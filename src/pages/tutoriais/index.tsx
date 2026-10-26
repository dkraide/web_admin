import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { getTutoriais, deleteTutorial, type TutorialResumoDto } from '@/services/tutorialApi';

export default function TutorialListPage() {
  const router = useRouter();
  const [itens, setItens] = useState<TutorialResumoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    getTutoriais()
      .then(setItens)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const excluir = async (id: number) => {
    if (!confirm('Deseja excluir este tutorial?')) return;
    try {
      await deleteTutorial(id);
      setItens((prev) => prev.filter((t) => t.id !== id));
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  const filtrados = itens.filter((t) => {
    const q = busca.toLowerCase();
    return !q || t.titulo.toLowerCase().includes(q) || t.modulo.toLowerCase().includes(q) || t.sistema.toLowerCase().includes(q);
  });

  return (
    <Container fluid className="py-4">
      <Row className="align-items-center mb-4">
        <Col><h4 className="fw-bold mb-0">🎓 Tutoriais</h4></Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => router.push('/tutoriais/form')}>+ Novo Tutorial</Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      <Card>
        <Card.Body>
          <Form.Control className="mb-3" placeholder="Buscar por título, sistema ou módulo" value={busca} onChange={(e) => setBusca(e.target.value)} />
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : (
            <Table hover responsive size="sm" className="align-middle mb-0">
              <thead>
                <tr><th>Sistema</th><th>Módulo</th><th>Ordem</th><th>Título</th><th>Vídeo</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {filtrados.map((t) => (
                  <tr key={t.id}>
                    <td>{t.sistema}</td>
                    <td>{t.modulo}</td>
                    <td>{t.ordem}</td>
                    <td>{t.titulo}</td>
                    <td>{t.temVideo ? '▶️' : '—'}</td>
                    <td><Badge bg={t.publicado ? 'success' : 'secondary'}>{t.publicado ? 'Publicado' : 'Rascunho'}</Badge></td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-primary" className="me-2" onClick={() => router.push(`/tutoriais/form?id=${t.id}`)}>Editar</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => excluir(t.id)}>Excluir</Button>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted py-3">Nenhum tutorial encontrado.</td></tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
