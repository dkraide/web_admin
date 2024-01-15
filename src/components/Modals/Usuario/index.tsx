import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputForm } from "@/components/ui/InputGroup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IUsuario from "@/interfaces/IUsuario";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../Base/Index";
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
    id: string | undefined
    setClose: (res?: boolean) => void
    color?: string
}
export default function UsuarioForm({ isOpen, id, setClose, color }: props) {

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const [objeto, setObjeto] = useState<IUsuario>({} as IUsuario)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false);
    const [onEditPass, SetOnEditPass] = useState(false);
    useEffect(() => {
        if (id !== undefined) {
            api.get(`/User/Select?id=${id}`)
                .then(({ data }: AxiosResponse) => {
                    setObjeto(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        } else {
            setObjeto({...objeto, isContador: false});
            setLoading(false);
        }

    }, []);

    const onSubmit = async (data: any) => {
        setSending(true);
        objeto.userName = data.userName;
        objeto.nome = data.nome;
        objeto.cpf = data.cpf;
        objeto.email = data.email;
        objeto.telefone = data.telefone;
        if (id !== undefined) {
            api.put(`User/Update`, objeto)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Usuario atualizado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao atualizar usuario. ${err.response?.data}`);
                })

        } else {
            var u = { ...objeto, passwordHash: data.passwordHash }
            api.post(`User/Create`, u)
                .then(({ data }: AxiosResponse) => {
                    toast.success(`Usuario cadastrado com sucesso!`);
                    setClose(true);
                })
                .catch((err: AxiosError) => {
                    toast.error(`Erro ao criar grupo. ${err.response?.data}`);
                })
        }
        setSending(false);
    }
    return (
        <BaseModal height={'90%'} width={'80%'} color={color} title={'Cadastro de Usuario'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <InputForm defaultValue={objeto.userName} width={'50%'} title={'Usuario'} errors={errors} inputName={"userName"} register={register} />
                    {!id && <InputForm width={'50%'} title={'Senha'} errors={errors} inputName={"passwordHash"} register={register} />}
                    <SelectSimNao width={'50%'} title={'Contador'} selected={objeto.isContador} setSelected={(v) => {setObjeto({...objeto, isContador: v})}}/>
                    <InputForm defaultValue={objeto.nome} width={'50%'} title={'Nome'} errors={errors} inputName={"nome"} register={register} />
                    <InputForm defaultValue={objeto.cpf} width={'50%'} title={'CPF'} errors={errors} inputName={"cpf"} register={register} />
                    <InputForm defaultValue={objeto.email} width={'50%'} title={'Email'} errors={errors} inputName={"email"} register={register} />
                    <InputForm defaultValue={objeto.telefone} width={'50%'} title={'Telefone'} errors={errors} inputName={"telefone"} register={register} />
                    {!!id && (
                        <>
                            <CustomButton typeButton={'dark'} onClick={() => {
                                SetOnEditPass(true);
                            }}>Alterar Senha</CustomButton>
                            {onEditPass && <ResetPassword setOnEditPass={SetOnEditPass} userId={objeto.id} />}
                        </>
                    )}
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); }} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}

const ResetPassword = ({userId, setOnEditPass}) => {
    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        formState: { errors } } =
        useForm();


    const onSubmit = async (data: any) => {
        if (!data.oldPassword || data.oldPassword.length == 0) {
            toast.error(`informe sua senha atual para alterar.`);
            return;
        }
        if (!data.newPassword || data.newPassword.length < 6) {
            toast.error(`nova senha invalida. Ela precisa contar no minimo 6 digitos`);
            return;
        }
        if (data.newPassword !== data.confirmPassword) {
            toast.error(`Nova senha e confirme nova senha nao conferem.`);
            return;
        }

        await api.put(`/User/UpdatePassword?oldPassword=${data.oldPassword}&password=${data.newPassword}&userId=${userId}`)
            .then(({ data }: AxiosResponse) => {
                toast.success(`Senha alterada com sucesso.`);
                setOnEditPass(false);
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao alterar senha. ${err.response?.data || err.message}`);
            })

    }

    return (
        <>
            <hr />
            <div className={styles.container}>
                <InputForm width={'30%'} title={'Senha Atual'} errors={errors} inputName={"oldPassword"} register={register} />
                <InputForm width={'30%'} title={'Nova Senha'} errors={errors} inputName={"newPassword"} register={register} />
                <InputForm  width={'30%'} title={'Confirme Nova Senha'} errors={errors} inputName={"confirmPassword"} register={register} />
                <CustomButton typeButton={'dark'} onClick={() => { handleSubmit(onSubmit)() }}>Confirmar</CustomButton>

            </div>
        </>
    )
}