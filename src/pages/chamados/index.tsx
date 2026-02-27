import { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Badge,
  Spinner, Alert, Form, InputGroup,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import {
  getChamados, deleteChamado,
  CHAMADO_STATUS, STATUS_LABEL, STATUS_COR,
  type ChamadoResumoDto, type ChamadoStatus,
} from '@/services/chamadoApi';

const fmtData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function ChamadoListPage() {
  const router = useRouter();

  const [chamados, setChamados]     = useState<ChamadoResumoDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [busca, setBusca]           = useState('');
  const [filtroStatus, setFiltroStatus] = useState<ChamadoStatus | ''>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setChamados(await getChamados({
        ...(filtroStatus && { status: filtroStatus }),
      }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este chamado?')) return;
    setDeletingId(id);
    try {
      await deleteChamado(id);
      setChamados((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtrados = chamados.filter((c) =>
    !busca ||
    c.title.toLowerCase().includes(busca.toLowerCase()) ||
    c.employerName.toLowerCase().includes(busca.toLowerCase()) ||
    String(c.empresaId).includes(busca)
  );

  return (
    <Container fluid className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="fw-bold mb-0">🎫 Chamados</h4>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => router.push('/chamados/form')}>
            + Novo Chamado
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header>
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por título, empresa ou contato…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as ChamadoStatus | '')}
              >
                <option value="">Todos os status</option>
                {CHAMADO_STATUS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Nenhum chamado encontrado.
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Status</th>
                  <th>Título</th>
                  <th>Empresa</th>
                  <th>Contato</th>
                  <th className="text-center">Eventos</th>
                  <th className="text-center">Anexos</th>
                  <th>Atualizado</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Badge bg={STATUS_COR[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                    </td>
                    <td className="fw-semibold">{c.title}</td>
                    <td>{c.empresaId}</td>
                    <td>{c.employerName}</td>
                    <td className="text-center">{c.totalEvents}</td>
                    <td className="text-center">{c.totalAnexos}</td>
                    <td className="text-muted small">{fmtData(c.lastUpdated)}</td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end">
                        <Button size="sm" variant="outline-secondary"
                          onClick={() => router.push(`/chamados/view?id=${c.id}`)}>
                          Ver
                        </Button>
                        <Button size="sm" variant="outline-primary"
                          onClick={() => router.push(`/chamados/form?id=${c.id}`)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="outline-danger"
                          disabled={deletingId === c.id}
                          onClick={() => handleDelete(c.id)}>
                          {deletingId === c.id ? <Spinner size="sm" /> : 'Excluir'}
                        </Button>
                      </div>
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