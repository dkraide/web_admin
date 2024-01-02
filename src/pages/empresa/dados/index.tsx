import SelectEmpresa from '@/components/Selects/SelectEmpresa'
import styles from './styles.module.scss'
import { useEffect, useState } from 'react'
import { api } from '@/services/apiClient'
import { AxiosError, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import CustomButton from '@/components/ui/Buttons'
import Loading from '@/components/Loading'
import Confirm from '@/components/Modals/Confirm'


type data = {
    classeMaterial: number
    grupoAdicional: number
    grupoAdicionalMateriaPrima: number
    cliente: number
    codBarras: number
    combo: number
    comboItem: number
    conferenciaEstoque: number
    despesa: number
    entrada: number
    formaPagamento: number
    lancamentoEstoque: number
    lancamentoEstoqueProduto: number
    materiaPrima: number
    motivoLancamento: number
    movimentoCaixa: number
    pedidoOnline: number
    produto: number
    produtoGrupo: number
    produtoImagem: number
    produtoMateriaPrima: number
    promocao: number
    sangriaReforco: number
    tabelaPromocional: number
    tabelaPromocionalProduto: number
    tamanho: number
    tributacao: number
    usuario: number
    venda: number
    vendaPagamento: number
    vendaProduto: number
    nfcecfexml: number
}

type actionProps = {
  field: string
  action: 'remover' | 'zerar'
}
export default function Dados() {

    const [empresa, setEmpresa] = useState(0)
    const [data, setData] = useState<data>()
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<actionProps>()


    async function loadData() {
        setLoading(true);
        await api.get(`/Empresa/GetRows?empresaId=${empresa}`)
            .then(({ data }: AxiosResponse) => {
                setData(data);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`);

            });
        setLoading(false);
    }
    async function  onAction(){

        if(!action){
            return;
        }


        var url  = `/Empresa/${action.action == "remover" ? 'DeleteRows' : 'UpdateRows'}?EmpresaId=${empresa}&field=${action.field.toUpperCase()}`;
        await api.post(url)
        .then((response) => {
            toast.success('operacao realizada');
            if(action.action == "remover"){
                data[action.field] = 0;
                setData({...data});
            }
            setAction(undefined);

        }).catch((err: AxiosError) => {
            toast.error(`Erro. ${err.response?.data || err.message}`);
            setAction(undefined);
        })
    }


    useEffect(() => {
        if (empresa > 0) {
               loadData();
        }
    }, [empresa])


    return (
        <div className={styles.container}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <SelectEmpresa width={'50%'} selected={empresa} setSelected={setEmpresa} />
            </div>
            <hr />
            {loading ?
                <div style={{width: '100%', height: '100%', display: 'flex', justifyContent:'center', alignItems:'center'}}>
                <Loading/>
                </div> : <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
                  <Box setAction={setAction} field={'classeMaterial'} value={data?.classeMaterial}/>
                  <Box setAction={setAction} field={'grupoAdicional'} value={data?.grupoAdicional}/>
                  <Box setAction={setAction} field={'grupoAdicionalMateriaPrima'} value={data?.grupoAdicionalMateriaPrima}/>
                  <Box setAction={setAction} field={'cliente'} value={data?.cliente}/>
                  <Box setAction={setAction} field={'codBarras'} value={data?.codBarras}/>
                  <Box setAction={setAction} field={'combo'} value={data?.combo}/>
                  <Box setAction={setAction} field={'comboItem'} value={data?.comboItem}/>
                  <Box setAction={setAction} field={'conferenciaEstoque'} value={data?.conferenciaEstoque}/>
                  <Box setAction={setAction} field={'despesa'} value={data?.despesa}/>
                  <Box setAction={setAction} field={'entrada'} value={data?.entrada}/>
                  <Box setAction={setAction} field={'formaPagamento'} value={data?.formaPagamento}/>
                  <Box setAction={setAction} field={'lancamentoEstoque'} value={data?.lancamentoEstoque}/>
                  <Box setAction={setAction} field={'lancamentoEstoqueProduto'} value={data?.lancamentoEstoqueProduto}/>
                  <Box setAction={setAction} field={'materiaPrima'} value={data?.materiaPrima}/>
                  <Box setAction={setAction} field={'motivoLancamento'} value={data?.motivoLancamento}/>
                  <Box setAction={setAction} field={'movimentoCaixa'} value={data?.movimentoCaixa}/>
                  <Box setAction={setAction} field={'pedidoOnline'} value={data?.pedidoOnline}/>
                  <Box setAction={setAction} field={'produto'} value={data?.produto}/>
                  <Box setAction={setAction} field={'produtoGrupo'} value={data?.produtoGrupo}/>
                  <Box setAction={setAction} field={'produtoImagem'} value={data?.produtoImagem}/>
                  <Box setAction={setAction} field={'produtoMateriaPrima'} value={data?.produtoMateriaPrima}/>
                  <Box setAction={setAction} field={'promocao'} value={data?.promocao}/>
                  <Box setAction={setAction} field={'sangriaReforco'} value={data?.sangriaReforco}/>
                  <Box setAction={setAction} field={'tabelaPromocional'} value={data?.tabelaPromocional}/>
                  <Box setAction={setAction} field={'tabelaPromocionalProduto'} value={data?.tabelaPromocionalProduto}/>
                  <Box setAction={setAction} field={'tamanho'} value={data?.tamanho}/>
                  <Box setAction={setAction} field={'tributacao'} value={data?.tributacao}/>
                  <Box setAction={setAction} field={'usuario'} value={data?.usuario}/>
                  <Box setAction={setAction} field={'venda'} value={data?.venda}/>
                  <Box setAction={setAction} field={'vendaPagamento'} value={data?.vendaPagamento}/>
                  <Box setAction={setAction} field={'vendaProduto'} value={data?.vendaProduto}/>
                  <Box setAction={setAction} field={'nfcecfexml'} value={data?.nfcecfexml}/>
                </div>}

            {!!action && <Confirm isOpen={!!action} setClose={(v) => {
               if(v){
                 onAction();
               }else{
                  setAction(undefined);
               }

            }} message={`Deseja ${action.action} de ${action.field}`}/>}



        </div>
    )
}

const Box = ({ field, value, setAction }) => {
    return (
        <div className={styles.box}>
            <b className={styles.value}>{value || '--'}</b>
            <span className={styles.field}>{field}</span>
            <hr />
            <div className={styles.functions}>
                <CustomButton onClick={() => {setAction({field: field, action: 'remover'} as actionProps)}} typeButton={'danger'}>Deletar</CustomButton>
                <CustomButton onClick={() => {setAction({field: field, action: 'zerar'} as actionProps)}}  typeButton={'primary'}>Zerar ID Local</CustomButton>
            </div>
        </div>
    )
}