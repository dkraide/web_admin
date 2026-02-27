// services/chamadoApi.ts
import { api, apiFormData } from './apiClient';

// =============================================
// Types
// =============================================
export const CHAMADO_STATUS = [
  'Aberto',
  'EmAndamento',
  'AguardandoCliente',
  'Resolvido',
  'Fechado',
] as const;

export type ChamadoStatus = (typeof CHAMADO_STATUS)[number];

export const STATUS_LABEL: Record<ChamadoStatus, string> = {
  Aberto:            'Aberto',
  EmAndamento:       'Em Andamento',
  AguardandoCliente: 'Aguardando Cliente',
  Resolvido:         'Resolvido',
  Fechado:           'Fechado',
};

export const STATUS_COR: Record<ChamadoStatus, string> = {
  Aberto:            'primary',
  EmAndamento:       'warning',
  AguardandoCliente: 'info',
  Resolvido:         'success',
  Fechado:           'secondary',
};

export interface ChamadoAnexoDto {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
}

export interface ChamadoEventDto {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface ChamadoDto {
  id: string;
  status: ChamadoStatus;
  title: string;
  description: string | null;
  empresaId: number;
  employerName: string;
  employerContact: string | null;
  userCreateId: string;
  createdAt: string;
  lastUpdated: string;
  events: ChamadoEventDto[];
  anexos: ChamadoAnexoDto[];
}

export interface ChamadoResumoDto {
  id: string;
  status: ChamadoStatus;
  title: string;
  empresaId: number;
  employerName: string;
  userCreateId: string;
  totalEvents: number;
  totalAnexos: number;
  createdAt: string;
  lastUpdated: string;
}

export interface ChamadoCreateDto {
  title: string;
  description?: string | null;
  empresaId: number;
  employerName: string;
  employerContact?: string | null;
  userCreateId: string;
}

export interface ChamadoUpdateDto {
  title: string;
  description?: string | null;
  empresaId: number;
  employerName: string;
  employerContact?: string | null;
}

export interface GetChamadosParams {
  empresaId?: number;
  status?: ChamadoStatus;
  userId?: string;
}

// =============================================
// Chamado
// =============================================
export async function getChamados(params: GetChamadosParams = {}): Promise<ChamadoResumoDto[]> {
  const { data } = await api.get<ChamadoResumoDto[]>('/admin/chamado', {
    params: {
      ...(params.empresaId && { empresaId: params.empresaId }),
      ...(params.status    && { status: params.status }),
      ...(params.userId    && { userId: params.userId }),
    },
  });
  return data;
}

export async function getChamadoById(id: string): Promise<ChamadoDto> {
  const { data } = await api.get<ChamadoDto>(`/admin/chamado/${id}`);
  return data;
}

export async function createChamado(body: ChamadoCreateDto): Promise<ChamadoDto> {
  const { data } = await api.post<ChamadoDto>('/admin/chamado', body);
  return data;
}

export async function updateChamado(id: string, body: ChamadoUpdateDto): Promise<ChamadoDto> {
  const { data } = await api.put<ChamadoDto>(`/admin/chamado/${id}`, body);
  return data;
}

export async function updateChamadoStatus(id: string, status: ChamadoStatus): Promise<ChamadoDto> {
  const { data } = await api.patch<ChamadoDto>(`/admin/chamado/${id}/status`, { status });
  return data;
}

export async function deleteChamado(id: string): Promise<void> {
  await api.delete(`/admin/chamado/${id}`);
}

// =============================================
// Eventos
// =============================================
export async function addChamadoEvent(
  chamadoId: string,
  userId: string,
  message: string
): Promise<ChamadoEventDto> {
  const { data } = await api.post<ChamadoEventDto>(`/admin/chamado/${chamadoId}/events`, {
    userId,
    message,
  });
  return data;
}

// =============================================
// Anexos
// =============================================
export async function uploadChamadoAnexo(
  chamadoId: string,
  file: File
): Promise<ChamadoAnexoDto> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiFormData.post<ChamadoAnexoDto>(
    `/admin/chamado/${chamadoId}/anexos`,
    formData
  );
  return data;
}

export async function deleteChamadoAnexo(chamadoId: string, anexoId: string): Promise<void> {
  await api.delete(`/admin/chamado/${chamadoId}/anexos/${anexoId}`);
}