import { useEffect, useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Loading from '@/components/Loading';
import CustomButton from '@/components/ui/Buttons';
import { listDespesas, pagarDespesa, TefDespesa, TefDespesasResponse } from '@/services/apiTefAdmin';
import TefDespesaForm from './TefDespesaForm';
import TefDespesaCard from './TefDespesaCard';
import { OrdenarBar, ordenar, TefVazio } from './TefCard';
import { brl, erroDaApi, StatTile } from './comum';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

const ORDEM = [
    { value: 'vencimento', label: 'Vencimento' },
    { value: 'competencia', label: 'Competência' },
    { value: 'valor', label: 'Valor' },
    { value: 'descricao', label: 'Descrição' },
    { value: 'id', label: 'Id' },
];

function valorDe(d: TefDespesa, campo: string): number | string {
    switch (campo) {
        case 'vencimento': return new Date(d.dataVencimento || 0).getTime();
        case 'competencia': return new Date(d.dataCompetencia || 0).getTime();
        case 'valor': return d.valor;
        case 'descricao': return (d.descricao || '').toLowerCase();
        default: return d.id;
    }
}

export default function TefDespesasTab() {
    const [loading, setLoading] = useState(true);
    const [pago, setPago] = useState<'' | 'aberto' | 'pago'>('');
    const [inicio, setInicio] = useState('');
    const [fim, setFim] = useState('');
    const [busca, setBusca] = useState('');
    const [campo, setCampo] = useState('vencimento');
    const [dir, setDir] = useState<'asc' | 'desc'>('desc');
    const [dados, setDados] = useState<TefDespesasResponse | null>(null);
    const [edit, setEdit] = useState<TefDespesa | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const filtroPago = pago === '' ? undefined : pago === 'pago';
            setDados(await listDespesas(filtroPago, inicio || undefined, fim || undefined));
        } catch (err: any) {
            toast.error(`Erro ao carregar as despesas. ${erroDaApi(err)}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const lista = useMemo(() => {
        const filtrada = (dados?.itens || []).filter(d =>
            `${d.descricao || ''}${d.fornecedor || ''}${d.id}`.toLowerCase().includes(busca.toLowerCase()));
        return ordenar(filtrada, d => valorDe(d, campo), dir);
    }, [dados, busca, campo, dir]);

    async function pagar(d: TefDespesa) {
        if (!confirm(`Marcar a despesa #${d.id} (${brl(d.valor)}) como paga?`)) return;
        try {
            await pagarDespesa(d.id);
            toast.success('Despesa marcada como paga.');
            load();
        } catch (err: any) {
            toast.error(`Erro ao pagar. ${erroDaApi(err)}`);
        }
    }

    return (
        <div>
            <div className={styles.filterCard}>
                <div className={styles.filterField} style={{ flex: 1, minWidth: 220 }}>
                    <label>Pesquisar</label>
                    <input placeholder="Descrição, fornecedor ou nº..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className={styles.filterField}>
                    <label>Status</label>
                    <Form.Select value={pago} onChange={(e) => setPago(e.target.value as any)}>
                        <option value="">Todas</option>
                        <option value="aberto">A pagar</option>
                        <option value="pago">Pagas</option>
                    </Form.Select>
                </div>
                <div className={styles.filterField}>
                    <label>Competência de</label>
                    <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                </div>
                <div className={styles.filterField}>
                    <label>até</label>
                    <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
                </div>
                <CustomButton typeButton={'dark'} onClick={load}>Pesquisar</CustomButton>
            </div>

            <div className={styles.tiles}>
                <StatTile label="Despesas" value={String(dados?.resumo.total ?? 0)} accent={'#3b82f6'} />
                <StatTile label="A pagar ao provedor" value={brl(dados?.resumo.valorEmAberto ?? 0)} accent={'#d97706'} />
                <StatTile label="Já pago" value={brl(dados?.resumo.valorPago ?? 0)} accent={'#1f9d5f'} />
            </div>

            <OrdenarBar opcoes={ORDEM} campo={campo} setCampo={setCampo} dir={dir} setDir={setDir}
                total={lista.length} rotulo="despesa(s)" />

            {loading ? <Loading /> : lista.length === 0 ? (
                <TefVazio>Nenhuma despesa encontrada.</TefVazio>
            ) : lista.map(d => <TefDespesaCard key={d.id} despesa={d} onEdit={setEdit} onPagar={pagar} />)}

            {edit && <TefDespesaForm despesa={edit} setClose={(refresh) => { setEdit(null); if (refresh) load(); }} />}
        </div>
    );
}
