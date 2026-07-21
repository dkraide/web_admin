export interface IFoodIntegracaoStatus {
  empresaId: number;
  merchantId: string | null;
  status: 0 | 1 | 2 | 3; // 0=Pendente, 1=Ativo, 2=Erro, 3=Revogado
  expiresAt: string | null;
  tokenValido: boolean;
}

export interface IFoodUserCode {
  verificationUrl: string;
  authorizationCodeVerifier: string;
}

export interface IFoodAutorizarDto {
  authorizationCode: string; // verifier fica no backend agora
}
export interface IFoodIntegracaoStatus {
  empresaId: number;
  merchantId: string | null;
  status: 0 | 1 | 2 | 3;
  expiresAt: string | null;
  tokenValido: boolean;
}

export interface IFoodAutorizarDto {
  authorizationCode: string;
}

export interface IFoodUserCode {
  verificationUrl: string;
  authorizationCodeVerifier: string;
}

export interface IFoodMerchant {
  id: string;
  name: string;
  corporateName: string;
}

export interface IFoodStatusMessage {
  title: string;
  subtitle: string;
  description: string;
}

export interface IFoodValidacao {
  id: string;
  code: string;
  state: "OK" | "WARNING" | "CLOSED" | "ERROR";
  message: IFoodStatusMessage | null;
}

export interface IFoodStatusLoja {
  operation: string;
  salesChannel: string;
  available: boolean;
  state: "OK" | "WARNING" | "CLOSED" | "ERROR";
  message: IFoodStatusMessage;
  validations: IFoodValidacao[];
}

export interface IFoodInterrupcao {
  id: string;
  description: string;
  start: string;
  end: string;
}

export interface IFoodCriarInterrupcaoDto {
  description: string;
  start: string;
  end: string;
}

export interface IFoodHorario {
  id: string | null;
  dayOfWeek: string;
  start: string;
  duration: number;
}

export interface IFoodAtualizarHorariosDto {
  shifts: IFoodHorario[];
}

export interface IFoodMerchantDetail {
  id: string | null;
  name?: string | null;
  corporateName?: string | null;
  description?: string | null;
  averageTicket?: number | null;
  exclusive?: boolean | null;
  type?: string | null;
  status?: string | null;
  createdAt?: string | null;
  address?: IFoodAddress | null;
  operations?: IFoodOperation | null;
}

export interface IFoodAddress {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  district?: string | null;
  street?: string | null;
  number?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface IFoodOperation {
  name?: string | null;
  salesChannel?: IFoodSalesChannel | null;
}

export interface IFoodSalesChannel {
  name?: string | null;
  enabled?: string | null;
}