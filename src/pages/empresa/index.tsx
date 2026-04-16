import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import IUsuario from '@/interfaces/IUsuario';
import IEmpresa from '@/interfaces/IEmpresa';
import EmpresaForm from '@/components/Modals/Empresa/EmpresaForm';
import { fGetOnlyNumber } from '@/utils/functions';
import SelectStatus from '@/components/Selects/SelectStatus';
import SelectUsuario from '@/components/Selects/SelectUsuario';
import { canSSRAuth } from '@/utils/CanSSRAuth';

type searchProps = {
    str: string;
    status: boolean;
    userId?: string;
}

export default function Empresa() {
    const [loading, setLoading] = useState(true)
    const [classes, setClasses] = useState<IEmpresa[]>([])
    const { getUser, isInRole } = useContext(AuthContext)
    const [search, setSearch] = useState<searchProps>({ str: '', status: true, userId: undefined });
    const [edit, setEdit] = useState(-1);
    const [user, setUser] = useState<IUsuario>()

    const loadData = async () => {
        var u: any;
        if (!user) {
            var res = await getUser();
            setUser(res);
            u = res;
        }
        await api
            .get(`/Empresa/List`)
            .then(({ data }: AxiosResponse) => {
                setClasses(data);
                console.log(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }
    useEffect(() => {
        loadData();
    }, [])

    function getFiltered() {
        var res = classes.filter(p => {
            if(search.userId && search.userId != 'GERAL' && (
                 p.usuarioDono?.toUpperCase() != search.userId.toUpperCase() &&
                 p.usuarioSupervisor?.toUpperCase() != search.userId.toUpperCase()
            )) return false;
            if(search.status != p.statusPagamento) return false;
            if (search.str === '') return true;
            const strFilter = `${p.nomeFantasia}${p.id}${p.usuarioDono}${fGetOnlyNumber(p.cnpj || '')}${fGetOnlyNumber(p.inscricaoEstadual || '')}`.toLowerCase();
            if (strFilter.includes(search.str.toLowerCase())) {
                return true;
            }

        });
        return res;
    }


    async function changeStatus(empresaId, tipo) {
        await api.put(`/Empresa/ChangeStatus?empresa=${empresaId}&tipo=${tipo}`)
            .then(({ data }: AxiosResponse) => {
                toast.success('Empresa atualizada com sucesso.')
                loadData();
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar empresa ${empresaId}.`);
            })
    }

    const handleClickEdit = (id) => {
        if(!isInRole(['ADMINISTRADOR'])){
            toast.error('Apenas administradores podem editar/criar empresas.');
            return;
        }
        setEdit(id);
    }

    const columns = [
        {
            name: 'Id',
            selector: row => row['id'],
            cell: ({ id }) => <CustomButton onClick={() => { handleClickEdit(id) }} typeButton={'warning'}>{id}</CustomButton>,
            sortable: true,
            width: '100px'
        },
        {
            name: 'CNPJ',
            selector: (row: IEmpresa) => row.cnpj,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Nome Fantasia',
            selector: row => row['nomeFantasia'],
            sortable: true,
            grow: 1,
        },
        {
            name: 'Telefone',
            selector: (row: IEmpresa) => row.telefone,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Status',
            selector: (row: IEmpresa) => row.statusPagamento ? 'ATIVO' : 'BLOQUEADO',
            cell: (row: IEmpresa) => <CustomButton onClick={() => { changeStatus(row.id, 'status') }} typeButton={row.statusPagamento ? 'success' : 'danger'}>{row.statusPagamento ? 'ATIVO' : 'BLOQUEADO'}</CustomButton>,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Supervisor',
            selector: (row: IEmpresa) => row.usuarioSupervisor || 'SEM SUPERVISOR',
            sortable: true,
            width: '10%'
        },
        {
            name: 'Usuario',
            selector: (row: IEmpresa) => row.usuarioDono,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Versao',
            selector: (row: IEmpresa) => row.versao,
            sortable: true,
            width: '10%'
        }
    ]
    return (
        <div className={styles.container}>
            <h4>Empresas</h4>
            <div className={styles.search}>
                <InputGroup width={'500px'} placeholder={'Filtro'} title={'Pesquisar'} value={search.str} onChange={(e) => { setSearch({ ...search, str: e.target.value }) }} />
                <SelectStatus width={'200px'} setSelected={(e) => { setSearch({ ...search, status: e}) }} selected={search.status} />
                <SelectUsuario includeGeral onlySupervisor title={'Supervisor'} width={'300px'} selected={search.userId} setSelected={(u) => setSearch({...search, userId: u.userName})} />
            </div>
            <CustomButton typeButton={'dark'} onClick={() => { handleClickEdit(0) }} >Nova Empresa</CustomButton>
            <hr />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <EmpresaForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
export const getServerSideProps = canSSRAuth(['SUPORTE', 'ADMINISTRADOR']);

