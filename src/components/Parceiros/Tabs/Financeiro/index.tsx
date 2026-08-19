import { useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { Badge, Form, Tab, Tabs } from 'react-bootstrap';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { toast } from 'react-toastify';
import CustomTable from '@/components/ui/CustomTable';
import CustomButton from '@/components/ui/Buttons';
import {
    getMensalidades,
    getMeusRepasses,
    getResumoParceiro,
    MensalidadeParceiro,
    RepasseParceiro,
    ResumoParceiro,
    SituacaoMensalidade,
    FiltroRepasse,
} from '@/services/apiParceiro';
import { BarList, Donut } from './charts';

const STATUS_COLORS = {
    pago: '#3b82f6',
    aberto: '#1f9d5f',
    vencido: '#d97706',
    cancelado: '#6b7280',
};

type StatusKey = 'pago' | 'aberto' | 'vencido' | 'cancelado';
function classifica(row: MensalidadeParceiro): StatusKey {
    if (row.isCancelado) return 'cancelado';
    if (row.isPago) return 'pago';
    return new Date(row.dataVencimento) >= new Date() ? 'aberto' : 'vencido';
}

const brl = (n: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (v: string | null) => (v && new Date(v).getFullYear() > 1 ? format(new Date(v), 'dd/MM/yyyy') : '-');

export default function TabFinanceiro() {
    return (
        <div className={styles.container}>
            <Tabs defaultActiveKey="mensalidades" id="parceiro-financeiro-tabs" className="mb-3">
                <Tab eventKey="mensalidades" title="Mensalidades">
                    <Mensalidades />
                </Tab>
                <Tab eventKey="repasses" title="Meus Repasses">
                    <MeusRepasses />
                </Tab>
            </Tabs>
        </div>
    );
}

function statusBadge(row: MensalidadeParceiro) {
    if (row.isCancelado) return <Badge bg="dark">Cancelado</Badge>;
    if (row.isPago) return <Badge bg="primary">Pago</Badge>;
    const venc = new Date(row.dataVencimento);
    return venc >= new Date()
        ? <Badge bg="success">Em Aberto</Badge>
        : <Badge bg="danger">Vencido</Badge>;
}

function StatTile({ label, value, accent, hint }: { label: string; value: string; accent?: string; hint?: string }) {
    return (
        <div className={styles.tile}>
            {accent && <span className={styles.tileBar} style={{ background: accent }} />}
            <div className={styles.tileBody}>
                <div className={styles.tileLabel}>{label}</div>
                <div className={styles.tileValue} style={accent ? { color: accent } : undefined}>{value}</div>
                {hint && <div className={styles.tileHint}>{hint}</div>}
            </div>
        </div>
    );
}

function Mensalidades() {
    const [loading, setLoading] = useState(true);
    const [dataIn, setDataIn] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [situacao, setSituacao] = useState<SituacaoMensalidade>(0);
    const [repasse, setRepasse] = useState<FiltroRepasse>(0);
    const [busca, setBusca] = useState('');
    const [itens, setItens] = useState<MensalidadeParceiro[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getMensalidades(dataIn, dataFim, situacao, 0, repasse);
            setItens(res.itens || []);
        } catch (err: any) {
            toast.error(`Erro ao carregar mensalidades. ${err.response?.data || err.message}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const getFiltered = () =>
        itens.filter(p => `${p.empresa}${p.empresaId}${p.id}`.toLowerCase().includes(busca.toLowerCase()));

    const columns = [
        { name: 'Id', selector: (r: MensalidadeParceiro) => r.id, sortable: true, width: '8%' },
        { name: 'Empresa', selector: (r: MensalidadeParceiro) => r.empresa, sortable: true, width: '30%' },
        { name: 'Vencimento', selector: (r: MensalidadeParceiro) => r.dataVencimento, cell: (r: MensalidadeParceiro) => dt(r.dataVencimento), sortable: true },
        { name: 'Valor', selector: (r: MensalidadeParceiro) => r.valor, cell: (r: MensalidadeParceiro) => brl(r.valor), sortable: true },
        { name: 'Repasse', selector: (r: MensalidadeParceiro) => r.valorRepasse, cell: (r: MensalidadeParceiro) => <b style={{ color: '#22a06b' }}>{brl(r.valorRepasse)}</b>, sortable: true },
        {
            name: 'Repassado', selector: (r: MensalidadeParceiro) => r.repassado,
            cell: (r: MensalidadeParceiro) => r.repassado
                ? <Badge bg="primary">Sim</Badge>
                : <Badge bg="secondary">Não</Badge>,
            sortable: true, width: '11%',
        },
        { name: 'Status', selector: (r: MensalidadeParceiro) => r.isPago, cell: (r: MensalidadeParceiro) => statusBadge(r), sortable: true },
    ];

    const filtrados = getFiltered();

    // Contagem por status (donut)
    const statusCount = filtrados.reduce((acc, r) => {
        acc[classifica(r)]++;
        return acc;
    }, { pago: 0, aberto: 0, vencido: 0, cancelado: 0 } as Record<StatusKey, number>);

    const donutData = [
        { label: 'Em aberto', value: statusCount.aberto, color: STATUS_COLORS.aberto },
        { label: 'Pago', value: statusCount.pago, color: STATUS_COLORS.pago },
        { label: 'Vencido', value: statusCount.vencido, color: STATUS_COLORS.vencido },
        { label: 'Cancelado', value: statusCount.cancelado, color: STATUS_COLORS.cancelado },
    ];

    // Top empresas por repasse (barras)
    const porEmpresa = new Map<string, number>();
    filtrados.forEach(r => porEmpresa.set(r.empresa, (porEmpresa.get(r.empresa) || 0) + r.valorRepasse));
    const topEmpresas = Array.from(porEmpresa.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    const qtdAberto = statusCount.aberto + statusCount.vencido;
    const somaValor = filtrados.reduce((s, r) => s + r.valor, 0);
    const somaRepasse = filtrados.reduce((s, r) => s + r.valorRepasse, 0);

    return (
        <div>
            <div className={styles.filterCard}>
                <div className={styles.filterField}>
                    <label>Início</label>
                    <input type="date" value={dataIn} onChange={(e) => setDataIn(e.target.value)} />
                </div>
                <div className={styles.filterField}>
                    <label>Final</label>
                    <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </div>
                <div className={styles.filterField}>
                    <label>Situação</label>
                    <Form.Select value={situacao} onChange={(e) => setSituacao(Number(e.target.value) as SituacaoMensalidade)}>
                        <option value={0}>Todas no período</option>
                        <option value={2}>Em aberto</option>
                        <option value={1}>Pagas</option>
                    </Form.Select>
                </div>
                <div className={styles.filterField}>
                    <label>Repasse</label>
                    <Form.Select value={repasse} onChange={(e) => setRepasse(Number(e.target.value) as FiltroRepasse)}>
                        <option value={0}>Geral</option>
                        <option value={1}>Repassadas</option>
                        <option value={2}>Não repassadas</option>
                    </Form.Select>
                </div>
                <div className={styles.filterField} style={{ flex: 1, minWidth: 200 }}>
                    <label>Buscar empresa</label>
                    <input placeholder="Nome ou id..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <CustomButton typeButton={'dark'} onClick={load}>Pesquisar</CustomButton>
            </div>

            <div className={styles.tiles}>
                <StatTile label="Total cobrado" value={brl(somaValor)} hint={`${filtrados.length} cobrança(s)`} />
                <StatTile label="Total a repassar" value={brl(somaRepasse)} accent={STATUS_COLORS.aberto} hint="sua comissão no período" />
                <StatTile label="Cobranças" value={String(filtrados.length)} accent={STATUS_COLORS.pago} hint={`${statusCount.pago} paga(s)`} />
                <StatTile label="Em aberto" value={String(qtdAberto)} accent={STATUS_COLORS.vencido} hint={`${statusCount.vencido} vencida(s)`} />
            </div>

            <div className={styles.charts}>
                <div className={styles.chartPanel}>
                    <h6>Cobranças por status</h6>
                    <Donut data={donutData} centerLabel="cobranças" />
                </div>
                <div className={styles.chartPanel}>
                    <h6>Repasse por empresa (top 6)</h6>
                    <BarList data={topEmpresas} format={brl} />
                </div>
            </div>

            <CustomTable columns={columns} data={filtrados} loading={loading} />
        </div>
    );
}

function MeusRepasses() {
    const [loading, setLoading] = useState(true);
    const [resumo, setResumo] = useState<ResumoParceiro | null>(null);
    const [repasses, setRepasses] = useState<RepasseParceiro[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const [r, lista] = await Promise.all([getResumoParceiro(), getMeusRepasses()]);
            setResumo(r);
            setRepasses(lista || []);
        } catch (err: any) {
            toast.error(`Erro ao carregar repasses. ${err.response?.data || err.message}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const columns = [
        { name: 'Id', selector: (r: RepasseParceiro) => r.id, sortable: true, width: '8%' },
        { name: 'Criado', selector: (r: RepasseParceiro) => r.createdAt, cell: (r: RepasseParceiro) => dt(r.createdAt), sortable: true },
        { name: 'Tipo', selector: (r: RepasseParceiro) => r.tipo, cell: (r: RepasseParceiro) => <Badge bg={r.tipo === 'Manual' ? 'info' : 'secondary'}>{r.tipo}</Badge>, sortable: true },
        { name: 'Descrição', selector: (r: RepasseParceiro) => r.descricao || '', sortable: true, width: '25%' },
        { name: 'Qtd', selector: (r: RepasseParceiro) => r.qtdDuplicatas, sortable: true, width: '8%' },
        { name: 'Valor', selector: (r: RepasseParceiro) => r.valorTotal, cell: (r: RepasseParceiro) => <b>{brl(r.valorTotal)}</b>, sortable: true },
        { name: 'Vencimento', selector: (r: RepasseParceiro) => r.dataVencimento, cell: (r: RepasseParceiro) => dt(r.dataVencimento), sortable: true },
        { name: 'Pagamento', selector: (r: RepasseParceiro) => r.dataPagamento, cell: (r: RepasseParceiro) => dt(r.dataPagamento), sortable: true },
        {
            name: 'Status', selector: (r: RepasseParceiro) => r.statusPagamento,
            cell: (r: RepasseParceiro) => r.statusPagamento ? <Badge bg="primary">Pago</Badge> : <Badge bg="success">Agendado</Badge>,
            sortable: true,
        },
    ];

    return (
        <div>
            <div className={styles.cards}>
                <div className={`${styles.card} ${styles.accentBlue}`}>
                    <div className={styles.label}>Previsão de repasse (em aberto)</div>
                    <div className={styles.value}>{brl(resumo?.repasseEmAberto || 0)}</div>
                    <div className={styles.hint}>Referente a cobranças ainda não pagas</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.label}>Repasse de cobranças pagas</div>
                    <div className={styles.value}>{brl(resumo?.repasseQuitado || 0)}</div>
                    <div className={styles.hint}>Base de conferência do que já foi quitado</div>
                </div>
                <div className={`${styles.card} ${styles.accentOrange}`}>
                    <div className={styles.label}>A receber (agendado)</div>
                    <div className={styles.value}>{brl(resumo?.aReceber || 0)}</div>
                    <div className={styles.hint}>{resumo?.qtdPagamentosPendentes || 0} pagamento(s) pendente(s)</div>
                </div>
                <div className={`${styles.card} ${styles.accentGreen}`}>
                    <div className={styles.label}>Já recebido</div>
                    <div className={styles.value}>{brl(resumo?.recebido || 0)}</div>
                    <div className={styles.hint}>{resumo?.qtdPagamentosPagos || 0} pagamento(s) pago(s)</div>
                </div>
            </div>

            <h6>Pagamentos</h6>
            <CustomTable columns={columns} data={repasses} loading={loading} />
        </div>
    );
}
