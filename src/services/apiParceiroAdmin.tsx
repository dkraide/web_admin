import { api } from "@/services/apiClient"

const BASE = '/admin/PagamentoParceiro'

export type TipoPagamento = 0 | 1 // 0 = Manual, 1 = Repasse

export interface PagamentoAdmin {
    id: number
    createdAt: string
    valorTotal: number
    qtdDuplicatas: number
    tipo: 'Manual' | 'Repasse'
    descricao: string | null
    statusPagamento: boolean
    dataVencimento: string
    dataPagamento: string | null
    usuarioParceiroId: string | null
    parceiro: string | null
}

export interface PagamentosResumo {
    total: number
    valorPendente: number
    valorPago: number
    qtdPendentes: number
    qtdPagos: number
}

export interface PagamentosResponse {
    resumo: PagamentosResumo
    itens: PagamentoAdmin[]
}

export interface MensalidadeRepasse {
    id: number
    cliente: string | null
    empresaId: number
    usuarioParceiroId: string | null
    parceiro: string | null
    valor: number
    valorRepasse: number
    dataVencimento: string
    isPago: boolean
}

export interface MensalidadesRepasseResumo {
    total: number
    totalRepasse: number
    parceiros: number
}

export interface MensalidadesRepasseResponse {
    resumo: MensalidadesRepasseResumo
    itens: MensalidadeRepasse[]
}

export interface ParceiroOption {
    id: string
    userName: string
    nome: string
}

export interface CriarPagamentoPayload {
    tipo: TipoPagamento
    usuarioParceiroId?: string
    descricao?: string
    dataVencimento: string
    valorTotal?: number
    duplicataIds?: number[]
}

export async function listPagamentos(status?: boolean, parceiroId?: string): Promise<PagamentosResponse> {
    const params = new URLSearchParams()
    if (status !== undefined) params.set('status', String(status))
    if (parceiroId) params.set('parceiroId', parceiroId)
    const { data } = await api.get<PagamentosResponse>(`${BASE}/List?${params.toString()}`)
    return data
}

export async function criarPagamento(payload: CriarPagamentoPayload): Promise<{ id: number }> {
    const { data } = await api.post(`${BASE}`, payload)
    return data
}

export async function atualizarPagamento(id: number, payload: { descricao?: string; dataVencimento: string; valorTotal?: number }): Promise<{ id: number }> {
    const { data } = await api.put(`${BASE}/${id}`, payload)
    return data
}

export async function setStatusPagamento(id: number, statusPagamento: boolean, dataPagamento?: string): Promise<void> {
    await api.put(`${BASE}/${id}/Status`, { statusPagamento, dataPagamento })
}

export async function excluirPagamento(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`)
}

export async function getMensalidadesParaRepasse(parceiroId?: string): Promise<MensalidadesRepasseResponse> {
    const params = new URLSearchParams()
    if (parceiroId) params.set('parceiroId', parceiroId)
    const { data } = await api.get<MensalidadesRepasseResponse>(`${BASE}/MensalidadesParaRepasse?${params.toString()}`)
    return data
}

export async function getParceiros(): Promise<ParceiroOption[]> {
    const { data } = await api.get<ParceiroOption[]>(`${BASE}/Parceiros`)
    return data
}
