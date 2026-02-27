// services/pesquisaSatisfacaoApi.ts

import { api } from "./apiClient";

// =============================================
// Types
// =============================================
export interface PesquisaItemDto {
  id: number;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
}

export interface PesquisaItemCreateDto {
  nome: string;
  descricao?: string | null;
  ordem: number;
  ativo?: boolean;
}

export interface PesquisaItemUpdateDto {
  nome: string;
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
}

export interface PesquisaItemNotaDto {
  pesquisaItemId: number;
  nota: number; // 0–10
}

export interface PesquisaSatisfacaoCreateDto {
  horarioRealizado: string; // ISO 8601
  usuarioId: string;
  empresaId: number;
  itens: PesquisaItemNotaDto[];
  feedbackMelhoria?: string | null;
  feedbackCritica?: string | null;
  feedbackElogio?: string | null;
}

export type PesquisaSatisfacaoUpdateDto = PesquisaSatisfacaoCreateDto;

export interface PesquisaSatisfacaoItemDto {
  pesquisaItemId: number;
  nomeItem: string;
  nota: number;
}

export interface PesquisaSatisfacaoDto {
  id: number;
  horarioRealizado: string;
  usuarioId: string;
  empresaId: number;
  itens: PesquisaSatisfacaoItemDto[];
  feedbackMelhoria: string | null;
  feedbackCritica: string | null;
  feedbackElogio: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PesquisaSatisfacaoResumoDto {
  id: number;
  horarioRealizado: string;
  usuarioId: string;
  empresaId: number;
  mediaGeral: number;
  criadoEm: string;
}

export interface GetPesquisasParams {
  empresaId?: number;
  usuarioId?: string;
}

// =============================================
// PesquisaItem
// =============================================
export async function getPesquisaItens(apenasAtivos = true): Promise<PesquisaItemDto[]> {
  const { data } = await api.get<PesquisaItemDto[]>('admin/pesquisaitem', { params: { apenasAtivos } });
  return data;
}

export async function createPesquisaItem(body: PesquisaItemCreateDto): Promise<PesquisaItemDto> {
  const { data } = await api.post<PesquisaItemDto>('admin/pesquisaitem', body);
  return data;
}

export async function updatePesquisaItem(id: number, body: PesquisaItemUpdateDto): Promise<PesquisaItemDto> {
  const { data } = await api.put<PesquisaItemDto>(`admin/pesquisaitem/${id}`, body);
  return data;
}

export async function deletePesquisaItem(id: number): Promise<void> {
  await api.delete(`/pesquisaitem/${id}`);
}

// =============================================
// PesquisaSatisfacao
// =============================================
export async function getPesquisas(params: GetPesquisasParams = {}): Promise<PesquisaSatisfacaoResumoDto[]> {
  const { empresaId, usuarioId } = params;
  const { data } = await api.get<PesquisaSatisfacaoResumoDto[]>('admin/pesquisasatisfacao', {
    params: {
      ...(empresaId && { empresaId }),
      ...(usuarioId && { usuarioId }),
    },
  });
  return data;
}

export async function getPesquisaById(id: number): Promise<PesquisaSatisfacaoDto> {
  const { data } = await api.get<PesquisaSatisfacaoDto>(`admin/pesquisasatisfacao/${id}`);
  return data;
}

export async function createPesquisa(body: PesquisaSatisfacaoCreateDto): Promise<PesquisaSatisfacaoDto> {
  const { data } = await api.post<PesquisaSatisfacaoDto>('admin/pesquisasatisfacao', body);
  return data;
}

export async function updatePesquisa(id: number, body: PesquisaSatisfacaoUpdateDto): Promise<PesquisaSatisfacaoDto> {
  const { data } = await api.put<PesquisaSatisfacaoDto>(`admin/pesquisasatisfacao/${id}`, body);
  return data;
}

export async function deletePesquisa(id: number): Promise<void> {
  await api.delete(`/pesquisasatisfacao/${id}`);
}