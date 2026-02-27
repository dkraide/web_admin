import { useState, useEffect, useRef } from 'react';
import {
  Container, Card, Row, Col, Badge, Spinner, Alert,
  Button, Form, ListGroup, Modal,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import {
  getChamadoById, updateChamadoStatus, addChamadoEvent,
  uploadChamadoAnexo, deleteChamadoAnexo,
  CHAMADO_STATUS, STATUS_LABEL, STATUS_COR,
  type ChamadoDto, type ChamadoStatus,
} from '@/services/chamadoApi';

// ── adapte para o usuário logado ──
const USUARIO_LOGADO = { id: 'ana.silva', nome: 'Ana Silva' };

const fmtData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const isImage = (fileName: string) =>
  /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

export default function ChamadoViewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [chamado, setChamado]       = useState<ChamadoDto | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Status
  const [newStatus, setNewStatus]   = useState<ChamadoStatus>('Aberto');
  const [savingStatus, setSavingStatus] = useState(false);

  // Evento
  const [message, setMessage]       = useState('');
  const [sendingEvent, setSendingEvent] = useState(false);

  // Anexo
  const fileRef                     = useRef<HTMLInputElement>(null);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [deletingAnexoId, setDeletingAnexoId] = useState<string | null>(null);

  // Modal preview imagem
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const carregar = () => {
    if (!id) return;
    setLoading(true);
    getChamadoById(String(id))
      .then((data) => {
        setChamado(data);
        setNewStatus(data.status);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, [id]);

  // ── Status ────────────────────────────────────────────────
  const handleStatusChange = async () => {
    if (!chamado || newStatus === chamado.status) return;
    setSavingStatus(true);
    try {
      const updated = await updateChamadoStatus(chamado.id, newStatus);
      setChamado(updated);
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setSavingStatus(false);
    }
  };

  // ── Evento ────────────────────────────────────────────────
  const handleSendEvent = async () => {
    if (!chamado || !message.trim()) return;
    setSendingEvent(true);
    try {
      const ev = await addChamadoEvent(chamado.id, USUARIO_LOGADO.id, message.trim());
      setChamado((prev) => prev ? { ...prev, events: [...prev.events, ev] } : prev);
      setMessage('');
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setSendingEvent(false);
    }
  };

  // ── Anexo upload ──────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chamado) return;
    setUploadingAnexo(true);
    try {
      const anexo = await uploadChamadoAnexo(chamado.id, file);
      setChamado((prev) => prev ? { ...prev, anexos: [...prev.anexos, anexo] } : prev);
    } catch (e: any) {
      alert('Erro ao enviar: ' + e.message);
    } finally {
      setUploadingAnexo(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Anexo delete ──────────────────────────────────────────
  const handleDeleteAnexo = async (anexoId: string) => {
    if (!chamado || !confirm('Remover este anexo?')) return;
    setDeletingAnexoId(anexoId);
    try {
      await deleteChamadoAnexo(chamado.id, anexoId);
      setChamado((prev) =>
        prev ? { ...prev, anexos: prev.anexos.filter((a) => a.id !== anexoId) } : prev
      );
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setDeletingAnexoId(null);
    }
  };

  if (loading) return (
    <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
  );
  if (error || !chamado) return (
    <Container className="py-4">
      <Alert variant="danger">{error ?? 'Chamado não encontrado.'}</Alert>
    </Container>
  );

  return (
    <Container fluid className="py-4" style={{ maxWidth: 1000 }}>

      {/* ── Cabeçalho ── */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1">🎫 {chamado.title}</h4>
          <small className="text-muted">Aberto em {fmtData(chamado.createdAt)}</small>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm"
            onClick={() => router.push(`/chamados/form?id=${chamado.id}`)}>
            Editar
          </Button>
          <Button variant="outline-secondary" size="sm"
            onClick={() => router.push('/chamados')}>
            Voltar
          </Button>
        </div>
      </div>

      <Row className="g-4">
        {/* ── Coluna esquerda ── */}
        <Col lg={8}>

          {/* Descrição */}
          {chamado.description && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white fw-bold">Descrição</Card.Header>
              <Card.Body>
                <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {chamado.description}
                </p>
              </Card.Body>
            </Card>
          )}

          {/* Eventos / Histórico */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white fw-bold">
              Histórico ({chamado.events.length})
            </Card.Header>
            <Card.Body className="p-0">
              {chamado.events.length === 0 ? (
                <p className="text-muted text-center py-4 mb-0">Nenhuma atualização ainda.</p>
              ) : (
                <ListGroup variant="flush">
                  {chamado.events.map((ev) => (
                    <ListGroup.Item key={ev.id}>
                      <div className="d-flex justify-content-between mb-1">
                        <strong className="small">{ev.userId}</strong>
                        <small className="text-muted">{fmtData(ev.createdAt)}</small>
                      </div>
                      <p className="mb-0 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                        {ev.message}
                      </p>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
            <Card.Footer className="bg-white">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Escreva uma atualização…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mb-2"
              />
              <div className="d-flex justify-content-end">
                <Button
                  variant="primary" size="sm"
                  disabled={!message.trim() || sendingEvent}
                  onClick={handleSendEvent}
                >
                  {sendingEvent
                    ? <><Spinner size="sm" className="me-1" /> Enviando…</>
                    : 'Adicionar Evento'
                  }
                </Button>
              </div>
            </Card.Footer>
          </Card>

          {/* Anexos */}
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
              <span>Anexos ({chamado.anexos.length})</span>
              <Button
                size="sm" variant="light"
                disabled={uploadingAnexo}
                onClick={() => fileRef.current?.click()}
              >
                {uploadingAnexo
                  ? <><Spinner size="sm" className="me-1" /> Enviando…</>
                  : '+ Anexar arquivo'
                }
              </Button>
              <input
                ref={fileRef}
                type="file"
                className="d-none"
                onChange={handleFileChange}
              />
            </Card.Header>
            <Card.Body>
              {chamado.anexos.length === 0 ? (
                <p className="text-muted text-center mb-0">Nenhum anexo.</p>
              ) : (
                <Row className="g-2">
                  {chamado.anexos.map((a) => (
                    <Col xs={12} md={6} key={a.id}>
                      <div className="border rounded p-2 d-flex align-items-center gap-2">
                        {isImage(a.fileName) ? (
                          <img
                            src={a.url}
                            alt={a.fileName}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => setPreviewUrl(a.url)}
                          />
                        ) : (
                          <div
                            className="bg-light d-flex align-items-center justify-content-center rounded"
                            style={{ width: 48, height: 48, fontSize: 22 }}
                          >
                            📄
                          </div>
                        )}
                        <div className="flex-grow-1 overflow-hidden">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="d-block text-truncate small fw-semibold"
                          >
                            {a.fileName}
                          </a>
                          <small className="text-muted">{fmtData(a.createdAt)}</small>
                        </div>
                        <Button
                          size="sm" variant="outline-danger"
                          disabled={deletingAnexoId === a.id}
                          onClick={() => handleDeleteAnexo(a.id)}
                        >
                          {deletingAnexoId === a.id ? <Spinner size="sm" /> : '✕'}
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>

        </Col>

        {/* ── Coluna direita (info + status) ── */}
        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white fw-bold">Informações</Card.Header>
            <Card.Body className="d-flex flex-column gap-3">
              <div>
                <small className="text-muted d-block">Status atual</small>
                <Badge bg={STATUS_COR[chamado.status]} className="fs-6">
                  {STATUS_LABEL[chamado.status]}
                </Badge>
              </div>
              <div>
                <small className="text-muted d-block">Empresa</small>
                <strong>#{chamado.empresaId}</strong>
              </div>
              <div>
                <small className="text-muted d-block">Contato</small>
                <strong>{chamado.employerName}</strong>
                {chamado.employerContact && (
                  <div className="text-muted small">{chamado.employerContact}</div>
                )}
              </div>
              <div>
                <small className="text-muted d-block">Aberto por</small>
                <strong>{chamado.userCreateId}</strong>
              </div>
              <div>
                <small className="text-muted d-block">Última atualização</small>
                <strong>{fmtData(chamado.lastUpdated)}</strong>
              </div>
            </Card.Body>
          </Card>

          {/* Alterar status */}
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white fw-bold">Alterar Status</Card.Header>
            <Card.Body>
              <Form.Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ChamadoStatus)}
                className="mb-3"
              >
                {CHAMADO_STATUS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </Form.Select>
              <Button
                variant="primary" className="w-100"
                disabled={savingStatus || newStatus === chamado.status}
                onClick={handleStatusChange}
              >
                {savingStatus
                  ? <><Spinner size="sm" className="me-1" /> Salvando…</>
                  : 'Confirmar Status'
                }
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal preview imagem */}
      <Modal show={!!previewUrl} onHide={() => setPreviewUrl(null)} centered size="lg">
        <Modal.Header closeButton />
        <Modal.Body className="text-center p-2">
          {previewUrl && (
            <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
}