import { useCallback, useEffect, useState } from "react";
import { ifoodService } from "@/services/ifoodService";
import {
  IFoodMerchant,
  IFoodMerchantDetail,
  IFoodStatusLoja,
} from "@/interfaces/ifood";
import styles from "./styles.module.scss";

type LogEntrada = {
  id: string;
  acao: string;
  detalhes?: string;
  data: string;
};

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

  const [logs, setLogs] = useState<LogEntrada[]>([]);

  // Grava cada etapa do processo: no histórico local (visível ao usuário)
  // e no backend, para auditoria (ver observação sobre ifoodService.registrarLogAsync).
  const registrarLog = useCallback(
    async (acao: string, merchantId?: string, detalhesLog?: string) => {
      const entrada: LogEntrada = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        acao,
        detalhes: detalhesLog,
        data: new Date().toLocaleString("pt-BR"),
      };
      setLogs((prev) => [entrada, ...prev]);

      try {
        await ifoodService.registrarLogAsync({
          merchantId: merchantId ?? "",
          acao,
          detalhes: detalhesLog,
        });
      } catch {
        // Falha ao gravar o log não deve travar o fluxo do usuário.
      }
    },
    []
  );

  const carregarMerchants = useCallback(async () => {
    setCarregandoMerchants(true);
    setErroMerchants("");
    try {
      const resposta = await ifoodService.listarMerchantsAsync();
      if (!resposta.sucesso) {
        throw new Error(resposta.erro || "Não foi possível listar as lojas.");
      }
      setMerchants(resposta.dados ?? []);
      await registrarLog(
        "Listagem de lojas vinculadas",
        undefined,
        `${resposta.dados?.length ?? 0} loja(s) encontrada(s)`
      );
    } catch (erro) {
      const mensagem =
        erro instanceof Error ? erro.message : "Erro ao listar lojas.";
      setErroMerchants(mensagem);
      await registrarLog("Falha ao listar lojas", undefined, mensagem);
    } finally {
      setCarregandoMerchants(false);
    }
  }, [registrarLog]);

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
      setCarregandoDetalhes(true);

      try {
        const resposta = await ifoodService.obterMerchantAsync(merchant.id);
        if (!resposta.sucesso) {
          throw new Error(
            resposta.erro || "Não foi possível obter os detalhes da loja."
          );
        }
        setDetalhes(resposta.dados);
        await registrarLog(
          "Consulta de detalhes da loja",
          merchant.id,
          merchant.name
        );
      } catch (erro) {
        const mensagem =
          erro instanceof Error
            ? erro.message
            : "Erro ao obter detalhes da loja.";
        setErroDetalhes(mensagem);
        await registrarLog(
          "Falha ao consultar detalhes da loja",
          merchant.id,
          mensagem
        );
      } finally {
        setCarregandoDetalhes(false);
      }
    },
    [registrarLog]
  );

  const consultarDisponibilidade = useCallback(async () => {
    if (!merchantSelecionado) return;
    setCarregandoDisponibilidade(true);
    setErroDisponibilidade("");
    try {
      const resposta = await ifoodService.consultarDisponibilidadeAsync(
        merchantSelecionado.id
      );
      console.log("Resposta da disponibilidade:", resposta);
      if (!resposta.sucesso) {
        throw new Error(
          resposta.erro || "Não foi possível consultar a disponibilidade."
        );
      }
      setDisponibilidade(resposta.dados[0]);
      await registrarLog(
        "Consulta de disponibilidade",
        merchantSelecionado.id,
        merchantSelecionado.name
      );
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Erro ao consultar disponibilidade.";
      setErroDisponibilidade(mensagem);
      await registrarLog(
        "Falha ao consultar disponibilidade",
        merchantSelecionado.id,
        mensagem
      );
    } finally {
      setCarregandoDisponibilidade(false);
    }
  }, [merchantSelecionado, registrarLog]);

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
                  disabled={carregandoDisponibilidade}
                >
                  {carregandoDisponibilidade
                    ? "Consultando..."
                    : "Consultar disponibilidade"}
                </button>
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

        <aside className={styles.painelLogs}>
          <h2>Histórico da sessão</h2>
          {logs.length === 0 ? (
            <div className={styles.vazio}>Nenhuma ação registrada ainda.</div>
          ) : (
            <ul className={styles.listaLogs}>
              {logs.map((log) => (
                <li key={log.id} className={styles.itemLog}>
                  <span className={styles.itemLogData}>{log.data}</span>
                  <span className={styles.itemLogAcao}>{log.acao}</span>
                  {log.detalhes && (
                    <span className={styles.itemLogDetalhes}>
                      {log.detalhes}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}