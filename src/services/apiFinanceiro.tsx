import { api } from "@/services/apiClient"
import IEmpresaNotificacao, { CanalNotificacao } from "@/interfaces/IEmpresaNotificacao"
import IDuplicata from "@/interfaces/IDuplicata"

export interface FiltroNotificacoes {
    dataIn: string       // yyyy-MM-dd
    dataFim: string      // yyyy-MM-dd
    canal: 0 | 1 | 2    // 0=Geral, 1=Email, 2=SMS
    busca?: string       // nomeFantasia, nro duplicata ou empresaId
}

export interface NotificacoesResponse {
    items: IEmpresaNotificacao[]
    total: number
}

export async function getNotificacoes(filtro: FiltroNotificacoes): Promise<NotificacoesResponse> {
    const params = new URLSearchParams({
        dataIn:  filtro.dataIn,
        dataFim: filtro.dataFim,
        canal:   String(filtro.canal),
        ...(filtro.busca ? { busca: filtro.busca } : {})
    })

    const { data } = await api.get(`/Financeiro/Notificacoes?${params.toString()}`)
    return data
}

// Duplicatas em aberto (não pagas e não canceladas) de uma empresa, usadas
// no wizard de criação manual de notificação.
export async function getDuplicatasAbertas(empresaId: number): Promise<IDuplicata[]> {
    const params = new URLSearchParams({
        dataIn: '2000-01-01',
        dataFim: '2100-12-31',
        Empresa: String(empresaId),
        Situacao: '0'
    })
    const { data } = await api.get<IDuplicata[]>(`/Financeiro/List?${params.toString()}`)
    return data.filter(d => !d.isCancelado && !d.isPago)
}

export interface NotificacaoManualResponse {
    id: number
    empresaId: number
    empresa: string
    tipo: string
    canal: string
    destino: string
    duplicatas: number[]
    status: string
    mensagem: string
}

export async function criarNotificacaoManual(duplicataIds: number[], canal: CanalNotificacao): Promise<NotificacaoManualResponse> {
    const { data } = await api.post(`/Financeiro/Notificacoes/Manual`, { duplicataIds, canal })
    return data
}