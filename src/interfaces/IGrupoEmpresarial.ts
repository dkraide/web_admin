export interface IGrupoEmpresa {
    id: number
    nomeFantasia: string
    cnpj: string
}

export interface IGrupoUsuario {
    id: string
    userName: string
    nome: string
}

export default interface IGrupoEmpresarial {
    id: string
    titulo: string
    empresaMatrizId: number
    empresas: IGrupoEmpresa[]
    usuarios: IGrupoUsuario[]
}

// loja que pode entrar em um grupo; grupoId preenchido = já pertence a outro grupo
export interface IGrupoEmpresaOpcao extends IGrupoEmpresa {
    isMatriz: boolean
    ativa: boolean
    grupoId: string | null
    grupoTitulo: string | null
}

export interface IGrupoOpcoes {
    empresas: IGrupoEmpresaOpcao[]
    usuarios: IGrupoUsuario[]
}

export interface IGrupoSalvar {
    titulo: string
    empresaMatrizId: number
    empresaIds: number[]
    usuarioIds: string[]
}
