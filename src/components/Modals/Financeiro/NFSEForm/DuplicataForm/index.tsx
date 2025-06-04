import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputGroup } from "@/components/ui/InputGroup";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IDuplicata from "@/interfaces/IDuplicata";
import BaseModal from "@/components/Modals/Base/Index";
import CustomButton from "@/components/ui/Buttons";
import { format } from "date-fns";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
}
export default function NFSEForm({ isOpen, id, setClose, color }: props) {

    const [objeto, setObjeto] = useState<IDuplicata>()
    const [loading, setLoading] = useState<boolean>(true)
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
        }

    }, []);
    if (!objeto) {
        return <></>
    }

    const handleAtualizar = async () => {
        setLoading(true);
        await api.put(`/NFSe/${objeto.id}/Update`).then(({ data }) => {
            setObjeto(data);
        }).catch((err: AxiosError) => {
            toast.error(`Erro ao atualizar NFSe. ${err.response?.data || err.message}`)
        });
        setLoading(false);

    }
    const handleCriar = async () => {
        setLoading(true);
        await api.post(`/NFSe/${objeto.id}/Create`).then(({ data }) => {
            setObjeto(data);
        }).catch((err: AxiosError) => {
            toast.error(`Erro ao gerar NFSe. ${err.response?.data || err.message}`)
        });
        setLoading(false);
    }
    const handleImprimir = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/NFSe/${objeto.id}/Impressao`, {
                responseType: 'blob', // Importante para receber o PDF como blob
            });

            // Cria um URL temporário para o PDF
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = window.URL.createObjectURL(pdfBlob);

            // Abre o PDF em uma nova aba
            const newWindow = window.open(pdfUrl, '_blank');
            if (!newWindow) {
                toast.error('Falha ao abrir o PDF. Verifique as permissões do navegador.');
            }

            // (Opcional) Pode também forçar o download em vez de abrir no navegador:
            // const link = document.createElement('a');
            // link.href = pdfUrl;
            // link.download = 'arquivo.pdf';
            // link.click();
        } catch (err) {
            const axiosError = err as AxiosError;
            toast.error(`Erro ao imprimir NFSe. ${axiosError.response?.data || axiosError.message}`);
        } finally {
            setLoading(false);
        }
    };
    const handleCancelar = async () => {
        setLoading(true);
        await api.post(`/NFSe/${objeto.id}/Cancelar`).then(({ data }) => {
            setObjeto(data);
        }).catch((err: AxiosError) => {
            toast.error(`Erro ao imprimir NFSe. ${err.response?.data || err.message}`)
        });
        setLoading(false);
    }

    const handleParametrizar = async () => {
      setLoading(true);
        await api.put(`/NFSe/${objeto.id}/Parametrizar`).then(({ data }) => {
            setObjeto(data);
        }).catch((err: AxiosError) => {
            toast.error(`Erro ao Parametrizar NFSe. ${err.response?.data || err.message}`)
        });
        setLoading(false);
    }



    return (
        <BaseModal color={color} title={'Cadastro de NFS-e'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.protocolo}>
                        <InputGroup width={'10%'} value={objeto.id} title={'Duplicata'} />
                        <InputGroup width={'50%'} value={objeto.empresa?.nomeFantasia} title={'Cliente'} />
                        <InputGroup width={'10%'} value={format(new Date(objeto.dataEmissao), 'dd/MM/yy')} title={'Emissao'} />
                        <InputGroup width={'15%'} value={format(new Date(objeto.dataVencimento), 'dd/MM/yy')} title={'Vencimento'} />
                        <InputGroup width={'15%'} value={objeto.valor.toFixed(2)} title={'Valor'} />
                    </div>
                    <div className={styles.protocolo} hidden={!objeto.protocolo}>
                        <InputGroup width={'15%'} value={objeto.numeroRPS} title={'RPS'} />
                        <InputGroup width={'20%'} value={objeto.numeroNFSE} title={'Numero'} />
                        <InputGroup width={'20%'} value={objeto.loteNFSE} title={'Lote'} />
                        <InputGroup width={'20%'} value={objeto.chaveNFSE} title={'Chave'} />
                        <InputGroup width={'20%'} value={objeto.statusNFSE} title={'Status'} />
                        <div className={styles.protocolo} style={{ justifyContent: 'flex-end' }}>
                            <CustomButton onClick={handleAtualizar}>Atualizar</CustomButton>
                            <CustomButton onClick={handleImprimir}>Imprimir</CustomButton>
                            <CustomButton hidden={objeto.statusNFSE?.toUpperCase() === 'CANCELADA'} onClick={handleCancelar}>Cancelar</CustomButton>
                            <CustomButton onClick={handleParametrizar}>Parametrizar</CustomButton>
                        </div>
                    </div>
                    <div className={styles.protocolo} hidden={!!objeto.protocolo}>
                        <CustomButton style={{ height: 40 }} onClick={handleCriar}>Gerar NFS-e</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}