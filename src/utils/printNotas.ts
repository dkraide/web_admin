import IDuplicata from '@/interfaces/IDuplicata';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d: Date | string | undefined) => {
  if (!d) return '—';
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return '—'; }
};

export function printNotasFiscais(
  notas: IDuplicata[],
  dataIn: string,
  dataFim: string
) {
  const normais    = notas.filter(n => n.statusNFSE?.toUpperCase() !== 'CANCELADA');
  const canceladas = notas.filter(n => n.statusNFSE?.toUpperCase() === 'CANCELADA');
  const totalNF    = normais.reduce((s, n) => s + (n.valor || 0), 0);
  const totalISS   = normais.reduce((s, n) => s + (n.valor || 0) * 0.05, 0);
  const totalCanc  = canceladas.reduce((s, n) => s + (n.valor || 0), 0);
  const totalISSCanc = canceladas.reduce((s, n) => s + (n.valor || 0) * 0.05, 0);

  const periodoFmt = `${fmtDate(dataIn + 'T00:00:00')} até ${fmtDate(dataFim + 'T00:00:00')}`;
  const agora = format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });

  const buildRows = (lista: IDuplicata[]) =>
    lista
      .map(n => {
        const base = n.valor || 0;
        const iss  = base * 0.05;
        const isCancelada = n.statusNFSE?.toUpperCase() === 'CANCELADA';
        return `
          <tr class="${isCancelada ? 'row-cancel' : ''}">
            <td>${n.numeroNFSE || '—'}</td>
            <td>${fmtDate(n.dataEmissao)}</td>
            <td>1.05</td>
            <td>${n.chaveNFSE || '—'}</td>
            <td class="num">${fmt(base)}</td>
            <td class="num">R$ 0,00</td>
            <td class="num">${fmt(base)}</td>
            <td class="num">5,0000</td>
            <td class="num">${fmt(iss)}</td>
            <td>NÃO</td>
            <td>${isCancelada ? 'CANCELADA' : 'NORMAL'}</td>
            <td>PIRACICABA - SP</td>
          </tr>`;
      })
      .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>NFS-e Emitidas — ${periodoFmt}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 9pt;
      color: #111;
      background: #fff;
      padding: 12mm 10mm;
    }

    /* ── Header ── */
    .report-header {
      text-align: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #333;
    }
    .report-header h2 { font-size: 13pt; font-weight: 700; }
    .report-header p  { font-size: 9pt; color: #444; margin-top: 2px; }

    /* ── Meta info ── */
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #555;
      margin: 6px 0 10px;
      padding: 6px 8px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    /* ── Section title ── */
    .section-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 12px 0 4px;
      padding: 4px 0 4px 8px;
      border-left: 3px solid #333;
      background: #f9f9f9;
    }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }

    thead th {
      background: #222;
      color: #fff;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 5px;
      text-align: left;
      white-space: nowrap;
    }

    tbody tr:nth-child(even) { background: #f8f8f8; }
    tbody tr:hover            { background: #eef4ff; }

    tbody td {
      padding: 3px 5px;
      border-bottom: 1px solid #e8e8e8;
      font-size: 7.5pt;
    }

    .num  { text-align: right; font-variant-numeric: tabular-nums; }
    .row-cancel td { color: #999; text-decoration: line-through; }

    /* ── Totals ── */
    .totals-row td {
      font-weight: 700;
      background: #f0f0f0;
      border-top: 2px solid #333;
      font-size: 8pt;
    }

    /* ── Summary box ── */
    .summary {
      margin-top: 14px;
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: hidden;
    }
    .summary-title {
      background: #333;
      color: #fff;
      font-size: 9pt;
      font-weight: 700;
      padding: 5px 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
    }
    .summary-item {
      padding: 8px 12px;
      border-right: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
    }
    .summary-item:nth-child(4n) { border-right: none; }
    .summary-item .s-label {
      font-size: 7pt;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
    }
    .summary-item .s-value {
      font-size: 11pt;
      font-weight: 700;
      color: #111;
    }

    /* ── Footer ── */
    .report-footer {
      margin-top: 10px;
      font-size: 7pt;
      color: #888;
      text-align: center;
      border-top: 1px solid #ddd;
      padding-top: 6px;
    }

    @media print {
      body { padding: 8mm 8mm; }
      @page { size: A4 landscape; margin: 10mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Print button (hidden on print) -->
  <div class="no-print" style="
    text-align: right;
    margin-bottom: 10px;
  ">
    <button onclick="window.print()" style="
      background: #1d4ed8;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-right: 8px;
    ">🖨️ Imprimir / Salvar PDF</button>
    <button onclick="window.close()" style="
      background: #6b7280;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 14px;
      font-size: 13px;
      cursor: pointer;
    ">✕ Fechar</button>
  </div>

  <!-- Report Header -->
  <div class="report-header">
    <h2>PREFEITURA MUNICIPAL DE PIRACICABA</h2>
    <p>SECRETARIA MUNICIPAL DE FINANÇAS — GERÊNCIA DE ARRECADAÇÃO — DIVISÃO DE FISCALIZAÇÃO</p>
    <h2 style="margin-top:6px; font-size:14pt;">NFS-E EMITIDAS</h2>
  </div>

  <!-- Meta -->
  <div class="meta">
    <span><strong>Período:</strong> ${periodoFmt}</span>
    <span><strong>Total de notas emitidas:</strong> ${notas.length}</span>
    <span><strong>Impresso em:</strong> ${agora}</span>
  </div>

  <!-- OUTRAS FORMAS DE RECOLHIMENTO -->
  ${normais.length > 0 ? `
  <div class="section-title">Outras Formas de Recolhimento</div>
  <table>
    <thead>
      <tr>
        <th>Nº NFS-e</th>
        <th>Dt. Emissão</th>
        <th>Ativ.</th>
        <th>Chave da Nota</th>
        <th class="num">Vl. NF</th>
        <th class="num">Vl. Ded.</th>
        <th class="num">Vl. Base</th>
        <th class="num">Alíq</th>
        <th class="num">Vl. ISSQN</th>
        <th>Retido</th>
        <th>Status</th>
        <th>Local Recolhimento</th>
      </tr>
    </thead>
    <tbody>
      ${buildRows(normais)}
      <tr class="totals-row">
        <td colspan="4">Quantidade — Outras Formas de Recolhimento: <strong>${normais.length}</strong></td>
        <td class="num">${fmt(totalNF)}</td>
        <td class="num">R$ 0,00</td>
        <td class="num">${fmt(totalNF)}</td>
        <td></td>
        <td class="num">${fmt(totalISS)}</td>
        <td colspan="3"></td>
      </tr>
    </tbody>
  </table>
  ` : ''}

  <!-- CANCELADAS -->
  ${canceladas.length > 0 ? `
  <div class="section-title" style="border-left-color:#c00; margin-top:16px;">
    Notas Fiscais Canceladas
  </div>
  <table>
    <thead>
      <tr>
        <th>Nº NFS-e</th>
        <th>Dt. Emissão</th>
        <th>Ativ.</th>
        <th>Chave da Nota</th>
        <th class="num">Vl. NF</th>
        <th class="num">Vl. Ded.</th>
        <th class="num">Vl. Base</th>
        <th class="num">Alíq</th>
        <th class="num">Vl. ISSQN</th>
        <th>Retido</th>
        <th>Status</th>
        <th>Local Recolhimento</th>
      </tr>
    </thead>
    <tbody>
      ${buildRows(canceladas)}
      <tr class="totals-row">
        <td colspan="4">Quantidade — Canceladas: <strong>${canceladas.length}</strong></td>
        <td class="num">${fmt(totalCanc)}</td>
        <td class="num">R$ 0,00</td>
        <td class="num">${fmt(totalCanc)}</td>
        <td></td>
        <td class="num">${fmt(totalISSCanc)}</td>
        <td colspan="3"></td>
      </tr>
    </tbody>
  </table>
  ` : ''}

  <!-- Summary -->
  <div class="summary">
    <div class="summary-title">Resumo do Período</div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="s-label">Total de Notas Emitidas</div>
        <div class="s-value">${notas.length}</div>
      </div>
      <div class="summary-item">
        <div class="s-label">Valor Total Geral</div>
        <div class="s-value">${fmt(totalNF + totalCanc)}</div>
      </div>
      <div class="summary-item">
        <div class="s-label">ISSQN Total (normais)</div>
        <div class="s-value">${fmt(totalISS)}</div>
      </div>
      <div class="summary-item">
        <div class="s-label">Notas Canceladas</div>
        <div class="s-value">${canceladas.length}</div>
      </div>
    </div>
  </div>

  <div class="report-footer">
    Simpliss — REL_02_0030 — V.001 · Impresso em: ${agora} · Gerado automaticamente pelo sistema
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) {
    alert('Popup bloqueado! Permita popups para esta página e tente novamente.');
    return;
  }
  win.document.write(html);
  win.document.close();
  // Small delay so styles load before print dialog (optional auto-print)
  // win.onload = () => win.print();
}