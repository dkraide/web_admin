import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { InputGroup} from "@/components/ui/InputGroup";
import styles from './styles.module.scss';
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../../Base/Index";
import { api } from "@/services/apiClient";
import { toast } from "react-toastify";



interface props {
    isOpen: boolean
    setClose: (res?: boolean) => void
    color?: string
}
export default function DuplicataMassaForm({isOpen,  setClose, color }: props) {

    const [loading, setLoading] = useState<boolean>(false)
    const [mes, setMes] = useState('')
    const [ano, setAno] = useState('')
    useEffect(() => {
       var d = new Date();
       console.log(d);
       setAno(d.getUTCFullYear().toString());
       setMes((d.getMonth() + 1).toString());
    }, []);

    async function generate(){
         setLoading(true);
         await api.post(`/Financeiro/CreateMassa?mes=${mes}&ano=${ano}`)
         .then((r) => {
               toast.success(`Duplicatas criada com sucesso`);
               setClose(true);
         }).catch((err) => {
             toast.error(`Erro ao gerar duplicatas. ${err.response?.data || err.message}`);
         });
         setLoading(false);
    }


    return (
        <BaseModal height={'50%'} width={'50%'} color={color} title={'Cadastro de Duplicata em massa'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading  />
            ) : (
                <div className={styles.container}>
                    <InputGroup width={'35%'} title={'mes'} value={mes} onChange={(e) => {
                        setMes(e.target.value)
                    }}/>
                     <InputGroup  width={'35%'} title={'ano'} value={ano} onChange={(e) => {
                        setAno(e.target.value)
                    }}/>
                    <div className={styles.button}>
                        <CustomButton onClick={() => { setClose(); } } typeButton={"secondary"}>Cancelar</CustomButton>
                        <CustomButton typeButton={'dark'} loading={loading} onClick={generate}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}