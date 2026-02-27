'use client';

import { useState, useEffect, useContext } from 'react';
import {
  Container, Card, Row, Col, Form, FloatingLabel,
  Button, Spinner, Alert, Badge,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import {
  getPesquisaItens,
  getPesquisaById,
  createPesquisa,
  updatePesquisa,
  type PesquisaItemDto,
  type PesquisaSatisfacaoCreateDto,
} from '@/services/pesquisaSatisfacaoApi';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import { fGetNumber } from '@/utils/functions';
import { AuthContext } from '@/contexts/AuthContext';

// ── adapte para seu contexto de auth / lista real ──
const USUARIOS = [
  { id: 'ana.silva',    nome: 'Ana Silva' },
  { id: 'carlos.souza', nome: 'Carlos Souza' },
];
const EMPRESAS = [
  { id: 1, nome: 'Mercadinho do João' },
  { id: 2, nome: 'Padaria Central' },
  { id: 3, nome: 'Farmácia Popular' },
];

// ── helpers de cor ──
const getCor = (nota: number) => {
  if (nota <= 3) return 'danger';
  if (nota <= 6) return 'warning';
  if (nota <= 8) return 'info';
  return 'success';
};
const getLabel = (nota: number) => {
  if (nota <= 3) return 'Ruim';
  if (nota <= 6) return 'Regular';
  if (nota <= 8) return 'Bom';
  return 'Excelente';
};

interface FormState {
  horarioRealizado: string;
  usuarioId: string;
  empresaId: string;
  feedbackMelhoria: string;
  feedbackCritica: string;
  feedbackElogio: string;
}

const emptyForm: FormState = {
  horarioRealizado: '',
  usuarioId: '',
  empresaId: '',
  feedbackMelhoria: '',
  feedbackCritica: '',
  feedbackElogio: '',
};

export default function PesquisaSatisfacaoFormPage() {
  const router  = useRouter();
  const { id }  = router.query;               // undefined = novo | string = editar
  const isEdit  = !!id;

  const [form, setForm]         = useState<FormState>(emptyForm);
  const [notas, setNotas]       = useState<Record<number, number>>({});
  const [itens, setItens]       = useState<PesquisaItemDto[]>([]);
  const [loadItens, setLoadItens] = useState(true);
  const [loadData, setLoadData]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const {user} = useContext(AuthContext);

  // Carrega itens dinâmicos
  useEffect(() => {
    getPesquisaItens(true)
      .then((data) => {
        setItens(data);
        const init: Record<number, number> = {};
        data.forEach((i) => { init[i.id] = 5; });
        setNotas(init);
      })
      .finally(() => setLoadItens(false));
  }, []);

  // Carrega dados ao editar
  useEffect(() => {
    if (!id) return;
    setLoadData(true);
    getPesquisaById(Number(id))
      .then((pesquisa) => {
        const dt = new Date(pesquisa.horarioRealizado);
        const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16);

        setForm({
          horarioRealizado: local,
          usuarioId:        pesquisa.usuarioId,
          empresaId:        String(pesquisa.empresaId),
          feedbackMelhoria: pesquisa.feedbackMelhoria ?? '',
          feedbackCritica:  pesquisa.feedbackCritica  ?? '',
          feedbackElogio:   pesquisa.feedbackElogio   ?? '',
        });

        const notasEdit: Record<number, number> = {};
        pesquisa.itens.forEach((i) => { notasEdit[i.pesquisaItemId] = i.nota; });
        setNotas((prev) => ({ ...prev, ...notasEdit }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadData(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNota = (itemId: number, valor: number) => {
    setNotas((prev) => ({ ...prev, [itemId]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;

    if (!formEl.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    const payload: PesquisaSatisfacaoCreateDto = {
      horarioRealizado: new Date(form.horarioRealizado).toISOString(),
      usuarioId:        user.id ?? 'asdasdasdadadads',
      empresaId:        Number(form.empresaId),
      feedbackMelhoria: form.feedbackMelhoria || null,
      feedbackCritica:  form.feedbackCritica  || null,
      feedbackElogio:   form.feedbackElogio   || null,
      itens: itens.map((item) => ({
        pesquisaItemId: item.id,
        nota:           notas[item.id] ?? 5,
      })),
    };

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updatePesquisa(Number(id), payload);
      } else {
        await createPesquisa(payload);
      }
      router.push('/pesquisa-satisfacao');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadItens || loadData) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-2 text-muted">Carregando…</p>
    </div>
  );

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <h4 className="fw-bold mb-4">
        {isEdit ? `✏️ Editar Pesquisa #${id}` : '📝 Nova Pesquisa de Satisfação'}
      </h4>

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
              </Col>

              <Col md={4}>
                   <SelectEmpresa selected={fGetNumber(form.empresaId ?? 0)} setSelected={(res) => {
                       handleChange({
                        target: {
                          name: 'empresaId',
                          value: res.toString()
                        }
                       })

                   }}/>
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
              {itens.map((item) => {
                const nota = notas[item.id] ?? 5;
                const cor  = getCor(nota);
                return (
                  <Col md={6} key={item.id}>
                    <div className="mb-3 p-3 border rounded bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <Form.Label className="mb-0 fw-semibold">{item.nome}</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg={cor} style={{ fontSize: '1rem', minWidth: 36, textAlign: 'center' }}>
                            {nota}
                          </Badge>
                          <small className={`text-${cor}`}>{getLabel(nota)}</small>
                        </div>
                      </div>
                      <Form.Range
                        min={0} max={10} step={1}
                        value={nota}
                        onChange={(e) => handleNota(item.id, Number(e.target.value))}
                      />
                      <div className="d-flex justify-content-between">
                        <small className="text-muted">0 — Péssimo</small>
                        <small className="text-muted">10 — Ótimo</small>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card.Body>
        </Card>

        {/* ── Feedbacks ── */}
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-primary text-white fw-bold">Feedbacks</Card.Header>
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
          <Button
            variant="outline-secondary"
            type="button"
            onClick={() => router.push('/pesquisa-satisfacao')}
          >
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving
              ? <><Spinner size="sm" className="me-1" /> Salvando…</>
              : isEdit ? 'Salvar Alterações' : 'Salvar Pesquisa'
            }
          </Button>
        </div>
      </Form>
    </Container>
  );
}