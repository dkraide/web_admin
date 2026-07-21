import { useState } from "react";
import { AxiosError, AxiosResponse } from "axios";
import { format } from "date-fns";
import { toast } from "react-toastify";
import BaseModal from "@/components/Modals/Base/Index";
import Loading from "@/components/Loading";
import CustomButton from "@/components/ui/Buttons";
import SelectEmpresa from "@/components/Selects/SelectEmpresa";
import { api } from "@/services/apiClient";
import { criarNotificacaoManual, getDuplicatasAbertas } from "@/services/apiFinanceiro";
import IEmpresa from "@/interfaces/IEmpresa";
import IDuplicata from "@/interfaces/IDuplicata";
import { CanalNotificacao } from "@/interfaces/IEmpresaNotificacao";
import styles from './styles.module.scss';

interface Props {
    isOpen: boolean
    setClose: (res?: boolean) => void
    color?: string
}

type Step = 'empresa' | 'duplicatas' | 'canais'

const STEPS: { key: Step, label: string }[] = [
    { key: 'empresa', label: 'Empresa' },
    { key: 'duplicatas', label: 'Duplicatas' },
    { key: 'canais', label: 'Canais' },
]

const CANAIS: { key: CanalNotificacao, label: string }[] = [
    { key: 'Email', label: 'E-mail' },
    { key: 'SMS', label: 'SMS' },
    { key: 'WhatsApp', label: 'WhatsApp' },
]

export default function NotificacaoManualForm({ isOpen, setClose, color }: Props) {

    const [step, setStep] = useState<Step>('empresa')
    const [maxStep, setMaxStep] = useState<Step>('empresa')

    const [empresaId, setEmpresaId] = useState<number>(0)
    const [empresa, setEmpresa] = useState<IEmpresa>()

    const [carregandoDuplicatas, setCarregandoDuplicatas] = useState(false)
    const [duplicatas, setDuplicatas] = useState<IDuplicata[]>([])
    const [selecionadas, setSelecionadas] = useState<number[]>([])

    const [canais, setCanais] = useState<CanalNotificacao[]>([])
    const [enviando, setEnviando] = useState(false)

    function irPara(destino: Step) {
        const ordem: Step[] = ['empresa', 'duplicatas', 'canais']
        if (ordem.indexOf(destino) <= ordem.indexOf(maxStep)) {
            setStep(destino)
        }
    }

    async function handleAvancarEmpresa() {
        if (!empresaId) return
        setCarregandoDuplicatas(true)
        try {
            const [{ data: empresaData }, duplicatasAbertas] = await Promise.all([
                api.get(`/Empresa/Select?id=${empresaId}`) as Promise<AxiosResponse<IEmpresa>>,
                getDuplicatasAbertas(empresaId)
            ])
            setEmpresa(empresaData)
            setDuplicatas(duplicatasAbertas)
            setSelecionadas([])
            setStep('duplicatas')
            setMaxStep('duplicatas')
        } catch (err) {
            const e = err as AxiosError
            toast.error(`Erro ao buscar dados da empresa. ${e.response?.data || e.message}`)
        } finally {
            setCarregandoDuplicatas(false)
        }
    }

    function toggleDuplicata(id: number) {
        setSelecionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    function toggleTodasDuplicatas() {
        setSelecionadas(prev => prev.length === duplicatas.length ? [] : duplicatas.map(d => d.id))
    }

    function handleAvancarDuplicatas() {
        if (selecionadas.length === 0) return
        setStep('canais')
        setMaxStep('canais')
    }

    function toggleCanal(canal: CanalNotificacao) {
        setCanais(prev => prev.includes(canal) ? prev.filter(x => x !== canal) : [...prev, canal])
    }

    function destinoDoCanal(canal: CanalNotificacao) {
        if (canal === 'Email') return empresa?.email
        if (canal === 'SMS') return empresa?.telefone
        return empresa?.whatsappFormatado
    }

    async function handleConfirmar() {
        if (canais.length === 0) return
        setEnviando(true)
        let algumSucesso = false
        for (const canal of canais) {
            try {
                const res = await criarNotificacaoManual(selecionadas, canal)
                toast.success(res?.mensagem || `Notificação de ${canal} criada. O worker envia em até 1 minuto.`)
                algumSucesso = true
            } catch (err) {
                const e = err as AxiosError
                toast.error(`Erro ao criar notificação de ${canal}. ${e.response?.data || e.message}`)
            }
        }
        setEnviando(false)
        if (algumSucesso) setClose(true)
    }

    return (
        <BaseModal color={color} title={'Criar Notificação Manual'} isOpen={isOpen} setClose={() => setClose()}>
            <div className={styles.container}>

                {/* ── Steps ── */}
                <div className={styles.steps}>
                    {STEPS.map((s, i) => (
                        <div
                            key={s.key}
                            className={`${styles.step} ${step === s.key ? styles.stepActive : ''}`}
                            onClick={() => irPara(s.key)}
                        >
                            <span className={styles.stepNumber}>{i + 1}</span>
                            <span className={styles.stepLabel}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* ── Passo 1: Empresa ── */}
                {step === 'empresa' && (
                    <div className={styles.stepContent}>
                        <SelectEmpresa width={'60%'} selected={empresaId} setSelected={setEmpresaId} />
                        <div className={styles.buttons}>
                            <CustomButton onClick={() => setClose()} typeButton={"secondary"}>Cancelar</CustomButton>
                            <CustomButton typeButton={'dark'} loading={carregandoDuplicatas} disabled={!empresaId} onClick={handleAvancarEmpresa}>Avançar</CustomButton>
                        </div>
                    </div>
                )}

                {/* ── Passo 2: Duplicatas ── */}
                {step === 'duplicatas' && (
                    <div className={styles.stepContent}>
                        <div className={styles.empresaInfo}>
                            <span className={styles.empresaNome}>{empresa?.nomeFantasia}</span>
                            <span className={styles.empresaId}>ID {empresaId}</span>
                        </div>

                        {duplicatas.length === 0 ? (
                            <div className={styles.empty}>Nenhuma duplicata em aberto para esta empresa.</div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.tdCheck}>
                                            <input
                                                type="checkbox"
                                                checked={selecionadas.length === duplicatas.length}
                                                onChange={toggleTodasDuplicatas}
                                            />
                                        </th>
                                        <th>ID</th>
                                        <th>Emissão</th>
                                        <th>Vencimento</th>
                                        <th>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {duplicatas.map(d => (
                                        <tr key={d.id} className={styles.row} onClick={() => toggleDuplicata(d.id)}>
                                            <td className={styles.tdCheck}>
                                                <input type="checkbox" checked={selecionadas.includes(d.id)} onChange={() => toggleDuplicata(d.id)} onClick={e => e.stopPropagation()} />
                                            </td>
                                            <td>{d.id}</td>
                                            <td>{format(new Date(d.dataEmissao), 'dd/MM/yyyy')}</td>
                                            <td>{format(new Date(d.dataVencimento), 'dd/MM/yyyy')}</td>
                                            <td>{d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className={styles.buttons}>
                            <CustomButton onClick={() => irPara('empresa')} typeButton={"secondary"}>Voltar</CustomButton>
                            <CustomButton typeButton={'dark'} disabled={selecionadas.length === 0} onClick={handleAvancarDuplicatas}>
                                Avançar ({selecionadas.length})
                            </CustomButton>
                        </div>
                    </div>
                )}

                {/* ── Passo 3: Canais ── */}
                {step === 'canais' && (
                    <div className={styles.stepContent}>
                        <div className={styles.canaisGrid}>
                            {CANAIS.map(c => {
                                const destino = destinoDoCanal(c.key)
                                const checked = canais.includes(c.key)
                                return (
                                    <label key={c.key} className={`${styles.canalCard} ${checked ? styles.canalCardChecked : ''}`}>
                                        <input type="checkbox" checked={checked} onChange={() => toggleCanal(c.key)} />
                                        <span className={styles.canalLabel}>{c.label}</span>
                                        {destino
                                            ? <span className={styles.canalDestino}>{destino}</span>
                                            : <span className={styles.canalSemDestino}>Sem destino cadastrado</span>}
                                    </label>
                                )
                            })}
                        </div>

                        <div className={styles.buttons}>
                            <CustomButton onClick={() => irPara('duplicatas')} typeButton={"secondary"}>Voltar</CustomButton>
                            <CustomButton typeButton={'dark'} loading={enviando} disabled={canais.length === 0} onClick={handleConfirmar}>Confirmar</CustomButton>
                        </div>
                    </div>
                )}

            </div>
        </BaseModal>
    )
}
