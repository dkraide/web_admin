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
import BaseModal from "../../Base/Index";
import SelectStatus from "@/components/Selects/SelectStatus";
import IEmpresa from "@/interfaces/IEmpresa";
import SelectEstado from "@/components/Selects/SelectEstado";
import SelectCidade from "@/components/Selects/SelectCidade";
import { fGetNumber, fGetOnlyNumber, fParseLocalDate } from "@/utils/functions";
import { apiViaCep } from "@/services/apiViaCep";
import SelectSimNao from "@/components/Selects/SelectSimNao";
import { format } from "date-fns";
import SelectUsuario from "@/components/Selects/SelectUsuario";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { buscarEmpresaPorCnpj } from "@/services/cnpjApi";
import WhatsappInput from "@/components/ui/WhatsappInput";

interface Props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
    user: IUsuario
}

type Aba = 'cadastro' | 'cobranca'

const PLANOS = ['Teste', 'Mensal', 'Semestral', 'Anual'] as const

export default function EmpresaForm({ user, isOpen, id, setClose, color }: Props) {

    const { register, getValues, setValue, handleSubmit, formState: { errors } } = useForm()

    const [objeto, setObjeto] = useState<IEmpresa>({} as IEmpresa)
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState(false)
    const [aba, setAba] = useState<Aba>('cadastro')

    useEffect(() => {
        if (id > 0) {
            api.get(`/Empresa/Select?id=${id}`)
                .then(({ data }: AxiosResponse) => {
                    setObjeto(data)
                    setLoading(false)
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false)
                })
        } else {
            setLoading(false)
        }
    }, [])

    const onSubmit = async (data: any) => {
        setSending(true)
        objeto.id               = fGetNumber(data.id)
        objeto.cnpj             = data.cnpj
        objeto.inscricaoEstadual = data.inscricaoEstadual
        objeto.nomeFantasia     = data.nomeFantasia
        objeto.razaoSocial      = data.razaoSocial
        objeto.endereco         = data.endereco
        objeto.nro              = data.nro
        objeto.complemento      = data.complemento
        objeto.cep              = data.cep
        objeto.bairro           = data.bairro
        objeto.dataCriacao      = fParseLocalDate(data.dataCriacao)
        objeto.inicioPagamento  = fParseLocalDate(data.inicioPagamento)
        objeto.valorMensal      = fGetNumber(data.valorMensal)
        objeto.valorKrd         = fGetNumber(data.valorKrd)
        objeto.diaCobranca      = fGetNumber(data.diaCobranca)
        objeto.formaPagamento   = data.formaPagamento
        objeto.email            = data.email
        objeto.telefone         = data.telefone
        // whatsappFormatado ja e atualizado direto no objeto pelo WhatsappInput

        const endpoint = id > 0 ? `Empresa/Update` : `Empresa/Create`
        const method   = id > 0 ? api.put : api.post
        const acao     = id > 0 ? 'atualizada' : 'cadastrada'

        method(endpoint, objeto)
            .then(() => {
                toast.success(`Empresa ${acao} com sucesso!`)
                setClose(true)
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao salvar empresa. ${err.response?.data}`)
            })
            .finally(() => setSending(false))
    }

    const handleSearchCnpj = async () => {
        try {
            setLoading(true)
            const res = await buscarEmpresaPorCnpj(getValues('cnpj'))
            if (res) {
                setValue('razaoSocial', res.razaoSocial)
                setValue('nomeFantasia', res.nomeFantasia)
                setValue('inscricaoEstadual', res.inscricaoEstadual)
                setValue('endereco', res.endereco)
                setValue('nro', res.nro)
                setValue('complemento', res.complemento)
                setValue('bairro', res.bairro)
                setValue('cep', res.cep)
                setValue('cidade', res.cidade)
                setValue('uf', res.uf)
                setValue('codCidade', res.codCidade)
                setValue('email', res.email)
                setValue('telefone', res.telefone)
                getCep(res.cep)
            }
        } catch (error) {
            console.error("Erro ao buscar CNPJ", error)
        } finally {
            setLoading(false)
        }
    }

    function getCep(c?: string) {
        const cep = c ?? fGetOnlyNumber(getValues("cep"))
        apiViaCep.get(`/${cep}/json`)
            .then(({ data }: AxiosResponse) => {
                setObjeto({ ...objeto, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf, codCidade: data.ibge })
                setValue("endereco", data.logradouro)
                setValue("bairro", data.bairro)
            })
            .catch((err: AxiosError) => {
                toast.error(`Erro ao buscar o CEP. ${err.message}`)
            })
    }

    return (
        <BaseModal height={'90%'} width={'80%'} color={color} title={'Cadastro de Empresa'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>

                    {/* ── Cabeçalho sempre visível ── */}
                    <InputForm defaultValue={objeto.id} width={'10%'} title={'Cod'} errors={errors} inputName={"id"} register={register} />
                    <SelectUsuario width={'20%'} selected={objeto.usuarioDono?.toUpperCase()} setSelected={(c) => setObjeto({ ...objeto, usuarioDono: c.userName?.toUpperCase() })} />
                    <SelectUsuario title={'Supervisor'} width={'20%'} selected={objeto.usuarioSupervisor?.toUpperCase()} setSelected={(c) => setObjeto({ ...objeto, usuarioSupervisor: c.userName?.toUpperCase() })} />
                    <SelectStatus width={'20%'} selected={objeto.statusPagamento} title={'Status'} setSelected={(v) => setObjeto({ ...objeto, statusPagamento: v })} />
                    <SelectUsuario onlyContador={true} title={'Contador'} width={'20%'} selected={objeto.usuarioContador?.toUpperCase()} setSelected={(c) => setObjeto({ ...objeto, usuarioContador: c.userName?.toUpperCase() })} />

                    {/* ── Abas ── */}
                    <div className={styles.tabs}>
                        <button
                            type="button"
                            className={`${styles.tab} ${aba === 'cadastro' ? styles.tabActive : ''}`}
                            onClick={() => setAba('cadastro')}
                        >
                            Cadastro
                        </button>
                        <button
                            type="button"
                            className={`${styles.tab} ${aba === 'cobranca' ? styles.tabActive : ''}`}
                            onClick={() => setAba('cobranca')}
                        >
                            Cobrança
                        </button>
                    </div>

                    {/* ── Aba Cadastro ── */}
                    {aba === 'cadastro' && (
                        <div className={styles.tabContent}>
                            <div style={{ width: '50%', display: 'flex' }}>
                                <CustomButton onClick={handleSearchCnpj} style={{ width: '50px', height: '50px' }}>
                                    <FontAwesomeIcon icon={faSearch} />
                                </CustomButton>
                                <InputForm defaultValue={objeto.cnpj} width={'calc(100% - 50px)'} title={'CNPJ / CPF'} errors={errors} inputName={"cnpj"} register={register} />
                            </div>
                            <InputForm defaultValue={objeto.inscricaoEstadual} width={'25%'} title={'IE / RG'} errors={errors} inputName={"inscricaoEstadual"} register={register} />
                            <InputForm defaultValue={objeto.inscricaoMunicipal} width={'25%'} title={'Insc. Municipal'} errors={errors} inputName={"inscricaoMunicipal"} register={register} />
                            <InputForm defaultValue={objeto.nomeFantasia} width={'50%'} title={'Nome Fantasia'} errors={errors} inputName={"nomeFantasia"} register={register} />
                            <InputForm defaultValue={objeto.razaoSocial} width={'50%'} title={'Razão Social'} errors={errors} inputName={"razaoSocial"} register={register} />
                            <InputForm defaultValue={objeto.endereco} width={'50%'} title={'Logradouro'} errors={errors} inputName={"endereco"} register={register} />
                            <InputForm defaultValue={objeto.nro} width={'15%'} title={'Nro'} errors={errors} inputName={"nro"} register={register} />
                            <InputForm defaultValue={objeto.complemento} width={'15%'} title={'Compl.'} errors={errors} inputName={"complemento"} register={register} />
                            <InputForm onBlur={() => getCep()} defaultValue={objeto.cep} width={'20%'} title={'CEP'} errors={errors} inputName={"cep"} register={register} />
                            <InputForm defaultValue={objeto.bairro} width={'20%'} title={'Bairro'} errors={errors} inputName={"bairro"} register={register} />
                            <SelectEstado selected={objeto.uf} setSelected={(v) => setObjeto({ ...objeto, uf: v.sigla })} width={'23%'} />
                            <SelectCidade uf={objeto.uf} selected={objeto.codCidade} setSelected={(v) => setObjeto({ ...objeto, codCidade: v.id, cidade: v.nome })} width={'23%'} />
                            <InputForm defaultValue={objeto.email} width={'50%'} title={'E-mail'} errors={errors} inputName={"email"} register={register} />
                            <InputForm defaultValue={objeto.telefone} width={'25%'} title={'Telefone'} errors={errors} inputName={"telefone"} register={register} />
                            <WhatsappInput width={'25%'} title={'WhatsApp'} value={objeto.whatsappFormatado} onChange={(v) => setObjeto({ ...objeto, whatsappFormatado: v })} />
                        </div>
                    )}

                    {/* ── Aba Cobrança ── */}
                    {aba === 'cobranca' && (
                        <div className={styles.tabContent}>
                            {/* Plano */}
                            <div className={styles.field} style={{ width: '20%' }}>
                                <label className={styles.label}>Plano</label>
                                <select
                                    className={styles.select}
                                    value={objeto.plano ?? 'Mensal'}
                                    onChange={(e) => setObjeto({ ...objeto, plano: e.target.value as IEmpresa['plano'] })}
                                >
                                    {PLANOS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <InputForm defaultValue={format(new Date(objeto.dataCriacao || new Date()), 'yyyy-MM-dd')} width={'15%'} type={'date'} title={'Criação'} errors={errors} inputName={"dataCriacao"} register={register} />
                            <InputForm defaultValue={format(new Date(objeto.inicioPagamento || new Date()), 'yyyy-MM-dd')} width={'15%'} type={'date'} title={'Início Pagamento'} errors={errors} inputName={"inicioPagamento"} register={register} />
                            <InputForm defaultValue={objeto.diaCobranca} width={'10%'} title={'Dia Cobrança'} errors={errors} inputName={"diaCobranca"} register={register} />
                            <InputForm defaultValue={objeto.valorMensal} width={'12%'} title={'Valor Mensal'} errors={errors} inputName={"valorMensal"} register={register} />
                            <InputForm defaultValue={objeto.valorKrd} width={'12%'} title={'Valor KRD'} errors={errors} inputName={"valorKrd"} register={register} />
                            <InputForm defaultValue={objeto.formaPagamento} width={'16%'} title={'Forma Pagamento'} errors={errors} inputName={"formaPagamento"} register={register} />

                            {/* Automações */}
                            <div className={styles.sectionTitle} style={{ width: '100%' }}>Automações</div>
                            <div className={styles.toggleRow}>
                                <label className={styles.toggle}>
                                    <input type="checkbox" checked={!!objeto.geraBoleto} onChange={(e) => setObjeto({ ...objeto, geraBoleto: e.target.checked })} />
                                    <span className={styles.toggleSlider} />
                                    <span className={styles.toggleLabel}>Gera Boleto</span>
                                </label>
                                <label className={styles.toggle}>
                                    <input type="checkbox" checked={!!objeto.geraNfse} onChange={(e) => setObjeto({ ...objeto, geraNfse: e.target.checked })} />
                                    <span className={styles.toggleSlider} />
                                    <span className={styles.toggleLabel}>Gera NFSe</span>
                                </label>
                                <label className={styles.toggle}>
                                    <input type="checkbox" checked={!!objeto.enviaEmail} onChange={(e) => setObjeto({ ...objeto, enviaEmail: e.target.checked })} />
                                    <span className={styles.toggleSlider} />
                                    <span className={styles.toggleLabel}>Envia E-mail</span>
                                </label>
                                <label className={styles.toggle}>
                                    <input type="checkbox" checked={!!objeto.enviaSms} onChange={(e) => setObjeto({ ...objeto, enviaSms: e.target.checked })} />
                                    <span className={styles.toggleSlider} />
                                    <span className={styles.toggleLabel}>Envia SMS</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* ── Ações ── */}
                    <div className={styles.button}>
                        <CustomButton onClick={() => setClose()} typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={sending} onClick={() => handleSubmit(onSubmit)()}>Confirmar</CustomButton>
                    </div>

                </div>
            )}
        </BaseModal>
    )
}