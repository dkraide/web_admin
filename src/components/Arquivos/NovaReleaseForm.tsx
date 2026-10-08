import { useEffect, useRef, useState } from 'react';
import { Alert, Form, ProgressBar } from 'react-bootstrap';
import { toast } from 'react-toastify';
import CustomButton from '@/components/ui/Buttons';
import {
    DownloadProduto,
    DownloadRelease,
    enviarRelease,
    mensagemErro,
    ProgressoUpload,
    UploadCancelado,
} from '@/services/apiDownloads';
import { formatBytes, formatDuracao } from './format';

interface Props {
    produto: DownloadProduto;
    existentes: DownloadRelease[];
    onUploadingChange: (uploading: boolean) => void;
    onConcluido: () => void;
    onVoltar: () => void;
}

const VERSAO_RX = /^\d+(\.\d+){0,3}$/;

export default function NovaReleaseForm({ produto, existentes, onUploadingChange, onConcluido, onVoltar }: Props) {
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [versao, setVersao] = useState('');
    const [canal, setCanal] = useState<'stable' | 'beta'>('stable');
    const [versaoMinima, setVersaoMinima] = useState('');
    const [notas, setNotas] = useState('');
    const [progresso, setProgresso] = useState<ProgressoUpload | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Impede fechar/recarregar a aba no meio do envio sem avisar.
    useEffect(() => {
        if (!enviando) return;
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', h);
        return () => window.removeEventListener('beforeunload', h);
    }, [enviando]);

    useEffect(() => () => abortRef.current?.abort(), []);

    function validar(): string | null {
        if (!arquivo) return 'Selecione o arquivo.';
        if (!VERSAO_RX.test(versao.trim())) return 'Versão inválida. Use números separados por ponto (ex.: 2.3.1 ou 102).';
        if (versaoMinima.trim() && !VERSAO_RX.test(versaoMinima.trim())) return 'Versão mínima inválida.';
        if (existentes.some(r => r.canal === canal && r.versao === versao.trim()))
            return `A versão ${versao.trim()} (${canal}) já existe. Escolha outro número.`;
        return null;
    }

    async function publicar() {
        const msg = validar();
        if (msg) return toast.warn(msg);

        setErro(null);
        setEnviando(true);
        onUploadingChange(true);
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        try {
            await enviarRelease(
                arquivo!,
                {
                    produtoId: produto.id,
                    versao: versao.trim(),
                    canal,
                    versaoMinima: versaoMinima.trim() || undefined,
                    notas: notas.trim() || undefined,
                },
                setProgresso,
                ctrl.signal
            );
            toast.success(`Versão ${versao.trim()} publicada.`);
            onConcluido();
        } catch (err: any) {
            if (err instanceof UploadCancelado) toast.info('Envio cancelado.');
            else setErro(mensagemErro(err));
            setEnviando(false);
            onUploadingChange(false);
            setProgresso(null);
        }
    }

    const verificando = progresso?.fase === 'verificando';

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0">Nova versão — {produto.nome}</h5>
            </div>

            <fieldset disabled={enviando}>
                <div className="row g-3">
                    <div className="col-12">
                        <Form.Label>Arquivo</Form.Label>
                        <Form.Control type="file" onChange={(e) => {
                            const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                            setArquivo(f);
                        }} />
                        {arquivo && <Form.Text muted>{arquivo.name} — {formatBytes(arquivo.size)}</Form.Text>}
                    </div>
                    <div className="col-md-4">
                        <Form.Label>Versão</Form.Label>
                        <Form.Control value={versao} placeholder="2.3.1" onChange={(e) => setVersao(e.target.value)} />
                        {produto.ultimaVersaoStable && <Form.Text muted>Última estável: {produto.ultimaVersaoStable}</Form.Text>}
                    </div>
                    <div className="col-md-4">
                        <Form.Label>Canal</Form.Label>
                        <Form.Select value={canal} onChange={(e) => setCanal(e.target.value as any)}>
                            <option value="stable">Estável</option>
                            <option value="beta">Beta</option>
                        </Form.Select>
                    </div>
                    <div className="col-md-4">
                        <Form.Label>Versão mínima (opcional)</Form.Label>
                        <Form.Control value={versaoMinima} placeholder="Abaixo disso a atualização é obrigatória"
                            onChange={(e) => setVersaoMinima(e.target.value)} />
                    </div>
                    <div className="col-12">
                        <Form.Label>Notas da versão</Form.Label>
                        <Form.Control as="textarea" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
                    </div>
                </div>
            </fieldset>

            {erro && (
                <Alert variant="danger" className="mt-3 mb-0">
                    <b>Não foi possível publicar:</b> {erro}
                </Alert>
            )}

            {enviando && (
                <div className="mt-4 p-3 border rounded bg-white">
                    {verificando ? (
                        <>
                            <div className="mb-2 fw-semibold">Arquivo enviado. Verificando integridade (SHA-256)…</div>
                            <ProgressBar now={100} animated striped variant="info" label="Finalizando" />
                            <div className="text-muted small mt-2">Em arquivos grandes isso pode levar alguns segundos. Não feche esta janela.</div>
                        </>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-semibold">Enviando…</span>
                                <span className="fw-semibold">{(progresso?.percentual ?? 0).toFixed(1)}%</span>
                            </div>
                            <ProgressBar
                                now={progresso?.percentual ?? 0}
                                animated striped
                                variant="success"
                                style={{ height: 22 }}
                            />
                            <div className="d-flex justify-content-between text-muted small mt-2 flex-wrap gap-2">
                                <span>{formatBytes(progresso?.enviado ?? 0)} de {formatBytes(progresso?.total ?? 0)}</span>
                                <span>
                                    {progresso && progresso.bytesPorSegundo > 0 ? `${formatBytes(progresso.bytesPorSegundo)}/s` : 'calculando velocidade…'}
                                    {' · '}faltam {formatDuracao(progresso?.segundosRestantes ?? null)}
                                </span>
                            </div>
                            {(progresso?.tentativa ?? 1) > 1 && (
                                <div className="text-warning small mt-2">
                                    Conexão instável — retomando (tentativa {progresso?.tentativa}). O que já foi enviado não se perde.
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
                {enviando ? (
                    <CustomButton typeButton="danger" disabled={verificando} onClick={() => abortRef.current?.abort()}>
                        Cancelar envio
                    </CustomButton>
                ) : (
                    <>
                        <CustomButton typeButton="secondary" onClick={onVoltar}>Voltar</CustomButton>
                        <CustomButton typeButton="success" onClick={publicar}>Publicar versão</CustomButton>
                    </>
                )}
            </div>
        </div>
    );
}
