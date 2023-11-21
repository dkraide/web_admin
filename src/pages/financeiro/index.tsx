

import { useEffect, useState } from 'react';
import styles from './styles.module.scss';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { InputGroup } from '@/components/ui/InputGroup';
import CustomTable from '@/components/ui/CustomTable';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faEdit } from '@fortawesome/free-solid-svg-icons';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import IDuplicata from '@/interfaces/IDuplicata';
import { Badge } from 'react-bootstrap';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import DuplicataForm from '@/components/Modals/Financeiro/DuplicataForm';
import _ from 'lodash';



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
        if(!search){
            var dateIn = format(startOfMonth(new Date()), 'yyyy-MM-dd');
            var dateFim = format(endOfMonth(new Date()), 'yyyy-MM-dd');
            url = `/Financeiro/List?dataIn=${dateIn}&dataFim=${dateFim}`;
        }else{
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

    async function updatePagamento(id: number){
        var index = _.findIndex(list, p => p.id == id);
        var x = list[index];
        x.isPago = !x.isPago;
        await api.put(`/Financeiro/update`, x)
        .then(({data}: AxiosResponse) => {
              list[index] = data;
              setList([...list]);
              toast.success(`Sucesso ao atualizar pagamento.`);

        })
        .catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar status de pagamento. ${err.response?.data || err.message}`);
        });
    }


    const columns = [
        {
            name: '#',
            cell: ({ id }: IDuplicata) => <CustomButton onClick={() => {setEdit(id)}} typeButton={'primary'}><FontAwesomeIcon icon={faEdit}/></CustomButton>,
            sortable: true,
            width: '5%'
        },
        {
            name: 'Empresa',
            selector: (row: IDuplicata) => row.empresa?.nomeFantasia || '',
            sortable: true,
            width: '50%'
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
            name: 'Status',
            selector: (row: IDuplicata) => row.isPago,
            cell: (row: IDuplicata) =>getBadge(row.id, row.isPago, row.isCancelado, row.dataVencimento),
            sortable: true,
            width: '10%'
        },
    ]

    function getBadge(id, isPago, isCancelado, vencimento){
           if(isCancelado){
            return <Badge  onClick={() => {updatePagamento(id)}} style={{fontSize: '12px', cursor: 'pointer'}}  bg={'dark'}>Cancelado</Badge>
           }
           if(isPago){
            return <Badge onClick={() => {updatePagamento(id)}} style={{fontSize: '12px', cursor: 'pointer'}}  bg={'primary'}>Pago</Badge>
           }
           var venc = new Date(vencimento);
           if(venc >= new Date()){
                   return <Badge onClick={() => {updatePagamento(id)}} style={{fontSize: '12px', cursor: 'pointer'}}  bg={'success'}>Em Aberto</Badge>
           }else{
            return <Badge onClick={() => {updatePagamento(id)}} style={{fontSize: '12px', cursor: 'pointer'}}  bg={'danger'}>Vencido</Badge>
           }

    }
    return (
        <div className={styles.container}>
            <h4>Financeiro</h4>
            <div className={styles.box}>
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateIn} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Inicio'} width={'20%'} />
                <InputGroup minWidth={'275px'} type={'date'} value={search?.dateFim} onChange={(v) => { setSearch({ ...search, dateIn: v.target.value }) }} title={'Final'} width={'20%'} />
                <SelectEmpresa width={'30%'} selected={search?.empresa} setSelected={(v) => {setSearch({...search, empresa: v})}}/>
                <div style={{width: '100%'}}>
                    <CustomButton onClick={() => {loadData()}} typeButton={'dark'}>Pesquisar</CustomButton>
                </div>
            </div>
            <InputGroup width={'50%'} placeholder={'Filtro'} title={'Pesquisar'} value={search?.searchString} onChange={(e) => { setSearch({...search, searchString: e.target.value}) }} />
            <CustomTable
                columns={columns}
                data={getFiltered()}
                loading={loading}
            />
            {edit >= 0 && <DuplicataForm id={edit} isOpen={edit >= 0} setClose={(v) => {
                if(v){
                    loadData();
                }
                setEdit(-1);
            }}/>}
        </div>
    )
}
