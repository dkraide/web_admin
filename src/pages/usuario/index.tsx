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
import UsuarioForm from '@/components/Modals/Usuario';


export default function Empresa() {
    const [loading, setLoading] = useState(true)
    const [classes, setClasses] = useState<IUsuario[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [edit, setEdit] = useState<number>(-1);
    const [user, setUser] = useState<string>()

    const loadData = async () => {
        await api
            .get(`/User/List`)
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
            return (p.userName + p.id.toString() + p.cpf + p.nome).toLowerCase().includes(search.toLowerCase())
        });
        return res;
    }


    const columns = [
        {
            name: '#',
            cell: ({ id }) => <CustomButton onClick={() => {setUser(id);setEdit(1)}} typeButton={'warning'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            width: '5%'
        },
        {
            name: 'Tipo',
            selector: (row: IUsuario) => row.isContador ? 'CONTADOR' : 'CLIENTE',
            sortable: true,
            width: '10%'
        },
        {
            name: 'Nome',
            selector: (row: IUsuario) => row.nome,
            sortable: true,
        },
        {
            name: 'Usuario',
            selector: (row: IUsuario) => row.userName,
            sortable: true,
        },
        {
            name: 'CPF',
            selector: row => row['cpf'],
            sortable: true,
        },
    ]
    return (
        <div className={styles.container}>
            <h4>Usuarios</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
            <CustomButton typeButton={'dark'} onClick={() => {setUser(undefined);setEdit(1)}} >Novo Usuario</CustomButton>
            <hr/>
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />

            {edit > 0 && <UsuarioForm  isOpen={edit > 0} id={user} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }} />}

        </div>
    )
}
