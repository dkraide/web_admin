

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
import { Badge } from 'react-bootstrap';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import DuplicataForm from '@/components/Modals/Financeiro/DuplicataForm';
import _ from 'lodash';
import DuplicataMassaForm from '@/components/Modals/Financeiro/DuplicataMassaForm';
import { fGetOnlyNumber } from '@/utils/functions';



type searchProps = {
    dateIn: string
    dateFim: string
    searchString?: string
    empresa?: number
}
export default function Financeiro() {
    const [loading, setLoading] = useState(true)
    const [list, setList] = useState<IDuplicata[]>([])
    const [search, setSearch] = useState<searchProps>()
    const [edit, setEdit] = useState<number>(-1);
    const [massa, setMassa] = useState(false);

    useEffect(() => {
        if (!search) {
            setSearch({ dateIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateFim: format(endOfMonth(new Date()), 'yyyy-MM-dd') });
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
            return (p.empresaId + (p.empresa?.nomeFantasia || '')).toLowerCase().includes((search?.searchString || '').toLowerCase())
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

    async function sendEmail(duplicataId) {
        setLoading(true);
        await api.post(`/Financeiro/SendEmail?duplicataId=${duplicataId}`)
            .then(({ data }) => {
                toast.success(`Email enviado com sucesso!`);
                loadData();
            }).catch((err) => {
                toast.error(`Ops... parece que houve um erro para enviar o seu boleto. Confira os dados do email!`);
            })
        setLoading(false);

    }
    async function sendWhatsapp(duplicataId) {

        var ind = _.findIndex(list, p => p.id == duplicataId);
        var d = list[ind];
        var str = `Ola, sua mensalidade da *KRD System* Chegou!\n
                \nVencimento: ${format(new Date(d.dataVencimento), 'dd/MM/yyyy')}
                \nValor: R$ ${d.valor.toFixed(2)}
                \nEmpresa: ${d.empresa.nomeFantasia}
                \n\nNossa Chave *PIX*!
                \nCNPJ: 34.073.667/0001-36\n`;

        if (d.codBarras) {
            str += `\nCodigo de Barras:\n\n${d.codBarras}\n`
        };
        if (d.url) {
            str += `\nPara baixar o PDF do boleto:\n\n${d.url}`
        };
        var encodedStr = encodeURIComponent(str);
        var url = `https://api.whatsapp.com/send?phone=${fGetOnlyNumber(d.empresa.telefone)}&text=${encodedStr}`;

        window.open(url);

    }


    const columns = [
        {
            name: '#',
            cell: ({ id }: IDuplicata) =>
                <>  <CustomButton size={'sm'} onClick={() => { setEdit(id) }} typeButton={'primary'}><FontAwesomeIcon icon={faEdit} /></CustomButton>
                    <CustomButton style={{ marginRight: 5, marginLeft: 5 }} size={'sm'} onClick={() => { sendEmail(id) }} typeButton={'primary'}><FontAwesomeIcon icon={faEnvelope} /></CustomButton>
                    <CustomButton size={'sm'} onClick={() => { sendWhatsapp(id) }} typeButton={'primary'}><FontAwesomeIcon icon={faPhone} /></CustomButton></>,
            sortable: true,
            width: '20%'
        },
        {
            name: 'Empresa',
            selector: (row: IDuplicata) => row.empresa?.nomeFantasia || '',
            sortable: true,
            width: '30%'
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
            width: '10%'
        },
        {
            name: 'Valor',
            selector: (row: IDuplicata) => `R$ ${row.valor.toFixed(2)}`,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Boleto',
            selector: (row: IDuplicata) => row.boletoId,
            cell: (row: IDuplicata) => row.boletoId ?
                <>
                    <CustomButton size={'sm'} typeButton={'primary'}
                        style={{ marginRight: 5 }}
                        onClick={() => {
                            window.open(row.url, 'about-blank')
                        }}
                    ><FontAwesomeIcon icon={faPrint} /></CustomButton>
                    <CustomButton size={'sm'} typeButton={'primary'}
                        onClick={() => {
                            navigator.clipboard.writeText(row.codBarras);
                            toast.success(`Codigo copiado!`)
                        }}
                    ><FontAwesomeIcon icon={faBarcode} /></CustomButton>
                </> :
                <>
                    <CustomButton size={'sm'} typeButton={'dark'}
                        style={{ marginRight: 5 }}
                        onClick={() => {
                            geraBoleto(row.id);
                        }}
                    ><b>Gerar</b></CustomButton>
                </>,
            sortable: true,
            width: '10%'
        },
        {
            name: 'Status',
            selector: (row: IDuplicata) => row.isPago,
            cell: (row: IDuplicata) => getBadge(row.id, row.isPago, row.isCancelado, row.dataVencimento),
            sortable: true,
            width: '10%'
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
                <SelectEmpresa width={'30%'} selected={search?.empresa} setSelected={(v) => { setSearch({ ...search, empresa: v }) }} />
                <div style={{ width: '100%' }}>
                    <CustomButton onClick={() => { loadData() }} typeButton={'dark'}>Pesquisar</CustomButton>
                </div>
            </div>
            <div style={{
                margin: '10px 0',
                display: 'flex', flexDirection: 'row', flexWrap: 'wrap'
            }}>
                <CustomButton typeButton={'dark'} onClick={(v) => {
                    setMassa(true)
                }}>Gerar em Massa</CustomButton>
                <CustomButton typeButton={'dark'} onClick={(v) => {
                    setEdit(0)
                }}>Nova Duplicata</CustomButton>
            </div>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search?.searchString} onChange={(e) => { setSearch({ ...search, searchString: e.target.value }) }} />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />
            {edit >= 0 && <DuplicataForm id={edit} isOpen={edit >= 0} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setEdit(-1);
            }} />}
            {massa && <DuplicataMassaForm isOpen={massa} setClose={(v) => {
                if (v) {
                    loadData();
                }
                setMassa(false);
            }} />}
        </div>

    )
}
