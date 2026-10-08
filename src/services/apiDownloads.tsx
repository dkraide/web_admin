import { api } from "@/services/apiClient"

const BASE = '/admin/Downloads'

// Tamanho de cada pedaço enviado. Precisa ficar abaixo do client_max_body_size do Nginx (64m no backend).
const CHUNK_SIZE = 8 * 1024 * 1024
const MAX_TENTATIVAS = 4

export interface DownloadProduto {
    id: number
    slug: string
    nome: string
    descricao: string | null
    categoria: string | null
    plataforma: string | null
    ativo: boolean
    ordem: number
    ultimaVersaoStable: string | null
}

export interface DownloadProdutoPayload {
    slug: string
    nome: string
    descricao?: string
    categoria?: string
    plataforma?: string
    ativo: boolean
    ordem: number
}

export interface DownloadRelease {
    id: number
    produtoId: number
    versao: string
    canal: 'stable' | 'beta'
    arquivoNome: string
    tamanhoBytes: number
    sha256: string | null
    versaoMinima: string | null
    notas: string | null
    ativo: boolean
    publicadoEm: string
    publicadoPor: string | null
    totalDownloads: number
}

export interface NovaReleasePayload {
    produtoId: number
    versao: string
    canal: 'stable' | 'beta'
    versaoMinima?: string
    notas?: string
}

export interface ProgressoUpload {
    fase: 'enviando' | 'verificando'
    enviado: number
    total: number
    percentual: number
    bytesPorSegundo: number
    segundosRestantes: number | null
    tentativa: number
}

// ── Produtos ──────────────────────────────────────────────────────────────

export async function listProdutos(): Promise<DownloadProduto[]> {
    const { data } = await api.get<DownloadProduto[]>(`${BASE}/Produtos`)
    return data
}

export async function criarProduto(payload: DownloadProdutoPayload): Promise<DownloadProduto> {
    const { data } = await api.post(`${BASE}/Produtos`, payload)
    return data
}

export async function atualizarProduto(id: number, payload: DownloadProdutoPayload): Promise<DownloadProduto> {
    const { data } = await api.put(`${BASE}/Produtos/${id}`, payload)
    return data
}

export async function excluirProduto(id: number): Promise<void> {
    await api.delete(`${BASE}/Produtos/${id}`)
}

// ── Releases ──────────────────────────────────────────────────────────────

export async function listReleases(produtoId: number): Promise<DownloadRelease[]> {
    const { data } = await api.get<DownloadRelease[]>(`${BASE}/Produtos/${produtoId}/Releases`)
    return data
}

export async function atualizarRelease(
    id: number,
    payload: { versaoMinima?: string | null; notas?: string | null; ativo: boolean }
): Promise<DownloadRelease> {
    const { data } = await api.put(`${BASE}/Releases/${id}`, payload)
    return data
}

export async function excluirRelease(id: number): Promise<void> {
    await api.delete(`${BASE}/Releases/${id}`)
}

// ── Upload em partes ──────────────────────────────────────────────────────

export class UploadCancelado extends Error {
    constructor() { super('Upload cancelado.') }
}

const dormir = (ms: number) => new Promise(r => setTimeout(r, ms))

export function mensagemErro(err: any): string {
    const d = err?.response?.data
    if (typeof d === 'string') return d
    return d?.error || d?.Error || err?.message || 'Erro desconhecido.'
}

/**
 * Envia o arquivo em pedaços (iniciar -> PUT por pedaço -> concluir), reportando progresso contínuo.
 * Cada pedaço tem retentativas com espera crescente; se o servidor responder 409 (offset divergente),
 * realinha pelo que ele realmente recebeu. A barra mostra o progresso dentro do pedaço (onUploadProgress),
 * então não "congela" entre um pedaço e outro.
 */
export async function enviarRelease(
    arquivo: File,
    payload: NovaReleasePayload,
    onProgresso: (p: ProgressoUpload) => void,
    signal: AbortSignal
): Promise<DownloadRelease> {
    const { data: ini } = await api.post<{ uploadId: string }>(`${BASE}/Upload/Iniciar`, null, { signal })
    const uploadId = ini.uploadId

    const total = arquivo.size
    let confirmado = 0        // bytes já gravados no servidor
    let tentativa = 1
    const inicio = Date.now()
    let baseInicio = 0        // bytes que já estavam no servidor quando começamos a medir velocidade

    const emitir = (enviado: number, fase: ProgressoUpload['fase'] = 'enviando') => {
        const decorrido = (Date.now() - inicio) / 1000
        const bps = decorrido > 0.5 ? (enviado - baseInicio) / decorrido : 0
        onProgresso({
            fase,
            enviado,
            total,
            percentual: total > 0 ? Math.min(100, (enviado / total) * 100) : 0,
            bytesPorSegundo: bps,
            segundosRestantes: bps > 0 && fase === 'enviando' ? (total - enviado) / bps : null,
            tentativa,
        })
    }

    try {
        emitir(0)
        while (confirmado < total) {
            if (signal.aborted) throw new UploadCancelado()

            const fim = Math.min(confirmado + CHUNK_SIZE, total)
            const pedaco = arquivo.slice(confirmado, fim)
            try {
                const { data } = await api.put<{ recebido: number }>(
                    `${BASE}/Upload/${uploadId}?offset=${confirmado}`,
                    pedaco,
                    {
                        signal,
                        headers: { 'Content-Type': 'application/octet-stream' },
                        // transformRequest vazio: o axios deve mandar o Blob cru, sem serializar.
                        transformRequest: [(d) => d],
                        maxBodyLength: Infinity,
                        onUploadProgress: (e) => emitir(confirmado + Math.min(e.loaded, pedaco.size)),
                    }
                )
                confirmado = data.recebido
                tentativa = 1
                emitir(confirmado)
            } catch (err: any) {
                if (signal.aborted || err?.code === 'ERR_CANCELED') throw new UploadCancelado()

                // Servidor já tem outra quantidade de bytes: retoma dali (ex.: resposta perdida após gravar).
                const recebido = err?.response?.data?.recebido ?? err?.response?.data?.Recebido
                if (err?.response?.status === 409 && typeof recebido === 'number') {
                    confirmado = recebido
                    emitir(confirmado)
                    continue
                }
                // Erro de validação/autorização não melhora com nova tentativa.
                const status = err?.response?.status
                if (status && status >= 400 && status < 500) throw err

                if (tentativa >= MAX_TENTATIVAS) throw err
                tentativa++
                emitir(confirmado)
                await dormir(1000 * 2 ** (tentativa - 2))

                // Antes de reenviar, pergunta ao servidor quanto ele realmente tem.
                try {
                    const { data } = await api.get<{ recebido: number }>(`${BASE}/Upload/${uploadId}`, { signal })
                    if (data.recebido !== confirmado) {
                        confirmado = data.recebido
                        baseInicio = Math.min(baseInicio, confirmado)
                    }
                } catch { /* segue com o que já sabemos */ }
            }
        }

        // O servidor calcula o SHA-256 do arquivo inteiro aqui; pode levar alguns segundos em arquivos grandes.
        emitir(total, 'verificando')
        const { data } = await api.post<DownloadRelease>(
            `${BASE}/Upload/${uploadId}/Concluir`,
            { ...payload, arquivoNome: arquivo.name, tamanhoEsperado: total },
            { signal, timeout: 0 }
        )
        return data
    } catch (err) {
        // Falha ou cancelamento: descarta o parcial no servidor (best-effort).
        api.delete(`${BASE}/Upload/${uploadId}`).catch(() => { })
        throw err
    }
}
