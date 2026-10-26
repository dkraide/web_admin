import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import { uploadImagemTutorial } from '@/services/tutorialApi';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const botao = (ativo: boolean) => (ativo ? 'primary' : 'outline-secondary');

export default function EditorHtml({ value, onChange }: Props) {
  const [modoHtml, setModoHtml] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const inputImagem = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Editor | null>(null);

  const enviarImagem = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setEnviando(true);
    try {
      const url = await uploadImagemTutorial(file);
      editorRef.current?.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (e: any) {
      alert('Erro ao enviar imagem: ' + (e.response?.data ?? e.message));
    } finally {
      setEnviando(false);
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image,
      Link.configure({ openOnClick: false }),
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder: 'Escreva o tutorial aqui…' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'form-control', style: 'min-height: 380px; overflow: auto;' },
      handleDrop: (_view, event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return false;
        event.preventDefault();
        enviarImagem(file);
        return true;
      },
      handlePaste: (_view, event) => {
        const file = event.clipboardData?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return false;
        event.preventDefault();
        enviarImagem(file);
        return true;
      },
    },
  });
  editorRef.current = editor;

  // Carrega o conteúdo quando o tutorial chega da API (edição).
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const inserirLink = () => {
    const atual = editor.getAttributes('link').href ?? '';
    const url = window.prompt('Endereço do link (deixe vazio para remover):', atual);
    if (url === null) return;
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const inserirVideo = () => {
    const url = window.prompt('Link do vídeo do YouTube:');
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
        <ButtonGroup size="sm">
          <Button variant={botao(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Título</Button>
          <Button variant={botao(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Subtítulo</Button>
          <Button variant={botao(editor.isActive('paragraph'))} onClick={() => editor.chain().focus().setParagraph().run()}>Texto</Button>
        </ButtonGroup>
        <ButtonGroup size="sm">
          <Button variant={botao(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><b>N</b></Button>
          <Button variant={botao(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Button>
          <Button variant={botao(editor.isActive('link'))} onClick={inserirLink}>Link</Button>
        </ButtonGroup>
        <ButtonGroup size="sm">
          <Button variant={botao(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• Lista</Button>
          <Button variant={botao(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Passos</Button>
          <Button variant={botao(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Destaque</Button>
          <Button variant="outline-secondary" onClick={() => editor.chain().focus().setHorizontalRule().run()}>Linha</Button>
        </ButtonGroup>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" disabled={enviando} onClick={() => inputImagem.current?.click()}>{enviando ? 'Enviando…' : '🖼 Imagem'}</Button>
          <Button variant="outline-secondary" onClick={inserirVideo}>▶ Vídeo</Button>
        </ButtonGroup>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={() => editor.chain().focus().undo().run()}>↶</Button>
          <Button variant="outline-secondary" onClick={() => editor.chain().focus().redo().run()}>↷</Button>
        </ButtonGroup>
        <Form.Check className="ms-auto" type="switch" label="Ver HTML" checked={modoHtml} onChange={(e) => setModoHtml(e.target.checked)} />
        <input
          ref={inputImagem}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) enviarImagem(f);
            e.target.value = '';
          }}
        />
      </div>

      {modoHtml ? (
        <Form.Control
          as="textarea"
          rows={18}
          style={{ fontFamily: 'monospace' }}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            editor.commands.setContent(e.target.value, false);
          }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
      <div className="form-text">Dica: arraste ou cole imagens direto no texto.</div>
    </div>
  );
}
