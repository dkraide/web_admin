import Loading from "@/components/Loading";
import { useEffect, useMemo, useState, ReactNode } from "react";
import styles from "./styles.module.scss";

export interface CustomColumn {
  name: string;
  selector?: (row: any) => any;
  cell?: (row: any) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface props {
  columns: CustomColumn[];
  data: any[];
  loading?: boolean;
  selectable?: boolean;
  handleChangeSelected?: (data: { selectedRows: any[] }) => void;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function CustomTable({
  handleChangeSelected,
  selectable,
  loading,
  columns,
  data,
}: props) {
  const [sortIndex, setSortIndex] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<any>>(new Set());

  const rowKey = (row: any, index: number) =>
    row && row.id !== undefined && row.id !== null ? row.id : index;

  // Ordenacao
  const sortedData = useMemo(() => {
    if (sortIndex === null) return data;
    const col = columns[sortIndex];
    if (!col || !col.selector) return data;

    const copy = [...data];
    copy.sort((a, b) => {
      const va = col.selector!(a);
      const vb = col.selector!(b);

      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;

      if (typeof va === "number" && typeof vb === "number") {
        return sortAsc ? va - vb : vb - va;
      }

      const sa = String(va);
      const sb = String(vb);
      return sortAsc
        ? sa.localeCompare(sb, undefined, { numeric: true })
        : sb.localeCompare(sa, undefined, { numeric: true });
    });
    return copy;
  }, [data, columns, sortIndex, sortAsc]);

  // Paginacao
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    // Volta para a primeira pagina se os dados/filtros mudarem e a pagina atual ficar vazia.
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedData.slice(start, start + perPage);
  }, [sortedData, currentPage, perPage]);

  // Selecao
  useEffect(() => {
    if (!selectable || !handleChangeSelected) return;
    const selectedRows = data.filter((row, index) =>
      selectedKeys.has(rowKey(row, index))
    );
    handleChangeSelected({ selectedRows });
  }, [selectedKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (index: number) => {
    const col = columns[index];
    if (!col.sortable) return;
    if (sortIndex === index) {
      setSortAsc((v) => !v);
    } else {
      setSortIndex(index);
      setSortAsc(true);
    }
  };

  const toggleRow = (row: any, index: number) => {
    const key = rowKey(row, index);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allPageSelected =
    pageData.length > 0 &&
    pageData.every((row, i) =>
      selectedKeys.has(rowKey(row, (currentPage - 1) * perPage + i))
    );

  const toggleAllPage = () => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      pageData.forEach((row, i) => {
        const key = rowKey(row, (currentPage - 1) * perPage + i);
        if (allPageSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  if (loading) {
    return <Loading />;
  }

  const rangeStart = totalRows === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, totalRows);

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {selectable && (
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAllPage}
                  />
                </th>
              )}
              {columns.map((col, index) => (
                <th
                  key={`${col.name}-${index}`}
                  style={{ width: col.width }}
                  className={col.sortable ? styles.sortable : undefined}
                  onClick={() => handleSort(index)}
                >
                  {col.name}
                  {col.sortable && sortIndex === index && (
                    <span className={styles.sortIcon}>{sortAsc ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td
                  className={styles.empty}
                  colSpan={columns.length + (selectable ? 1 : 0)}
                >
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
            {pageData.map((row, i) => {
              const absoluteIndex = (currentPage - 1) * perPage + i;
              const key = rowKey(row, absoluteIndex);
              return (
                <tr key={key} className={styles.row}>
                  {selectable && (
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(key)}
                        onChange={() => toggleRow(row, absoluteIndex)}
                      />
                    </td>
                  )}
                  {columns.map((col, ci) => (
                    <td key={`${key}-${ci}`} className={styles.cell}>
                      {col.cell
                        ? col.cell(row)
                        : col.selector
                        ? col.selector(row)
                        : null}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div className={styles.perPage}>
          <span>Itens por Pagina</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            {PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <span className={styles.range}>
          {rangeStart} - {rangeEnd} de {totalRows}
        </span>

        <div className={styles.pageNav}>
          <button
            className={styles.pageButton}
            onClick={() => setPage(1)}
            disabled={currentPage <= 1}
            title="Primeira pagina"
          >
            «
          </button>
          <button
            className={styles.pageButton}
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Pagina anterior"
          >
            ‹
          </button>
          <span className={styles.range}>
            {currentPage} / {totalPages}
          </span>
          <button
            className={styles.pageButton}
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Proxima pagina"
          >
            ›
          </button>
          <button
            className={styles.pageButton}
            onClick={() => setPage(totalPages)}
            disabled={currentPage >= totalPages}
            title="Ultima pagina"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
