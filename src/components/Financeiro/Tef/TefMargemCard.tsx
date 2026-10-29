import { TefRelatorioMes } from '@/services/apiTefAdmin';
import { cardStyles, TefCard, TefCol, TefField } from './TefCard';
import { brl, mes } from './comum';

export default function TefMargemCard({ item: m }: { item: TefRelatorioMes }) {
    const cor = m.margem >= 0 ? '#1f9d5f' : '#c0392b';
    const aReceber = m.valor - m.recebido;
    const aPagar = m.custo - m.custoPago;

    return (
        <TefCard cols="1fr 1fr 1fr 1fr">
            <TefCol title="Competência">
                <div className={cardStyles.destaque}>{mes(m.competencia)}</div>
                <div className={cardStyles.sub}>{m.qtd} cobrança(s)</div>
            </TefCol>

            <TefCol title="Cliente">
                <TefField label="Cobrado" value={brl(m.valor)} strong />
                <TefField label="Recebido" value={brl(m.recebido)} color="#1f9d5f" />
                <TefField label="A receber" value={brl(aReceber)} color={aReceber > 0 ? '#d97706' : undefined} />
            </TefCol>

            <TefCol title="Provedor">
                <TefField label="Custo" value={brl(m.custo)} strong />
                <TefField label="Pago" value={brl(m.custoPago)} color="#1f9d5f" />
                <TefField label="A pagar" value={brl(aPagar)} color={aPagar > 0 ? '#d97706' : undefined} />
            </TefCol>

            <TefCol title="Margem">
                <div className={cardStyles.destaque} style={{ color: cor }}>{brl(m.margem)}</div>
                <div className={cardStyles.sub}>cobrado − custo</div>
            </TefCol>
        </TefCard>
    );
}
