// Ajustes a aplicar no seu src/services/ifoodService.ts existente
// (mantenha os demais métodos que já tem lá, ex: horários/interrupções)

import { api } from "./apiClient";
import {
  IFoodMerchant,
  IFoodMerchantDetail, // <- usar este tipo, não IFoodMerchant[]
  IFoodStatusLoja,
} from "@/interfaces/ifood";

type ApiResult<T> = { sucesso: boolean; dados: T; erro: string };

// Adicionar em interfaces/ifood.ts (ou onde ficam os DTOs de request):
export interface IFoodRegistrarLogDto {
  merchantId: string;
  acao: string;
  detalhes?: string;
}

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
  async consultarDisponibilidadeAsync(merchantId: string) {
    const { data } = await api.get<ApiResult<IFoodStatusLoja>>(
      `/ifood/empresas/0/integracoes/${merchantId}/status-loja`
    );
    return data;
  },

  // NOVO: grava, no backend, cada ação realizada no processo (auditoria)
  async registrarLogAsync(log: IFoodRegistrarLogDto) {
    const { data } = await api.post<ApiResult<boolean>>(`/ifood/logs`, log);
    return data;
  },
};