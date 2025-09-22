import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import IClasseMaterial from '@/interfaces/IClasseMaterial';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import ClasseForm from '@/components/Modals/ClasseMaterial/CreateEditForm';
import IUsuario from '@/interfaces/IUsuario';
import IEmpresa from '@/interfaces/IEmpresa';
import EmpresaForm from '@/components/Modals/Empresa/EmpresaForm';
import { fGetOnlyNumber } from '@/utils/functions';


export default function Empresa() {
    const [loading, setLoading] = useState(true)
    const [classes, setClasses] = useState<IEmpresa[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [edit, setEdit] = useState(-1);
    const [user, setUser] = useState<IUsuario>()

    const loadData = async () => {
       var u: any;
       if(!user){
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
            if(search === '') return true;
            const strFilter = `${p.nomeFantasia}${p.id}${p.usuarioDono}${fGetOnlyNumber(p.cnpj || '')}${fGetOnlyNumber(p.inscricaoEstadual  || '')}`.toLowerCase();
            if (strFilter.includes(search.toLowerCase())) {
                return true;
            }

        });
        return res;
    }


    async function changeStatus(empresaId, tipo){
           await api.put(`/Empresa/ChangeStatus?empresa=${empresaId}&tipo=${tipo}`)
           .then(({data}: AxiosResponse) => {
                toast.success('Empresa atualizada com sucesso.')
                loadData();
           }).catch((err: AxiosError) => {
            toast.error(`Erro ao atualizar empresa ${empresaId}.`);
           })
    }

    const columns = [
        {
            name: 'Id',
            selector: row => row['id'],
            cell: ({ id }) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'warning'}>{id}</CustomButton>,
            sortable: true,
            width: '5%'
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
            width: '25%'
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
            cell: (row: IEmpresa) => <CustomButton onClick={() => {changeStatus(row.id, 'status')}} typeButton={row.statusPagamento ? 'success' : 'danger'}>{row.statusPagamento ? 'ATIVO' : 'BLOQUEADO'}</CustomButton>,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Backup',
            selector: (row: IEmpresa) => row.liberaBackup ? 'SIM' : 'NAO',
            cell: (row: IEmpresa) => <CustomButton onClick={() => {changeStatus(row.id, 'backup')}} typeButton={row.liberaBackup ? 'success' : 'danger'}>{row.liberaBackup ? 'SIM' : 'NAO'}</CustomButton>,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Assessoria',
            selector: (row: IEmpresa) => row.assessoria ? 'SIM' : 'NAO',
            cell: (row: IEmpresa) => <CustomButton onClick={() => {changeStatus(row.id, 'assessoria')}} typeButton={row.assessoria ? 'success' : 'danger'}>{row.assessoria ? 'SIM' : 'NAO'}</CustomButton>,
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
            width: '5%'
        }
    ]
    return (
        <div className={styles.container}>
            <h4>Empresas</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => {setEdit(0)}} >Nova Empresa</CustomButton>
            <hr/>
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {(edit >= 0) && <EmpresaForm user={user} isOpen={edit >= 0} id={edit} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}


