import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPen } from '@fortawesome/free-solid-svg-icons';
import { TefDespesa } from '@/services/apiTefAdmin';
import { cardStyles, TefBtn, TefCard, TefCol, TefField } from './TefCard';
import { brl, dt, mes } from './comum';

interface Props {
    despesa: TefDespesa;
    onEdit: (d: TefDespesa) => void;
    onPagar: (d: TefDespesa) => void;
}

export default function TefDespesaCard({ despesa: d, onEdit, onPagar }: Props) {
    return (
        <TefCard cols="130px 1.6fr 1.1fr 1fr">
            <TefCol acoes>
                <span className={cardStyles.id}>#{d.id}</span>
                <TefBtn cor="dark" onClick={() => onEdit(d)}>
                    <FontAwesomeIcon icon={faPen} /> Editar
                </TefBtn>
                {d.pago ? (
                    <span className={`${cardStyles.pill} ${cardStyles.sitAtivo}`}
                        style={{ textAlign: 'center', padding: '6px 8px', fontSize: 13 }}>Paga</span>
                ) : (
                    <TefBtn cor="verde" onClick={() => onPagar(d)}>
                        <FontAwesomeIcon icon={faCheck} /> Marcar paga
                    </TefBtn>
                )}
            </TefCol>

            <TefCol title="Despesa">
                <div className={cardStyles.nome} title={d.descricao || ''}>{d.descricao || '-'}</div>
                <div className={cardStyles.sub}>{d.fornecedor || '-'} · {d.categoria || '-'}</div>
                {d.empresaId != null && <TefField label="Cliente" value={`Empresa #${d.empresaId}`} />}
            </TefCol>

            <TefCol title="Datas">
                <TefField label="Competência" value={mes(d.dataCompetencia)} />
                <TefField label="Vencimento" value={dt(d.dataVencimento)} />
                <TefField label="Pagamento" value={dt(d.dataPagamento)} />
                <TefField label="Lançamento" value={dt(d.dataLancamento)} />
            </TefCol>

            <TefCol title="Valor">
                <div className={cardStyles.destaque} style={{ color: d.pago ? '#1f9d5f' : '#d97706' }}>{brl(d.valor)}</div>
                <div className={cardStyles.sub}>{d.pago ? 'pago ao provedor' : 'a pagar ao provedor'}</div>
            </TefCol>
        </TefCard>
    );
}
