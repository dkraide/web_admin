import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faEye, faPause, faPen, faPlay } from '@fortawesome/free-solid-svg-icons';
import { SituacaoTef, TefContrato } from '@/services/apiTefAdmin';
import { cardStyles, TefBtn, TefCard, TefCol, TefField } from './TefCard';
import { brl, ContratoDocBadge, dt } from './comum';

const CLASSE_SITUACAO: Record<SituacaoTef, string> = {
    Ativo: cardStyles.sitAtivo,
    Carencia: cardStyles.sitCarencia,
    Suspenso: cardStyles.sitSuspenso,
    Cancelado: cardStyles.sitCancelado,
};

interface Props {
    contrato: TefContrato;
    onDetalhes: (c: TefContrato) => void;
    onEdit: (c: TefContrato) => void;
    onSuspender: (c: TefContrato) => void;
    onReativar: (c: TefContrato) => void;
    onCancelar: (c: TefContrato) => void;
}

export default function TefContratoCard({ contrato: c, onDetalhes, onEdit, onSuspender, onReativar, onCancelar }: Props) {
    const margem = c.valorMensalAtual - c.custoMensalAtual;
    const cancelado = c.status === 'Cancelado';

    return (
        <TefCard>
            {/* Coluna 1 — Ações */}
            <TefCol acoes>
                <span className={cardStyles.id}>#{c.id}</span>
                <TefBtn cor="dark" onClick={() => onDetalhes(c)}>
                    <FontAwesomeIcon icon={faEye} /> Detalhes
                </TefBtn>
                {!cancelado && (
                    <TefBtn cor="contorno" onClick={() => onEdit(c)}>
                        <FontAwesomeIcon icon={faPen} /> Editar
                    </TefBtn>
                )}
            </TefCol>

            {/* Coluna 2 — Empresa e plano */}
            <TefCol title="Empresa">
                <div className={cardStyles.nome}>{c.empresa || `Empresa ${c.empresaId}`}</div>
                <div className={cardStyles.sub}>Empresa #{c.empresaId}</div>
                <TefField label="Plano" value={<span className={`${cardStyles.pill} ${cardStyles.plano}`}>{c.plano}</span>} />
                <TefField label="Caixas ativos" value={c.pontosAtivos} strong />
                <TefField label="Ativação" value={dt(c.dataAtivacao)} />
                <TefField label="Assinatura" value={<ContratoDocBadge status={c.contratoStatus} />} />
                {c.dataCancelamento && <TefField label="Cancelamento" value={dt(c.dataCancelamento)} />}
                {c.observacao && <TefField label="Observação" value={c.observacao} />}
            </TefCol>

            {/* Coluna 3 — Cobrança */}
            <TefCol title="Cobrança">
                <TefField label="Mensalidade" value={brl(c.valorMensalAtual)} strong />
                <TefField label="Custo" value={brl(c.custoMensalAtual)} />
                <TefField label="Margem" value={brl(margem)} strong color={margem >= 0 ? '#1f9d5f' : '#c0392b'} />
                <TefField label="Dia de cobrança" value={c.diaCobranca} />
                <TefField label="Carência" value={`${c.diasCarencia} dia(s)`} />
                <TefField label="Em aberto desde" value={dt(c.vencimentoEmAberto)} />
            </TefCol>

            {/* Coluna 4 — Situação */}
            <TefCol title="Situação" acoes>
                <span className={`${cardStyles.pill} ${CLASSE_SITUACAO[c.situacao] || cardStyles.sitCancelado}`}
                    style={{ textAlign: 'center', padding: '6px 8px', fontSize: 13 }}>
                    {c.situacao === 'Carencia' ? 'Carência' : c.situacao}
                </span>
                {c.status === 'Ativo' && (
                    <TefBtn cor="ambar" onClick={() => onSuspender(c)}>
                        <FontAwesomeIcon icon={faPause} /> Suspender
                    </TefBtn>
                )}
                {c.status === 'Suspenso' && (
                    <TefBtn cor="verde" onClick={() => onReativar(c)}>
                        <FontAwesomeIcon icon={faPlay} /> Reativar
                    </TefBtn>
                )}
                {!cancelado && (
                    <TefBtn cor="vermelho" onClick={() => onCancelar(c)}>
                        <FontAwesomeIcon icon={faBan} /> Cancelar
                    </TefBtn>
                )}
            </TefCol>
        </TefCard>
    );
}
