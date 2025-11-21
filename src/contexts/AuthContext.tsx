import { createContext, ReactNode, useState, useEffect } from "react";
import { destroyCookie, setCookie, parseCookies } from 'nookies';
import Router from 'next/router';
import { api } from "../services/apiClient";
import { toast } from "react-toastify";
import IUsuario from "@/interfaces/IUsuario";

type AuthContextData = {
    signIn: (credentials: SignInProps) => Promise<void>;
    signOut: () => void;
    signUp: (credentials: SignUpPropos) => Promise<void>;
    getUser: () => Promise<IUsuario | undefined>;
    user?: IUsuario;
    updateUser: (user) => Promise<void>;
}
type SignInProps = {
    userName: string;
    password: string;
}
type SignUpPropos = {
    name: string;
    userName: string;
    password: string;
}
type AuthProviderProps = {
    children: ReactNode
}

export const AuthContext = createContext({} as AuthContextData)


export function signOut() {
    try {
        console.log('caiu aqui');
        destroyCookie(undefined, '@web_admin.token', {
            path: '/'
        });
        destroyCookie(undefined, '@web_admin.user', {
            path: '/'
        });
        destroyCookie(undefined, '@web_admin.admin', {
            path: '/'
        });
        sessionStorage.removeItem('user');
        window.location.href = "/";
        //Router.push('/pedidos');
    } catch {
        console.log('erro ao deslogar');
    }
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<IUsuario>();
    async function signIn({ userName, password }: SignInProps) {
        try {
            const response = await api.post('/User/Login', {
                email: userName,
                password,
                source: 'web_admin'
            });
            const { token, nome, empresaId, empresas } = response.data;
            var user = {
                userName,
                nome,
                empresaSelecionada: empresaId,
            }
            setCookie(undefined, '@web_admin.token', token, {
                maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
                path: "/" //quais caminhos terao acesso aos cookies
            });
            if (userName.toLowerCase() == 'dkraide') {
                setCookie(undefined, '@web_admin.admin', token, {
                    maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
                    path: "/" //quais caminhos terao acesso aos cookies
                });
            }
            setCookie(undefined, '@web_admin.user', JSON.stringify(user), {
                maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
                path: "/" //quais caminhos terao acesso aos cookies
            });
            setCookie(undefined, '@web_admin.empresas', JSON.stringify(empresas), {
                maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
                path: "/" //quais caminhos terao acesso aos cookies
            });
            api.defaults.headers['Authorization'] = `Bearer ${token}`;
            toast.success('Logado com sucesso');
            window.location.reload();
            Router.push('/dashboard');
        } catch (err: any) {
            console.log(err);
            toast.error(`Erro ao Acessar: ${err.toString()}`);
        }
    }

    async function signUp({ name, userName, password }: SignUpPropos) {
        try {
            const response = await api.post('/users', {
                name,
                userName,
                password
            });
            toast.success('Conta criada com sucesso')
            Router.push('/');
        } catch (err) {
            toast.error("Erro ao acessar");
        }
    }

    async function getUser(): Promise<IUsuario | undefined> {
        var cookies = parseCookies(undefined);
        var userStr = cookies['@web_admin.user'];
        if (!userStr) {
            return undefined;
        }
        const u =  JSON.parse(userStr) as IUsuario;
        setUser(u);
        return u; 
    }
    async function updateUser(user: IUsuario): Promise<void> {
        setCookie(undefined, '@web_admin.user', JSON.stringify(user), {
            maxAge: 60 * 60 * 24 * 30, //expirar em 1 mes,
            path: "/" //quais caminhos terao acesso aos cookies
        });
    }


    return (
        <AuthContext.Provider value={{ updateUser, getUser, signIn, signOut, signUp, user }}>
            {children}
        </AuthContext.Provider>
    )
}