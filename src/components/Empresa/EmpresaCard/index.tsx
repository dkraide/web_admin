import { Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import IEmpresa from '@/interfaces/IEmpresa';
import styles from './styles.module.scss';

const brl = (n: number) => (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (v?: Date | string) => {
    if (!v) return '-';
    const d = new Date(v);
    return d.getFullYear() > 1 ? format(d, 'dd/MM/yyyy') : '-';
};

export type ToggleTipo = 'status' | 'geraboleto' | 'geranfse' | 'enviaemail' | 'enviasms';

interface Props {
    empresa: IEmpresa;
    onEdit: (id: number) => void;
    onToggle: (empresa: IEmpresa, tipo: ToggleTipo) => void;
}

function Field({ label, value, strong, color }: { label: string; value: React.ReactNode; strong?: boolean; color?: string }) {
    return (
        <div className={styles.field}>
            <span className={styles.fLabel}>{label}</span>
            <span className={styles.fValue} style={{ fontWeight: strong ? 700 : 500, color }}>{value}</span>
        </div>
    );
}

export default function EmpresaCard({ empresa, onEdit, onToggle }: Props) {
    const repasse = Math.max((empresa.valorMensal || 0) - (empresa.valorKrd || 0), 0);

    const switches: { label: string; tipo: ToggleTipo; on: boolean }[] = [
        { label: 'Gera boleto', tipo: 'geraboleto', on: empresa.geraBoleto },
        { label: 'Gera NFSe', tipo: 'geranfse', on: empresa.geraNfse },
        { label: 'Envia e-mail', tipo: 'enviaemail', on: empresa.enviaEmail },
        { label: 'Envia SMS', tipo: 'enviasms', on: empresa.enviaSms },
    ];

    return (
        <div className={styles.card}>
            {/* Coluna 1 — Ações */}
            <div className={`${styles.col} ${styles.actions}`}>
                <span className={styles.id}>#{empresa.id}</span>
                <button className={styles.editBtn} onClick={() => onEdit(empresa.id)}>
                    <FontAwesomeIcon icon={faPen} /> Editar
                </button>
                <button
                    className={`${styles.statusBtn} ${empresa.statusPagamento ? styles.ativo : styles.bloqueado}`}
                    onClick={() => onToggle(empresa, 'status')}
                >
                    <FontAwesomeIcon icon={empresa.statusPagamento ? faLockOpen : faLock} />{' '}
                    {empresa.statusPagamento ? 'Ativo' : 'Bloqueado'}
                </button>
            </div>

            {/* Coluna 2 — Dados da empresa */}
            <div className={styles.col}>
                <div className={styles.colTitle}>Empresa</div>
                <div className={styles.nome}>{empresa.nomeFantasia}</div>
                <div className={styles.sub}>{empresa.cnpj || 'sem CNPJ'}</div>
                <Field label="Telefone" value={empresa.telefone || '-'} />
                <Field label="Usuário" value={empresa.usuarioDono || '-'} />
                <Field label="Supervisor" value={empresa.usuarioSupervisor || <i style={{ color: '#c00' }}>sem parceiro</i>} />
                <Field label="Versão" value={empresa.versao ?? '-'} />
            </div>

            {/* Coluna 3 — Dados de cobrança */}
            <div className={styles.col}>
                <div className={styles.colTitle}>Cobrança</div>
                <Field label="Criação" value={dt(empresa.dataCriacao)} />
                <Field label="Plano" value={<span className={styles.plano}>{empresa.plano || '-'}</span>} />
                <Field label="Início pagamento" value={dt(empresa.inicioPagamento)} />
                <Field label="Dia cobrança" value={empresa.diaCobranca || '-'} />
                <Field label="Valor mensal" value={brl(empresa.valorMensal)} strong />
                <Field label="Valor repasse" value={brl(repasse)} strong color="#1f9d5f" />
            </div>

            {/* Coluna 4 — Automações */}
            <div className={styles.col}>
                <div className={styles.colTitle}>Automações</div>
                {switches.map(s => (
                    <div key={s.tipo} className={styles.switchRow}>
                        <span>{s.label}</span>
                        <Form.Check
                            type="switch"
                            id={`sw-${empresa.id}-${s.tipo}`}
                            checked={s.on}
                            onChange={() => onToggle(empresa, s.tipo)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
