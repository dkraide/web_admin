'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Spinner, Alert, Form, InputGroup,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import {
  getPesquisas,
  deletePesquisa,
  type PesquisaSatisfacaoResumoDto,
} from '@/services/pesquisaSatisfacaoApi';

const corMedia = (media: number) => {
  if (media <= 3) return 'danger';
  if (media <= 6) return 'warning';
  if (media <= 8) return 'info';
  return 'success';
};

const fmtData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function PesquisaSatisfacaoListPage() {
  const router = useRouter();

  const [pesquisas, setPesquisas]   = useState<PesquisaSatisfacaoResumoDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [busca, setBusca]           = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPesquisas(await getPesquisas());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir esta pesquisa?')) return;
    setDeletingId(id);
    try {
      await deletePesquisa(id);
      setPesquisas((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtradas = pesquisas.filter((p) =>
    !busca ||
    String(p.empresaId).includes(busca) ||
    p.usuarioId.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Container fluid className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="fw-bold mb-0">📋 Pesquisas de Satisfação</h4>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => router.push('/pesquisa-satisfacao/form')}>
            + Nova Pesquisa
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header>
          <InputGroup style={{ maxWidth: 340 }}>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Buscar por empresa ou atendente…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </InputGroup>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Nenhuma pesquisa encontrada.
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Data / Hora</th>
                  <th>Atendente</th>
                  <th>Empresa</th>
                  <th className="text-center">Média</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((p) => (
                  <tr key={p.id}>
                    <td className="text-muted">{p.id}</td>
                    <td>{fmtData(p.horarioRealizado)}</td>
                    <td>{p.usuarioId}</td>
                    <td>{p.empresaId}</td>
                    <td className="text-center">
                      <Badge bg={corMedia(p.mediaGeral)}>
                        {p.mediaGeral.toFixed(1)}
                      </Badge>
                    </td>
                    <td className="text-end d-flex gap-1 justify-content-end">
                      <Button
                        size="sm" variant="outline-secondary"
                        onClick={() => router.push(`/pesquisa-satisfacao/view?id=${p.id}`)}
                      >
                        Ver
                      </Button>
                      <Button
                        size="sm" variant="outline-primary"
                        onClick={() => router.push(`/pesquisa-satisfacao/form?id=${p.id}`)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm" variant="outline-danger"
                        disabled={deletingId === p.id}
                        onClick={() => handleDelete(p.id)}
                      >
                        {deletingId === p.id ? <Spinner size="sm" /> : 'Excluir'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}