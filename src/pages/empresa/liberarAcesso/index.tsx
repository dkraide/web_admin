import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { InputGroup } from "@/components/ui/InputGroup";
import styles from './styles.module.scss';
import CustomButton from "@/components/ui/Buttons";
import { api } from "@/services/apiClient";
import { toast } from "react-toastify";
import SelectSimNao from "@/components/Selects/SelectSimNao";




export default function LiberarAcesso() {

    const [loading, setLoading] = useState<boolean>(false)
    const [empresa, setEmpresa] = useState('')
    const [isAntigo, setAntigo] = useState(false)
    const [senha, setSenha] = useState<string | undefined>(undefined)
    useEffect(() => {
    }, []);

    async function generate() {
        setLoading(true);
        await api.post(`/Empresa/GetLiberacao?empresaid=${empresa}&old=${isAntigo}`)
            .then((r) => {
                toast.success(`Senha criada com sucesso`);
                setSenha(r.data.toString());
            }).catch((err) => {
                toast.error(`Erro ao gerar senha. ${err.response?.data || err.message}`);
            });
        setLoading(false);
    }


    return (
        <div className={styles.container}>
            {senha !== undefined ? <>
                <InputGroup readOnly={true} title={'Usuario'} value={'KRDSYSTEM'} />
                <InputGroup readOnly={true} title={'Senha'} value={(senha || '').toUpperCase() || '--'} />
            </> : <>
                <InputGroup width={'35%'} title={'Empresa'} value={empresa} onChange={(e) => {
                    setEmpresa(e.target.value)
                }} />
                <SelectSimNao width={'35%'}
                    selected={isAntigo} title={'Sistema antigo'}
                    setSelected={(v) => {
                        setAntigo(v);
                    }} />
                <div className={styles.button}>
                    <CustomButton typeButton={'dark'} loading={loading} onClick={generate}>Confirmar</CustomButton>
                </div>
            </>}
        </div>
    )
}