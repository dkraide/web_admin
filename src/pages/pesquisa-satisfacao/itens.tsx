'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container, Card, Table, Button, Modal, Form,
  Spinner, Alert, Badge, FloatingLabel, Row, Col,
} from 'react-bootstrap';
import { useRouter } from 'next/router';
import {
  getPesquisaItens,
  createPesquisaItem,
  updatePesquisaItem,
  deletePesquisaItem,
  type PesquisaItemDto,
  type PesquisaItemCreateDto,
  type PesquisaItemUpdateDto,
} from '@/services/pesquisaSatisfacaoApi';

interface FormState {
  nome: string;
  descricao: string;
  ordem: number;
  ativo: boolean;
}

const emptyForm: FormState = { nome: '', descricao: '', ordem: 0, ativo: true };

export default function PesquisaItensPage() {
  const router = useRouter();

  const [itens, setItens]         = useState<PesquisaItemDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState<PesquisaItemDto | null>(null);
  const [form, setForm]           = useState<FormState>(emptyForm);
  const [saving, setSaving]       = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setItens(await getPesquisaItens(false));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => {
    setEditItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const abrirEditar = (item: PesquisaItemDto) => {
    setEditItem(item);
    setForm({ nome: item.nome, descricao: item.descricao ?? '', ordem: item.ordem, ativo: item.ativo });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) {
        const body: PesquisaItemUpdateDto = { ...form };
        const updated = await updatePesquisaItem(editItem.id, body);
        setItens((prev) => prev.map((i) => (i.id === editItem.id ? updated : i)));
      } else {
        const body: PesquisaItemCreateDto = { ...form };
        const created = await createPesquisaItem(body);
        setItens((prev) => [...prev, created].sort((a, b) => a.ordem - b.ordem));
      }
      setShowModal(false);
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este item?')) return;
    try {
      await deletePesquisaItem(id);
      setItens((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h4 className="fw-bold mb-0">⚙️ Itens de Avaliação</h4>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => router.push('/pesquisa-satisfacao')}>
            ← Voltar
          </Button>
          <Button variant="primary" onClick={abrirNovo}>
            + Novo Item
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ordem</th>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th className="text-center">Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td className="text-muted">{item.ordem}</td>
                    <td className="fw-semibold">{item.nome}</td>
                    <td className="text-muted small">{item.descricao ?? '—'}</td>
                    <td className="text-center">
                      <Badge bg={item.ativo ? 'success' : 'secondary'}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="text-end d-flex gap-1 justify-content-end">
                      <Button size="sm" variant="outline-primary" onClick={() => abrirEditar(item)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item.id)}>
                        Excluir
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* ── Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Editar Item' : 'Novo Item'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            <FloatingLabel label="Nome *">
              <Form.Control
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Nome"
                required
              />
            </FloatingLabel>
            <FloatingLabel label="Descrição">
              <Form.Control
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Descrição"
              />
            </FloatingLabel>
            <FloatingLabel label="Ordem de exibição">
              <Form.Control
                type="number"
                value={form.ordem}
                onChange={(e) => setForm((p) => ({ ...p, ordem: Number(e.target.value) }))}
                placeholder="Ordem"
              />
            </FloatingLabel>
            <Form.Check
              type="switch"
              label="Ativo"
              checked={form.ativo}
              onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.nome.trim()}>
            {saving ? <Spinner size="sm" /> : 'Salvar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}