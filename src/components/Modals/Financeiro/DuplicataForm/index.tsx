import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import {InputForm} from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import IEmpresa from "@/interfaces/IEmpresa";
import SelectEstado from "@/components/Selects/SelectEstado";
import SelectCidade from "@/components/Selects/SelectCidade";
import { fGetNumber, fGetOnlyNumber } from "@/utils/functions";
import { apiViaCep } from "@/services/apiViaCep";
import SelectSimNao from "@/components/Selects/SelectSimNao";
import { format } from "date-fns";
import SelectUsuario from "@/components/Selects/SelectUsuario";
import IDuplicata from "@/interfaces/IDuplicata";
import SelectEmpresa from "@/components/Selects/SelectEmpresa";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
}
export default function DuplicataForm({isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [objeto, setObjeto] = useState<IDuplicata>()
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/Financeiro/Select?id=${id}`)
                .then(({ data }: AxiosResponse) => {
                    setObjeto(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        }else{
            setObjeto({dataVencimento: new Date,
                       valor: 0} as IDuplicata)
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) =>{
        setSending(true);
        objeto.dataVencimento = new Date(data.dataVencimento);
        objeto.valor = fGetNumber(data.valor);
        objeto.descricaoNFSE = data.descricaoNFSE;
        if(id > 0){
            api.put(`Financeiro/Update`, objeto)
            .then(({data}: AxiosResponse) => {
                toast.success(`grupo atualizado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao atualizar grupo. ${err.response?.data}`);
            })

        }else{
            api.post(`Financeiro/Create`, objeto)
            .then(({data}: AxiosResponse) => {
                toast.success(`grupo cadastrado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao criar grupo. ${err.response?.data}`);
            })
        }
        setSending(false);
    }

    if(!objeto){
        return <></>
    }



    return (
        <BaseModal  color={color} title={'Cadastro de Duplicata'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <SelectEmpresa selected={objeto.empresaId} setSelected={(v) => {setObjeto({...objeto, empresaId: v})}}/>
                    <InputForm type={'date'} defaultValue={format(new Date(objeto.dataVencimento), 'yyyy-MM-dd')} width={'30%'} title={'Vencimento'}  errors={errors} inputName={"dataVencimento"} register={register} />
                    <InputForm defaultValue={objeto.valor.toFixed(2)} width={'30%'} title={'Valor'}  errors={errors} inputName={"valor"} register={register} />
                    <InputForm defaultValue={objeto.descricaoNFSE} width={'100%'} title={'Descricao NFSe'}  errors={errors} inputName={"descricaoNFSE"} register={register} />
                    <SelectSimNao width={'30%'} selected={objeto.isPago} title={'Pago'} setSelected={(v) => {setObjeto({...objeto, isPago: v})}} />
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}