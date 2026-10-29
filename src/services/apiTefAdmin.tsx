import { api } from "@/services/apiClient"

const BASE = '/admin/Tef'

export type SituacaoTef = 'Ativo' | 'Carencia' | 'Suspenso' | 'Cancelado'

export interface TefPlano {
    id: number
    provedor: string
    nome: string
    valorBase: number
    valorCaixaExtra: number
    caixasIncluidos: number
    custoBase: number
    custoCaixaExtra: number
    valorImplantacao: number
    custoImplantacao: number
    ativo: boolean
}

export interface TefPlanoPayload {
    nome: string
    valorBase: number
    valorCaixaExtra: number
    caixasIncluidos: number
    custoBase: number
    custoCaixaExtra: number
    valorImplantacao: number
    custoImplantacao: number
    ativo: boolean
}

export type StatusContratoDoc =
    'NaoEnviado' | 'Enviado' | 'ParcialmenteAssinado' | 'Assinado' | 'Recusado' | 'Expirado'

export interface TefContrato {
    id: number
    empresaId: number
    empresa: string | null
    tefPlanoId: number
    plano: string
    status: 'Ativo' | 'Suspenso' | 'Cancelado'
    situacao: SituacaoTef
    dataAtivacao: string
    dataCancelamento: string | null
    diaCobranca: number
    diasCarencia: number
    observacao: string | null
    pontosAtivos: number
    valorMensalAtual: number
    custoMensalAtual: number
    vencimentoEmAberto: string | null
    contratoStatus: StatusContratoDoc
    contratoEnviadoEm: string | null
    contratoAssinadoEm: string | null
    contratoUrl: string | null
}

export interface TefContratoPayload {
    empresaId?: number
    tefPlanoId?: number
    diaCobranca?: number
    diasCarencia?: number
    observacao?: string
}

export interface TefPonto {
    id: number
    empresaTefId: number
    posId: string
    descricao: string | null
    ativadoEm: string
    desativadoEm: string | null
    ativo: boolean
}

export interface TefCobranca {
    id: number
    competencia: string
    tipo: 'Mensalidade' | 'Implantacao'
    qtdPontos: number
    valor: number
    custo: number
    criadoEm: string
    duplicataId: number | null
    vencimento: string | null
    paga: boolean
    cancelada: boolean
    despesaKrdId: number | null
    custoPago: boolean
}

export interface TefContratoDetalhe {
    contrato: TefContrato
    pontos: TefPonto[]
    cobrancas: TefCobranca[]
}

export interface TefDespesa {
    id: number
    categoria: string | null
    fornecedor: string | null
    descricao: string | null
    dataLancamento: string
    dataCompetencia: string
    dataVencimento: string
    dataPagamento: string | null
    pago: boolean
    valor: number
    empresaId: number | null
}

export interface TefDespesasResponse {
    resumo: { total: number; valorEmAberto: number; valorPago: number }
    itens: TefDespesa[]
}

export interface TefRelatorioMes {
    competencia: string
    qtd: number
    valor: number
    custo: number
    margem: number
    recebido: number
    custoPago: number
}

export interface TefRelatorio {
    total: { valor: number; custo: number; margem: number; recebido: number; custoPago: number }
    meses: TefRelatorioMes[]
}

// ---- planos

export async function listPlanos(somenteAtivos = false): Promise<TefPlano[]> {
    const { data } = await api.get<TefPlano[]>(`${BASE}/Plano/List?somenteAtivos=${somenteAtivos}`)
    return data
}

export async function criarPlano(payload: TefPlanoPayload): Promise<TefPlano> {
    const { data } = await api.post<TefPlano>(`${BASE}/Plano`, payload)
    return data
}

export async function atualizarPlano(id: number, payload: TefPlanoPayload): Promise<TefPlano> {
    const { data } = await api.put<TefPlano>(`${BASE}/Plano/${id}`, payload)
    return data
}

// ---- contratos

export async function listContratos(situacao?: string): Promise<TefContrato[]> {
    const params = new URLSearchParams()
    if (situacao) params.set('situacao', situacao)
    const { data } = await api.get<TefContrato[]>(`${BASE}/Contrato/List?${params.toString()}`)
    return data
}

export async function getContrato(id: number): Promise<TefContratoDetalhe> {
    const { data } = await api.get<TefContratoDetalhe>(`${BASE}/Contrato/${id}`)
    return data
}

export async function criarContrato(payload: TefContratoPayload): Promise<{ id: number }> {
    const { data } = await api.post(`${BASE}/Contrato`, payload)
    return data
}

export async function atualizarContrato(id: number, payload: TefContratoPayload): Promise<{ id: number }> {
    const { data } = await api.put(`${BASE}/Contrato/${id}`, payload)
    return data
}

export async function suspenderContrato(id: number): Promise<void> {
    await api.post(`${BASE}/Contrato/${id}/Suspender`)
}

export async function reativarContrato(id: number): Promise<void> {
    await api.post(`${BASE}/Contrato/${id}/Reativar`)
}

export async function cancelarContrato(id: number): Promise<void> {
    await api.post(`${BASE}/Contrato/${id}/Cancelar`)
}

// ---- contrato para assinatura eletronica (DocuSeal)

export interface TefDocumentoEstado {
    mensagem: string
    contratoStatus: StatusContratoDoc
    contratoEnviadoEm: string | null
    contratoAssinadoEm: string | null
    contratoUrl: string | null
}

export async function testarDocuSeal(): Promise<{ conectado: boolean; prontoParaEnviar: boolean; falta: string | null }> {
    const { data } = await api.get(`${BASE}/Documento/Teste`)
    return data
}

export async function enviarContratoParaAssinatura(id: number, reenviar = false): Promise<TefDocumentoEstado> {
    const { data } = await api.post<TefDocumentoEstado>(`${BASE}/Contrato/${id}/Documento/Enviar?reenviar=${reenviar}`)
    return data
}

export async function atualizarStatusDoContrato(id: number): Promise<TefDocumentoEstado> {
    const { data } = await api.post<TefDocumentoEstado>(`${BASE}/Contrato/${id}/Documento/Atualizar`)
    return data
}

// ---- caixas

export async function adicionarPonto(contratoId: number, posId: string, descricao?: string): Promise<TefPonto> {
    const { data } = await api.post<TefPonto>(`${BASE}/Contrato/${contratoId}/Ponto`, { posId, descricao })
    return data
}

export async function desativarPonto(id: number): Promise<TefPonto> {
    const { data } = await api.post<TefPonto>(`${BASE}/Ponto/${id}/Desativar`)
    return data
}

// ---- cobrancas

export async function gerarCobrancas(): Promise<{ geradas: number }> {
    const { data } = await api.post<{ geradas: number }>(`${BASE}/Cobranca/Gerar`)
    return data
}

// ---- despesas da KRD

export async function listDespesas(pago?: boolean, inicio?: string, fim?: string): Promise<TefDespesasResponse> {
    const params = new URLSearchParams()
    params.set('categoria', 'TEF')
    if (pago !== undefined) params.set('pago', String(pago))
    if (inicio) params.set('inicio', inicio)
    if (fim) params.set('fim', fim)
    const { data } = await api.get<TefDespesasResponse>(`${BASE}/Despesa/List?${params.toString()}`)
    return data
}

export async function pagarDespesa(id: number, dataPagamento?: string): Promise<TefDespesa> {
    const { data } = await api.post<TefDespesa>(`${BASE}/Despesa/${id}/Pagar`, { dataPagamento })
    return data
}

export async function atualizarDespesa(
    id: number,
    payload: { valor?: number; dataVencimento?: string; descricao?: string },
): Promise<TefDespesa> {
    const { data } = await api.put<TefDespesa>(`${BASE}/Despesa/${id}`, payload)
    return data
}

// ---- margem

export async function getRelatorio(inicio?: string, fim?: string): Promise<TefRelatorio> {
    const params = new URLSearchParams()
    if (inicio) params.set('inicio', inicio)
    if (fim) params.set('fim', fim)
    const { data } = await api.get<TefRelatorio>(`${BASE}/Relatorio?${params.toString()}`)
    return data
}
