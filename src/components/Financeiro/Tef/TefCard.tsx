import { CSSProperties, ReactNode } from 'react';
import { Form } from 'react-bootstrap';
import styles from './TefCard.module.scss';
import filtros from '../../Parceiros/Tabs/Financeiro/styles.module.scss';

export const cardStyles = styles;

/** Card no formato do EmpresaCard: uma coluna de ações e colunas de dados lado a lado. */
export function TefCard({ cols, children }: { cols?: string; children: ReactNode }) {
    const style = cols ? ({ '--tef-cols': cols } as CSSProperties) : undefined;
    return <div className={styles.card} style={style}>{children}</div>;
}

export function TefCol({ title, acoes, children }: { title?: string; acoes?: boolean; children: ReactNode }) {
    return (
        <div className={`${styles.col} ${acoes ? styles.actions : ''}`}>
            {title && <div className={styles.colTitle}>{title}</div>}
            {children}
        </div>
    );
}

export function TefField({ label, value, strong, color }: { label: string; value: ReactNode; strong?: boolean; color?: string }) {
    return (
        <div className={styles.field}>
            <span className={styles.fLabel}>{label}</span>
            <span className={styles.fValue} style={{ fontWeight: strong ? 700 : 500, color }}>{value}</span>
        </div>
    );
}

export type CorBotao = 'dark' | 'verde' | 'vermelho' | 'ambar' | 'cinza' | 'contorno';

export function TefBtn({ cor, onClick, children, disabled }: { cor: CorBotao; onClick: () => void; children: ReactNode; disabled?: boolean }) {
    return (
        <button className={`${styles.btn} ${styles[cor]}`} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
}

export function TefVazio({ children }: { children: ReactNode }) {
    return <div className={styles.vazio}>{children}</div>;
}

export interface OpcaoOrdem {
    value: string;
    label: string;
}

/** Mesma barra "Ordenar / Ordenar por / contagem" da lista de Empresas. */
export function OrdenarBar({
    opcoes, campo, setCampo, dir, setDir, total, rotulo, children,
}: {
    opcoes: OpcaoOrdem[];
    campo: string;
    setCampo: (v: string) => void;
    dir: 'asc' | 'desc';
    setDir: (v: 'asc' | 'desc') => void;
    total: number;
    rotulo: string;
    children?: ReactNode;
}) {
    return (
        <div className={filtros.filterCard}>
            <div className={filtros.filterField}>
                <label>Ordenar</label>
                <Form.Select value={campo} onChange={(e) => setCampo(e.target.value)}>
                    {opcoes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Form.Select>
            </div>
            <div className={filtros.filterField}>
                <label>Ordenar por</label>
                <Form.Select value={dir} onChange={(e) => setDir(e.target.value as 'asc' | 'desc')}>
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                </Form.Select>
            </div>
            <div className={filtros.filterField} style={{ flex: 1, alignItems: 'flex-end' }}>
                {children}
            </div>
            <div className={filtros.filterField} style={{ justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 13, color: '#888' }}>{total} {rotulo}</span>
            </div>
        </div>
    );
}

export function ordenar<T>(lista: T[], valor: (item: T) => number | string, dir: 'asc' | 'desc'): T[] {
    const sentido = dir === 'asc' ? 1 : -1;
    return [...lista].sort((a, b) => {
        const va = valor(a);
        const vb = valor(b);
        if (va < vb) return -1 * sentido;
        if (va > vb) return 1 * sentido;
        return 0;
    });
}
