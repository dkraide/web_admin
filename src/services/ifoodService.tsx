// Ajustes a aplicar no seu src/services/ifoodService.ts existente
// (mantenha os demais métodos que já tem lá, ex: horários/interrupções)

import { api } from "./apiClient";
import {
  IFoodMerchant,
  IFoodIntegracaoStatus,
  IFoodMerchantDetail,
  IFoodStatusLoja,
} from "@/interfaces/ifood";

type ApiResult<T> = { sucesso: boolean; dados: T; erro: string };

export const ifoodService = {
  async listarMerchantsAsync() {
    const { data } = await api.get<ApiResult<IFoodMerchant[]>>(
      `/ifood/merchants`
    );
    return data;
  },

  // CORREÇÃO: retornava IFoodMerchant[] (lista), mas é um único merchant com detalhes
  async obterMerchantAsync(merchantId: string) {
    const { data } = await api.get<ApiResult<IFoodMerchantDetail>>(
      `/ifood/merchants/${merchantId}`
    );
    return data;
  },

  // NOVO: consulta de disponibilidade da loja
  async consultarDisponibilidadeAsync(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodStatusLoja>>(
      `/ifood/empresas/${empresaId}/status-loja`
    );
    return data;
  },

  async listarIntegracoesAsync(empresaId: number) {
    const { data } = await api.get<ApiResult<IFoodIntegracaoStatus[]>>(
      `/ifood/empresas/${empresaId}/integracoes`
    );
    return data;
  },

  // Vincula o merchant a uma empresa KRDSystem (gera a linha em ifood_integracoes)
  async vincularEmpresaAsync(empresaId: number, merchantId: string) {
    const { data } = await api.post<ApiResult<IFoodIntegracaoStatus>>(
      `/ifood/empresas/${empresaId}/integracoes`,
      { merchantId }
    );
    return data;
  },
};
