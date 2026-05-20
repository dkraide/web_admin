import { api } from "@/services/apiClient"
import IEmpresaNotificacao from "@/interfaces/IEmpresaNotificacao"

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