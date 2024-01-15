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


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}
export default function EmpresaForm({user, isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [objeto, setObjeto] = useState<IEmpresa>({} as IEmpresa)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    useEffect(() => {
        if (id > 0) {
            api.get(`/Empresa/Select?id=${id}`)
                .then(({ data }: AxiosResponse) => {
                    setObjeto(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        }else{
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) =>{
        setSending(true);
        objeto.id = fGetNumber(data.id);
        objeto.cnpj = data.cnpj;
        objeto.inscricaoEstadual = data.inscricaoEstadual;
        objeto.nomeFantasia = data.nomeFantasia;
        objeto.razaoSocial = data.razaoSocial;
        objeto.endereco = data.endereco;
        objeto.nro =  data.nro;
        objeto.complemento = data.complemento;
        objeto.cep = data.cep;
        objeto.bairro = data.bairro;
        objeto.dataCriacao = new Date(data.dataCriacao);
        objeto.inicioPagamento = new Date(data.inicioPagamento);
        objeto.valorMensal = fGetNumber(objeto.valorMensal);
        objeto.diaCobranca = fGetNumber(objeto.diaCobranca);
        objeto.formaPagamento = data.formaPagamento;
        objeto.email = data.email;
        objeto.telefone = data.telefone;

        if(id > 0){
            api.put(`Empresa/Update`, objeto)
            .then(({data}: AxiosResponse) => {
                toast.success(`grupo atualizado com sucesso!`);
                setClose(true);
            })
            .catch((err: AxiosError) => {
                   toast.error(`Erro ao atualizar grupo. ${err.response?.data}`);
            })

        }else{
            api.post(`Empresa/Create`, objeto)
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
    function getCep() {
        var cep = fGetOnlyNumber(getValues("cep"));
        apiViaCep.get(`/${cep}/json`)
            .then(({ data }: AxiosResponse) => {
                setObjeto({ ...objeto, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf, codCidade: data.ibge })
                setValue("endereco", data.logradouro);
                setValue("bairro", data.bairro);

            }).catch((err: AxiosError) => {
                toast.error(`Erro ao buscar o cep. ${err.message}`);
            })
        console.log(cep);
    }
    return (
        <BaseModal height={'90%'} width={'80%'} color={color} title={'Cadastro de Empresa'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={objeto.id} width={'10%'} title={'Cod'}  errors={errors} inputName={"id"} register={register} />
                    <SelectUsuario width={'20%'} selected={objeto.usuarioDono?.toUpperCase()} setSelected={(c) => {setObjeto({...objeto, usuarioDono: c.userName?.toUpperCase()})}}/>
                    <SelectStatus width={'20%'} selected={objeto.statusPagamento} title={'Status'} setSelected={(v) => {setObjeto({...objeto, statusPagamento: v})}} />
                    <SelectSimNao width={'20%'} selected={objeto.liberaBackup} title={'Backup'} setSelected={(v) => {setObjeto({...objeto, liberaBackup: v})}}/>
                    <SelectSimNao width={'20%'} selected={objeto.assessoria} title={'Assessoria'} setSelected={(v) => {setObjeto({...objeto, assessoria: v})}}/>
                    <InputForm defaultValue={objeto.cnpj} width={'50%'} title={'CNPJ / CPF'} errors={errors} inputName={"cnpj"} register={register} />
                    <InputForm defaultValue={objeto.inscricaoEstadual} width={'50%'} title={'IE / RG'} errors={errors} inputName={"inscricaoEstadual"} register={register} />
                    <InputForm defaultValue={objeto.nomeFantasia} width={'50%'} title={'Nome Fantasia'} errors={errors} inputName={"nomeFantasia"} register={register} />
                    <InputForm defaultValue={objeto.razaoSocial} width={'50%'} title={'Razao Social'} errors={errors} inputName={"razaoSocial"} register={register} />
                    <InputForm defaultValue={objeto.endereco} width={'50%'} title={'Logradouro'} errors={errors} inputName={"endereco"} register={register} />
                    <InputForm defaultValue={objeto.nro} width={'15%'} title={'Nro'} errors={errors} inputName={"nro"} register={register} />
                    <InputForm defaultValue={objeto.complemento} width={'15%'} title={'Compl.'} errors={errors} inputName={"complemento"} register={register} />
                    <InputForm onBlur={getCep} defaultValue={objeto.cep} width={'20%'} title={'CEP'} errors={errors} inputName={"cep"} register={register} />
                    <InputForm defaultValue={objeto.bairro} width={'20%'} title={'Bairro'} errors={errors} inputName={"bairro"} register={register} />
                    <SelectEstado selected={objeto.uf} setSelected={(v) => {
                        setObjeto({ ...objeto, uf: v.sigla })
                    }} width={'23%'} />
                    <SelectCidade uf={objeto.uf} selected={objeto.codCidade} setSelected={(v) => {
                        setObjeto({ ...objeto, codCidade: v.id, cidade: v.nome })
                    }} width={'23%'} />
                    <h3 style={{width: '100%'}}>Dados Cobranca</h3>
                    <InputForm defaultValue={format(new Date(objeto.dataCriacao || new Date()), 'yyyy-MM-dd')} width={'15%'} type={'date'} title={'Criacao'} errors={errors} inputName={"dataCriacao"} register={register} />
                    <InputForm defaultValue={format(new Date(objeto.inicioPagamento|| new Date()), 'yyyy-MM-dd')} width={'15%'} type={'date'} title={'Pagamento'} errors={errors} inputName={"inicioPagamento"} register={register} />
                    <InputForm defaultValue={objeto.valorMensal} width={'10%'} title={'Nro'} errors={errors} inputName={"valorMensal"} register={register} />
                    <InputForm defaultValue={objeto.diaCobranca} width={'10%'} title={'Nro'} errors={errors} inputName={"diaCobranca"} register={register} />
                    <InputForm defaultValue={objeto.formaPagamento} width={'15%'} title={'Forma Pagamento'} errors={errors} inputName={"formaPagamento"} register={register} />
                    <SelectUsuario onlyContador={true} title={'Contador'} width={'20%'} selected={objeto.usuarioContador?.toUpperCase()} setSelected={(c) => {setObjeto({...objeto, usuarioContador: c.userName?.toUpperCase()})}}/>
                    <InputForm defaultValue={objeto.email} width={'50%'} title={'Email'} errors={errors} inputName={"email"} register={register} />
                    <InputForm defaultValue={objeto.telefone} width={'50%'} title={'Telefone'} errors={errors} inputName={"telefone"} register={register} />

                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => {handleSubmit(onSubmit)()}}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}