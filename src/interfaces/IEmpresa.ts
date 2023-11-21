export default interface IEmpresa{
         id: number
         nomeFantasia: string
         optante: string
         razaoSocial: string
         cnpj: string
         inscricaoEstadual: string
         inscricaoMunicipal: string
         endereco: string
         cep: string
         bairro: string
         cidade: string
         uf: string
         codCidade: string
         nro: string
         complemento: string
         usuarioDono: string
         statusPagamento: boolean
         tokenCertificado: string
         versao: number
         liberaBackup: boolean
         dataCriacao: Date
         vendedor: string
         certificado: string
         senhaCertificado: string
         inicioPagamento: Date
         diaCobranca: number
         email: string
         telefone: string
         valorMensal: number
         formaPagamento: string
         isMatriz: boolean
}