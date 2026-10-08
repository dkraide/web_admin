import { useCallback, useEffect, useState } from 'react';
import { Badge, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import BaseModal from '@/components/Modals/Base/Index';
import CustomButton from '@/components/ui/Buttons';
import CustomTable from '@/components/ui/CustomTable';
import {
    atualizarRelease,
    DownloadProduto,
    DownloadRelease,
    excluirRelease,
    listReleases,
    mensagemErro,
} from '@/services/apiDownloads';
import NovaReleaseForm from './NovaReleaseForm';
import { dataHora, formatBytes } from './format';

interface Props {
    produto: DownloadProduto | null;
    setClose: (refresh?: boolean) => void;
}

type Modo = 'lista' | 'nova' | 'editar';

const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:7020' : 'https://pdv.krdsys.tech';

export default function ReleasesModal({ produto, setClose }: Props) {
    const [modo, setModo] = useState<Modo>('lista');
    const [releases, setReleases] = useState<DownloadRelease[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [mudou, setMudou] = useState(false);
    const [edit, setEdit] = useState<DownloadRelease | null>(null);
    const [editNotas, setEditNotas] = useState('');
    const [editMinima, setEditMinima] = useState('');
    const [editAtivo, setEditAtivo] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const load = useCallback(async () => {
        if (!produto) return;
        setLoading(true);
        try {
            setReleases(await listReleases(produto.id));
        } catch (err: any) {
            toast.error(`Erro ao carregar versões. ${mensagemErro(err)}`);
        }
        setLoading(false);
    }, [produto]);

    useEffect(() => {
        if (produto) { setModo('lista'); setMudou(false); load(); }
    }, [produto]);

    if (!produto) return <></>;

    const fechar = () => {
        if (uploading) return toast.warn('Há um envio em andamento. Cancele-o antes de fechar.');
        setClose(mudou);
    };

    const urlPublica = (r: DownloadRelease) =>
        `${API_BASE}/api/v2/downloads/${produto.slug}/arquivo?versao=${encodeURIComponent(r.versao)}&canal=${r.canal}`;

    async function copiar(r: DownloadRelease) {
        try {
            await navigator.clipboard.writeText(urlPublica(r));
            toast.success('Link copiado.');
        } catch {
            toast.info(urlPublica(r));
        }
    }

    async function alternarAtivo(r: DownloadRelease) {
        try {
            await atualizarRelease(r.id, { versaoMinima: r.versaoMinima, notas: r.notas, ativo: !r.ativo });
            toast.success(r.ativo ? 'Versão desativada (não aparece mais para download).' : 'Versão reativada.');
            setMudou(true);
            load();
        } catch (err: any) {
            toast.error(mensagemErro(err));
        }
    }

    async function remover(r: DownloadRelease) {
        if (!confirm(`Excluir a versão ${r.versao} (${r.canal})? O arquivo será apagado do servidor e isso não pode ser desfeito.`)) return;
        try {
            await excluirRelease(r.id);
            toast.success('Versão excluída.');
            setMudou(true);
            load();
        } catch (err: any) {
            toast.error(mensagemErro(err));
        }
    }

    function abrirEdicao(r: DownloadRelease) {
        setEdit(r);
        setEditNotas(r.notas ?? '');
        setEditMinima(r.versaoMinima ?? '');
        setEditAtivo(r.ativo);
        setModo('editar');
    }

    async function salvarEdicao() {
        if (!edit) return;
        setSalvando(true);
        try {
            await atualizarRelease(edit.id, { versaoMinima: editMinima.trim() || null, notas: editNotas.trim() || null, ativo: editAtivo });
            toast.success('Versão atualizada.');
            setMudou(true);
            setModo('lista');
            load();
        } catch (err: any) {
            toast.error(mensagemErro(err));
        }
        setSalvando(false);
    }

    const columns = [
        { name: 'Versão', selector: (r: DownloadRelease) => r.versao, cell: (r: DownloadRelease) => <b>{r.versao}</b>, sortable: true, width: '10%' },
        {
            name: 'Canal', selector: (r: DownloadRelease) => r.canal,
            cell: (r: DownloadRelease) => <Badge bg={r.canal === 'stable' ? 'primary' : 'warning'} text={r.canal === 'stable' ? undefined : 'dark'}>{r.canal === 'stable' ? 'Estável' : 'Beta'}</Badge>,
            sortable: true, width: '9%',
        },
        { name: 'Arquivo', selector: (r: DownloadRelease) => r.arquivoNome, cell: (r: DownloadRelease) => <span title={r.sha256 ?? ''}>{r.arquivoNome}</span>, sortable: true, width: '22%' },
        { name: 'Tamanho', selector: (r: DownloadRelease) => r.tamanhoBytes, cell: (r: DownloadRelease) => formatBytes(r.tamanhoBytes), sortable: true, width: '9%' },
        { name: 'Mínima', selector: (r: DownloadRelease) => r.versaoMinima ?? '', cell: (r: DownloadRelease) => r.versaoMinima ?? '-', width: '8%' },
        { name: 'Downloads', selector: (r: DownloadRelease) => r.totalDownloads, sortable: true, width: '9%' },
        { name: 'Publicado', selector: (r: DownloadRelease) => r.publicadoEm, cell: (r: DownloadRelease) => dataHora(r.publicadoEm), sortable: true, width: '13%' },
        {
            name: 'Status', selector: (r: DownloadRelease) => r.ativo,
            cell: (r: DownloadRelease) => (
                <Badge bg={r.ativo ? 'success' : 'secondary'} style={{ cursor: 'pointer' }} onClick={() => alternarAtivo(r)}>
                    {r.ativo ? 'Ativa' : 'Inativa'}
                </Badge>
            ),
            width: '8%',
        },
        {
            name: 'Ações',
            cell: (r: DownloadRelease) => (
                <div className="d-flex gap-1">
                    <CustomButton size="sm" typeButton="dark" title="Copiar link público" onClick={() => copiar(r)}>Link</CustomButton>
                    <CustomButton size="sm" typeButton="primary" onClick={() => abrirEdicao(r)}>Editar</CustomButton>
                    <CustomButton size="sm" typeButton="danger" onClick={() => remover(r)}>Excluir</CustomButton>
                </div>
            ),
        },
    ];

    return (
        <BaseModal isOpen={!!produto} setClose={fechar} title={`Versões — ${produto.nome}`} height={'75vh'}>
            {modo === 'lista' && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted">
                            <code>{produto.slug}</code> · {releases.length} versão(ões)
                        </span>
                        <CustomButton typeButton="success" onClick={() => setModo('nova')}>Nova versão</CustomButton>
                    </div>
                    <CustomTable columns={columns} data={releases} loading={loading} />
                </>
            )}

            {modo === 'nova' && (
                <NovaReleaseForm
                    produto={produto}
                    existentes={releases}
                    onUploadingChange={setUploading}
                    onConcluido={() => { setUploading(false); setMudou(true); setModo('lista'); load(); }}
                    onVoltar={() => setModo('lista')}
                />
            )}

            {modo === 'editar' && edit && (
                <div>
                    <h5>Editar versão {edit.versao} ({edit.canal})</h5>
                    <div className="text-muted small mb-3">O arquivo em si não muda. Para trocar o arquivo, publique uma nova versão.</div>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <Form.Label>Versão mínima</Form.Label>
                            <Form.Control value={editMinima} onChange={(e) => setEditMinima(e.target.value)} />
                        </div>
                        <div className="col-md-6 d-flex align-items-end">
                            <Form.Check type="switch" label="Ativa (disponível para download)" checked={editAtivo} onChange={(e) => setEditAtivo(e.target.checked)} />
                        </div>
                        <div className="col-12">
                            <Form.Label>Notas</Form.Label>
                            <Form.Control as="textarea" rows={4} value={editNotas} onChange={(e) => setEditNotas(e.target.value)} />
                        </div>
                        {edit.sha256 && (
                            <div className="col-12 small text-muted">SHA-256: <code>{edit.sha256}</code></div>
                        )}
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <CustomButton typeButton="secondary" onClick={() => setModo('lista')}>Voltar</CustomButton>
                        <CustomButton typeButton="success" loading={salvando} onClick={salvarEdicao}>Salvar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    );
}
