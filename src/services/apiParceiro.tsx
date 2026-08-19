import { api } from "@/services/apiClient"

// Situacao das mensalidades: 0 = todas no periodo, 1 = pagas, 2 = em aberto
export type SituacaoMensalidade = 0 | 1 | 2
// Filtro de repasse: 0 = geral, 1 = repassadas, 2 = nao repassadas
export type FiltroRepasse = 0 | 1 | 2

export interface MensalidadeParceiro {
    id: number
    empresaId: number
    empresa: string
    dataEmissao: string
    dataVencimento: string
    dataPagamento: string
    valor: number
    valorRepasse: number
    isPago: boolean
    isCancelado: boolean
    formaPagamento: string
    repassado: boolean
}

export interface MensalidadesResponse {
    itens: MensalidadeParceiro[]
    total: number
    totalValor: number
    totalRepasse: number
}

export interface RepasseParceiro {
    id: number
    createdAt: string
    valorTotal: number
    qtdDuplicatas: number
    tipo: 'Manual' | 'Repasse'
    descricao: string | null
    statusPagamento: boolean
    dataVencimento: string
    dataPagamento: string | null
}

export interface ResumoParceiro {
    repasseEmAberto: number
    repasseQuitado: number
    aReceber: number
    recebido: number
    qtdPagamentosPendentes: number
    qtdPagamentosPagos: number
}

export async function getMensalidades(
    dataIn: string,
    dataFim: string,
    situacao: SituacaoMensalidade = 0,
    empresa = 0,
    repasse: FiltroRepasse = 0
): Promise<MensalidadesResponse> {
    const params = new URLSearchParams({
        datain: dataIn,
        datafim: dataFim,
        situacao: String(situacao),
        empresa: String(empresa),
        repasse: String(repasse)
    })
    const { data } = await api.get<MensalidadesResponse>(`/PagamentoParceiro/Mensalidades?${params.toString()}`)
    return data
}

export async function getMeusRepasses(status?: boolean): Promise<RepasseParceiro[]> {
    const params = new URLSearchParams()
    if (status !== undefined) params.set('status', String(status))
    const { data } = await api.get<RepasseParceiro[]>(`/PagamentoParceiro/MeusRepasses?${params.toString()}`)
    return data
}

export async function getResumoParceiro(): Promise<ResumoParceiro> {
    const { data } = await api.get<ResumoParceiro>(`/PagamentoParceiro/Resumo`)
    return data
}

export interface LojaSaude {
    id: number
    empresa: string
    statusPagamento: boolean
    versao: number
    qtdVendas: number
    valorVendas: number
    duplicatasVencidas: number
    valorEmAberto: number
}

export interface SaudeResumo {
    totalEmpresas: number
    ativas: number
    bloqueadas: number
    semVenda: number
    totalVendas: number
    faturamento: number
    inadimplentes: number
}

export interface SaudeResponse {
    resumo: SaudeResumo
    lojas: LojaSaude[]
}

export async function getSaudeLojas(dataIn: string, dataFim: string): Promise<SaudeResponse> {
    const params = new URLSearchParams({ datain: dataIn, datafim: dataFim })
    const { data } = await api.get<SaudeResponse>(`/Parceiro/SaudeLojas?${params.toString()}`)
    return data
}

export type ChamadoStatus = 'Aberto' | 'EmAndamento' | 'AguardandoCliente' | 'Resolvido' | 'Fechado'

export interface ChamadoParceiro {
    id: string
    status: ChamadoStatus
    title: string
    empresaId: number
    empresa: string | null
    employerName: string
    userCreateId: string
    totalEvents: number
    createdAt: string
    lastUpdated: string
}

export interface ChamadosResumo {
    total: number
    abertos: number
    aberto: number
    emAndamento: number
    aguardandoCliente: number
    resolvidos: number
    fechados: number
}

export interface ChamadosResponse {
    resumo: ChamadosResumo
    itens: ChamadoParceiro[]
}

export async function getChamadosParceiro(status?: string, empresa = 0): Promise<ChamadosResponse> {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (empresa > 0) params.set('empresa', String(empresa))
    const { data } = await api.get<ChamadosResponse>(`/Parceiro/Chamados?${params.toString()}`)
    return data
}
