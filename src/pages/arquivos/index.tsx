import { useEffect, useMemo, useState } from 'react';
import { Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CustomTable from '@/components/ui/CustomTable';
import CustomButton from '@/components/ui/Buttons';
import ProdutoFormModal from '@/components/Arquivos/ProdutoFormModal';
import ReleasesModal from '@/components/Arquivos/ReleasesModal';
import {
    DownloadProduto,
    excluirProduto,
    listProdutos,
    mensagemErro,
} from '@/services/apiDownloads';
import { canSSRAuth } from '@/utils/CanSSRAuth';

export default function Arquivos() {
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [itens, setItens] = useState<DownloadProduto[]>([]);
    const [novo, setNovo] = useState(false);
    const [edit, setEdit] = useState<DownloadProduto | null>(null);
    const [releasesDe, setReleasesDe] = useState<DownloadProduto | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            setItens(await listProdutos());
        } catch (err: any) {
            toast.error(`Erro ao carregar arquivos. ${mensagemErro(err)}`);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtrados = useMemo(
        () => itens.filter(p => `${p.nome}${p.slug}${p.categoria ?? ''}${p.plataforma ?? ''}`.toLowerCase().includes(busca.toLowerCase())),
        [itens, busca]
    );

    async function remover(p: DownloadProduto) {
        if (!confirm(`Excluir o produto "${p.nome}"? Só é possível se ele não tiver versões publicadas.`)) return;
        try {
            await excluirProduto(p.id);
            toast.success('Produto excluído.');
            load();
        } catch (err: any) {
            toast.error(mensagemErro(err));
        }
    }

    const columns = [
        { name: 'Produto', selector: (r: DownloadProduto) => r.nome, cell: (r: DownloadProduto) => <b>{r.nome}</b>, sortable: true, width: '24%' },
        { name: 'Slug', selector: (r: DownloadProduto) => r.slug, cell: (r: DownloadProduto) => <code>{r.slug}</code>, sortable: true, width: '20%' },
        { name: 'Categoria', selector: (r: DownloadProduto) => r.categoria ?? '', sortable: true, width: '10%' },
        { name: 'Plataforma', selector: (r: DownloadProduto) => r.plataforma ?? '', sortable: true, width: '10%' },
        {
            name: 'Última estável', selector: (r: DownloadProduto) => r.ultimaVersaoStable ?? '',
            cell: (r: DownloadProduto) => r.ultimaVersaoStable ? <Badge bg="primary">{r.ultimaVersaoStable}</Badge> : <i style={{ color: '#bbb' }}>nenhuma</i>,
            width: '10%',
        },
        {
            name: 'Status', selector: (r: DownloadProduto) => r.ativo,
            cell: (r: DownloadProduto) => <Badge bg={r.ativo ? 'success' : 'secondary'}>{r.ativo ? 'Ativo' : 'Inativo'}</Badge>,
            sortable: true, width: '8%',
        },
        {
            name: 'Ações',
            cell: (r: DownloadProduto) => (
                <div className="d-flex gap-1">
                    <CustomButton size="sm" typeButton="success" onClick={() => setReleasesDe(r)}>Versões</CustomButton>
                    <CustomButton size="sm" typeButton="primary" onClick={() => setEdit(r)}>Editar</CustomButton>
                    <CustomButton size="sm" typeButton="danger" onClick={() => remover(r)}>Excluir</CustomButton>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: 16 }}>
            <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Arquivos para download</h4>
                <CustomButton typeButton="success" onClick={() => setNovo(true)}>Novo produto</CustomButton>
            </div>
            <hr />
            <div className="mb-3" style={{ maxWidth: 360 }}>
                <input className="form-control" placeholder="Buscar por nome, slug, categoria..."
                    value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>

            <CustomTable columns={columns} data={filtrados} loading={loading} />

            <ProdutoFormModal
                isOpen={novo || !!edit}
                edit={edit}
                setClose={(refresh) => { setNovo(false); setEdit(null); if (refresh) load(); }}
            />
            <ReleasesModal
                produto={releasesDe}
                setClose={(refresh) => { setReleasesDe(null); if (refresh) load(); }}
            />
        </div>
    );
}

export const getServerSideProps = canSSRAuth(['ADMINISTRADOR']);
