import { useState } from 'react';

export interface Slice {
    label: string;
    value: number;
    color: string;
}

/**
 * Donut de contagem por status. Cada fatia sempre acompanha rotulo na legenda
 * (codificacao secundaria), entao a identidade nunca depende so da cor.
 */
export function Donut({ data, size = 170, stroke = 22, centerLabel }: {
    data: Slice[];
    size?: number;
    stroke?: number;
    centerLabel?: string;
}) {
    const [hover, setHover] = useState<number | null>(null);
    const total = data.reduce((s, d) => s + d.value, 0);
    const r = (size - stroke) / 2;
    const cx = size / 2;
    const c = 2 * Math.PI * r;
    const gap = total > 0 ? 6 : 0; // 2px+ de respiro entre fatias
    let acc = 0;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cx} r={r} fill="none" stroke="#eef0f2" strokeWidth={stroke} />
                {total > 0 && data.map((d, i) => {
                    const frac = d.value / total;
                    const len = frac * c;
                    const dash = Math.max(len - gap, 0.001);
                    const el = (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cx}
                            r={r}
                            fill="none"
                            stroke={d.color}
                            strokeWidth={hover === i ? stroke + 4 : stroke}
                            strokeDasharray={`${dash} ${c - dash}`}
                            strokeDashoffset={-acc}
                            strokeLinecap="butt"
                            transform={`rotate(-90 ${cx} ${cx})`}
                            style={{ transition: 'stroke-width .12s', cursor: 'default' }}
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(null)}
                        />
                    );
                    acc += len;
                    return el;
                })}
                <text x={cx} y={cx - 4} textAnchor="middle" fontSize={26} fontWeight={700} fill="#333">
                    {hover !== null ? data[hover].value : total}
                </text>
                <text x={cx} y={cx + 16} textAnchor="middle" fontSize={12} fill="#999">
                    {hover !== null ? data[hover].label : (centerLabel || 'total')}
                </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.map((d, i) => (
                    <div
                        key={i}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: hover === null || hover === i ? 1 : 0.5 }}
                    >
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ color: '#555', minWidth: 90 }}>{d.label}</span>
                        <b style={{ color: '#333' }}>{d.value}</b>
                        <span style={{ color: '#aaa', fontSize: 12 }}>
                            {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export interface BarItem {
    label: string;
    value: number;
}

/**
 * Lista de barras horizontais (magnitude, serie unica). Rotulo de valor direto
 * em cada barra — sem legenda, o titulo do bloco nomeia a serie.
 */
export function BarList({ data, color = '#fc4f6b', format }: {
    data: BarItem[];
    color?: string;
    format: (n: number) => string;
}) {
    const max = Math.max(...data.map(d => d.value), 1);
    if (data.length === 0) {
        return <div style={{ color: '#aaa', fontSize: 13, padding: '20px 0' }}>Sem dados no período.</div>;
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.map((d, i) => (
                <div key={i} title={`${d.label}: ${format(d.value)}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                        <span style={{ color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{d.label}</span>
                        <b style={{ color: '#333' }}>{format(d.value)}</b>
                    </div>
                    <div style={{ background: '#eef0f2', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${(d.value / max) * 100}%`, background: color, height: '100%', borderRadius: 6, transition: 'width .3s' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
