import { useEffect, useMemo, useState } from 'react';
import { Badge, Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import CustomTable from '@/components/ui/CustomTable';
import CustomButton from '@/components/ui/Buttons';
import {
    getMensalidadesParaRepasse,
    getParceiros,
    MensalidadeRepasse,
    MensalidadesRepasseResumo,
    ParceiroOption,
} from '@/services/apiParceiroAdmin';
import PagamentoParceiroForm, { RepassePreset } from './PagamentoParceiroForm';
import styles from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

const brl = (n: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (v: string) => (v ? format(new Date(v), 'dd/MM/yyyy') : '-');

function StatTile({ label, value, accent, hint }: { label: string; value: string; accent?: string; hint?: string }) {
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

export default function MensalidadesRepasseTab() {
    const [loading, setLoading] = useState(true);
    const [parceiroId, setParceiroId] = useState('');
    const [busca, setBusca] = useState('');
    const [resumo, setResumo] = useState<MensalidadesRepasseResumo | null>(null);
    const [itens, setItens] = useState<MensalidadeRepasse[]>([]);
    const [parceiros, setParceiros] = useState<ParceiroOption[]>([]);
    const [selecionadas, setSelecionadas] = useState<MensalidadeRepasse[]>([]);
    const [preset, setPreset] = useState<RepassePreset | null>(null);
    const [tableKey, setTableKey] = useState(0); // força limpar seleção ao recarregar

    const load = async () => {
        setLoading(true);
        try {
            const res = await getMensalidadesParaRepasse(parceiroId || undefined);
            setResumo(res.resumo);
            setItens(res.itens || []);
            setSelecionadas([]);
            setTableKey(k => k + 1);
        } catch (err: any) {
            toast.error(`Erro ao carregar mensalidades. ${err.response?.data || err.message}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); getParceiros().then(setParceiros).catch(() => {}); }, []);

    const filtradas = useMemo(
        () => itens.filter(m => `${m.cliente || ''}${m.parceiro || ''}${m.id}`.toLowerCase().includes(busca.toLowerCase())),
        [itens, busca]
    );

    // "Gerar pagamento" exige seleção de um único parceiro.
    const parceirosSelecionados = new Set(selecionadas.map(s => s.usuarioParceiroId || ''));
    const podeGerar = selecionadas.length > 0 && parceirosSelecionados.size === 1 && !parceirosSelecionados.has('');
    const totalSelecionado = selecionadas.reduce((s, m) => s + m.valorRepasse, 0);

    function gerar() {
        if (!podeGerar) {
            toast.warn('Selecione mensalidades de um único parceiro (e que tenham parceiro vinculado).');
            return;
        }
        const primeira = selecionadas[0];
        setPreset({
            duplicataIds: selecionadas.map(s => s.id),
            valorTotal: totalSelecionado,
            qtd: selecionadas.length,
            parceiroId: primeira.usuarioParceiroId,
            parceiroNome: primeira.parceiro,
        });
    }

    const columns = [
        { name: 'Duplicata', selector: (r: MensalidadeRepasse) => r.id, cell: (r: MensalidadeRepasse) => <b style={{ color: 'var(--main)' }}>#{r.id}</b>, sortable: true, width: '10%' },
        { name: 'Cliente', selector: (r: MensalidadeRepasse) => r.cliente || '', sortable: true, width: '24%' },
        {
            name: 'Parceiro', selector: (r: MensalidadeRepasse) => r.parceiro || '',
            cell: (r: MensalidadeRepasse) => r.parceiro || <i style={{ color: '#c00' }}>sem parceiro</i>,
            sortable: true, width: '20%',
        },
        { name: 'Valor total', selector: (r: MensalidadeRepasse) => r.valor, cell: (r: MensalidadeRepasse) => brl(r.valor), sortable: true },
        { name: 'Repasse', selector: (r: MensalidadeRepasse) => r.valorRepasse, cell: (r: MensalidadeRepasse) => <b style={{ color: '#1f9d5f' }}>{brl(r.valorRepasse)}</b>, sortable: true },
        {
            name: 'Vencimento', selector: (r: MensalidadeRepasse) => r.dataVencimento,
            cell: (r: MensalidadeRepasse) => <span>{dt(r.dataVencimento)} {r.isPago ? <Badge bg="primary">Pago</Badge> : <Badge bg="success">Em aberto</Badge>}</span>,
            sortable: true,
        },
    ];

    return (
        <div>
            <div className={styles.filterCard}>
                <div className={styles.filterField}>
                    <label>Parceiro</label>
                    <Form.Select value={parceiroId} onChange={(e) => setParceiroId(e.target.value)}>
                        <option value="">Todos</option>
                        {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </Form.Select>
                </div>
                <div className={styles.filterField} style={{ flex: 1, minWidth: 200 }}>
                    <label>Buscar</label>
                    <input placeholder="Cliente, parceiro ou nº..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <CustomButton typeButton={'dark'} onClick={load}>Pesquisar</CustomButton>
            </div>

            <div className={styles.tiles}>
                <StatTile label="Mensalidades a repassar" value={String(resumo?.total ?? 0)} accent={'#3b82f6'} />
                <StatTile label="Total a repassar" value={brl(resumo?.totalRepasse ?? 0)} accent={'#1f9d5f'} />
                <StatTile label="Parceiros" value={String(resumo?.parceiros ?? 0)} accent={'#8b5cf6'} hint="com repasse pendente" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '10px 0', flexWrap: 'wrap' }}>
                <CustomButton typeButton={'success'} onClick={gerar} disabled={!podeGerar}>
                    Gerar pagamento
                </CustomButton>
                {selecionadas.length > 0 && (
                    <span style={{ fontSize: 14, color: '#555' }}>
                        {selecionadas.length} selecionada(s) · <b style={{ color: '#1f9d5f' }}>{brl(totalSelecionado)}</b>
                        {!podeGerar && <span style={{ color: '#c00', marginLeft: 8 }}>selecione um único parceiro</span>}
                    </span>
                )}
            </div>

            <CustomTable
                key={tableKey}
                columns={columns}
                data={filtradas}
                loading={loading}
                selectable
                handleChangeSelected={(s: any) => setSelecionadas(s.selectedRows || [])}
            />

            {preset && (
                <PagamentoParceiroForm
                    isOpen={!!preset}
                    preset={preset}
                    setClose={(refresh) => {
                        setPreset(null);
                        if (refresh) load();
                    }}
                />
            )}
        </div>
    );
}
