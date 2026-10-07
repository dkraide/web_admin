import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { api } from "@/services/apiClient";
import Loading from "@/components/Loading";
import CustomButton from "@/components/ui/Buttons";
import BaseModal from "../Base/Index";
import IGrupoEmpresarial, { IGrupoOpcoes, IGrupoSalvar } from "@/interfaces/IGrupoEmpresarial";
import styles from "./styles.module.scss";

interface Props {
    isOpen: boolean
    grupo?: IGrupoEmpresarial   // vazio = novo grupo
    setClose: (recarregar?: boolean) => void
}

function normalizar(t: string) {
    return (t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function GrupoEmpresarialForm({ isOpen, grupo, setClose }: Props) {
    const [opcoes, setOpcoes] = useState<IGrupoOpcoes>({ empresas: [], usuarios: [] });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [titulo, setTitulo] = useState(grupo?.titulo ?? "");
    const [matrizId, setMatrizId] = useState<number>(grupo?.empresaMatrizId ?? 0);
    const [empresaIds, setEmpresaIds] = useState<Set<number>>(new Set(grupo?.empresas.map(e => e.id) ?? []));
    const [usuarioIds, setUsuarioIds] = useState<Set<string>>(new Set(grupo?.usuarios.map(u => u.id) ?? []));
    const [buscaEmpresa, setBuscaEmpresa] = useState("");
    const [buscaUsuario, setBuscaUsuario] = useState("");

    useEffect(() => {
        api.get("/admin/grupo-empresarial/opcoes")
            .then(({ data }) => setOpcoes(data))
            .catch((err: AxiosError) => toast.error(`Erro ao carregar empresas e usuários. ${err.response?.data || err.message}`))
            .finally(() => setLoading(false));
    }, []);

    // loja que já está em OUTRO grupo não pode entrar neste
    const ocupada = (e: { grupoId: string | null }) => !!e.grupoId && e.grupoId !== grupo?.id;

    const empresasFiltradas = useMemo(() => {
        const t = normalizar(buscaEmpresa);
        return opcoes.empresas.filter(e => !t || normalizar(`${e.nomeFantasia} ${e.cnpj} ${e.id}`).includes(t));
    }, [opcoes.empresas, buscaEmpresa]);

    const usuariosFiltrados = useMemo(() => {
        const t = normalizar(buscaUsuario);
        return opcoes.usuarios.filter(u => !t || normalizar(`${u.nome} ${u.userName}`).includes(t));
    }, [opcoes.usuarios, buscaUsuario]);

    function alternarEmpresa(id: number) {
        if (id === matrizId) return; // a matriz sempre fica no grupo
        setEmpresaIds(prev => {
            const novo = new Set(prev);
            novo.has(id) ? novo.delete(id) : novo.add(id);
            return novo;
        });
    }

    function alternarUsuario(id: string) {
        setUsuarioIds(prev => {
            const novo = new Set(prev);
            novo.has(id) ? novo.delete(id) : novo.add(id);
            return novo;
        });
    }

    function escolherMatriz(id: number) {
        setMatrizId(id);
        if (id > 0) setEmpresaIds(prev => new Set(prev).add(id));
    }

    async function salvar() {
        if (!titulo.trim()) return toast.warn("Informe o título do grupo");
        if (matrizId <= 0) return toast.warn("Escolha a empresa matriz");

        const body: IGrupoSalvar = {
            titulo: titulo.trim(),
            empresaMatrizId: matrizId,
            empresaIds: Array.from(empresaIds),
            usuarioIds: Array.from(usuarioIds),
        };

        setSending(true);
        try {
            if (grupo) await api.put(`/admin/grupo-empresarial/${grupo.id}`, body);
            else await api.post("/admin/grupo-empresarial", body);
            toast.success(`Grupo ${grupo ? "atualizado" : "criado"} com sucesso!`);
            setClose(true);
        } catch (e) {
            const err = e as AxiosError;
            toast.error(`Erro ao salvar o grupo. ${typeof err.response?.data === "string" ? err.response.data : err.message}`);
        } finally {
            setSending(false);
        }
    }

    // matriz: só lojas livres (ou que já são deste grupo)
    const candidatasMatriz = opcoes.empresas.filter(e => !ocupada(e));

    return (
        <BaseModal height={"90%"} width={"80%"} title={grupo ? "Editar grupo empresarial" : "Novo grupo empresarial"} isOpen={isOpen} setClose={() => setClose()}>
            {loading ? <Loading /> : (
                <div className={styles.container}>
                    <div className={styles.linha}>
                        <div className={styles.campo} style={{ flex: 2 }}>
                            <label htmlFor="grupo-titulo">Título do grupo</label>
                            <input id="grupo-titulo" className={styles.input} maxLength={100} value={titulo}
                                onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Rede Sabor & Cia" />
                        </div>
                        <div className={styles.campo} style={{ flex: 2 }}>
                            <label htmlFor="grupo-matriz">Empresa matriz</label>
                            <select id="grupo-matriz" className={styles.input} value={matrizId} onChange={(e) => escolherMatriz(Number(e.target.value))}>
                                <option value={0}>Selecione…</option>
                                {candidatasMatriz.map(e => (
                                    <option key={e.id} value={e.id}>{e.id} — {e.nomeFantasia}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.colunas}>
                        <section className={styles.coluna}>
                            <h6>Lojas do grupo ({empresaIds.size})</h6>
                            <input className={styles.input} placeholder="Buscar loja, CNPJ ou código" value={buscaEmpresa}
                                onChange={(e) => setBuscaEmpresa(e.target.value)} aria-label="Buscar loja" />
                            <ul className={styles.lista}>
                                {empresasFiltradas.map(e => {
                                    const bloqueada = ocupada(e);
                                    const ehMatriz = e.id === matrizId;
                                    return (
                                        <li key={e.id} className={bloqueada ? styles.desativado : ""}>
                                            <label>
                                                <input type="checkbox"
                                                    checked={empresaIds.has(e.id)}
                                                    disabled={bloqueada || ehMatriz}
                                                    onChange={() => alternarEmpresa(e.id)} />
                                                <span className={styles.nome}>{e.id} — {e.nomeFantasia}</span>
                                                {ehMatriz && <span className={styles.selo}>Matriz</span>}
                                                {!e.ativa && <span className={`${styles.selo} ${styles.seloAlerta}`}>Bloqueada</span>}
                                                {bloqueada && <span className={`${styles.selo} ${styles.seloAlerta}`}>Já está em “{e.grupoTitulo}”</span>}
                                            </label>
                                            <small>{e.cnpj}</small>
                                        </li>
                                    );
                                })}
                                {empresasFiltradas.length === 0 && <li className={styles.vazio}>Nenhuma loja encontrada</li>}
                            </ul>
                        </section>

                        <section className={styles.coluna}>
                            <h6>Usuários com acesso ({usuarioIds.size})</h6>
                            <input className={styles.input} placeholder="Buscar nome ou usuário" value={buscaUsuario}
                                onChange={(e) => setBuscaUsuario(e.target.value)} aria-label="Buscar usuário" />
                            <ul className={styles.lista}>
                                {usuariosFiltrados.map(u => (
                                    <li key={u.id}>
                                        <label>
                                            <input type="checkbox" checked={usuarioIds.has(u.id)} onChange={() => alternarUsuario(u.id)} />
                                            <span className={styles.nome}>{u.nome || u.userName}</span>
                                        </label>
                                        <small>{u.userName}</small>
                                    </li>
                                ))}
                                {usuariosFiltrados.length === 0 && <li className={styles.vazio}>Nenhum usuário encontrado</li>}
                            </ul>
                            <p className={styles.dica}>
                                Estes usuários entram no painel do franqueado e enxergam todas as lojas do grupo.
                                Só aparecem usuários do tipo cliente.
                            </p>
                        </section>
                    </div>

                    <div className={styles.botoes}>
                        <CustomButton typeButton={"secondary"} onClick={() => setClose()}>Cancelar</CustomButton>
                        <CustomButton typeButton={"dark"} loading={sending} onClick={salvar}>Confirmar</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    );
}
