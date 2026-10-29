import { format } from 'date-fns';
import { Badge } from 'react-bootstrap';
import { SituacaoTef, StatusContratoDoc } from '@/services/apiTefAdmin';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

export const brl = (n: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const dt = (v: string | null | undefined) =>
    (v && new Date(v).getFullYear() > 1 ? format(new Date(v), 'dd/MM/yyyy') : '-');

export const mes = (v: string | null | undefined) =>
    (v && new Date(v).getFullYear() > 1 ? format(new Date(v), 'MM/yyyy') : '-');

export const paraInputData = (v: string | null | undefined) =>
    (v && new Date(v).getFullYear() > 1 ? format(new Date(v), 'yyyy-MM-dd') : '');

export function erroDaApi(err: any): string {
    const d = err?.response?.data;
    if (typeof d === 'string') return d;
    return d?.title || d?.message || err?.message || 'Erro desconhecido';
}

export function StatTile({ label, value, accent, hint }: { label: string; value: string; accent?: string; hint?: string }) {
    return (
        <div className={styles.tile}>
            {accent && <span className={styles.tileBar} style={{ background: accent }} />}
            <div className={styles.tileBody}>
                <div className={styles.tileLabel}>{label}</div>
                <div className={styles.tileValue} style={accent ? { color: accent } : undefined}>{value}</div>
                {hint && <div className={styles.tileHint}>{hint}</div>}
            </div>
        </div>
    );
}

export const ROTULO_DOC: Record<StatusContratoDoc, string> = {
    NaoEnviado: 'Não enviado',
    Enviado: 'Aguardando assinaturas',
    ParcialmenteAssinado: 'Assinado em parte',
    Assinado: 'Assinado',
    Recusado: 'Recusado',
    Expirado: 'Expirado',
};

const COR_DOC: Record<StatusContratoDoc, string> = {
    NaoEnviado: 'secondary',
    Enviado: 'warning',
    ParcialmenteAssinado: 'warning',
    Assinado: 'success',
    Recusado: 'danger',
    Expirado: 'danger',
};

export function ContratoDocBadge({ status }: { status: StatusContratoDoc }) {
    return <Badge bg={COR_DOC[status] || 'secondary'}>{ROTULO_DOC[status] || status}</Badge>;
}

const COR_SITUACAO: Record<SituacaoTef, string> = {
    Ativo: 'success',
    Carencia: 'warning',
    Suspenso: 'danger',
    Cancelado: 'secondary',
};

export function SituacaoBadge({ situacao }: { situacao: SituacaoTef }) {
    return <Badge bg={COR_SITUACAO[situacao] || 'secondary'}>{situacao === 'Carencia' ? 'Carência' : situacao}</Badge>;
}
