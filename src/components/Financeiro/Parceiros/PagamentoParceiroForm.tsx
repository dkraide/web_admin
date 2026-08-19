import { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import BaseModal from '@/components/Modals/Base/Index';
import CustomButton from '@/components/ui/Buttons';
import {
    atualizarPagamento,
    criarPagamento,
    getParceiros,
    PagamentoAdmin,
    ParceiroOption,
} from '@/services/apiParceiroAdmin';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

const brl = (n: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export interface RepassePreset {
    duplicataIds: number[];
    valorTotal: number;
    qtd: number;
    parceiroId: string | null;
    parceiroNome: string | null;
}

interface Props {
    isOpen: boolean;
    setClose: (refresh?: boolean) => void;
    edit?: PagamentoAdmin | null;
    preset?: RepassePreset | null;
}

export default function PagamentoParceiroForm({ isOpen, setClose, edit, preset }: Props) {
    const isEdit = !!edit;
    const isRepasse = !!preset;

    const [sending, setSending] = useState(false);
    const [parceiros, setParceiros] = useState<ParceiroOption[]>([]);
    const [usuarioParceiroId, setUsuarioParceiroId] = useState('');
    const [descricao, setDescricao] = useState('');
    const [dataVencimento, setDataVencimento] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [valorTotal, setValorTotal] = useState<number>(0);

    useEffect(() => {
        if (edit) {
            setDescricao(edit.descricao || '');
            setDataVencimento(format(new Date(edit.dataVencimento), 'yyyy-MM-dd'));
            setValorTotal(edit.valorTotal);
            setUsuarioParceiroId(edit.usuarioParceiroId || '');
        }
        // Só precisa da lista de parceiros no manual novo.
        if (!edit && !preset) {
            getParceiros().then(setParceiros).catch(() => { /* silencioso */ });
        }
    }, [edit, preset]);

    const titulo = isEdit
        ? `Editar pagamento #${edit!.id}`
        : isRepasse ? 'Gerar repasse' : 'Novo pagamento manual';

    async function submit() {
        setSending(true);
        try {
            if (isEdit) {
                await atualizarPagamento(edit!.id, {
                    descricao,
                    dataVencimento,
                    valorTotal: edit!.tipo === 'Manual' ? valorTotal : undefined,
                });
                toast.success('Pagamento atualizado.');
            } else if (isRepasse) {
                await criarPagamento({
                    tipo: 1,
                    duplicataIds: preset!.duplicataIds,
                    descricao,
                    dataVencimento,
                });
                toast.success('Repasse gerado com sucesso.');
            } else {
                if (!usuarioParceiroId) {
                    toast.error('Selecione o parceiro.');
                    setSending(false);
                    return;
                }
                if (valorTotal <= 0) {
                    toast.error('Informe um valor maior que zero.');
                    setSending(false);
                    return;
                }
                await criarPagamento({
                    tipo: 0,
                    usuarioParceiroId,
                    descricao,
                    dataVencimento,
                    valorTotal,
                });
                toast.success('Pagamento manual criado.');
            }
            setClose(true);
        } catch (err: any) {
            toast.error(`Erro ao salvar. ${err.response?.data || err.message}`);
        }
        setSending(false);
    }

    return (
        <BaseModal isOpen={isOpen} setClose={() => setClose()} title={titulo} height={'auto'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
                {isRepasse && (
                    <div className={styles.tiles} style={{ marginBottom: 0 }}>
                        <div className={styles.tile}>
                            <span className={styles.tileBar} style={{ background: '#1f9d5f' }} />
                            <div className={styles.tileBody}>
                                <div className={styles.tileLabel}>Valor do repasse</div>
                                <div className={styles.tileValue} style={{ color: '#1f9d5f' }}>{brl(preset!.valorTotal)}</div>
                                <div className={styles.tileHint}>{preset!.qtd} duplicata(s) · {preset!.parceiroNome || 'parceiro'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {!isEdit && !isRepasse && (
                    <div className={styles.filterField}>
                        <label>Parceiro</label>
                        <Form.Select value={usuarioParceiroId} onChange={(e) => setUsuarioParceiroId(e.target.value)}>
                            <option value="">Selecione...</option>
                            {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </Form.Select>
                    </div>
                )}

                {isEdit && (
                    <div className={styles.filterField}>
                        <label>Parceiro</label>
                        <input value={edit!.parceiro || edit!.usuarioParceiroId || '-'} disabled />
                    </div>
                )}

                {(!isRepasse) && (
                    <div className={styles.filterField}>
                        <label>Valor total {isEdit && edit!.tipo !== 'Manual' ? '(somente repasse manual é editável)' : ''}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={valorTotal}
                            disabled={isEdit && edit!.tipo !== 'Manual'}
                            onChange={(e) => setValorTotal(Number(e.target.value))}
                        />
                    </div>
                )}

                <div className={styles.filterField}>
                    <label>Vencimento</label>
                    <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
                </div>

                <div className={styles.filterField}>
                    <label>Descrição</label>
                    <input
                        maxLength={455}
                        placeholder="Ex.: Repasse referente a agosto/2026"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                    />
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
