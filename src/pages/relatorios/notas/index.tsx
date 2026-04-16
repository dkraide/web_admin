import styles from './styles.module.scss';
import { useEffect, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { api } from '@/services/apiClient';
import IDuplicata from '@/interfaces/IDuplicata';
import { exportNotasToExcel } from '@/utils/exportNotasExcel';
import { printNotasFiscais } from '@/utils/printNotas';
import { canSSRAuth } from '@/utils/CanSSRAuth';

type Search = {
  dataIn: string;
  dataFim: string;
  statusNFse: string;
};

export default function Notas() {
  const [entradas, setEntradas] = useState<IDuplicata[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState<Search>({
    dataIn: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dataFim: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    statusNFse: '1',
  });

  useEffect(() => {
    loadDatas();
  }, []);

  const loadDatas = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<IDuplicata[]>(
        `/financeiro/notas?dataIn=${search.dataIn}&dataFim=${search.dataFim}&statusNFse=${search.statusNFse}`
      );
      setEntradas(data || []);
    } catch {
      setEntradas([]);
    }
    setLoading(false);
  };

  // ── Derived stats ──────────────────────────────────────────────
  const normais    = entradas.filter(e => e.statusNFSE?.toUpperCase() !== 'CANCELADA');
  const canceladas = entradas.filter(e => e.statusNFSE?.toUpperCase() === 'CANCELADA');
  const totalNF    = normais.reduce((s, e) => s + (e.valor || 0), 0);
  const totalISS   = normais.reduce((s, e) => s + (e.valor || 0) * 0.05, 0);

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ── Handlers ──────────────────────────────────────────────────
  const handleExcel = () => exportNotasToExcel(entradas, search.dataIn, search.dataFim);
  const handlePrint = () => printNotasFiscais(entradas, search.dataIn, search.dataFim);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>NFS-e Emitidas</h1>
          <span>Relatório de Notas Fiscais de Serviço</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Data Inicial</label>
          <input
            type="date"
            value={search.dataIn}
            onChange={e => setSearch(s => ({ ...s, dataIn: e.target.value }))}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Data Final</label>
          <input
            type="date"
            value={search.dataFim}
            onChange={e => setSearch(s => ({ ...s, dataFim: e.target.value }))}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Status</label>
          <select
            value={search.statusNFse}
            onChange={e => setSearch(s => ({ ...s, statusNFse: e.target.value }))}
          >
            <option value="0">Todas</option>
            <option value="1">Emitidas</option>
            <option value="2">Não emitidas</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnSearch} onClick={loadDatas} disabled={loading}>
            {loading ? '⏳ Buscando...' : '🔍 Buscar'}
          </button>

          <button
            className={styles.btnExcel}
            onClick={handleExcel}
            disabled={entradas.length === 0}
            title="Exportar para Excel"
          >
            📊 Excel
          </button>

          <button
            className={styles.btnPrint}
            onClick={handlePrint}
            disabled={entradas.length === 0}
            title="Imprimir / Gerar PDF"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Stats */}
      {entradas.length > 0 && (
        <div className={styles.stats}>
          <div className={`${styles.statCard} ${styles.blue}`}>
            <div className={styles.statLabel}>Total de Notas</div>
            <div className={styles.statValue}>{entradas.length}</div>
            <div className={styles.statSub}>emitidas no período</div>
          </div>

          <div className={`${styles.statCard} ${styles.green}`}>
            <div className={styles.statLabel}>Valor Total NF</div>
            <div className={styles.statValue}>{fmt(totalNF)}</div>
            <div className={styles.statSub}>{normais.length} notas normais</div>
          </div>

          <div className={`${styles.statCard} ${styles.purple}`}>
            <div className={styles.statLabel}>ISSQN Total</div>
            <div className={styles.statValue}>{fmt(totalISS)}</div>
            <div className={styles.statSub}>alíquota 5%</div>
          </div>

          <div className={`${styles.statCard} ${styles.red}`}>
            <div className={styles.statLabel}>Canceladas</div>
            <div className={styles.statValue}>{canceladas.length}</div>
            <div className={styles.statSub}>
              {fmt(canceladas.reduce((s, e) => s + (e.valor || 0), 0))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableScroll}>
          {loading ? (
            <div className={styles.loading}>Carregando notas fiscais...</div>
          ) : entradas.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Nenhuma nota encontrada</p>
              <p>Ajuste os filtros e clique em Buscar.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nº NFS-e</th>
                  <th>Dt. Emissão</th>
                  <th>Nº RPS</th>
                  <th>Série</th>
                  <th>Chave da Nota</th>
                  <th style={{ textAlign: 'right' }}>Vl. NF</th>
                  <th style={{ textAlign: 'right' }}>Vl. Ded.</th>
                  <th style={{ textAlign: 'right' }}>Base Cálc.</th>
                  <th style={{ textAlign: 'right' }}>ISSQN</th>
                  <th>Retido</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map(nota => {
                  const isCancelada = nota.statusNFSE?.toUpperCase() === 'CANCELADA';
                  const base = nota.valor || 0;
                  const iss = base * 0.05;

                  return (
                    <tr key={nota.id} className={isCancelada ? styles.rowCancelada : ''}>
                      <td><strong>{nota.numeroNFSE || '—'}</strong></td>
                      <td>
                        {nota.dataEmissao
                          ? format(new Date(nota.dataEmissao), 'dd/MM/yyyy')
                          : '—'}
                      </td>
                      <td>{nota.numeroRPS || '—'}</td>
                      <td>{nota.serieNFSE || '—'}</td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {nota.chaveNFSE || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>{fmt(base)}</td>
                      <td style={{ textAlign: 'right' }}>R$ 0,00</td>
                      <td style={{ textAlign: 'right' }}>{fmt(base)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(iss)}</td>
                      <td>NÃO</td>
                      <td>
                        <span className={`${styles.badge} ${isCancelada ? styles.badgeCancelada : styles.badgeNormal}`}>
                          {isCancelada ? 'Cancelada' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {entradas.length > 0 && (
          <div className={styles.tableFooter}>
            <span>
              <strong>{entradas.length}</strong> notas — período{' '}
              {format(new Date(search.dataIn + 'T00:00:00'), 'dd/MM/yyyy')} a{' '}
              {format(new Date(search.dataFim + 'T00:00:00'), 'dd/MM/yyyy')}
            </span>
            <span>
              Total: <strong>{fmt(totalNF)}</strong> · ISSQN:{' '}
              <strong>{fmt(totalISS)}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps = canSSRAuth(['ADMINISTRADOR']);