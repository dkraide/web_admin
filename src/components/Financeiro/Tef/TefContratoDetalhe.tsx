import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPowerOff } from '@fortawesome/free-solid-svg-icons';
import BaseModal from '@/components/Modals/Base/Index';
import CustomButton from '@/components/ui/Buttons';
import Loading from '@/components/Loading';
import {
    adicionarPonto,
    atualizarStatusDoContrato,
    desativarPonto,
    enviarContratoParaAssinatura,
    getContrato,
    TefCobranca,
    TefContratoDetalhe as Detalhe,
    TefPonto,
} from '@/services/apiTefAdmin';
import { cardStyles, TefBtn, TefCard, TefCol, TefField, TefVazio } from './TefCard';
import { brl, ContratoDocBadge, dt, erroDaApi, mes, SituacaoBadge, StatTile } from './comum';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

interface Props {
    contratoId: number;
    setClose: (refresh?: boolean) => void;
}

function PontoCard({ ponto: p, onDesativar }: { ponto: TefPonto; onDesativar: (p: TefPonto) => void }) {
    return (
        <TefCard cols="1.6fr 1fr 1fr 130px">
            <TefCol title="Ponto de captura">
                <div className={cardStyles.nome}>{p.posId}</div>
                <div className={cardStyles.sub}>{p.descricao || 'sem descrição'}</div>
            </TefCol>
            <TefCol title="Ativado em">
                <div className={cardStyles.nome}>{dt(p.ativadoEm)}</div>
            </TefCol>
            <TefCol title="Situação">
                <span className={`${cardStyles.pill} ${p.ativo ? cardStyles.sitAtivo : cardStyles.sitCancelado}`}
                    style={{ alignSelf: 'flex-start' }}>
                    {p.ativo ? 'Ativo' : `Desativado em ${dt(p.desativadoEm)}`}
                </span>
            </TefCol>
            <TefCol acoes>
                {p.ativo && (
                    <TefBtn cor="vermelho" onClick={() => onDesativar(p)}>
                        <FontAwesomeIcon icon={faPowerOff} /> Desativar
                    </TefBtn>
                )}
            </TefCol>
        </TefCard>
    );
}

function CobrancaCard({ cobranca: r }: { cobranca: TefCobranca }) {
    const statusCliente = r.duplicataId == null
        ? { texto: 'sem duplicata', classe: cardStyles.sitCancelado }
        : r.cancelada
            ? { texto: 'Cancelada', classe: cardStyles.sitCancelado }
            : r.paga
                ? { texto: 'Paga', classe: cardStyles.sitAtivo }
                : { texto: 'Em aberto', classe: cardStyles.sitCarencia };

    const statusCusto = r.despesaKrdId == null
        ? { texto: '-', classe: cardStyles.sitCancelado }
        : r.custoPago
            ? { texto: 'Pago', classe: cardStyles.sitAtivo }
            : { texto: 'A pagar', classe: cardStyles.sitCarencia };

    return (
        <TefCard cols="1fr 1.2fr 1.2fr 0.8fr">
            <TefCol title="Competência">
                <div className={cardStyles.nome}>{mes(r.competencia)}</div>
                <div className={cardStyles.sub}>{r.tipo === 'Implantacao' ? 'Implantação' : 'Mensalidade'}</div>
            </TefCol>
            <TefCol title="Cliente">
                <TefField label="Valor" value={brl(r.valor)} strong />
                <TefField label="Vencimento" value={dt(r.vencimento)} />
                <TefField label="Situação" value={<span className={`${cardStyles.pill} ${statusCliente.classe}`}>{statusCliente.texto}</span>} />
            </TefCol>
            <TefCol title="KRD → provedor">
                <TefField label="Custo" value={brl(r.custo)} strong />
                <TefField label="Margem" value={brl(r.valor - r.custo)} color={r.valor - r.custo >= 0 ? '#1f9d5f' : '#c0392b'} />
                <TefField label="Situação" value={<span className={`${cardStyles.pill} ${statusCusto.classe}`}>{statusCusto.texto}</span>} />
            </TefCol>
            <TefCol title="Caixas">
                <div className={cardStyles.destaque}>{r.qtdPontos}</div>
                <div className={cardStyles.sub}>na cobrança</div>
            </TefCol>
        </TefCard>
    );
}

export default function TefContratoDetalhe({ contratoId, setClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
    const [posId, setPosId] = useState('');
    const [descricao, setDescricao] = useState('');
    const [alterou, setAlterou] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            setDetalhe(await getContrato(contratoId));
        } catch (err: any) {
            toast.error(`Erro ao carregar o contrato. ${erroDaApi(err)}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, [contratoId]);

    async function adicionar() {
        if (!posId.trim()) {
            toast.error('Informe o ID do ponto de captura.');
            return;
        }
        try {
            await adicionarPonto(contratoId, posId.trim(), descricao.trim() || undefined);
            toast.success('Caixa adicionado.');
            setPosId('');
            setDescricao('');
            setAlterou(true);
            load();
        } catch (err: any) {
            toast.error(`Erro ao adicionar o caixa. ${erroDaApi(err)}`);
        }
    }

    async function enviarContrato(reenviar: boolean) {
        const c = detalhe?.contrato;
        if (!c) return;
        const texto = reenviar
            ? 'Criar um NOVO envio do contrato? O envio anterior deixa de ser acompanhado aqui.'
            : `Enviar o contrato de TEF para assinatura da KRD e de ${c.empresa}?`;
        if (!confirm(texto)) return;
        setEnviando(true);
        try {
            const r = await enviarContratoParaAssinatura(contratoId, reenviar);
            toast.success(r.mensagem);
            setAlterou(true);
            load();
        } catch (err: any) {
            toast.error(erroDaApi(err));
        }
        setEnviando(false);
    }

    async function atualizarStatus() {
        setEnviando(true);
        try {
            const r = await atualizarStatusDoContrato(contratoId);
            toast.info(r.mensagem);
            setAlterou(true);
            load();
        } catch (err: any) {
            toast.error(erroDaApi(err));
        }
        setEnviando(false);
    }

    async function desativar(p: TefPonto) {
        if (!confirm(`Desativar o caixa ${p.posId}? Ele deixa de contar nas próximas cobranças.`)) return;
        try {
            await desativarPonto(p.id);
            toast.success('Caixa desativado.');
            setAlterou(true);
            load();
        } catch (err: any) {
            toast.error(`Erro ao desativar. ${erroDaApi(err)}`);
        }
    }

    const c = detalhe?.contrato;
    const contratoCancelado = c?.status === 'Cancelado';

    return (
        <BaseModal isOpen={true} setClose={() => setClose(alterou)} title={c ? `Contrato #${c.id} — ${c.empresa || ''}` : 'Contrato'} height={'auto'}>
            {loading && !detalhe && <Loading />}
            {c && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div className={styles.tiles}>
                        <StatTile label="Situação" value={c.situacao === 'Carencia' ? 'Carência' : c.situacao} accent={'#3b82f6'}
                            hint={`Plano: ${c.plano}`} />
                        <StatTile label="Caixas ativos" value={String(c.pontosAtivos)} accent={'#1f9d5f'} />
                        <StatTile label="Mensalidade atual" value={brl(c.valorMensalAtual)} accent={'#d97706'}
                            hint={`custo ${brl(c.custoMensalAtual)}`} />
                        <StatTile label="Vencimento em aberto" value={dt(c.vencimentoEmAberto)}
                            hint={`carência de ${c.diasCarencia} dia(s)`} />
                    </div>

                    <div>
                        <h6>Contrato para assinatura <ContratoDocBadge status={c.contratoStatus} /></h6>
                        <div className={styles.filterCard}>
                            <div className={styles.filterField} style={{ flex: 1, minWidth: 220 }}>
                                <label>Situação</label>
                                <span style={{ color: '#555' }}>
                                    {c.contratoStatus === 'NaoEnviado' && 'Ainda não enviado. Assinam a KRD e o cliente, nessa ordem.'}
                                    {c.contratoEnviadoEm && `Enviado em ${dt(c.contratoEnviadoEm)}. `}
                                    {c.contratoAssinadoEm && `Assinado em ${dt(c.contratoAssinadoEm)}.`}
                                </span>
                                <span style={{ color: '#999', fontSize: 12 }}>
                                    Informativo: o TEF no PDV segue pela mensalidade, e não pela assinatura.
                                </span>
                            </div>
                            {!contratoCancelado && (c.contratoStatus === 'NaoEnviado' || c.contratoStatus === 'Recusado' || c.contratoStatus === 'Expirado') && (
                                <CustomButton typeButton={'dark'} onClick={() => enviarContrato(false)} disabled={enviando}>
                                    Enviar para assinatura
                                </CustomButton>
                            )}
                            {c.contratoStatus !== 'NaoEnviado' && (
                                <CustomButton typeButton={'secondary'} onClick={atualizarStatus} disabled={enviando}>
                                    Atualizar status
                                </CustomButton>
                            )}
                            {!contratoCancelado && (c.contratoStatus === 'Enviado' || c.contratoStatus === 'ParcialmenteAssinado' || c.contratoStatus === 'Assinado') && (
                                <CustomButton typeButton={'warning'} onClick={() => enviarContrato(true)} disabled={enviando}>
                                    Reenviar
                                </CustomButton>
                            )}
                            {c.contratoUrl && (
                                <a href={c.contratoUrl} target="_blank" rel="noreferrer">
                                    <CustomButton typeButton={'success'}>Abrir assinado</CustomButton>
                                </a>
                            )}
                        </div>
                    </div>

                    <div>
                        <h6>Caixas (pontos de captura) <SituacaoBadge situacao={c.situacao} /></h6>
                        {!contratoCancelado && (
                            <div className={styles.filterCard}>
                                <div className={styles.filterField}>
                                    <label>ID do ponto de captura</label>
                                    <input value={posId} onChange={(e) => setPosId(e.target.value)} placeholder="Ex.: 118653" />
                                </div>
                                <div className={styles.filterField} style={{ flex: 1, minWidth: 180 }}>
                                    <label>Descrição (opcional)</label>
                                    <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Caixa 1" />
                                </div>
                                <CustomButton typeButton={'success'} onClick={adicionar}>Adicionar caixa</CustomButton>
                            </div>
                        )}
                        {detalhe!.pontos.length === 0
                            ? <TefVazio>Nenhum caixa cadastrado neste contrato.</TefVazio>
                            : detalhe!.pontos.map(p => <PontoCard key={p.id} ponto={p} onDesativar={desativar} />)}
                    </div>

                    <div>
                        <h6>Cobranças geradas</h6>
                        {detalhe!.cobrancas.length === 0
                            ? <TefVazio>Nenhuma cobrança gerada ainda. A primeira mensalidade sai pelo worker, na janela de 10 dias antes do vencimento.</TefVazio>
                            : detalhe!.cobrancas.map(r => <CobrancaCard key={r.id} cobranca={r} />)}
                    </div>
                </div>
            )}
        </BaseModal>
    );
}
