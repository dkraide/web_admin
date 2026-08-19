import { useEffect, useMemo, useState } from 'react';
import { Badge, Dropdown, Form, SplitButton } from 'react-bootstrap';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import CustomTable from '@/components/ui/CustomTable';
import CustomButton from '@/components/ui/Buttons';
import {
    excluirPagamento,
    listPagamentos,
    PagamentoAdmin,
    PagamentosResumo,
    setStatusPagamento,
} from '@/services/apiParceiroAdmin';
import PagamentoParceiroForm from './PagamentoParceiroForm';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

const brl = (n: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (v: string | null) => (v && new Date(v).getFullYear() > 1 ? format(new Date(v), 'dd/MM/yyyy') : '-');

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

export default function PagamentosTab() {
    const [loading, setLoading] = useState(true);
    const [statusFiltro, setStatusFiltro] = useState<'' | 'pendente' | 'pago'>('');
    const [busca, setBusca] = useState('');
    const [resumo, setResumo] = useState<PagamentosResumo | null>(null);
    const [itens, setItens] = useState<PagamentoAdmin[]>([]);
    const [novo, setNovo] = useState(false);
    const [edit, setEdit] = useState<PagamentoAdmin | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const status = statusFiltro === '' ? undefined : statusFiltro === 'pago';
            const res = await listPagamentos(status);
            setResumo(res.resumo);
            setItens(res.itens || []);
        } catch (err: any) {
            toast.error(`Erro ao carregar pagamentos. ${err.response?.data || err.message}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtrados = useMemo(
        () => itens.filter(p => `${p.parceiro || ''}${p.descricao || ''}${p.id}`.toLowerCase().includes(busca.toLowerCase())),
        [itens, busca]
    );

    async function toggleStatus(p: PagamentoAdmin) {
        try {
            await setStatusPagamento(p.id, !p.statusPagamento);
            toast.success(!p.statusPagamento ? 'Marcado como pago.' : 'Reaberto como pendente.');
            load();
        } catch (err: any) {
            toast.error(`Erro ao alterar status. ${err.response?.data || err.message}`);
        }
    }

    async function remover(p: PagamentoAdmin) {
        if (!confirm(`Excluir o pagamento #${p.id}? As duplicatas vinculadas voltam a ficar disponíveis para repasse.`)) return;
        try {
            await excluirPagamento(p.id);
            toast.success('Pagamento excluído.');
            load();
        } catch (err: any) {
            toast.error(`Erro ao excluir. ${err.response?.data || err.message}`);
        }
    }

    const columns = [
        {
            name: '#', selector: (r: PagamentoAdmin) => r.id,
            cell: (r: PagamentoAdmin) => (
                <SplitButton size="sm" variant="primary" id={`pp-${r.id}`} title={r.id}
                    onClick={() => setEdit(r)}>
                    <Dropdown.Item onClick={() => toggleStatus(r)}>{r.statusPagamento ? 'Reabrir (pendente)' : 'Marcar como pago'}</Dropdown.Item>
                    <Dropdown.Item onClick={() => remover(r)}>Excluir</Dropdown.Item>
                </SplitButton>
            ),
            width: '90px',
        },
        { name: 'Parceiro', selector: (r: PagamentoAdmin) => r.parceiro || '', cell: (r: PagamentoAdmin) => r.parceiro || <i style={{ color: '#bbb' }}>-</i>, sortable: true, width: '18%' },
        { name: 'Tipo', selector: (r: PagamentoAdmin) => r.tipo, cell: (r: PagamentoAdmin) => <Badge bg={r.tipo === 'Manual' ? 'info' : 'secondary'}>{r.tipo}</Badge>, sortable: true, width: '9%' },
        { name: 'Descrição', selector: (r: PagamentoAdmin) => r.descricao || '', sortable: true, width: '22%' },
        { name: 'Dupl.', selector: (r: PagamentoAdmin) => r.qtdDuplicatas, sortable: true, width: '7%' },
        { name: 'Valor', selector: (r: PagamentoAdmin) => r.valorTotal, cell: (r: PagamentoAdmin) => <b>{brl(r.valorTotal)}</b>, sortable: true },
        { name: 'Vencimento', selector: (r: PagamentoAdmin) => r.dataVencimento, cell: (r: PagamentoAdmin) => dt(r.dataVencimento), sortable: true },
        { name: 'Pagamento', selector: (r: PagamentoAdmin) => r.dataPagamento, cell: (r: PagamentoAdmin) => dt(r.dataPagamento), sortable: true },
        {
            name: 'Status', selector: (r: PagamentoAdmin) => r.statusPagamento,
            cell: (r: PagamentoAdmin) => (
                <Badge bg={r.statusPagamento ? 'primary' : 'success'} style={{ cursor: 'pointer' }} onClick={() => toggleStatus(r)}>
                    {r.statusPagamento ? 'Pago' : 'Agendado'}
                </Badge>
            ),
            sortable: true,
        },
    ];

    return (
        <div>
            <div className={styles.filterCard}>
                <div className={styles.filterField}>
                    <label>Status</label>
                    <Form.Select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value as any)}>
                        <option value="">Todos</option>
                        <option value="pendente">Agendados</option>
                        <option value="pago">Pagos</option>
                    </Form.Select>
                </div>
                <div className={styles.filterField} style={{ flex: 1, minWidth: 200 }}>
                    <label>Buscar</label>
                    <input placeholder="Parceiro, descrição ou nº..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <CustomButton typeButton={'dark'} onClick={load}>Pesquisar</CustomButton>
                <CustomButton typeButton={'success'} onClick={() => setNovo(true)}>Novo manual</CustomButton>
            </div>

            <div className={styles.tiles}>
                <StatTile label="Pagamentos" value={String(resumo?.total ?? 0)} accent={'#3b82f6'} />
                <StatTile label="A pagar (agendado)" value={brl(resumo?.valorPendente ?? 0)} accent={'#d97706'} hint={`${resumo?.qtdPendentes ?? 0} pendente(s)`} />
                <StatTile label="Já pago" value={brl(resumo?.valorPago ?? 0)} accent={'#1f9d5f'} hint={`${resumo?.qtdPagos ?? 0} pago(s)`} />
            </div>

            <CustomTable columns={columns} data={filtrados} loading={loading} />

            {novo && (
                <PagamentoParceiroForm isOpen={novo} setClose={(refresh) => { setNovo(false); if (refresh) load(); }} />
            )}
            {edit && (
                <PagamentoParceiroForm isOpen={!!edit} edit={edit} setClose={(refresh) => { setEdit(null); if (refresh) load(); }} />
            )}
        </div>
    );
}
