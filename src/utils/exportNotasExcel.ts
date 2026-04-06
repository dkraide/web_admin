/**
 * exportNotasExcel.ts
 * Exporta NFS-e para .xlsx usando a biblioteca SheetJS (xlsx).
 * Instale: npm install xlsx
 */
import IDuplicata from '@/interfaces/IDuplicata';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const fmtDate = (d: Date | string | undefined) => {
  if (!d) return '';
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return ''; }
};

const fmtMoney = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function exportNotasToExcel(
  notas: IDuplicata[],
  dataIn: string,
  dataFim: string
) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Todas as notas ────────────────────────────────────
  const headers = [
    'Nº NFS-e',
    'Dt. Emissão',
    'Nº RPS',
    'Série',
    'Chave da Nota',
    'Vl. NF (R$)',
    'Vl. Dedução (R$)',
    'Vl. Base Cálculo (R$)',
    'Alíquota (%)',
    'Vl. ISSQN (R$)',
    'Retido',
    'Status',
    'Local Recolhimento',
  ];

  const rows = notas.map(n => {
    const base = n.valor || 0;
    const iss  = base * 0.05;
    return [
      n.numeroNFSE   || '',
      fmtDate(n.dataEmissao),
      n.numeroRPS    || '',
      n.serieNFSE    || '',
      n.chaveNFSE    || '',
      fmtMoney(base),
      '0,00',
      fmtMoney(base),
      '5,0000',
      fmtMoney(iss),
      'NÃO',
      n.statusNFSE?.toUpperCase() === 'CANCELADA' ? 'CANCELADA' : 'NORMAL',
      'PIRACICABA - SP',
    ];
  });

  // Totals row
  const normais    = notas.filter(n => n.statusNFSE?.toUpperCase() !== 'CANCELADA');
  const canceladas = notas.filter(n => n.statusNFSE?.toUpperCase() === 'CANCELADA');
  const totalNF    = normais.reduce((s, n) => s + (n.valor || 0), 0);
  const totalISS   = normais.reduce((s, n) => s + (n.valor || 0) * 0.05, 0);

  const totalsRow = [
    `TOTAL: ${notas.length} notas`,
    '', '', '', '', '',
    fmtMoney(totalNF),
    '0,00',
    fmtMoney(totalNF),
    '',
    fmtMoney(totalISS),
    '', '', '',
  ];

  const wsData = [headers, ...rows, totalsRow];
  const ws     = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 8 },
    { wch: 36 }, { wch: 14 }, { wch: 14 },
    { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 8 },
    { wch: 12 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'NFS-e Emitidas');

  // ── Sheet 2: Resumo ──────────────────────────────────────────
  const periodoFmt = `${fmtDate(dataIn + 'T00:00:00')} a ${fmtDate(dataFim + 'T00:00:00')}`;
  const resumoData = [
    ['RESUMO — NFS-e EMITIDAS'],
    [`Período: ${periodoFmt}`],
    [''],
    ['Descrição', 'Qtd', 'Valor Total (R$)', 'ISSQN (R$)'],
    [
      'Notas Normais',
      normais.length,
      fmtMoney(totalNF),
      fmtMoney(totalISS),
    ],
    [
      'Notas Canceladas',
      canceladas.length,
      fmtMoney(canceladas.reduce((s, n) => s + (n.valor || 0), 0)),
      fmtMoney(canceladas.reduce((s, n) => s + (n.valor || 0) * 0.05, 0)),
    ],
    [
      'TOTAL GERAL',
      notas.length,
      fmtMoney(notas.reduce((s, n) => s + (n.valor || 0), 0)),
      fmtMoney(notas.reduce((s, n) => s + (n.valor || 0) * 0.05, 0)),
    ],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  wsResumo['!cols'] = [{ wch: 22 }, { wch: 8 }, { wch: 18 }, { wch: 14 }];

  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // ── Download ─────────────────────────────────────────────────
  const filename = `NFS-e_${dataIn}_${dataFim}.xlsx`;
  XLSX.writeFile(wb, filename);
}