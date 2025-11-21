import CircleProgressBar from '@/components/ui/CircleProgressBar';
import styles from './styles.module.scss';
import CustomButton from '@/components/ui/Buttons';
import IEmpresa from '@/interfaces/IEmpresa';
import { api } from '@/services/apiClient';
import { toast } from 'react-toastify';
import { AxiosError, AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';
import CustomTable from '@/components/ui/CustomTable';
import EmpresaParceiroForm from '@/components/Modals/Empresa/EmpresaParceiroForm';
import Dropdown from 'react-bootstrap/Dropdown';
import { fGetOnlyNumber } from '@/utils/functions';
import { InputGroup } from '@/components/ui/InputGroup';

type searchProps = {
    str: string,
    edit: number
}
export default function TabEmpresas() {

    const [empresas, setEmpresas] = useState<IEmpresa[]>([]);
    const [search, setSearch] = useState<searchProps>({ str: '', edit: -1 });
    useEffect(() => {
        loadData();
    }, []);
    function getFiltered() {
        var res = empresas.filter(p => {
            if (search.str === '') return true;
            const strFilter = `${p.nomeFantasia}${p.id}${p.usuarioDono}${fGetOnlyNumber(p.cnpj || '')}${fGetOnlyNumber(p.inscricaoEstadual || '')}`.toLowerCase();
            if (strFilter.includes(search.str.toLowerCase())) {
                return true;
            }

        });
        return res;
    }

    const loadData = async () => {
        await api
            .get(`/Empresa/GetEmpresas`)
            .then(({ data }: AxiosResponse) => {
                setEmpresas(data);
                console.log(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);
            });
    }
    const columns = [
        {
            name: 'Id',
            selector: row => row['id'],
            cell: ({ id }) => <b style={{ color: 'var(--main)' }}>{id}</b>,
            sortable: true,
            width: '5%'
        },
        {
            name: 'CNPJ',
            selector: (row: IEmpresa) => row.cnpj,
            sortable: true,
        },
        {
            name: 'Nome Fantasia',
            selector: row => row['nomeFantasia'],
            sortable: true,
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
            cell: (row: IEmpresa) => <b style={{ color: 'var(--main)' }}>{row.statusPagamento ? 'ATIVO' : 'BLOQUEADO'}</b>,
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
        },
        {
            name: '#',
            selector: (row: IEmpresa) => row.versao,
            cell: (row: IEmpresa) => (
                <Dropdown>
                    <Dropdown.Toggle variant="secondary" size="sm">
                        Ações
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleEditar(row)}>Editar</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleBloquear(row)}>Bloquear</Dropdown.Item>
                        <Dropdown.Item onClick={() => handleLiberarManual(row)}>Liberar manual</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            ),
            sortable: true,
            width: '10%'
        }
    ]
    // Handlers vazios
    const handleEditar = ({ id }: IEmpresa) => {
        setSearch({ ...search, edit: id })
    };
    const handleBloquear = (empresa: IEmpresa) => {

    };
    const handleLiberarManual = (empresa: IEmpresa) => {

    };

    async function changeStatus(empresaId, tipo) {
        await api.put(`/Empresa/ChangeStatus?empresa=${empresaId}&tipo=${tipo}`)
            .then(({ data }: AxiosResponse) => {
                toast.success('Empresa atualizada com sucesso.')
                loadData();
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar empresa ${empresaId}.`);
            })
    }
    const ativas = (percentage: boolean) => {
        const filtered = getFiltered().filter(emp => emp.statusPagamento);
        return percentage ? (filtered.length / empresas.length) * 100 : filtered.length;
    }
    const bloqueadas = (percentage: boolean) => {
        const a = ativas(false);
        const bloqueadas = getFiltered().length - a;
        return percentage ? (bloqueadas / getFiltered().length) * 100 : bloqueadas;
    }
    return (
        <div className={styles.container}>
            <div className={styles.status}>
                <CircleProgressBar barColor={'#427effff'} percentage={100} centerText={getFiltered().length.toString()} size={100} description={'Empresas'} />
                <CircleProgressBar percentage={ativas(true)} centerText={ativas(false).toString()} size={100} description={'Ativas'} />
                <CircleProgressBar barColor={'#ff4242ff'} percentage={bloqueadas(true)} centerText={bloqueadas(false).toString()} size={100} description={'Bloqueadas'} />
            </div>
            <hr />
            <div className={styles.actions}>
                <CustomButton onClick={() => {
                    setSearch({ ...search, edit: 0 })
                }}>Nova Empresa</CustomButton>
                <CustomButton>Excel</CustomButton>
                <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search.str} onChange={(e) => { setSearch({...search, str: e.target.value}) }} />
            </div>
            <hr/>
            <div className={styles.list}>
                <CustomTable
                    columns={columns}
                    data={getFiltered()}
                />
            </div>
            {search.edit >= 0 && (
                <EmpresaParceiroForm
                    id={search.edit}
                    isOpen={true}
                    setClose={(res) => {
                        if (res) {
                            loadData();
                        }
                        setSearch({ ...search, edit: -1 })
                    }}
                />
            )}
        </div>
    )
}