export default interface IUsuario{
    id: string
    nome: string
    userName: string
    empresaSelecionada: number
    isContador: boolean
    cpf?: string
    email?: string
    telefone?: string
}