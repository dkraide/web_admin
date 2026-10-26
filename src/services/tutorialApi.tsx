// services/tutorialApi.tsx
import { api } from './apiClient';

export const TUTORIAL_SISTEMAS = ['PDV', 'WEB', 'DELIVERY', 'SELF', 'GARCOM', 'OFICINA'] as const;

export interface TutorialResumoDto {
  id: number;
  sistema: string;
  ordem: number;
  modulo: string;
  titulo: string;
  slug: string;
  resumo?: string;
  temVideo: boolean;
  publicado: boolean;
  updatedAt?: string;
}

export interface TutorialDto {
  id: number;
  sistema: string;
  modulo: string;
  titulo: string;
  slug?: string;
  resumo?: string;
  corpo?: string;
  urlVideo?: string;
  transcricaoVideo?: string;
  ordem: number;
  publicado: boolean;
}

export async function getTutoriais(): Promise<TutorialResumoDto[]> {
  const { data } = await api.get<TutorialResumoDto[]>('/admin/Tutorial');
  return data;
}

export async function getTutorialById(id: number | string): Promise<TutorialDto> {
  const { data } = await api.get<TutorialDto>(`/admin/Tutorial/${id}`);
  return data;
}

export async function saveTutorial(dto: TutorialDto): Promise<{ id: number; slug: string }> {
  const { data } = dto.id
    ? await api.put(`/admin/Tutorial/${dto.id}`, dto)
    : await api.post('/admin/Tutorial', dto);
  return data;
}

export async function uploadImagemTutorial(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const { data } = await api.post<{ url: string }>('/admin/Tutorial/UploadImagem', body);
  return data.url;
}

export interface TutorialGeradoDto {
  titulo: string;
  resumo: string;
  corpo: string;
}

export async function gerarTutorialComIA(transcricao: string, sistema: string, modulo: string): Promise<TutorialGeradoDto> {
  const { data } = await api.post<TutorialGeradoDto>(
    '/admin/Tutorial/GerarComIA',
    { transcricao, sistema, modulo },
    { timeout: 120000 },
  );
  return data;
}

export async function deleteTutorial(id: number): Promise<void> {
  await api.delete(`/admin/Tutorial/${id}`);
}
