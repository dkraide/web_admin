import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import BaseModal from '@/components/Modals/Base/Index';
import CustomButton from '@/components/ui/Buttons';
import { atualizarDespesa, TefDespesa } from '@/services/apiTefAdmin';
import { erroDaApi, paraInputData } from './comum';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

interface Props {
    despesa: TefDespesa;
    setClose: (refresh?: boolean) => void;
}

export default function TefDespesaForm({ despesa, setClose }: Props) {
    const [sending, setSending] = useState(false);
    const [valor, setValor] = useState<number>(despesa.valor);
    const [vencimento, setVencimento] = useState(paraInputData(despesa.dataVencimento));
    const [descricao, setDescricao] = useState(despesa.descricao || '');

    useEffect(() => {
        setValor(despesa.valor);
        setVencimento(paraInputData(despesa.dataVencimento));
        setDescricao(despesa.descricao || '');
    }, [despesa]);

    async function submit() {
        if (valor < 0) {
            toast.error('O valor não pode ser negativo.');
            return;
        }
        setSending(true);
        try {
            await atualizarDespesa(despesa.id, {
                valor,
                dataVencimento: vencimento || undefined,
                descricao,
            });
            toast.success('Despesa atualizada.');
            setClose(true);
        } catch (err: any) {
            toast.error(`Erro ao salvar. ${erroDaApi(err)}`);
        }
        setSending(false);
    }

    return (
        <BaseModal isOpen={true} setClose={() => setClose()} title={`Editar despesa #${despesa.id}`} height={'auto'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
                <div className={styles.filterField}>
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" min={0} value={valor} onChange={(e) => setValor(Number(e.target.value))} />
                </div>
                <div className={styles.filterField}>
                    <label>Vencimento (pagamento ao provedor)</label>
                    <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
                </div>
                <div className={styles.filterField}>
                    <label>Descrição</label>
                    <input maxLength={255} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <CustomButton typeButton={'secondary'} onClick={() => setClose()}>Cancelar</CustomButton>
                    <CustomButton typeButton={'dark'} onClick={submit} disabled={sending}>
                        {sending ? 'Salvando...' : 'Salvar'}
                    </CustomButton>
                </div>
            </div>
        </BaseModal>
    );
}
