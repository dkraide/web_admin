'use client';

import { useState, useEffect } from 'react';
import {
  Container, Card, Row, Col, Badge,
  Spinner, Alert, Button,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import {
  getPesquisaById,
  type PesquisaSatisfacaoDto,
} from '@/services/pesquisaSatisfacaoApi';

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

const fmtData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function PesquisaSatisfacaoViewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [pesquisa, setPesquisa] = useState<PesquisaSatisfacaoDto | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPesquisaById(Number(id))
      .then(setPesquisa)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error || !pesquisa) return (
    <Container className="py-4">
      <Alert variant="danger">{error ?? 'Pesquisa não encontrada.'}</Alert>
    </Container>
  );

  const media = pesquisa.itens.length
    ? pesquisa.itens.reduce((s, i) => s + i.nota, 0) / pesquisa.itens.length
    : 0;

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>

      {/* ── Topo ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">🔍 Pesquisa #{pesquisa.id}</h4>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary" size="sm"
            onClick={() => router.push(`/pesquisa-satisfacao/form?id=${pesquisa.id}`)}
          >
            Editar
          </Button>
          <Button
            variant="outline-secondary" size="sm"
            onClick={() => router.push('/pesquisa-satisfacao')}
          >
            Voltar
          </Button>
        </div>
      </div>

      {/* ── Informações ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white fw-bold">Informações</Card.Header>
        <Card.Body>
          <Row className="g-2">
            <Col md={4}>
              <small className="text-muted d-block">Data / Hora</small>
              <strong>{fmtData(pesquisa.horarioRealizado)}</strong>
            </Col>
            <Col md={4}>
              <small className="text-muted d-block">Atendente</small>
              <strong>{pesquisa.usuarioId}</strong>
            </Col>
            <Col md={4}>
              <small className="text-muted d-block">Empresa</small>
              <strong>#{pesquisa.empresaId}</strong>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── Avaliações ── */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
          <span>Avaliações</span>
          <Badge bg="light" text="dark" className="fs-6">
            Média: {media.toFixed(1)}
          </Badge>
        </Card.Header>
        <Card.Body>
          <Row>
            {pesquisa.itens.map((item) => {
              const cor = getCor(item.nota);
              return (
                <Col md={6} key={item.pesquisaItemId}>
                  <div className="mb-3 p-3 border rounded bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold">{item.nomeItem}</span>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={cor} style={{ fontSize: '1rem', minWidth: 36, textAlign: 'center' }}>
                          {item.nota}
                        </Badge>
                        <small className={`text-${cor}`}>{getLabel(item.nota)}</small>
                      </div>
                    </div>
                    <div
                      className="progress"
                      style={{ height: 8 }}
                      role="progressbar"
                      aria-valuenow={item.nota}
                      aria-valuemin={0}
                      aria-valuemax={10}
                    >
                      <div
                        className={`progress-bar bg-${cor}`}
                        style={{ width: `${item.nota * 10}%` }}
                      />
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted">0</small>
                      <small className="text-muted">10</small>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card.Body>
      </Card>

      {/* ── Feedbacks ── */}
      {(pesquisa.feedbackMelhoria || pesquisa.feedbackCritica || pesquisa.feedbackElogio) && (
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white fw-bold">Feedbacks</Card.Header>
          <Card.Body className="d-flex flex-column gap-3">
            {pesquisa.feedbackMelhoria && (
              <div>
                <strong>💡 Sugestões de melhoria</strong>
                <p className="mt-1 mb-0 text-muted">{pesquisa.feedbackMelhoria}</p>
              </div>
            )}
            {pesquisa.feedbackCritica && (
              <div>
                <strong>❌ Críticas</strong>
                <p className="mt-1 mb-0 text-muted">{pesquisa.feedbackCritica}</p>
              </div>
            )}
            {pesquisa.feedbackElogio && (
              <div>
                <strong>⭐ Elogios</strong>
                <p className="mt-1 mb-0 text-muted">{pesquisa.feedbackElogio}</p>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}