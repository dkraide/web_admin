

import { useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode, faEdit, faEnvelope, faMailBulk, faPhone, faPrint } from '@fortawesome/free-solid-svg-icons';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import IDuplicata from '@/interfaces/IDuplicata';
import { Badge, Dropdown, SplitButton } from 'react-bootstrap';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import DuplicataForm from '@/components/Modals/Financeiro/DuplicataForm';
import _ from 'lodash';
import DuplicataMassaForm from '@/components/Modals/Financeiro/DuplicataMassaForm';
import NFSEForm from '@/components/Modals/Financeiro/NFSEForm/DuplicataForm';
import EnviarEmailForm from '@/components/Modals/Financeiro/EnviarEmailForm';
import SelectUsuario from '@/components/Selects/SelectUsuario';
import { canSSRAuth } from '@/utils/CanSSRAuth';



type searchProps = {
    dateIn: string
    dateFim: string
    searchString?: string
    empresa?: number
    showNFSe?: number
    massa?: boolean,
    edit?: number,
    email?: number,
    userName?: string
}
export default function Financeiro() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IDuplicata[]>([])
    const [search, setSearch] = useState<searchProps>()

    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'), email: 0, showNFSe: 0, massa: false, edit: -1 });
        }
        setTimeout(() => {
            loadData();
        }, 1000);
    }, [])

    const loadData = async () => {

        if (!loading) {
            setLoading(true);
        }
        var url = '';
        if (!search) {
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/Financeiro/List?dataIn=${dateIn}&dataFim=${dateFim}`;
        } else {
            url = `/Financeiro/List?dataIn=${search.dateIn}&dataFim=${search.dateFim}&Empresa=${search.empresa || 0}&Situacao=0`;
        }
        await api.get(url)
            .then(({ data }: AxiosResponse<IDuplicata[]>) => {
                setList(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar duplcatas. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }

    function getFiltered() {
        var res = list.filter(p => {
            if (search.empresa && search.empresa > 0 && p.empresaId != search.empresa) return false;
            if (search.userName && search.userName != 'GERAL' && search.userName.length > 0 && p.empresa?.usuarioSupervisor?.toUpperCase() != search.userName.toUpperCase()) return false;
            return (p.id.toString() + p.empresaId + (p.empresa?.nomeFantasia || '')).toLowerCase().includes((search?.searchString || '').toLowerCase())
        });
        return res;
    }

    async function updatePagamento(id: number) {
        var index = _.findIndex(list, p => p.id == id);
        var x = list[index];
        x.isPago = !x.isPago;
        await api.put(`/Financeiro/update`, x)
            .then(({ data }: AxiosResponse) => {
                list[index] = data;
                setList([...list]);
                toast.success(`Sucesso ao atualizar pagamento.`);

            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar status de pagamento. ${err.response?.data || err.message}`);
            });
    }

    async function geraBoleto(duplicataId) {
        setLoading(true);
        await api.post(`/Boleto/CreateBoleto?duplicataId=${duplicataId}`)
            .then(({ data }) => {
                toast.success(`Boleto gerado com sucesso!`);
                loadData();
            }).catch((err) => {
                toast.error(`Ops... parece que houve um erro para gerar o boleto. Confira os dados do cliente!`);
            })
        setLoading(false);
    }

    async function vincular(duplicataId) {
        setLoading(true);
        await api.post(`/Boleto/BuscarBoletoGerado?duplicataId=${duplicataId}`)
            .then(({ data }) => {
                toast.success(`Boleto vinculado com sucesso!`);
                loadData();
            }).catch((err) => {
                toast.error(`Ops... parece que houve um erro para vincular o boleto. Confira os dados do cliente!`);
            })
        setLoading(false);
    }
    async function sendWhatsapp(duplicataId) {
        setLoading(true);
        await api.post(`/Financeiro/Notificacoes/Manual`, {
            duplicataIds: [duplicataId],
            canal: 'WhatsApp'
        })
            .then(({ data }: AxiosResponse) => {
                toast.success(data?.mensagem || `Notificação de WhatsApp criada. O envio ocorre em até 1 minuto.`);
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao criar notificação de WhatsApp. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }



    const columns = [
        {
            name: '#',
            selector: row => row.id,
            cell: ({ id }: IDuplicata) =>
                <SplitButton
                    size="sm"
                    variant="primary"
                    id={`split-button-duplicata-${id}`}
                    title={<><FontAwesomeIcon icon={faEdit} /> {id}</>}
                    onClick={() => { setSearch({ ...search, edit: id }) }}
                >
                    <Dropdown.Item onClick={() => { setSearch({ ...search, email: id }) }}>
                        <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                        Enviar e-mail
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => { sendWhatsapp(id) }}>
                        <FontAwesomeIcon icon={faPhone} className="me-2" />
                        Enviar WhatsApp
                    </Dropdown.Item>
                </SplitButton>,
            sortable: true,
            width: '150px'
        },
        {
            name: 'Empresa',
            selector: (row: IDuplicata) => row.empresa?.nomeFantasia || '',
            sortable: true,
            width: '35%'
        },
        {
            name: 'Emissao',
            selector: row => row.Emissao,
            cell: (row: IDuplicata) => format(new Date(row.dataEmissao), 'dd/MM/yyyy'),
            sortable: true,
            width: '10%'
        },
        {
            name: 'Vencimento',
            selector: row => row.dataVencimento,
            cell: (row: IDuplicata) => format(new Date(row.dataVencimento), 'dd/MM/yyyy'),
            sortable: true,
        },
        {
            name: 'Valor',
            selector: (row: IDuplicata) => `R$ ${row.valor.toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Boleto',
            selector: (row: IDuplicata) => row.boletoId,
            cell: (row: IDuplicata) => {
                return row.boletoId ?
                    <>
                        <CustomButton size={'sm'} typeButton={'primary'}
                            style={{ marginRight: 5 }}
                            onClick={() => {
                                window.open(row.url, 'about-blank');
                            }}
                        ><FontAwesomeIcon icon={faPrint} /></CustomButton>
                        <CustomButton size={'sm'} typeButton={'primary'}
                            onClick={() => {
                                navigator.clipboard.writeText(row.codBarras);
                                toast.success(`Codigo copiado!`);
                            }}
                        ><FontAwesomeIcon icon={faBarcode} /></CustomButton>
                    </> :
                    <>
                        <SplitButton
                            size="sm"
                            variant="primary"
                            title={<b>Gerar</b>}
                            id={`split-button-gerar-${row.id}`}
                            style={{ marginRight: 5 }}
                            onClick={() => {
                                geraBoleto(row.id);
                            }}
                        >
                            <Dropdown.Item
                                onClick={() => {
                                    vincular(row.id);
                                }}
                            >
                                Vincular
                            </Dropdown.Item>
                        </SplitButton>
                    </>;
            },
            sortable: true,
            width: '10%'
        },
        {
            name: 'NFSe',
            selector: (row: IDuplicata) => row.numeroNFSE,
            cell: (row: IDuplicata) => !!row.protocolo ? <>
                <a href={'#'} onClick={() => { setSearch({ ...search, showNFSe: row.id }) }}>{row.numeroNFSE?.length > 0 ? row.numeroNFSE : row.statusNFSE}</a>
            </> : <>
                <CustomButton onClick={() => { setSearch({ ...search, showNFSe: row.id }) }}>Gerar</CustomButton>
            </>,
            sortable: true,
        },
        {
            name: 'Status',
            selector: (row: IDuplicata) => row.isPago,
            cell: (row: IDuplicata) => getBadge(row.id, row.isPago, row.isCancelado, row.dataVencimento),
            sortable: true,
        },
    ]

    function getBadge(id, isPago, isCancelado, vencimento) {
        if (isCancelado) {
            return <Badge onClick={() => { updatePagamento(id) }} style={{ fontSize: '12px', cursor: 'pointer' }} bg={'dark'}>Cancelado</Badge>
        }
        if (isPago) {
            return <Badge onClick={() => { updatePagamento(id) }} style={{ fontSize: '12px', cursor: 'pointer' }} bg={'primary'}>Pago</Badge>
        }
        var venc = new Date(vencimento);
        if (venc >= new Date()) {
            return <Badge onClick={() => { updatePagamento(id) }} style={{ fontSize: '12px', cursor: 'pointer' }} bg={'success'}>Em Aberto</Badge>
        } else {
            return <Badge onClick={() => { updatePagamento(id) }} style={{ fontSize: '12px', cursor: 'pointer' }} bg={'danger'}>Vencido</Badge>
        }

    }
    return (
        <div className={styles.container}>
            <h4>Financeiro</h4>
            <div className={styles.box}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateFim: v.target.value }) }} title={'Final'} width={'20%'} />
                <SelectEmpresa includeGeral width={'30%'} selected={search?.empresa} setSelected={(v) => { setSearch({ ...search, empresa: v }) }} />
                <SelectUsuario includeGeral onlySupervisor title={'Supervisor'} width={'300px'} selected={search?.userName} setSelected={(u) => setSearch({ ...search, userName: u.userName })} />
                <div style={{ width: '100%' }}>
                    <CustomButton onClick={() => { loadData() }} typeButton={'dark'}>Pesquisar</CustomButton>
                </div>
            </div>
            <div style={{
                margin: '10px 0',
                display: 'flex', flexDirection: 'row', flexWrap: 'wrap'
            }}>
                <CustomButton typeButton={'dark'} onClick={(v) => {
                    setSearch({ ...search, massa: true })
                }}>Gerar em Massa</CustomButton>
                <CustomButton typeButton={'dark'} onClick={(v) => {
                    setSearch({ ...search, edit: 0 })
                }}>Nova Duplicata</CustomButton>
            </div>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search?.searchString} onChange={(e) => { setSearch({ ...search, searchString: e.target.value }) }} />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />
            {search?.edit >= 0 && <DuplicataForm id={search?.edit} isOpen={search?.edit >= 0} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setSearch({ ...search, edit: -1 })
            }} />}
            {search?.massa && <DuplicataMassaForm isOpen={search?.massa} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setSearch({ ...search, massa: false })
            }} />}
            {search?.showNFSe > 0 && <NFSEForm id={search?.showNFSe} isOpen={search?.showNFSe > 0} setClose={(v) => {
                loadData();
                setSearch({ ...search, showNFSe: 0 })
            }} />}
            {search?.email > 0 && <EnviarEmailForm id={search?.email} isOpen={search?.email > 0} setClose={(v) => {
                loadData();
                setSearch({ ...search, email: 0 })
            }} />}
        </div>

    )
}
export const getServerSideProps = canSSRAuth(['ADMINISTRADOR']);
