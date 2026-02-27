// components/pesquisa/PesquisaSatisfacaoForm.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  Form, Button, Card, Row, Col, Alert, Spinner, FloatingLabel
} from 'react-bootstrap';
import NotaSlider from './NotaSlider';
import { getPesquisaItens } from '@/services/pesquisaSatisfacaoApi';

const emptyForm = {
  horarioRealizado: '',
  usuarioId: '',
  empresaId: '',
  feedbackMelhoria: '',
  feedbackCritica: '',
  feedbackElogio: '',
};

/**
 * Props:
 *  - initialData: PesquisaSatisfacaoDto (edição) | null (criação)
 *  - onSubmit(payload): função chamada ao salvar
 *  - loading: bool
 *  - error: string | null
 *  - usuarios: [{ id, nome }]  – lista para select
 *  - empresas: [{ id, nome }]  – lista para select
 */
export default function PesquisaSatisfacaoForm({
  initialData = null,
  onSubmit,
  loading = false,
  error = null,
  usuarios = [],
  empresas = [],
}) {
  const [form, setForm]       = useState(emptyForm);
  const [notas, setNotas]     = useState({});   // { [pesquisaItemId]: nota }
  const [itens, setItens]     = useState([]);   // PesquisaItemDto[]
  const [loadItens, setLoadItens] = useState(true);
  const [validated, setValidated] = useState(false);

  // Carrega itens dinâmicos
  useEffect(() => {
    getPesquisaItens(true)
      .then((data) => {
        setItens(data);
        // Inicializa notas com 5 (neutro)
        const notasInit = {};
        data.forEach((i) => { notasInit[i.id] = 5; });
        setNotas(notasInit);
      })
      .finally(() => setLoadItens(false));
  }, []);

  // Preenche form quando em modo edição
  useEffect(() => {
    if (!initialData) return;

    const dt = new Date(initialData.horarioRealizado);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setForm({
      horarioRealizado: local,
      usuarioId:        initialData.usuarioId ?? '',
      empresaId:        String(initialData.empresaId ?? ''),
      feedbackMelhoria: initialData.feedbackMelhoria ?? '',
      feedbackCritica:  initialData.feedbackCritica  ?? '',
      feedbackElogio:   initialData.feedbackElogio   ?? '',
    });

    if (initialData.itens) {
      const notasEdit = {};
      initialData.itens.forEach((i) => { notasEdit[i.pesquisaItemId] = i.nota; });
      setNotas((prev) => ({ ...prev, ...notasEdit }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNota = (itemId, valor) => {
    setNotas((prev) => ({ ...prev, [itemId]: valor }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;

    if (!formEl.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    const payload = {
      horarioRealizado: new Date(form.horarioRealizado).toISOString(),
      usuarioId:        form.usuarioId,
      empresaId:        Number(form.empresaId),
      feedbackMelhoria: form.feedbackMelhoria || null,
      feedbackCritica:  form.feedbackCritica  || null,
      feedbackElogio:   form.feedbackElogio   || null,
      itens: itens.map((item) => ({
        pesquisaItemId: item.id,
        nota:           notas[item.id] ?? 5,
      })),
    };

    onSubmit(payload);
  };

  if (loadItens) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Carregando itens de avaliação…</p>
      </div>
    );
  }

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}

      {/* ── Cabeçalho ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white fw-bold">
          Informações da Visita
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <FloatingLabel label="Data / Hora da visita *">
                <Form.Control
                  type="datetime-local"
                  name="horarioRealizado"
                  value={form.horarioRealizado}
                  onChange={handleChange}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Informe a data e hora.
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>

            <Col md={4}>
              <FloatingLabel label="Atendente *">
                <Form.Select
                  name="usuarioId"
                  value={form.usuarioId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione…</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Selecione o atendente.
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>

            <Col md={4}>
              <FloatingLabel label="Empresa *">
                <Form.Select
                  name="empresaId"
                  value={form.empresaId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione…</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Selecione a empresa.
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Avaliações ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white fw-bold">
          Avaliações (0 — Péssimo / 10 — Ótimo)
        </Card.Header>
        <Card.Body>
          <Row>
            {itens.map((item) => (
              <Col md={6} key={item.id}>
                <NotaSlider
                  itemId={item.id}
                  nome={item.nome}
                  nota={notas[item.id] ?? 5}
                  onChange={handleNota}
                />
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* ── Feedbacks ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white fw-bold">
          Feedbacks
        </Card.Header>
        <Card.Body className="d-flex flex-column gap-3">
          <FloatingLabel label="💡 Sugestões de melhoria">
            <Form.Control
              as="textarea"
              name="feedbackMelhoria"
              value={form.feedbackMelhoria}
              onChange={handleChange}
              placeholder="Sugestões de melhoria"
              style={{ height: 100 }}
            />
          </FloatingLabel>

          <FloatingLabel label="❌ Críticas">
            <Form.Control
              as="textarea"
              name="feedbackCritica"
              value={form.feedbackCritica}
              onChange={handleChange}
              placeholder="Críticas"
              style={{ height: 100 }}
            />
          </FloatingLabel>

          <FloatingLabel label="⭐ Elogios">
            <Form.Control
              as="textarea"
              name="feedbackElogio"
              value={form.feedbackElogio}
              onChange={handleChange}
              placeholder="Elogios"
              style={{ height: 100 }}
            />
          </FloatingLabel>
        </Card.Body>
      </Card>

      {/* ── Ações ── */}
      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-secondary" type="button" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading
            ? <><Spinner size="sm" className="me-1" /> Salvando…</>
            : 'Salvar Pesquisa'
          }
        </Button>
      </div>
    </Form>
  );
}