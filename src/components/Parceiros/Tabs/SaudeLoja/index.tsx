import { useEffect, useState } from 'react';
import { Badge, Form } from 'react-bootstrap';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { toast } from 'react-toastify';
import CustomTable from '@/components/ui/CustomTable';
import CustomButton from '@/components/ui/Buttons';
import { getSaudeLojas, LojaSaude, SaudeResumo } from '@/services/apiParceiro';
import { BarList, Donut } from '../Financeiro/charts';
import styles from '../Financeiro/styles.module.scss';

const brl = (n: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ACCENT = {
    green: '#1f9d5f',
    blue: '#3b82f6',
    amber: '#d97706',
    gray: '#6b7280',
    red: '#dc3545',
};

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

export default function TabSaudeLoja() {
    const [loading, setLoading] = useState(true);
    const [dataIn, setDataIn] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [busca, setBusca] = useState('');
    const [resumo, setResumo] = useState<SaudeResumo | null>(null);
    const [lojas, setLojas] = useState<LojaSaude[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getSaudeLojas(dataIn, dataFim);
            setResumo(res.resumo);
            setLojas(res.lojas || []);
        } catch (err: any) {
            toast.error(`Erro ao carregar saúde das lojas. ${err.response?.data || err.message}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtradas = lojas.filter(l => `${l.empresa}${l.id}`.toLowerCase().includes(busca.toLowerCase()));

    const donutData = [
        { label: 'Ativas', value: filtradas.filter(l => l.statusPagamento).length, color: ACCENT.green },
        { label: 'Bloqueadas', value: filtradas.filter(l => !l.statusPagamento).length, color: ACCENT.gray },
    ];

    const topFaturamento = filtradas
        .filter(l => l.valorVendas > 0)
        .map(l => ({ label: l.empresa, value: l.valorVendas }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    const columns = [
        { name: 'Id', selector: (r: LojaSaude) => r.id, sortable: true, width: '7%' },
        { name: 'Empresa', selector: (r: LojaSaude) => r.empresa, sortable: true, width: '26%' },
        {
            name: 'Situação', selector: (r: LojaSaude) => r.statusPagamento,
            cell: (r: LojaSaude) => r.statusPagamento ? <Badge bg="success">Ativa</Badge> : <Badge bg="dark">Bloqueada</Badge>,
            sortable: true,
        },
        { name: 'Vendas', selector: (r: LojaSaude) => r.qtdVendas, cell: (r: LojaSaude) => <b>{r.qtdVendas}</b>, sortable: true, width: '10%' },
        { name: 'Faturamento', selector: (r: LojaSaude) => r.valorVendas, cell: (r: LojaSaude) => brl(r.valorVendas), sortable: true },
        {
            name: 'Vencidas', selector: (r: LojaSaude) => r.duplicatasVencidas,
            cell: (r: LojaSaude) => r.duplicatasVencidas > 0
                ? <Badge bg="danger">{r.duplicatasVencidas}</Badge>
                : <span style={{ color: '#bbb' }}>0</span>,
            sortable: true, width: '10%',
        },
        { name: 'Em aberto', selector: (r: LojaSaude) => r.valorEmAberto, cell: (r: LojaSaude) => r.valorEmAberto > 0 ? <span style={{ color: ACCENT.red }}>{brl(r.valorEmAberto)}</span> : '-', sortable: true },
    ];

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
                <div className={styles.filterField} style={{ flex: 1, minWidth: 200 }}>
                    <label>Buscar empresa</label>
                    <input placeholder="Nome ou id..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <CustomButton typeButton={'dark'} onClick={load}>Pesquisar</CustomButton>
            </div>

            <div className={styles.tiles}>
                <StatTile label="Lojas" value={String(resumo?.totalEmpresas ?? 0)} accent={ACCENT.blue} hint={`${resumo?.ativas ?? 0} ativa(s) · ${resumo?.bloqueadas ?? 0} bloqueada(s)`} />
                <StatTile label="Faturamento no período" value={brl(resumo?.faturamento ?? 0)} accent={ACCENT.green} hint={`${resumo?.totalVendas ?? 0} venda(s)`} />
                <StatTile label="Sem vender" value={String(resumo?.semVenda ?? 0)} accent={ACCENT.amber} hint="lojas sem venda no período" />
                <StatTile label="Inadimplentes" value={String(resumo?.inadimplentes ?? 0)} accent={ACCENT.red} hint="com cobrança vencida" />
            </div>

            <div className={styles.charts}>
                <div className={styles.chartPanel}>
                    <h6>Lojas por situação</h6>
                    <Donut data={donutData} centerLabel="lojas" />
                </div>
                <div className={styles.chartPanel}>
                    <h6>Faturamento por loja (top 6)</h6>
                    <BarList data={topFaturamento} format={brl} />
                </div>
            </div>

            <CustomTable columns={columns} data={filtradas} loading={loading} />
        </div>
    );
}
