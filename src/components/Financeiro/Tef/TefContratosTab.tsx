import { useEffect, useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import Loading from '@/components/Loading';
import CustomButton from '@/components/ui/Buttons';
import {
    cancelarContrato,
    gerarCobrancas,
    listContratos,
    reativarContrato,
    suspenderContrato,
    TefContrato,
    testarDocuSeal,
} from '@/services/apiTefAdmin';
import TefContratoForm from './TefContratoForm';
import TefContratoDetalhe from './TefContratoDetalhe';
import TefContratoCard from './TefContratoCard';
import { OrdenarBar, ordenar, TefVazio } from './TefCard';
import { brl, erroDaApi, StatTile } from './comum';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

const ORDEM = [
    { value: 'empresa', label: 'Empresa' },
    { value: 'id', label: 'Id' },
    { value: 'situacao', label: 'Situação' },
    { value: 'caixas', label: 'Caixas' },
    { value: 'mensal', label: 'Mensalidade' },
    { value: 'custo', label: 'Custo' },
    { value: 'ativacao', label: 'Data de ativação' },
    { value: 'aberto', label: 'Em aberto desde' },
];

function valorDe(c: TefContrato, campo: string): number | string {
    switch (campo) {
        case 'empresa': return (c.empresa || '').toLowerCase();
        case 'situacao': return c.situacao;
        case 'caixas': return c.pontosAtivos;
        case 'mensal': return c.valorMensalAtual;
        case 'custo': return c.custoMensalAtual;
        case 'ativacao': return new Date(c.dataAtivacao || 0).getTime();
        case 'aberto': return c.vencimentoEmAberto ? new Date(c.vencimentoEmAberto).getTime() : 0;
        default: return c.id;
    }
}

export default function TefContratosTab() {
    const [loading, setLoading] = useState(true);
    const [situacao, setSituacao] = useState('');
    const [busca, setBusca] = useState('');
    const [campo, setCampo] = useState('empresa');
    const [dir, setDir] = useState<'asc' | 'desc'>('asc');
    const [itens, setItens] = useState<TefContrato[]>([]);
    const [novo, setNovo] = useState(false);
    const [edit, setEdit] = useState<TefContrato | null>(null);
    const [detalheId, setDetalheId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            setItens(await listContratos(situacao || undefined));
        } catch (err: any) {
            toast.error(`Erro ao carregar os contratos. ${erroDaApi(err)}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const lista = useMemo(() => {
        const filtrada = itens.filter(c =>
            `${c.empresa || ''}${c.plano}${c.id}${c.empresaId}`.toLowerCase().includes(busca.toLowerCase()));
        return ordenar(filtrada, c => valorDe(c, campo), dir);
    }, [itens, busca, campo, dir]);

    const resumo = useMemo(() => {
        const vigentes = itens.filter(c => c.situacao === 'Ativo' || c.situacao === 'Carencia');
        return {
            vigentes: vigentes.length,
            carencia: itens.filter(c => c.situacao === 'Carencia').length,
            suspensos: itens.filter(c => c.situacao === 'Suspenso').length,
            caixas: vigentes.reduce((s, c) => s + c.pontosAtivos, 0),
            valor: vigentes.reduce((s, c) => s + c.valorMensalAtual, 0),
            custo: vigentes.reduce((s, c) => s + c.custoMensalAtual, 0),
        };
    }, [itens]);

    async function acao(texto: string, executar: () => Promise<void>, ok: string) {
        if (!confirm(texto)) return;
        try {
            await executar();
            toast.success(ok);
            load();
        } catch (err: any) {
            toast.error(`Erro: ${erroDaApi(err)}`);
        }
    }

    async function testarAssinatura() {
        try {
            const r = await testarDocuSeal();
            if (r.prontoParaEnviar) toast.success('DocuSeal conectado e pronto para enviar contratos.');
            else toast.warning(`DocuSeal conectado, mas falta configurar no servidor: ${r.falta}`);
        } catch (err: any) {
            toast.error(`DocuSeal: ${erroDaApi(err)}`);
        }
    }

    async function gerarAgora() {
        if (!confirm('Gerar agora as mensalidades que já estão na janela de cobrança (10 dias antes do vencimento)?')) return;
        try {
            const r = await gerarCobrancas();
            toast.success(`${r.geradas} cobrança(s) gerada(s).`);
            load();
        } catch (err: any) {
            toast.error(`Erro ao gerar as cobranças. ${erroDaApi(err)}`);
        }
    }

    return (
        <div>
            <div className={styles.filterCard}>
                <div className={styles.filterField} style={{ flex: 1, minWidth: 220 }}>
                    <label>Pesquisar</label>
                    <input placeholder="Empresa, plano ou nº..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <div className={styles.filterField}>
                    <label>Situação</label>
                    <Form.Select value={situacao} onChange={(e) => setSituacao(e.target.value)}>
                        <option value="">Todas</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Carencia">Carência</option>
                        <option value="Suspenso">Suspenso</option>
                        <option value="Cancelado">Cancelado</option>
                    </Form.Select>
                </div>
                <CustomButton typeButton={'dark'} onClick={load}>Pesquisar</CustomButton>
            </div>

            <div className={styles.tiles}>
                <StatTile label="Contratos vigentes" value={String(resumo.vigentes)} accent={'#3b82f6'}
                    hint={`${resumo.carencia} em carência · ${resumo.suspensos} suspenso(s)`} />
                <StatTile label="Caixas ativos" value={String(resumo.caixas)} accent={'#1f9d5f'} />
                <StatTile label="Receita mensal" value={brl(resumo.valor)} accent={'#1f9d5f'} hint="contratos vigentes" />
                <StatTile label="Custo mensal" value={brl(resumo.custo)} accent={'#d97706'}
                    hint={`margem ${brl(resumo.valor - resumo.custo)}`} />
            </div>

            <OrdenarBar opcoes={ORDEM} campo={campo} setCampo={setCampo} dir={dir} setDir={setDir}
                total={lista.length} rotulo="contrato(s)">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <CustomButton typeButton={'dark'} onClick={() => setNovo(true)}>Ativar TEF</CustomButton>
                    <CustomButton typeButton={'secondary'} onClick={gerarAgora}>Gerar cobranças agora</CustomButton>
                    <CustomButton typeButton={'secondary'} onClick={testarAssinatura}>Testar DocuSeal</CustomButton>
                </div>
            </OrdenarBar>

            {loading ? <Loading /> : lista.length === 0 ? (
                <TefVazio>Nenhum contrato de TEF encontrado.</TefVazio>
            ) : lista.map(c => (
                <TefContratoCard
                    key={c.id}
                    contrato={c}
                    onDetalhes={(x) => setDetalheId(x.id)}
                    onEdit={setEdit}
                    onSuspender={(x) => acao(`Suspender o TEF de ${x.empresa}? A cobrança pausa e o TEF é bloqueado no PDV.`,
                        () => suspenderContrato(x.id), 'Contrato suspenso.')}
                    onReativar={(x) => acao(`Reativar o TEF de ${x.empresa}?`,
                        () => reativarContrato(x.id), 'Contrato reativado.')}
                    onCancelar={(x) => acao(`Cancelar o contrato de TEF de ${x.empresa}? Todos os caixas são desativados. As duplicatas em aberto continuam; cancele-as no financeiro, se for o caso.`,
                        () => cancelarContrato(x.id), 'Contrato cancelado.')}
                />
            ))}

            {novo && <TefContratoForm isOpen={novo} setClose={(refresh) => { setNovo(false); if (refresh) load(); }} />}
            {edit && <TefContratoForm isOpen={!!edit} edit={edit} setClose={(refresh) => { setEdit(null); if (refresh) load(); }} />}
            {detalheId !== null && (
                <TefContratoDetalhe contratoId={detalheId} setClose={(refresh) => { setDetalheId(null); if (refresh) load(); }} />
            )}
        </div>
    );
}
