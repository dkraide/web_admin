import { useEffect, useState } from 'react';
import { Badge, Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import CustomTable from '@/components/ui/CustomTable';
import CustomButton from '@/components/ui/Buttons';
import { ChamadoParceiro, ChamadosResumo, getChamadosParceiro } from '@/services/apiParceiro';
import { Donut } from '../Financeiro/charts';
import styles from '../Financeiro/styles.module.scss';

const dt = (v: string) => (v && new Date(v).getFullYear() > 1 ? format(new Date(v), 'dd/MM/yyyy HH:mm') : '-');

const STATUS_META: Record<string, { label: string; color: string; badge: string }> = {
    Aberto: { label: 'Aberto', color: '#3b82f6', badge: 'primary' },
    EmAndamento: { label: 'Em andamento', color: '#d97706', badge: 'warning' },
    AguardandoCliente: { label: 'Aguardando cliente', color: '#8b5cf6', badge: 'info' },
    Resolvido: { label: 'Resolvido', color: '#1f9d5f', badge: 'success' },
    Fechado: { label: 'Fechado', color: '#6b7280', badge: 'secondary' },
};

const ACCENT = { blue: '#3b82f6', amber: '#d97706', green: '#1f9d5f', gray: '#6b7280' };

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

export default function TabChamados() {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [busca, setBusca] = useState('');
    const [resumo, setResumo] = useState<ChamadosResumo | null>(null);
    const [itens, setItens] = useState<ChamadoParceiro[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getChamadosParceiro(status);
            setResumo(res.resumo);
            setItens(res.itens || []);
        } catch (err: any) {
            toast.error(`Erro ao carregar chamados. ${err.response?.data || err.message}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtrados = itens.filter(c =>
        `${c.empresa || ''}${c.title}${c.employerName}${c.id}`.toLowerCase().includes(busca.toLowerCase()));

    const donutData = [
        { label: 'Aberto', value: resumo?.aberto ?? 0, color: STATUS_META.Aberto.color },
        { label: 'Em andamento', value: resumo?.emAndamento ?? 0, color: STATUS_META.EmAndamento.color },
        { label: 'Aguardando', value: resumo?.aguardandoCliente ?? 0, color: STATUS_META.AguardandoCliente.color },
        { label: 'Resolvido', value: resumo?.resolvidos ?? 0, color: STATUS_META.Resolvido.color },
        { label: 'Fechado', value: resumo?.fechados ?? 0, color: STATUS_META.Fechado.color },
    ];

    const columns = [
        {
            name: 'Empresa', selector: (r: ChamadoParceiro) => r.empresa || '',
            cell: (r: ChamadoParceiro) => <span>{r.empresa || <i style={{ color: '#bbb' }}>#{r.empresaId}</i>}</span>,
            sortable: true, width: '20%',
        },
        { name: 'Título', selector: (r: ChamadoParceiro) => r.title, sortable: true, width: '30%' },
        {
            name: 'Status', selector: (r: ChamadoParceiro) => r.status,
            cell: (r: ChamadoParceiro) => {
                const m = STATUS_META[r.status] || { label: r.status, badge: 'dark' };
                return <Badge bg={m.badge}>{m.label}</Badge>;
            },
            sortable: true,
        },
        { name: 'Interações', selector: (r: ChamadoParceiro) => r.totalEvents, cell: (r: ChamadoParceiro) => <b>{r.totalEvents}</b>, sortable: true, width: '10%' },
        { name: 'Aberto em', selector: (r: ChamadoParceiro) => r.createdAt, cell: (r: ChamadoParceiro) => dt(r.createdAt), sortable: true },
        { name: 'Atualizado', selector: (r: ChamadoParceiro) => r.lastUpdated, cell: (r: ChamadoParceiro) => dt(r.lastUpdated), sortable: true },
    ];

    return (
        <div>
            <div className={styles.filterCard}>
                <div className={styles.filterField}>
                    <label>Status</label>
                    <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Todos</option>
                        <option value="Aberto">Aberto</option>
                        <option value="EmAndamento">Em andamento</option>
                        <option value="AguardandoCliente">Aguardando cliente</option>
                        <option value="Resolvido">Resolvido</option>
                        <option value="Fechado">Fechado</option>
                    </Form.Select>
                </div>
                <div className={styles.filterField} style={{ flex: 1, minWidth: 200 }}>
                    <label>Buscar</label>
                    <input placeholder="Empresa, título ou contato..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <CustomButton typeButton={'dark'} onClick={load}>Pesquisar</CustomButton>
            </div>

            <div className={styles.tiles}>
                <StatTile label="Total de chamados" value={String(resumo?.total ?? 0)} accent={ACCENT.blue} />
                <StatTile label="Em aberto" value={String(resumo?.abertos ?? 0)} accent={ACCENT.amber} hint="aguardando resolução" />
                <StatTile label="Resolvidos" value={String(resumo?.resolvidos ?? 0)} accent={ACCENT.green} />
                <StatTile label="Fechados" value={String(resumo?.fechados ?? 0)} accent={ACCENT.gray} />
            </div>

            <div className={styles.charts}>
                <div className={styles.chartPanel}>
                    <h6>Chamados por status</h6>
                    <Donut data={donutData} centerLabel="chamados" />
                </div>
                <div className={styles.chartPanel}>
                    <h6>Como acompanhar</h6>
                    <p style={{ color: '#777', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                        Aqui você vê todo o suporte prestado às suas empresas. Use o filtro de status para
                        focar no que está <b>em aberto</b> e a coluna <b>Interações</b> para saber quais chamados
                        tiveram mais idas e vindas. A coluna <b>Atualizado</b> mostra o último movimento de cada chamado.
                    </p>
                </div>
            </div>

            <CustomTable columns={columns} data={filtrados} loading={loading} />
        </div>
    );
}
