import { format } from 'date-fns';

export function formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) return '0 B';
    const un = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), un.length - 1);
    const v = bytes / Math.pow(1024, i);
    return `${v.toFixed(i === 0 ? 0 : v >= 100 ? 0 : 1)} ${un[i]}`;
}

export function formatDuracao(seg: number | null): string {
    if (seg === null || !isFinite(seg)) return '--';
    const s = Math.round(seg);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}min ${s % 60}s`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
}

export const dataHora = (v: string | null) =>
    v && new Date(v).getFullYear() > 1 ? format(new Date(v), 'dd/MM/yyyy HH:mm') : '-';
