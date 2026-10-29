import { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import BaseModal from '@/components/Modals/Base/Index';
import CustomButton from '@/components/ui/Buttons';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import { atualizarContrato, criarContrato, listPlanos, TefContrato, TefPlano } from '@/services/apiTefAdmin';
import { erroDaApi } from './comum';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

interface Props {
    isOpen: boolean;
    setClose: (refresh?: boolean) => void;
    edit?: TefContrato | null;
}

export default function TefContratoForm({ isOpen, setClose, edit }: Props) {
    const isEdit = !!edit;

    const [sending, setSending] = useState(false);
    const [planos, setPlanos] = useState<TefPlano[]>([]);
    const [empresaId, setEmpresaId] = useState<number>(0);
    const [tefPlanoId, setTefPlanoId] = useState<number>(0);
    const [diaCobranca, setDiaCobranca] = useState<string>('');
    const [diasCarencia, setDiasCarencia] = useState<string>('5');
    const [observacao, setObservacao] = useState('');

    useEffect(() => {
        listPlanos(true).then(setPlanos).catch((err) => toast.error(`Erro ao carregar os planos. ${erroDaApi(err)}`));
    }, []);

    useEffect(() => {
        if (edit) {
            setEmpresaId(edit.empresaId);
            setTefPlanoId(edit.tefPlanoId);
            setDiaCobranca(String(edit.diaCobranca));
            setDiasCarencia(String(edit.diasCarencia));
            setObservacao(edit.observacao || '');
        }
    }, [edit]);

    async function submit() {
        if (!isEdit && !empresaId) {
            toast.error('Selecione a empresa.');
            return;
        }
        if (!tefPlanoId) {
            toast.error('Selecione o plano.');
            return;
        }
        const payload = {
            tefPlanoId,
            diaCobranca: diaCobranca === '' ? undefined : Number(diaCobranca),
            diasCarencia: diasCarencia === '' ? undefined : Number(diasCarencia),
            observacao,
        };
        setSending(true);
        try {
            if (isEdit) {
                await atualizarContrato(edit!.id, payload);
                toast.success('Contrato atualizado.');
            } else {
                await criarContrato({ ...payload, empresaId });
                toast.success('TEF ativado para a empresa.');
            }
            setClose(true);
        } catch (err: any) {
            toast.error(`Erro ao salvar o contrato. ${erroDaApi(err)}`);
        }
        setSending(false);
    }

    return (
        <BaseModal isOpen={isOpen} setClose={() => setClose()} title={isEdit ? `Editar contrato #${edit!.id}` : 'Ativar TEF para uma empresa'} height={'auto'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
                {isEdit ? (
                    <div className={styles.filterField}>
                        <label>Empresa</label>
                        <input value={`${edit!.empresaId} - ${edit!.empresa || ''}`} disabled />
                    </div>
                ) : (
                    <SelectEmpresa selected={empresaId} setSelected={setEmpresaId} />
                )}

                <div className={styles.filterField}>
                    <label>Plano</label>
                    <Form.Select value={tefPlanoId} onChange={(e) => setTefPlanoId(Number(e.target.value))}>
                        <option value={0}>Selecione...</option>
                        {planos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </Form.Select>
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <div className={styles.filterField}>
                        <label>Dia de cobrança {isEdit ? '' : '(vazio: o da empresa)'}</label>
                        <input type="number" min={1} max={31} value={diaCobranca} onChange={(e) => setDiaCobranca(e.target.value)} />
                    </div>
                    <div className={styles.filterField}>
                        <label>Dias de carência</label>
                        <input type="number" min={0} value={diasCarencia} onChange={(e) => setDiasCarencia(e.target.value)} />
                    </div>
                </div>

                <div className={styles.filterField}>
                    <label>Observação</label>
                    <input maxLength={500} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                </div>

                {!isEdit && (
                    <span style={{ color: '#666', fontSize: 13 }}>
                        Ao ativar, a implantação do plano (se houver) é cobrada na hora. A primeira mensalidade sai no primeiro
                        vencimento depois de hoje. Depois, cadastre os caixas no detalhe do contrato.
                    </span>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <CustomButton typeButton={'secondary'} onClick={() => setClose()}>Cancelar</CustomButton>
                    <CustomButton typeButton={'dark'} onClick={submit} disabled={sending}>
                        {sending ? 'Salvando...' : isEdit ? 'Salvar' : 'Ativar TEF'}
                    </CustomButton>
                </div>
            </div>
        </BaseModal>
    );
}
