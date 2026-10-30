import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import IEmpresa from "@/interfaces/IEmpresa";
import { ifoodService } from "@/services/ifoodService";
import {
  IFoodMerchant,
  IFoodMerchantDetail,
  IFoodStatusLoja,
} from "@/interfaces/ifood";
import styles from "./styles.module.scss";

export default function IFoodIntegracaoPage() {
  const [merchants, setMerchants] = useState<IFoodMerchant[]>([]);
  const [carregandoMerchants, setCarregandoMerchants] = useState(true);
  const [erroMerchants, setErroMerchants] = useState("");

  const [merchantSelecionado, setMerchantSelecionado] =
    useState<IFoodMerchant | null>(null);
  const [detalhes, setDetalhes] = useState<IFoodMerchantDetail | null>(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [erroDetalhes, setErroDetalhes] = useState("");

  const [disponibilidade, setDisponibilidade] =
    useState<IFoodStatusLoja | null>(null);
  const [carregandoDisponibilidade, setCarregandoDisponibilidade] =
    useState(false);
  const [erroDisponibilidade, setErroDisponibilidade] = useState("");

  const [empresas, setEmpresas] = useState<IEmpresa[]>([]);
  const [vinculos, setVinculos] = useState<Record<string, number>>({});
  const [empresaEscolhida, setEmpresaEscolhida] = useState("");
  const [vinculando, setVinculando] = useState(false);
  const [erroVinculo, setErroVinculo] = useState("");

  useEffect(() => {
    api
      .get<IEmpresa[]>("/Empresa/List")
      .then(({ data }) => setEmpresas(data))
      .catch(() => setErroVinculo("Não foi possível carregar as empresas."));
  }, []);

  const empresaDoMerchant = (merchant: IFoodMerchant | null) =>
    merchant ? vinculos[merchant.id] ?? merchant.empresaId ?? null : null;

  const vincularEmpresa = useCallback(async () => {
    if (!merchantSelecionado || !empresaEscolhida) return;
    setVinculando(true);
    setErroVinculo("");
    try {
      const empresaId = Number(empresaEscolhida);
      const existentes = await ifoodService.listarIntegracoesAsync(empresaId);
      const jaVinculado = (existentes.dados ?? []).some(
        (i) => i.merchantId === merchantSelecionado.id
      );
      if (!jaVinculado) {
        const resposta = await ifoodService.vincularEmpresaAsync(
          empresaId,
          merchantSelecionado.id
        );
        if (!resposta.sucesso) {
          throw new Error(
            resposta.erro || "Não foi possível vincular a empresa."
          );
        }
      }
      setVinculos((prev) => ({ ...prev, [merchantSelecionado.id]: empresaId }));
    } catch (erro) {
      setErroVinculo(
        erro instanceof Error ? erro.message : "Erro ao vincular empresa."
      );
    } finally {
      setVinculando(false);
    }
  }, [merchantSelecionado, empresaEscolhida]);

  const carregarMerchants = useCallback(async () => {
    setCarregandoMerchants(true);
    setErroMerchants("");
    try {
      const resposta = await ifoodService.listarMerchantsAsync();
      if (!resposta.sucesso) {
        throw new Error(resposta.erro || "Não foi possível listar as lojas.");
      }
      setMerchants(resposta.dados ?? []);
    } catch (erro) {
      const mensagem =
        erro instanceof Error ? erro.message : "Erro ao listar lojas.";
      setErroMerchants(mensagem);
    } finally {
      setCarregandoMerchants(false);
    }
  }, []);

  useEffect(() => {
    carregarMerchants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selecionarMerchant = useCallback(
    async (merchant: IFoodMerchant) => {
      setMerchantSelecionado(merchant);
      setDetalhes(null);
      setDisponibilidade(null);
      setErroDetalhes("");
      setErroDisponibilidade("");
      setErroVinculo("");
      setEmpresaEscolhida("");
      setCarregandoDetalhes(true);

      try {
        const resposta = await ifoodService.obterMerchantAsync(merchant.id);
        if (!resposta.sucesso) {
          throw new Error(
            resposta.erro || "Não foi possível obter os detalhes da loja."
          );
        }
        setDetalhes(resposta.dados);
      } catch (erro) {
        const mensagem =
          erro instanceof Error
            ? erro.message
            : "Erro ao obter detalhes da loja.";
        setErroDetalhes(mensagem);
      } finally {
        setCarregandoDetalhes(false);
      }
    },
    []
  );

  const consultarDisponibilidade = useCallback(async () => {
    const empresaId = empresaDoMerchant(merchantSelecionado);
    if (!merchantSelecionado || empresaId == null) return;
    setCarregandoDisponibilidade(true);
    setErroDisponibilidade("");
    try {
      const resposta = await ifoodService.consultarDisponibilidadeAsync(
        empresaId
      );
      if (!resposta.sucesso) {
        throw new Error(
          resposta.erro || "Não foi possível consultar a disponibilidade."
        );
      }
      setDisponibilidade(resposta.dados[0]);
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Erro ao consultar disponibilidade.";
      setErroDisponibilidade(mensagem);
    } finally {
      setCarregandoDisponibilidade(false);
    }
  }, [merchantSelecionado, vinculos]);

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Integrações</span>
        <h1>iFood · Informações da loja</h1>
        <p>
          Lojas vinculadas ao seu sistema, detalhes completos e
          disponibilidade em tempo real.
        </p>
      </header>

      <div className={styles.conteudo}>
        <aside className={styles.listaLojas}>
          <div className={styles.listaCabecalho}>
            <h2>Lojas vinculadas</h2>
            <button
              onClick={carregarMerchants}
              disabled={carregandoMerchants}
              className={styles.botaoSecundario}
            >
              {carregandoMerchants ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {erroMerchants && (
            <div className={styles.alertaErro}>{erroMerchants}</div>
          )}

          {carregandoMerchants ? (
            <div className={styles.carregando}>Carregando lojas...</div>
          ) : merchants.length === 0 ? (
            <div className={styles.vazio}>Nenhuma loja vinculada.</div>
          ) : (
            <ul className={styles.cardsLojas}>
              {merchants.map((merchant) => (
                <li key={merchant.id}>
                  <button
                    className={`${styles.cardLoja} ${
                      merchantSelecionado?.id === merchant.id
                        ? styles.cardLojaAtiva
                        : ""
                    }`}
                    onClick={() => selecionarMerchant(merchant)}
                  >
                    <span className={styles.cardLojaNome}>
                      {merchant.name}
                    </span>
                    <span className={styles.cardLojaRazao}>
                      {merchant.corporateName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className={styles.painelDetalhes}>
          {!merchantSelecionado ? (
            <div className={styles.estadoVazio}>
              Selecione uma loja ao lado para ver os detalhes.
            </div>
          ) : (
            <>
              <div className={styles.painelTopo}>
                <div>
                  <h2>{merchantSelecionado.name}</h2>
                  <span className={styles.subtitulo}>
                    {merchantSelecionado.corporateName}
                  </span>
                </div>
                <button
                  className={styles.botaoPrimario}
                  onClick={consultarDisponibilidade}
                  disabled={carregandoDisponibilidade || empresaDoMerchant(merchantSelecionado) == null}
                >
                  {carregandoDisponibilidade
                    ? "Consultando..."
                    : "Consultar disponibilidade"}
                </button>
              </div>

              <div className={styles.blocoDetalhe}>
                <h3>Empresa KRDSystem</h3>
                {erroVinculo && (
                  <div className={styles.alertaErro}>{erroVinculo}</div>
                )}
                {empresaDoMerchant(merchantSelecionado) != null ? (
                  <p>
                    Vinculada a:{" "}
                    {empresas.find(
                      (e) => e.id === empresaDoMerchant(merchantSelecionado)
                    )?.nomeFantasia ??
                      `Empresa #${empresaDoMerchant(merchantSelecionado)}`}
                  </p>
                ) : (
                  <>
                    <select
                      value={empresaEscolhida}
                      onChange={(e) => setEmpresaEscolhida(e.target.value)}
                    >
                      <option value="">Selecione a empresa</option>
                      {empresas.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nomeFantasia}
                        </option>
                      ))}
                    </select>
                    <button
                      className={styles.botaoPrimario}
                      onClick={vincularEmpresa}
                      disabled={vinculando || !empresaEscolhida}
                    >
                      {vinculando ? "Vinculando..." : "Vincular empresa"}
                    </button>
                  </>
                )}
              </div>

              {erroDisponibilidade && (
                <div className={styles.alertaErro}>{erroDisponibilidade}</div>
              )}

              {disponibilidade && (
                <div
                  className={`${styles.badgeStatus} ${
                    disponibilidade.available
                      ? styles.badgeDisponivel
                      : styles.badgeIndisponivel
                  }`}
                >
                  <span className={styles.badgePonto} />
                  {disponibilidade.available
                    ? "Loja disponível"
                    : "Loja indisponível"}
                  {disponibilidade.state && <span> · {disponibilidade.state}</span>}
                </div>
              )}

              {erroDetalhes && (
                <div className={styles.alertaErro}>{erroDetalhes}</div>
              )}

              {carregandoDetalhes ? (
                <div className={styles.carregando}>
                  Carregando detalhes...
                </div>
              ) : detalhes ? (
                <div className={styles.gradeDetalhes}>
                  <div className={styles.blocoDetalhe}>
                    <h3>Dados gerais</h3>
                    <dl>
                      <dt>Tipo</dt>
                      <dd>{detalhes.type ?? "-"}</dd>
                      <dt>Status</dt>
                      <dd>{detalhes.status ?? "-"}</dd>
                      <dt>Ticket médio</dt>
                      <dd>
                        {detalhes.averageTicket != null
                          ? `R$ ${detalhes.averageTicket.toFixed(2)}`
                          : "-"}
                      </dd>
                      <dt>Exclusiva</dt>
                      <dd>{detalhes.exclusive ? "Sim" : "Não"}</dd>
                      <dt>Criada em</dt>
                      <dd>
                        {detalhes.createdAt
                          ? new Date(detalhes.createdAt).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </dd>
                    </dl>
                    {detalhes.description && (
                      <p className={styles.descricao}>
                        {detalhes.description}
                      </p>
                    )}
                  </div>

                  <div className={styles.blocoDetalhe}>
                    <h3>Endereço</h3>
                    <dl>
                      <dt>Logradouro</dt>
                      <dd>
                        {detalhes.address?.street ?? "-"}
                        {detalhes.address?.number
                          ? `, ${detalhes.address.number}`
                          : ""}
                      </dd>
                      <dt>Bairro</dt>
                      <dd>{detalhes.address?.district ?? "-"}</dd>
                      <dt>Cidade/UF</dt>
                      <dd>
                        {detalhes.address?.city ?? "-"}
                        {detalhes.address?.state
                          ? `/${detalhes.address.state}`
                          : ""}
                      </dd>
                      <dt>CEP</dt>
                      <dd>{detalhes.address?.postalCode ?? "-"}</dd>
                      <dt>País</dt>
                      <dd>{detalhes.address?.country ?? "-"}</dd>
                    </dl>
                  </div>

                  <div className={styles.blocoDetalhe}>
                    <h3>Operação</h3>
                    <dl>
                      <dt>Nome</dt>
                      <dd>{detalhes.operations?.name ?? "-"}</dd>
                      <dt>Canal de vendas</dt>
                      <dd>
                        {detalhes.operations?.salesChannel?.name ?? "-"}
                      </dd>
                      <dt>Habilitado</dt>
                      <dd>
                        {detalhes.operations?.salesChannel?.enabled ?? "-"}
                      </dd>
                    </dl>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </main>

      </div>
    </div>
  );
}