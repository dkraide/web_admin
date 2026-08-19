import { useContext, useEffect, useMemo, useState } from 'react';
import styles from './styles.module.scss';
import filtros from '@/components/Parceiros/Tabs/Financeiro/styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import Loading from '@/components/Loading';
import IUsuario from '@/interfaces/IUsuario';
import IEmpresa from '@/interfaces/IEmpresa';
import EmpresaForm from '@/components/Modals/Empresa/EmpresaForm';
import EmpresaCard, { ToggleTipo } from '@/components/Empresa/EmpresaCard';
import { fGetOnlyNumber } from '@/utils/functions';
import { canSSRAuth } from '@/utils/CanSSRAuth';

type Tri = '' | 'sim' | 'nao';
type StatusFiltro = 'geral' | 'ativo' | 'bloqueado';
const SEM_SUPERVISOR = '__none__';
type SortField = 'nomeFantasia' | 'id' | 'dataCriacao' | 'inicioPagamento' | 'diaCobranca' | 'valorMensal' | 'repasse' | 'plano';

const SORT_LABELS: { field: SortField; label: string }[] = [
    { field: 'nomeFantasia', label: 'Nome' },
    { field: 'id', label: 'Id' },
    { field: 'dataCriacao', label: 'Data de criação' },
    { field: 'inicioPagamento', label: 'Início pagamento' },
    { field: 'diaCobranca', label: 'Dia cobrança' },
    { field: 'valorMensal', label: 'Valor mensal' },
    { field: 'repasse', label: 'Valor repasse' },
    { field: 'plano', label: 'Plano' },
];

function triMatch(tri: Tri, value: boolean) {
    if (tri === 'sim') return value;
    if (tri === 'nao') return !value;
    return true;
}

function TriSelect({ label, value, onChange }: { label: string; value: Tri; onChange: (v: Tri) => void }) {
    return (
        <div className={filtros.filterField}>
            <label>{label}</label>
            <Form.Select value={value} onChange={(e) => onChange(e.target.value as Tri)}>
                <option value="">Geral</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
            </Form.Select>
        </div>
    );
}

export default function Empresa() {
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<IEmpresa[]>([]);
    const { getUser, isInRole } = useContext(AuthContext);
    const [user, setUser] = useState<IUsuario>();
    const [edit, setEdit] = useState(-1);

    // filtros
    const [str, setStr] = useState('');
    const [status, setStatus] = useState<StatusFiltro>('ativo');
    const [userId, setUserId] = useState<string>('');
    const [plano, setPlano] = useState<string>('');
    const [fBoleto, setFBoleto] = useState<Tri>('');
    const [fNfse, setFNfse] = useState<Tri>('');
    const [fEmail, setFEmail] = useState<Tri>('');
    const [fSms, setFSms] = useState<Tri>('');

    // ordenação
    const [sortField, setSortField] = useState<SortField>('nomeFantasia');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const loadData = async () => {
        setLoading(true);
        if (!user) {
            const res = await getUser();
            setUser(res);
        }
        await api.get(`/Empresa/List`)
            .then(({ data }: AxiosResponse) => setClasses(data))
            .catch((err: AxiosError) => toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`));
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const repasseDe = (e: IEmpresa) => Math.max((e.valorMensal || 0) - (e.valorKrd || 0), 0);

    // opções de supervisor a partir das empresas carregadas
    const supervisores = useMemo(() => {
        const set = new Set<string>();
        classes.forEach(e => { if (e.usuarioSupervisor?.trim()) set.add(e.usuarioSupervisor); });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [classes]);

    const lista = useMemo(() => {
        const filtrada = classes.filter(p => {
            if (userId === SEM_SUPERVISOR) {
                if (p.usuarioSupervisor?.trim()) return false;
            } else if (userId) {
                if (p.usuarioSupervisor?.toUpperCase() !== userId.toUpperCase()) return false;
            }
            if (status === 'ativo' && !p.statusPagamento) return false;
            if (status === 'bloqueado' && p.statusPagamento) return false;
            if (plano && p.plano !== plano) return false;
            if (!triMatch(fBoleto, p.geraBoleto)) return false;
            if (!triMatch(fNfse, p.geraNfse)) return false;
            if (!triMatch(fEmail, p.enviaEmail)) return false;
            if (!triMatch(fSms, p.enviaSms)) return false;
            if (str) {
                const s = `${p.nomeFantasia}${p.id}${p.usuarioDono}${fGetOnlyNumber(p.cnpj || '')}${fGetOnlyNumber(p.inscricaoEstadual || '')}`.toLowerCase();
                if (!s.includes(str.toLowerCase())) return false;
            }
            return true;
        });

        const dir = sortDir === 'asc' ? 1 : -1;
        const val = (e: IEmpresa): number | string => {
            switch (sortField) {
                case 'nomeFantasia': return (e.nomeFantasia || '').toLowerCase();
                case 'plano': return (e.plano || '').toLowerCase();
                case 'id': return e.id;
                case 'diaCobranca': return e.diaCobranca || 0;
                case 'valorMensal': return e.valorMensal || 0;
                case 'repasse': return repasseDe(e);
                case 'dataCriacao': return new Date(e.dataCriacao || 0).getTime();
                case 'inicioPagamento': return new Date(e.inicioPagamento || 0).getTime();
                default: return 0;
            }
        };
        return [...filtrada].sort((a, b) => {
            const va = val(a) as any, vb = val(b) as any;
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
    }, [classes, userId, status, plano, fBoleto, fNfse, fEmail, fSms, str, sortField, sortDir]);

    async function toggle(empresa: IEmpresa, tipo: ToggleTipo) {
        // atualização otimista
        const patch: Partial<IEmpresa> =
            tipo === 'status' ? { statusPagamento: !empresa.statusPagamento } :
            tipo === 'geraboleto' ? { geraBoleto: !empresa.geraBoleto } :
            tipo === 'geranfse' ? { geraNfse: !empresa.geraNfse } :
            tipo === 'enviaemail' ? { enviaEmail: !empresa.enviaEmail } :
            { enviaSms: !empresa.enviaSms };

        setClasses(prev => prev.map(e => e.id === empresa.id ? { ...e, ...patch } : e));

        try {
            await api.put(`/Empresa/ChangeStatus?empresa=${empresa.id}&tipo=${tipo}`);
        } catch (err: any) {
            // reverte
            setClasses(prev => prev.map(e => e.id === empresa.id ? empresa : e));
            toast.error(`Erro ao atualizar empresa ${empresa.id}. ${err.response?.data || err.message}`);
        }
    }

    function handleClickEdit(id: number) {
        if (!isInRole(['ADMINISTRADOR'])) {
            toast.error('Apenas administradores podem editar/criar empresas.');
            return;
        }
        setEdit(id);
    }

    return (
        <div className={styles.container}>
            <h4>Empresas</h4>

            <div className={filtros.filterCard}>
                <div className={filtros.filterField} style={{ flex: 1, minWidth: 220 }}>
                    <label>Pesquisar</label>
                    <input placeholder="Nome, id, CNPJ, usuário..." value={str} onChange={(e) => setStr(e.target.value)} />
                </div>
                <div className={filtros.filterField}>
                    <label>Status</label>
                    <Form.Select value={status} onChange={(e) => setStatus(e.target.value as StatusFiltro)}>
                        <option value="geral">Geral</option>
                        <option value="ativo">Ativas</option>
                        <option value="bloqueado">Bloqueadas</option>
                    </Form.Select>
                </div>
                <div className={filtros.filterField}>
                    <label>Supervisor</label>
                    <Form.Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                        <option value="">Todos</option>
                        <option value={SEM_SUPERVISOR}>Sem supervisor</option>
                        {supervisores.map(s => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>
                </div>
                <div className={filtros.filterField}>
                    <label>Plano</label>
                    <Form.Select value={plano} onChange={(e) => setPlano(e.target.value)}>
                        <option value="">Todos</option>
                        <option value="Teste">Teste</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Semestral">Semestral</option>
                        <option value="Anual">Anual</option>
                    </Form.Select>
                </div>
                <TriSelect label="Gera boleto" value={fBoleto} onChange={setFBoleto} />
                <TriSelect label="Gera NFSe" value={fNfse} onChange={setFNfse} />
                <TriSelect label="Envia e-mail" value={fEmail} onChange={setFEmail} />
                <TriSelect label="Envia SMS" value={fSms} onChange={setFSms} />
            </div>

            <div className={filtros.filterCard}>
                <div className={filtros.filterField}>
                    <label>Ordenar</label>
                    <Form.Select value={sortField} onChange={(e) => setSortField(e.target.value as SortField)}>
                        {SORT_LABELS.map(s => <option key={s.field} value={s.field}>{s.label}</option>)}
                    </Form.Select>
                </div>
                <div className={filtros.filterField}>
                    <label>Ordenar por</label>
                    <Form.Select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
                        <option value="asc">Crescente</option>
                        <option value="desc">Decrescente</option>
                    </Form.Select>
                </div>
                <div className={filtros.filterField} style={{ flex: 1, alignItems: 'flex-end' }}>
                    <CustomButton typeButton={'dark'} onClick={() => handleClickEdit(0)}>Nova Empresa</CustomButton>
                </div>
                <div className={filtros.filterField} style={{ justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 13, color: '#888' }}>{lista.length} empresa(s)</span>
                </div>
            </div>

            {loading ? <Loading /> : lista.map(e => (
                <EmpresaCard key={e.id} empresa={e} onEdit={handleClickEdit} onToggle={toggle} />
            ))}

            {edit >= 0 && (
                <EmpresaForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                    if (v) loadData();
                    setEdit(-1);
                }} />
            )}
        </div>
    );
}

export const getServerSideProps = canSSRAuth(['SUPORTE', 'ADMINISTRADOR']);
