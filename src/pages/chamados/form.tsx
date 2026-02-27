import { useState, useEffect } from 'react';
import {
  Container, Card, Row, Col, Form, FloatingLabel,
  Button, Spinner, Alert,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import {
  getChamadoById, createChamado, updateChamado,
  type ChamadoCreateDto, type ChamadoUpdateDto,
} from '@/services/chamadoApi';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import SelectUsuario from '@/components/Selects/SelectUsuario';

interface FormState {
  title: string;
  description: string;
  empresaId: string;
  employerName: string;
  employerContact: string;
  userCreateId: string;
}

const emptyForm: FormState = {
  title: '', description: '', empresaId: '',
  employerName: '', employerContact: '', userCreateId: '',
};

export default function ChamadoFormPage() {
  const router = useRouter();
  const { id } = router.query;
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getChamadoById(String(id))
      .then((c) => setForm({
        title: c.title,
        description: c.description ?? '',
        empresaId: String(c.empresaId),
        employerName: c.employerName,
        employerContact: c.employerContact ?? '',
        userCreateId: c.userCreateId,
      }))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        const body: ChamadoUpdateDto = {
          title: form.title,
          description: form.description || null,
          empresaId: Number(form.empresaId),
          employerName: form.employerName,
          employerContact: form.employerContact || null,
        };
        await updateChamado(String(id), body);
      } else {
        const body: ChamadoCreateDto = {
          title: form.title,
          description: form.description || null,
          empresaId: Number(form.empresaId),
          employerName: form.employerName,
          employerContact: form.employerContact || null,
          userCreateId: form.userCreateId,
        };
        await createChamado(body);
      }
      router.push('/chamados');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <h4 className="fw-bold mb-4">
        {isEdit ? `✏️ Editar Chamado` : '🎫 Novo Chamado'}
      </h4>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        {error && <Alert variant="danger">{error}</Alert>}

        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-primary text-white fw-bold">Dados do Chamado</Card.Header>
          <Card.Body>
            <div className="d-flex flex-column gap-3">

              <FloatingLabel label="Título *">
                <Form.Control
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Título"
                  required
                  maxLength={200}
                />
                <Form.Control.Feedback type="invalid">
                  Informe o título.
                </Form.Control.Feedback>
              </FloatingLabel>

              <FloatingLabel label="Descrição">
                <Form.Control
                  as="textarea"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descrição"
                  style={{ height: 120 }}
                />
              </FloatingLabel>

            </div>
          </Card.Body>
        </Card>

        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-primary text-white fw-bold">Empresa e Contato</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <SelectEmpresa selected={Number(form.empresaId ?? 0)} setSelected={(e) => {
                  handleChange({
                    target: {
                      name: 'empresaId',
                      value: e
                    }
                  })
                }} />
              </Col>

              <Col md={6}>
                <Form.Control
                  name="employerName"
                  value={form.employerName}
                  onChange={handleChange}
                  placeholder="Nome do contato"
                  required
                  maxLength={100}
                />
                <Form.Control.Feedback type="invalid">
                  Informe o nome do contato.
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="employerContact"
                  value={form.employerContact}
                  onChange={handleChange}
                  placeholder="Contato"
                  maxLength={100}
                />
              </Col>

              {!isEdit && (
                <Col md={6}>
                  <SelectUsuario selected={form.userCreateId} setSelected={(e) => {
                    handleChange({
                      target: {
                        name: 'userCreateId',
                        value: e.id
                      }
                    })
                  }} />
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" type="button"
            onClick={() => router.push('/chamados')}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving
              ? <><Spinner size="sm" className="me-1" /> Salvando…</>
              : isEdit ? 'Salvar Alterações' : 'Abrir Chamado'
            }
          </Button>
        </div>
      </Form>
    </Container>
  );
}