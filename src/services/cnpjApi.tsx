import axios from "axios";
import IEmpresa from "@/interfaces/IEmpresa";

export async function buscarEmpresaPorCnpj(cnpj: string): Promise<IEmpresa | null> {
    try {

        // Remove máscara
        const cnpjLimpo = cnpj.replace(/\D/g, "");

        const response = await axios.get(
            `https://publica.cnpj.ws/cnpj/${cnpjLimpo}`
        );

        const data = response.data;

        const empresa: IEmpresa = {
            id: 0, // será gerado pelo backend
            nomeFantasia: data.estabelecimento?.nome_fantasia ?? "",
            razaoSocial: data.razao_social ?? "",
            cnpj: cnpjLimpo,
            optante: data.simples?.optante ? "Sim" : "Não",

            inscricaoEstadual: data.estabelecimento?.inscricoes_estaduais?.[0]?.inscricao_estadual ?? "",
            inscricaoMunicipal: "",

            endereco: data.estabelecimento?.logradouro ?? "",
            nro: data.estabelecimento?.numero ?? "",
            complemento: data.estabelecimento?.complemento ?? "",
            bairro: data.estabelecimento?.bairro ?? "",
            cep: data.estabelecimento?.cep ?? "",
            cidade: data.estabelecimento?.cidade?.nome ?? "",
            codCidade: data.estabelecimento?.cidade?.ibge ?? "",
            uf: data.estabelecimento?.estado?.sigla ?? "",

            email: data.estabelecimento?.email ?? "",
            telefone: data.estabelecimento?.telefone1 ?? "",

            // Campos que não vêm da API
            usuarioDono: "",
            statusPagamento: true,
            tokenCertificado: "",
            versao: 1,
            liberaBackup: false,
            dataCriacao: new Date(),
            vendedor: "",
            certificado: "",
            senhaCertificado: "",
            inicioPagamento: new Date(),
            diaCobranca: 0,
            valorMensal: 0,
            formaPagamento: "",
            isMatriz: data.estabelecimento?.matriz,
            assessoria: false,
            usuarioContador: "",
            usuarioSupervisor: "",
            valorKrd: 0
        };

        return empresa;

    } catch (error) {
        console.error("Erro ao consultar CNPJ:", error);
        return null;
    }
}
