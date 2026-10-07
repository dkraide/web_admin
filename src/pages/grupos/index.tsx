import { useEffect, useState } from 'react';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import CustomButton from '@/components/ui/Buttons';
import Confirm from '@/components/Modals/Confirm';
import GrupoEmpresarialForm from '@/components/Modals/GrupoEmpresarial';
import IGrupoEmpresarial from '@/interfaces/IGrupoEmpresarial';
import { canSSRAuth } from '@/utils/CanSSRAuth';

export default function GruposEmpresariais() {
    const [loading, setLoading] = useState(true);
    const [grupos, setGrupos] = useState<IGrupoEmpresarial[]>([]);
    const [search, setSearch] = useState('');
    const [formAberto, setFormAberto] = useState(false);
    const [editando, setEditando] = useState<IGrupoEmpresarial | undefined>();
    const [excluindo, setExcluindo] = useState<IGrupoEmpresarial | undefined>();

    const loadData = async () => {
        setLoading(true);
        await api
            .get('/admin/grupo-empresarial')
            .then(({ data }: AxiosResponse) => setGrupos(data))
            .catch((err: AxiosError) => toast.error(`Erro ao carregar grupos. ${err.response?.data || err.message}`));
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    function getFiltered() {
        const t = search.toLowerCase();
        return grupos.filter(g =>
            [g.titulo, ...g.empresas.map(e => e.nomeFantasia), ...g.usuarios.map(u => `${u.nome} ${u.userName}`)]
                .join(' ').toLowerCase().includes(t));
    }

    function abrir(grupo?: IGrupoEmpresarial) {
        setEditando(grupo);
        setFormAberto(true);
    }

    async function excluir() {
        const grupo = excluindo;
        setExcluindo(undefined);
        if (!grupo) return;
        try {
            await api.delete(`/admin/grupo-empresarial/${grupo.id}`);
            toast.success('Grupo excluído.');
            loadData();
        } catch (e) {
            const err = e as AxiosError;
            toast.error(`Erro ao excluir o grupo. ${typeof err.response?.data === 'string' ? err.response.data : err.message}`);
        }
    }

    const columns = [
        {
            name: '#',
            cell: (g: IGrupoEmpresarial) => (
                <div style={{ display: 'flex', gap: 4 }}>
                    <CustomButton onClick={() => abrir(g)} typeButton={'warning'} title="Editar" aria-label="Editar grupo"><FontAwesomeIcon icon={faEdit} /></CustomButton>
                    <CustomButton onClick={() => setExcluindo(g)} typeButton={'danger'} title="Excluir" aria-label="Excluir grupo"><FontAwesomeIcon icon={faTrash} /></CustomButton>
                </div>
            ),
            width: '10%',
        },
        {
            name: 'Grupo',
            selector: (g: IGrupoEmpresarial) => g.titulo,
            sortable: true,
            width: '20%',
        },
        {
            name: 'Matriz',
            selector: (g: IGrupoEmpresarial) => g.empresas.find(e => e.id === g.empresaMatrizId)?.nomeFantasia ?? `#${g.empresaMatrizId}`,
            sortable: true,
            width: '20%',
        },
        {
            name: 'Lojas',
            cell: (g: IGrupoEmpresarial) => (
                <span title={g.empresas.map(e => e.nomeFantasia).join('\n')}>
                    <b>{g.empresas.length}</b> · {g.empresas.slice(0, 3).map(e => e.nomeFantasia).join(', ')}{g.empresas.length > 3 ? '…' : ''}
                </span>
            ),
            sortable: false,
        },
        {
            name: 'Usuários',
            cell: (g: IGrupoEmpresarial) => (
                <span title={g.usuarios.map(u => u.userName).join('\n')}>
                    <b>{g.usuarios.length}</b>{g.usuarios.length > 0 ? ` · ${g.usuarios.slice(0, 2).map(u => u.nome || u.userName).join(', ')}${g.usuarios.length > 2 ? '…' : ''}` : ''}
                </span>
            ),
            sortable: false,
        },
    ];

    return (
        <div className={styles.container}>
            <h4>Grupos Empresariais</h4>
            <p className={styles.ajuda}>
                Um grupo reúne a matriz e as filiais de uma franquia. Os usuários do grupo acessam o painel do franqueado
                com todos os relatórios e cadastros das lojas.
            </p>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => setSearch(e.target.value)} />
            <CustomButton typeButton={'dark'} onClick={() => abrir()}>Novo Grupo</CustomButton>
            <hr />
            <CustomTable columns={columns} data={getFiltered()} loading={loading} />

            {formAberto && (
                <GrupoEmpresarialForm
                    isOpen={formAberto}
                    grupo={editando}
                    setClose={(recarregar) => {
                        setFormAberto(false);
                        setEditando(undefined);
                        if (recarregar) loadData();
                    }}
                />
            )}

            {excluindo && (
                <Confirm
                    isOpen={!!excluindo}
                    message={`Excluir o grupo “${excluindo.titulo}”? As lojas e os usuários não são apagados, mas deixam de acessar o painel do franqueado por este grupo.`}
                    setClose={(ok) => (ok ? excluir() : setExcluindo(undefined))}
                />
            )}
        </div>
    );
}
export const getServerSideProps = canSSRAuth(['ADMINISTRADOR', 'SUPORTE']);
