import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Loading from '@/components/Loading';
import CustomButton from '@/components/ui/Buttons';
import { getRelatorio, TefRelatorio, TefRelatorioMes } from '@/services/apiTefAdmin';
import TefMargemCard from './TefMargemCard';
import { OrdenarBar, ordenar, TefVazio } from './TefCard';
import { brl, erroDaApi, StatTile } from './comum';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

const ORDEM = [
    { value: 'competencia', label: 'Competência' },
    { value: 'valor', label: 'Cobrado' },
    { value: 'custo', label: 'Custo' },
    { value: 'margem', label: 'Margem' },
];

function valorDe(m: TefRelatorioMes, campo: string): number | string {
    switch (campo) {
        case 'valor': return m.valor;
        case 'custo': return m.custo;
        case 'margem': return m.margem;
        default: return new Date(m.competencia || 0).getTime();
    }
}

export default function TefMargemTab() {
    const [loading, setLoading] = useState(true);
    const [inicio, setInicio] = useState('');
    const [fim, setFim] = useState('');
    const [campo, setCampo] = useState('competencia');
    const [dir, setDir] = useState<'asc' | 'desc'>('desc');
    const [rel, setRel] = useState<TefRelatorio | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            setRel(await getRelatorio(inicio || undefined, fim || undefined));
        } catch (err: any) {
            toast.error(`Erro ao carregar o relatório. ${erroDaApi(err)}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const lista = useMemo(() => ordenar(rel?.meses || [], m => valorDe(m, campo), dir), [rel, campo, dir]);
    const t = rel?.total;

    return (
        <div>
            <div className={styles.filterCard}>
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
                <StatTile label="Cobrado do cliente" value={brl(t?.valor ?? 0)} accent={'#3b82f6'}
                    hint={`recebido ${brl(t?.recebido ?? 0)}`} />
                <StatTile label="Custo do provedor" value={brl(t?.custo ?? 0)} accent={'#d97706'}
                    hint={`pago ${brl(t?.custoPago ?? 0)}`} />
                <StatTile label="Margem" value={brl(t?.margem ?? 0)} accent={(t?.margem ?? 0) >= 0 ? '#1f9d5f' : '#c0392b'} />
            </div>

            <OrdenarBar opcoes={ORDEM} campo={campo} setCampo={setCampo} dir={dir} setDir={setDir}
                total={lista.length} rotulo="mês(es)" />

            {loading ? <Loading /> : lista.length === 0 ? (
                <TefVazio>Nenhuma cobrança de TEF no período.</TefVazio>
            ) : lista.map(m => <TefMargemCard key={m.competencia} item={m} />)}
        </div>
    );
}
