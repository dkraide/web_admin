import SelectEmpresa from '@/components/Selects/SelectEmpresa'
import styles from './styles.module.scss'
import { useEffect, useState } from 'react'
import { api } from '@/services/apiClient'
import { AxiosError, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import CustomButton from '@/components/ui/Buttons'
import Confirm from '@/components/Modals/Confirm'
import { canSSRAuth } from '@/utils/CanSSRAuth'

type FormaPagamento = {
    nome: string
    botaoAtiva: string
    identificacaoSAT: string
    geraFaturamento: boolean
    isVisivel: boolean
    empresaId: number
}

export default function CriarDadosIniciais() {

    const [target, setTarget] = useState(0)
    const [loading, setLoading] = useState(false)
    const [confirm, setConfirm] = useState(false)
    const [formas, setFormas] = useState<FormaPagamento[] | null>(null)

    // sempre que a empresa muda, limpa o resultado exibido
    useEffect(() => {
        setFormas(null)
    }, [target])

    async function onCriar() {
        setConfirm(false)
        setLoading(true)
        await api.post(`/v2/Empresa/CriarDadosIniciais?TargetId=${target}`)
            .then(({ data }: AxiosResponse) => {
                setFormas(data?.formas ?? [])
                toast.success('Dados iniciais criados com sucesso.')
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao criar dados iniciais. ${err.response?.data || err.message}`)
            })
        setLoading(false)
    }

    function handleCriarClick() {
        if (target <= 0) {
            toast.warning('Selecione a empresa.')
            return
        }
        setConfirm(true)
    }

    return (
        <div className={styles.container}>
            <h4>Criar Dados Iniciais</h4>
            <p className={styles.subtitle}>
                Cria as formas de pagamento padrão (Dinheiro, Crédito, Débito e Pix) para a empresa selecionada.
            </p>

            <div className={styles.card}>
                <div className={styles.field}>
                    <label>Empresa <small>(receberá os dados iniciais)</small></label>
                    <SelectEmpresa width={'100%'} selected={target} setSelected={setTarget} />
                </div>

                <div className={styles.actions}>
                    <CustomButton typeButton={'dark'} loading={loading} onClick={handleCriarClick}>
                        Criar dados iniciais
                    </CustomButton>
                </div>
            </div>

            {formas !== null && (
                <div className={styles.card}>
                    <h5>Dados criados</h5>
                    {formas.length === 0 ? (
                        <p className={styles.subtitle}>Nenhum dado retornado.</p>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Botão</th>
                                        <th>Identificação SAT</th>
                                        <th>Gera faturamento</th>
                                        <th>Visível</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formas.map((f, i) => (
                                        <tr key={i}>
                                            <td>{f.nome}</td>
                                            <td>{f.botaoAtiva}</td>
                                            <td>{f.identificacaoSAT}</td>
                                            <td>{f.geraFaturamento ? 'Sim' : 'Não'}</td>
                                            <td>{f.isVisivel ? 'Sim' : 'Não'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {confirm && (
                <Confirm
                    isOpen={confirm}
                    setClose={(v) => { v ? onCriar() : setConfirm(false) }}
                    message={`Deseja criar os dados iniciais para a empresa ${target}?`}
                />
            )}
        </div>
    )
}

export const getServerSideProps = canSSRAuth(['SUPORTE', 'ADMINISTRADOR']);
