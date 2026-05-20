import { useEffect, useState, useCallback } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getNotificacoes } from "@/services/apiFinanceiro"
import IEmpresaNotificacao, { CanalNotificacao, StatusNotificacao, TipoNotificacao } from "@/interfaces/IEmpresaNotificacao"
import styles from "./styles.module.scss"

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TipoNotificacao, string> = {
    FaturaCriada:    'Fatura Criada',
    FaturaVenceHoje: 'Vence Hoje',
    FaturaPaga:      'Paga',
    FaturaVencida:   'Vencida',
}

const TIPO_COLOR: Record<TipoNotificacao, string> = {
    FaturaCriada:    '#1a73e8',
    FaturaVenceHoje: '#f59e0b',
    FaturaPaga:      '#10b981',
    FaturaVencida:   '#ef4444',
}

const STATUS_COLOR: Record<StatusNotificacao, string> = {
    Pendente: '#f59e0b',
    Enviado:  '#10b981',
    Erro:     '#ef4444',
}

const CANAL_ICON: Record<CanalNotificacao, string> = {
    Email: '✉',
    SMS:   '💬',
}

function fmt(d?: Date | string) {
    if (!d) return '—'
    return format(new Date(d), 'dd/MM/yy HH:mm')
}

function fmtData(d?: Date | string) {
    if (!d) return '—'
    return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR })
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function NotificacoesPage() {
    const hoje = new Date()
    const [dataIn,  setDataIn]  = useState(format(startOfMonth(hoje), 'yyyy-MM-dd'))
    const [dataFim, setDataFim] = useState(format(endOfMonth(hoje),   'yyyy-MM-dd'))
    const [canal,   setCanal]   = useState<0 | 1 | 2>(0)
    const [busca,   setBusca]   = useState('')
    const [items,   setItems]   = useState<IEmpresaNotificacao[]>([])
    const [total,   setTotal]   = useState(0)
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState<number | null>(null)

    const buscar = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getNotificacoes({ dataIn, dataFim, canal, busca: busca || undefined })
            setItems(res.items)
            setTotal(res.total)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [dataIn, dataFim, canal, busca])

    useEffect(() => { buscar() }, [])

    // Stats rápidos
    const enviados  = items.filter(i => i.status === 'Enviado').length
    const erros     = items.filter(i => i.status === 'Erro').length
    const pendentes = items.filter(i => i.status === 'Pendente').length


    return (
        <div className={styles.page}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Notificações</h1>
                    <p className={styles.subtitle}>Histórico de envios de e-mail e SMS por empresa</p>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statNum}>{total}</span>
                    <span className={styles.statLabel}>Total</span>
                </div>
                <div className={`${styles.stat} ${styles.statGreen}`}>
                    <span className={styles.statNum}>{enviados}</span>
                    <span className={styles.statLabel}>Enviados</span>
                </div>
                <div className={`${styles.stat} ${styles.statRed}`}>
                    <span className={styles.statNum}>{erros}</span>
                    <span className={styles.statLabel}>Erros</span>
                </div>
                <div className={`${styles.stat} ${styles.statYellow}`}>
                    <span className={styles.statNum}>{pendentes}</span>
                    <span className={styles.statLabel}>Pendentes</span>
                </div>
            </div>

            {/* ── Filtros ── */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>De</label>
                    <input
                        type="date"
                        className={styles.filterInput}
                        value={dataIn}
                        onChange={e => setDataIn(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Até</label>
                    <input
                        type="date"
                        className={styles.filterInput}
                        value={dataFim}
                        onChange={e => setDataFim(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Canal</label>
                    <select
                        className={styles.filterInput}
                        value={canal}
                        onChange={e => setCanal(Number(e.target.value) as 0 | 1 | 2)}
                    >
                        <option value={0}>Geral</option>
                        <option value={1}>E-mail</option>
                        <option value={2}>SMS</option>
                    </select>
                </div>
                <div className={`${styles.filterGroup} ${styles.filterBusca}`}>
                    <label className={styles.filterLabel}>Busca</label>
                    <input
                        type="text"
                        className={styles.filterInput}
                        placeholder="Nome fantasia, ID empresa ou nº duplicata"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && buscar()}
                    />
                </div>
                <button className={styles.btnBuscar} onClick={buscar} disabled={loading}>
                    {loading ? '...' : 'Buscar'}
                </button>
            </div>

            {/* ── Tabela ── */}
            <div className={styles.tableWrap}>
                {loading ? (
                    <div className={styles.empty}>Carregando...</div>
                ) : items.length === 0 ? (
                    <div className={styles.empty}>Nenhuma notificação encontrada.</div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Empresa</th>
                                <th>Canal</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Tentativas</th>
                                <th>Criado em</th>
                                <th>Concluído em</th>
                                <th>Duplicatas</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(n => (
                                <>
                                    <tr
                                        key={n.id}
                                        className={`${styles.row} ${expanded === n.id ? styles.rowExpanded : ''}`}
                                        onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                                    >
                                        <td className={styles.tdMuted}>{n.id}</td>
                                        <td>
                                            <div className={styles.empresaCell}>
                                                <span className={styles.empresaNome}>{n.empresa?.nomeFantasia}</span>
                                                <span className={styles.empresaId}>ID {n.empresaId}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.canal}>
                                                {CANAL_ICON[n.canal]} {n.canal}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={styles.badge}
                                                style={{ background: TIPO_COLOR[n.tipo] + '18', color: TIPO_COLOR[n.tipo] }}
                                            >
                                                {TIPO_LABEL[n.tipo]}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={styles.badge}
                                                style={{ background: STATUS_COLOR[n.status] + '18', color: STATUS_COLOR[n.status] }}
                                            >
                                                {n.status}
                                            </span>
                                        </td>
                                        <td className={styles.tdCenter}>{n.tentativas}</td>
                                        <td className={styles.tdMuted}>{fmt(n.criadoEm)}</td>
                                        <td className={styles.tdMuted}>{fmt(n.concluidoEm)}</td>
                                        <td className={styles.tdCenter}>{n.duplicatas?.length ?? 0}</td>
                                        <td className={styles.tdChevron}>
                                            {expanded === n.id ? '▲' : '▼'}
                                        </td>
                                    </tr>

                                    {/* ── Linha expandida ── */}
                                    {expanded === n.id && (
                                        <tr key={`exp-${n.id}`} className={styles.rowDetail}>
                                            <td colSpan={10}>
                                                <div className={styles.detail}>

                                                    {/* Contato */}
                                                    <div className={styles.detailSection}>
                                                        <span className={styles.detailSectionTitle}>Contato</span>
                                                        <div className={styles.detailGrid}>
                                                            <div>
                                                                <span className={styles.detailKey}>E-mail</span>
                                                                <span className={styles.detailVal}>{n.empresa?.email || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className={styles.detailKey}>Telefone</span>
                                                                <span className={styles.detailVal}>{n.empresa?.telefone || '—'}</span>
                                                            </div>
                                                            <div>
                                                                <span className={styles.detailKey}>Última tentativa</span>
                                                                <span className={styles.detailVal}>{fmt(n.ultimaTentativa)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Retorno */}
                                                    {n.ultimoRetorno && (
                                                        <div className={styles.detailSection}>
                                                            <span className={styles.detailSectionTitle}>Último retorno</span>
                                                            <pre className={styles.retorno}>{n.ultimoRetorno}</pre>
                                                        </div>
                                                    )}

                                                    {/* Duplicatas */}
                                                    {n.duplicatas?.length > 0 && (
                                                        <div className={styles.detailSection}>
                                                            <span className={styles.detailSectionTitle}>
                                                                Duplicatas referenciadas ({n.duplicatas.length})
                                                            </span>
                                                            <table className={styles.innerTable}>
                                                                <thead>
                                                                    <tr>
                                                                        <th>ID</th>
                                                                        <th>Vencimento</th>
                                                                        <th>Valor</th>
                                                                        <th>Status</th>
                                                                        <th>NFSe</th>
                                                                        <th>Boleto</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {n.duplicatas.map(nd => (
                                                                        <tr key={nd.id}>
                                                                            <td>{nd.duplicataId}</td>
                                                                            <td>{fmtData(nd.duplicata?.dataVencimento)}</td>
                                                                            <td>
                                                                                {nd.duplicata?.valor != null
                                                                                    ? nd.duplicata.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                                                    : '—'}
                                                                            </td>
                                                                            <td>
                                                                                {nd.duplicata?.isCancelado
                                                                                    ? <span style={{ color: '#ef4444' }}>Cancelada</span>
                                                                                    : nd.duplicata?.isPago
                                                                                        ? <span style={{ color: '#10b981' }}>Paga</span>
                                                                                        : <span style={{ color: '#f59e0b' }}>Em aberto</span>}
                                                                            </td>
                                                                            <td>{nd.duplicata?.statusNFSE || '—'}</td>
                                                                            <td>
                                                                                {nd.duplicata?.url
                                                                                    ? <a href={nd.duplicata.url} target="_blank" rel="noreferrer" className={styles.link}>Ver</a>
                                                                                    : '—'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    )
}