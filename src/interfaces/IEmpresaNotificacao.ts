import IDuplicata from "./IDuplicata"
import IEmpresa from "./IEmpresa"

export type TipoNotificacao = 'FaturaCriada' | 'FaturaVenceHoje' | 'FaturaPaga' | 'FaturaVencida' | 'Manual'
export type CanalNotificacao = 'Email' | 'SMS' | 'WhatsApp'
export type StatusNotificacao = 'Pendente' | 'Enviado' | 'Erro'

export interface IEmpresaNotificacaoDuplicata {
    id: number
    empresaNotificacaoId: number
    duplicataId: number
    duplicata: IDuplicata
}

export default interface IEmpresaNotificacao {
    id: number
    empresaId: number
    empresa: IEmpresa
    tipo: TipoNotificacao
    canal: CanalNotificacao
    status: StatusNotificacao
    tentativas: number
    ultimaTentativa?: Date
    ultimoRetorno?: string
    criadoEm: Date
    concluidoEm?: Date
    duplicatas: IEmpresaNotificacaoDuplicata[]
}