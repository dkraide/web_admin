import { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import BaseModal from '@/components/Modals/Base/Index';
import CustomButton from '@/components/ui/Buttons';
import {
    atualizarProduto,
    criarProduto,
    DownloadProduto,
    mensagemErro,
} from '@/services/apiDownloads';

interface Props {
    isOpen: boolean;
    setClose: (refresh?: boolean) => void;
    edit?: DownloadProduto | null;
}

const CATEGORIAS = ['Instalador', 'Atualizador', 'Driver', 'Manual', 'Outro'];

const slugify = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);

export default function ProdutoFormModal({ isOpen, setClose, edit }: Props) {
    const isEdit = !!edit;
    const [sending, setSending] = useState(false);
    const [nome, setNome] = useState('');
    const [slug, setSlug] = useState('');
    const [slugManual, setSlugManual] = useState(false);
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState('Instalador');
    const [plataforma, setPlataforma] = useState('');
    const [ordem, setOrdem] = useState(0);
    const [ativo, setAtivo] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        setNome(edit?.nome ?? '');
        setSlug(edit?.slug ?? '');
        setSlugManual(isEdit);
        setDescricao(edit?.descricao ?? '');
        setCategoria(edit?.categoria ?? 'Instalador');
        setPlataforma(edit?.plataforma ?? '');
        setOrdem(edit?.ordem ?? 0);
        setAtivo(edit?.ativo ?? true);
    }, [isOpen, edit]);

    async function salvar() {
        if (!nome.trim()) return toast.warn('Informe o nome.');
        if (slug.length < 2) return toast.warn('Informe um slug válido.');
        setSending(true);
        try {
            const payload = { slug, nome: nome.trim(), descricao, categoria, plataforma, ordem, ativo };
            if (edit) await atualizarProduto(edit.id, payload);
            else await criarProduto(payload);
            toast.success(edit ? 'Produto atualizado.' : 'Produto criado.');
            setClose(true);
        } catch (err: any) {
            toast.error(mensagemErro(err));
        }
        setSending(false);
    }

    return (
        <BaseModal isOpen={isOpen} setClose={() => setClose()} title={isEdit ? `Editar ${edit?.nome}` : 'Novo produto'} height={'auto'}>
            <div className="row g-3">
                <div className="col-md-7">
                    <Form.Label>Nome</Form.Label>
                    <Form.Control value={nome} placeholder="Ex.: PDV Windows — Instalador"
                        onChange={(e) => { setNome(e.target.value); if (!slugManual) setSlug(slugify(e.target.value)); }} />
                </div>
                <div className="col-md-5">
                    <Form.Label>Slug (usado na URL e pelos clients)</Form.Label>
                    <Form.Control value={slug} placeholder="pdv-winforms-setup"
                        onChange={(e) => { setSlugManual(true); setSlug(slugify(e.target.value)); }} />
                    <Form.Text muted>{isEdit ? 'Só pode mudar enquanto não houver versões publicadas.' : 'Não muda depois que houver versões.'}</Form.Text>
                </div>
                <div className="col-12">
                    <Form.Label>Descrição</Form.Label>
                    <Form.Control as="textarea" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                </div>
                <div className="col-md-4">
                    <Form.Label>Categoria</Form.Label>
                    <Form.Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                        {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                    </Form.Select>
                </div>
                <div className="col-md-4">
                    <Form.Label>Plataforma</Form.Label>
                    <Form.Control value={plataforma} placeholder="win-x64, android, web..." onChange={(e) => setPlataforma(e.target.value)} />
                </div>
                <div className="col-md-2">
                    <Form.Label>Ordem</Form.Label>
                    <Form.Control type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                    <Form.Check type="switch" label="Ativo" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
                </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
                <CustomButton typeButton="secondary" onClick={() => setClose()}>Cancelar</CustomButton>
                <CustomButton typeButton="success" loading={sending} onClick={salvar}>Salvar</CustomButton>
            </div>
        </BaseModal>
    );
}
