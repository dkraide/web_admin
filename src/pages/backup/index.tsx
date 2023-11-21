import { useContext, useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AuthContext } from '@/contexts/AuthContext';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faEdit } from '@fortawesome/free-solid-svg-icons';
import UsuarioForm from '@/components/Modals/Usuario';
import { format } from 'date-fns';

type file = {
     fileSize : number
     lastModifiedDate: Date
     fileName: string
}
export default function Backup() {
    const [loading, setLoading] = useState(true)
    const [classes, setClasses] = useState<file[]>([])
    const { getUser } = useContext(AuthContext)
    const [search, setSearch] = useState('')
    const [edit, setEdit] = useState<number>(-1);
    const [user, setUser] = useState<string>()

    const loadData = async () => {
        await api
            .get(`/Empresa/GetBackupList`)
            .then(({ data }: AxiosResponse) => {
                setClasses(data);
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
            return p.fileName.toLowerCase().includes(search.toLowerCase()) 
        });
        return res;
    }

    async function downLoadFile(file){
           await api.get(`/Empresa/DownloadFile?file=${file}`)
           .then(({data}: AxiosResponse) => {
            console.log(data);
            var oMyBlob = new Blob(data, {type : 'text'}); // the blob
            window.open(URL.createObjectURL(oMyBlob));
           }).catch((err: AxiosError) => {
            console.log(err);
           })
    }


    const columns = [
        {
            name: '#',
            cell: ({ fileName }) => <CustomButton onClick={() => {downLoadFile(fileName)}} typeButton={'primary'}><FontAwesomeIcon icon={faDownload}/></CustomButton>,
            sortable: true,
            width: '5%'
        },
        {
            name: 'Arquivo',
            selector: (row: file) => row.fileName,
            sortable: true,
        },
        {
            name: 'Ultima Modificacao',
            selector: row => row.lastModifiedDate,
            cell: (row: file) => format(new Date(row.lastModifiedDate), 'dd/MM/yyyy'),
            sortable: true,
        },
        {
            name: 'Tamanho',
            selector: (row: file) => row.fileSize,
            cell: (row:file) => `${(row.fileSize/ 1e+6).toFixed(2)}MB`,
            sortable: true,
        },
    ]
    return (
        <div className={styles.container}>
            <h4>Backup Online</h4>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search} onChange={(e) => { setSearch(e.target.value) }} />
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