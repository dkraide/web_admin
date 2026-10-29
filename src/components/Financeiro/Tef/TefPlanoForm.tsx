import { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import BaseModal from '@/components/Modals/Base/Index';
import CustomButton from '@/components/ui/Buttons';
import { atualizarPlano, criarPlano, TefPlano, TefPlanoPayload } from '@/services/apiTefAdmin';
import { erroDaApi } from './comum';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

interface Props {
    isOpen: boolean;
    setClose: (refresh?: boolean) => void;
    edit?: TefPlano | null;
}

const VAZIO: TefPlanoPayload = {
    nome: '',
    valorBase: 0,
    valorCaixaExtra: 0,
    caixasIncluidos: 1,
    custoBase: 0,
    custoCaixaExtra: 0,
    valorImplantacao: 0,
    custoImplantacao: 0,
    ativo: true,
};

export default function TefPlanoForm({ isOpen, setClose, edit }: Props) {
    const [sending, setSending] = useState(false);
    const [plano, setPlano] = useState<TefPlanoPayload>(VAZIO);

    useEffect(() => {
        if (edit) {
            setPlano({
                nome: edit.nome,
                valorBase: edit.valorBase,
                valorCaixaExtra: edit.valorCaixaExtra,
                caixasIncluidos: edit.caixasIncluidos,
                custoBase: edit.custoBase,
                custoCaixaExtra: edit.custoCaixaExtra,
                valorImplantacao: edit.valorImplantacao,
                custoImplantacao: edit.custoImplantacao,
                ativo: edit.ativo,
            });
        }
    }, [edit]);

    const num = (campo: keyof TefPlanoPayload, rotulo: string, passo = '0.01') => (
        <div className={styles.filterField}>
            <label>{rotulo}</label>
            <input
                type="number"
                step={passo}
                min={0}
                value={plano[campo] as number}
                onChange={(e) => setPlano({ ...plano, [campo]: Number(e.target.value) })}
            />
        </div>
    );

    async function submit() {
        if (!plano.nome.trim()) {
            toast.error('Informe o nome do plano.');
            return;
        }
        setSending(true);
        try {
            if (edit) {
                await atualizarPlano(edit.id, plano);
                toast.success('Plano atualizado. O novo preço vale para as próximas cobranças.');
            } else {
                await criarPlano(plano);
                toast.success('Plano criado.');
            }
            setClose(true);
        } catch (err: any) {
            toast.error(`Erro ao salvar o plano. ${erroDaApi(err)}`);
        }
        setSending(false);
    }

    return (
        <BaseModal isOpen={isOpen} setClose={() => setClose()} title={edit ? `Editar plano #${edit.id}` : 'Novo plano de TEF'} height={'auto'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
                <div className={styles.filterField}>
                    <label>Nome</label>
                    <input maxLength={80} placeholder="Ex.: TEF PayGo - 1 caixa" value={plano.nome}
                        onChange={(e) => setPlano({ ...plano, nome: e.target.value })} />
                </div>

                <div className={styles.filterField}>
                    <label>Caixas incluídos na mensalidade base</label>
                    <input type="number" min={0} step={1} value={plano.caixasIncluidos}
                        onChange={(e) => setPlano({ ...plano, caixasIncluidos: Number(e.target.value) })} />
                </div>

                <b>O que o cliente paga</b>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {num('valorBase', 'Mensalidade base (R$)')}
                    {num('valorCaixaExtra', 'Cada caixa extra (R$)')}
                    {num('valorImplantacao', 'Implantação, uma vez (R$)')}
                </div>

                <b>O que a KRD paga ao provedor</b>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {num('custoBase', 'Custo mensal base (R$)')}
                    {num('custoCaixaExtra', 'Custo de cada caixa extra (R$)')}
                    {num('custoImplantacao', 'Custo de implantação (R$)')}
                </div>

                {edit && (
                    <Form.Check
                        type="switch"
                        id="plano-ativo"
                        label="Plano ativo (aparece para novos contratos)"
                        checked={plano.ativo}
                        onChange={(e) => setPlano({ ...plano, ativo: e.target.checked })}
                    />
                )}

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
