import { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Form, FloatingLabel, Button, Spinner, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import EditorHtml from '@/components/Tutorial/EditorHtml';
import { getTutorialById, saveTutorial, gerarTutorialComIA, TUTORIAL_SISTEMAS, type TutorialDto } from '@/services/tutorialApi';

const vazio: TutorialDto = {
  id: 0, sistema: 'PDV', modulo: '', titulo: '', slug: '', resumo: '',
  corpo: '', urlVideo: '', transcricaoVideo: '', ordem: 0, publicado: false,
};

export default function TutorialFormPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const [form, setForm] = useState<TutorialDto>(vazio);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gerando, setGerando] = useState(false);
  const inputTxt = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !id) return;
    setLoading(true);
    getTutorialById(id)
      .then(setForm)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router.isReady, id]);

  const set = <K extends keyof TutorialDto>(k: K, v: TutorialDto[K]) => setForm((f) => ({ ...f, [k]: v }));

  const carregarTxt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) set('transcricaoVideo', await file.text());
  };

  const gerarComIA = async () => {
    const temConteudo = !!form.corpo?.replace(/<[^>]*>/g, '').trim();
    if (temConteudo && !confirm('Isso vai substituir o conteúdo atual do tutorial. Continuar?')) return;
    setGerando(true);
    setError(null);
    try {
      const r = await gerarTutorialComIA(form.transcricaoVideo ?? '', form.sistema, form.modulo);
      setForm((f) => ({ ...f, titulo: r.titulo || f.titulo, resumo: r.resumo || f.resumo, corpo: r.corpo }));
    } catch (e: any) {
      setError(e.response?.data ?? e.message);
    } finally {
      setGerando(false);
    }
  };

  const salvar = async () => {
    if (!form.titulo.trim() || !form.modulo.trim()) {
      setError('Título e módulo são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveTutorial(form);
      router.push('/tutoriais');
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <Container fluid className="py-4">
      <Row className="align-items-center mb-4">
        <Col><h4 className="fw-bold mb-0">{form.id ? 'Editar tutorial' : 'Novo tutorial'}</h4></Col>
        <Col xs="auto">
          <Button variant="outline-secondary" className="me-2" onClick={() => router.push('/tutoriais')}>Voltar</Button>
          <Button variant="primary" onClick={salvar} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <FloatingLabel label="Sistema">
                <Form.Select value={form.sistema} onChange={(e) => set('sistema', e.target.value)}>
                  {TUTORIAL_SISTEMAS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
              </FloatingLabel>
            </Col>
            <Col md={5}>
              <FloatingLabel label="Módulo (ex.: Produtos, Nota de Entrada)">
                <Form.Control value={form.modulo} onChange={(e) => set('modulo', e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={2}>
              <FloatingLabel label="Ordem">
                <Form.Control type="number" value={form.ordem} onChange={(e) => set('ordem', Number(e.target.value))} />
              </FloatingLabel>
            </Col>
            <Col md={2} className="d-flex align-items-center">
              <Form.Check type="switch" label="Publicado" checked={form.publicado} onChange={(e) => set('publicado', e.target.checked)} />
            </Col>
            <Col md={8}>
              <FloatingLabel label="Título">
                <Form.Control value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={4}>
              <FloatingLabel label="Slug (vazio = gerado do título)">
                <Form.Control value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={12}>
              <FloatingLabel label="Resumo (aparece na listagem e ajuda a Edina)">
                <Form.Control value={form.resumo ?? ''} onChange={(e) => set('resumo', e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={12}>
              <FloatingLabel label="URL do vídeo (YouTube)">
                <Form.Control value={form.urlVideo ?? ''} onChange={(e) => set('urlVideo', e.target.value)} />
              </FloatingLabel>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col lg={12}>
          <Card>
            <Card.Header>Conteúdo do tutorial</Card.Header>
            <Card.Body>
              <EditorHtml value={form.corpo ?? ''} onChange={(html) => set('corpo', html)} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex flex-wrap gap-2 align-items-center">
              <span className="me-auto">Transcrição do vídeo (alimenta a Edina)</span>
              <input ref={inputTxt} type="file" accept=".txt,text/plain" hidden onChange={carregarTxt} />
              <Button size="sm" variant="outline-secondary" onClick={() => inputTxt.current?.click()}>Carregar .txt</Button>
              <Button size="sm" variant="success" disabled={gerando || !form.transcricaoVideo?.trim()} onClick={gerarComIA}>
                {gerando ? 'Gerando…' : '✨ Gerar tutorial com IA'}
              </Button>
            </Card.Header>
            <Card.Body>
              <Form.Control as="textarea" rows={10} value={form.transcricaoVideo ?? ''} onChange={(e) => set('transcricaoVideo', e.target.value)} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
