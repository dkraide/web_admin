// components/pesquisa/NotaSlider.jsx
// Componente reutilizável para nota 0-10 com visual colorido

import { Form, Badge } from 'react-bootstrap';

const getCor = (nota) => {
  if (nota <= 3) return 'danger';
  if (nota <= 6) return 'warning';
  if (nota <= 8) return 'info';
  return 'success';
};

const getLabel = (nota) => {
  if (nota <= 3) return 'Ruim';
  if (nota <= 6) return 'Regular';
  if (nota <= 8) return 'Bom';
  return 'Excelente';
};

export default function NotaSlider({ itemId, nome, nota, onChange, disabled = false }) {
  const cor = getCor(nota);

  return (
    <div className="mb-3 p-3 border rounded bg-light">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <Form.Label className="mb-0 fw-semibold">{nome}</Form.Label>
        <div className="d-flex align-items-center gap-2">
          <Badge bg={cor} style={{ fontSize: '1rem', minWidth: 36, textAlign: 'center' }}>
            {nota}
          </Badge>
          <small className={`text-${cor}`}>{getLabel(nota)}</small>
        </div>
      </div>
      <Form.Range
        min={0}
        max={10}
        step={1}
        value={nota}
        disabled={disabled}
        onChange={(e) => onChange(itemId, Number(e.target.value))}
        className={`accent-${cor}`}
      />
      <div className="d-flex justify-content-between">
        <small className="text-muted">0 — Péssimo</small>
        <small className="text-muted">10 — Ótimo</small>
      </div>
    </div>
  );
}