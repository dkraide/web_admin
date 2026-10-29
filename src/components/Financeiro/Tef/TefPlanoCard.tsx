import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { TefPlano } from '@/services/apiTefAdmin';
import { cardStyles, TefBtn, TefCard, TefCol, TefField } from './TefCard';
import { brl } from './comum';

export default function TefPlanoCard({ plano: p, onEdit }: { plano: TefPlano; onEdit: (p: TefPlano) => void }) {
    const margemBase = p.valorBase - p.custoBase;
    const margemExtra = p.valorCaixaExtra - p.custoCaixaExtra;

    return (
        <TefCard>
            <TefCol acoes>
                <span className={cardStyles.id}>#{p.id}</span>
                <TefBtn cor="dark" onClick={() => onEdit(p)}>
                    <FontAwesomeIcon icon={faPen} /> Editar
                </TefBtn>
                <span className={`${cardStyles.pill} ${p.ativo ? cardStyles.sitAtivo : cardStyles.sitCancelado}`}
                    style={{ textAlign: 'center', padding: '6px 8px', fontSize: 13 }}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </TefCol>

            <TefCol title="Plano">
                <div className={cardStyles.nome}>{p.nome}</div>
                <div className={cardStyles.sub}>{p.provedor}</div>
                <TefField label="Caixas incluídos" value={p.caixasIncluidos} strong />
            </TefCol>

            <TefCol title="Cliente paga">
                <TefField label="Mensalidade base" value={brl(p.valorBase)} strong />
                <TefField label="Cada caixa extra" value={brl(p.valorCaixaExtra)} />
                <TefField label="Implantação" value={brl(p.valorImplantacao)} />
            </TefCol>

            <TefCol title="KRD paga">
                <TefField label="Custo base" value={brl(p.custoBase)} strong />
                <TefField label="Custo caixa extra" value={brl(p.custoCaixaExtra)} />
                <TefField label="Custo implantação" value={brl(p.custoImplantacao)} />
                <TefField label="Margem base" value={brl(margemBase)} strong color={margemBase >= 0 ? '#1f9d5f' : '#c0392b'} />
                <TefField label="Margem caixa extra" value={brl(margemExtra)} color={margemExtra >= 0 ? '#1f9d5f' : '#c0392b'} />
            </TefCol>
        </TefCard>
    );
}
