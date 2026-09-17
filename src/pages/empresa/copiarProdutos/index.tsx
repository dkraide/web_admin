import SelectEmpresa from '@/components/Selects/SelectEmpresa'
import styles from './styles.module.scss'
import { useEffect, useState } from 'react'
import { api } from '@/services/apiClient'
import { AxiosError, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import CustomButton from '@/components/ui/Buttons'
import Confirm from '@/components/Modals/Confirm'
import { canSSRAuth } from '@/utils/CanSSRAuth'

export default function CopiarProdutos() {

    const [source, setSource] = useState(0)
    const [target, setTarget] = useState(0)

    const [qtd, setQtd] = useState<number | null>(null)
    const [loadingQtd, setLoadingQtd] = useState(false)
    const [loadingCopy, setLoadingCopy] = useState(false)
    const [confirm, setConfirm] = useState(false)

    // sempre que a origem muda, invalida a quantidade exibida
    useEffect(() => {
        setQtd(null)
    }, [source])

    async function loadQuantidade() {
        if (source <= 0) {
            toast.warning('Selecione a empresa de origem.')
            return
        }
        setLoadingQtd(true)
        await api.get(`/Empresa/GetRows?empresaId=${source}`)
            .then(({ data }: AxiosResponse) => {
                setQtd(data?.produto ?? 0)
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao carregar dados. ${err.response?.data || err.message}`)
            })
        setLoadingQtd(false)
    }

    async function onCopiar() {
        setConfirm(false)
        setLoadingCopy(true)
        await api.post(`/v2/Empresa/CopiarProdutos?SourceId=${source}&TargetId=${target}`)
            .then(({ data }: AxiosResponse) => {
                toast.success(typeof data === 'string' ? data : 'Produtos copiados com sucesso.')
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao copiar produtos. ${err.response?.data || err.message}`)
            })
        setLoadingCopy(false)
    }

    function handleCopiarClick() {
        if (source <= 0 || target <= 0) {
            toast.warning('Selecione a empresa de origem e a de destino.')
            return
        }
        if (source === target) {
            toast.warning('A empresa de origem e a de destino devem ser diferentes.')
            return
        }
        setConfirm(true)
    }

    return (
        <div className={styles.container}>
            <h4>Copiar Produtos</h4>
            <p className={styles.subtitle}>
                Copia a base de produtos (classes, tributações e códigos de barras) de uma empresa de origem para uma empresa de destino.
            </p>

            <div className={styles.card}>
                <div className={styles.field}>
                    <label>Empresa de origem <small>(terá os dados copiados)</small></label>
                    <SelectEmpresa width={'100%'} selected={source} setSelected={setSource} />
                </div>

                <div className={styles.qtdRow}>
                    <CustomButton typeButton={'secondary'} loading={loadingQtd} onClick={loadQuantidade}>
                        Ver quantidade de produtos
                    </CustomButton>
                    {qtd !== null && (
                        <span className={styles.qtdInfo}>
                            <b>{qtd}</b> produto(s) serão enviados para a empresa de destino.
                        </span>
                    )}
                </div>

                <hr />

                <div className={styles.field}>
                    <label>Empresa de destino <small>(receberá os produtos)</small></label>
                    <SelectEmpresa width={'100%'} selected={target} setSelected={setTarget} />
                </div>

                <div className={styles.actions}>
                    <CustomButton typeButton={'dark'} loading={loadingCopy} onClick={handleCopiarClick}>
                        Copiar
                    </CustomButton>
                </div>
            </div>

            {confirm && (
                <Confirm
                    isOpen={confirm}
                    setClose={(v) => { v ? onCopiar() : setConfirm(false) }}
                    message={`Deseja copiar ${qtd !== null ? qtd + ' produto(s)' : 'os produtos'} da empresa ${source} para a empresa ${target}?`}
                />
            )}
        </div>
    )
}

export const getServerSideProps = canSSRAuth(['SUPORTE', 'ADMINISTRADOR']);
