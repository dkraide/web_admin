import { useEffect, useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Loading from '@/components/Loading';
import CustomButton from '@/components/ui/Buttons';
import { listPlanos, TefPlano } from '@/services/apiTefAdmin';
import TefPlanoForm from './TefPlanoForm';
import TefPlanoCard from './TefPlanoCard';
import { OrdenarBar, ordenar, TefVazio } from './TefCard';
import { erroDaApi } from './comum';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

const ORDEM = [
    { value: 'nome', label: 'Nome' },
    { value: 'id', label: 'Id' },
    { value: 'valorBase', label: 'Mensalidade' },
    { value: 'custoBase', label: 'Custo base' },
    { value: 'caixas', label: 'Caixas incluídos' },
];

function valorDe(p: TefPlano, campo: string): number | string {
    switch (campo) {
        case 'nome': return (p.nome || '').toLowerCase();
        case 'valorBase': return p.valorBase;
        case 'custoBase': return p.custoBase;
        case 'caixas': return p.caixasIncluidos;
        default: return p.id;
    }
}

export default function TefPlanosTab() {
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [status, setStatus] = useState<'' | 'ativo' | 'inativo'>('');
    const [campo, setCampo] = useState('nome');
    const [dir, setDir] = useState<'asc' | 'desc'>('asc');
    const [itens, setItens] = useState<TefPlano[]>([]);
    const [novo, setNovo] = useState(false);
    const [edit, setEdit] = useState<TefPlano | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            setItens(await listPlanos(false));
        } catch (err: any) {
            toast.error(`Erro ao carregar os planos. ${erroDaApi(err)}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const lista = useMemo(() => {
        const filtrada = itens.filter(p => {
            if (status === 'ativo' && !p.ativo) return false;
            if (status === 'inativo' && p.ativo) return false;
            return `${p.nome}${p.id}${p.provedor}`.toLowerCase().includes(busca.toLowerCase());
        });
        return ordenar(filtrada, p => valorDe(p, campo), dir);
    }, [itens, busca, status, campo, dir]);

    return (
        <div>
            <div className={styles.filterCard}>
                <div className={styles.filterField} style={{ flex: 1, minWidth: 220 }}>
                    <label>Pesquisar</label>
                    <input placeholder="Nome ou nº do plano..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className={styles.filterField}>
                    <label>Situação</label>
                    <Form.Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                        <option value="">Todos</option>
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                    </Form.Select>
                </div>
            </div>

            <OrdenarBar opcoes={ORDEM} campo={campo} setCampo={setCampo} dir={dir} setDir={setDir}
                total={lista.length} rotulo="plano(s)">
                <CustomButton typeButton={'dark'} onClick={() => setNovo(true)}>Novo plano</CustomButton>
            </OrdenarBar>

            <div style={{ color: '#888', fontSize: 13, margin: '0 4px 12px' }}>
                O catálogo do que você cobra do cliente e do que paga ao provedor. Mudar um preço vale só para as próximas cobranças.
            </div>

            {loading ? <Loading /> : lista.length === 0 ? (
                <TefVazio>Nenhum plano encontrado.</TefVazio>
            ) : lista.map(p => <TefPlanoCard key={p.id} plano={p} onEdit={setEdit} />)}

            {novo && <TefPlanoForm isOpen={novo} setClose={(refresh) => { setNovo(false); if (refresh) load(); }} />}
            {edit && <TefPlanoForm isOpen={!!edit} edit={edit} setClose={(refresh) => { setEdit(null); if (refresh) load(); }} />}
        </div>
    );
}
