import { createContext, ReactNode, useState } from "react";
import { destroyCookie, setCookie, parseCookies } from 'nookies';
import Router from 'next/router';
import { api } from "../services/apiClient";
import { toast } from "react-toastify";
import IUsuario from "@/interfaces/IUsuario";

type Role = 'ADMINISTRADOR' | 'SUPERVISOR' | 'SUPORTE';

type AuthContextData = {
    signIn: (credentials: SignInProps) => Promise<void>;
    signOut: () => void;
    signUp: (credentials: SignUpPropos) => Promise<void>;
    getUser: () => Promise<IUsuario | undefined>;
    user?: IUsuario;
    updateUser: (user: IUsuario) => Promise<void>;
    isInRole: (roles: Role | Role[]) => boolean;
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
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function signOut() {
    try {
        destroyCookie(undefined, '@web_admin.token', { path: '/' });
        destroyCookie(undefined, '@web_admin.user', { path: '/' });
        destroyCookie(undefined, '@web_admin.roles', { path: '/' }); // trocou @web_admin.admin
        sessionStorage.removeItem('user');
        window.location.href = "/";
    } catch {
        console.log('erro ao deslogar');
    }
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<IUsuario>();

    function isInRole(roles: Role | Role[]): boolean {
        const cookies = parseCookies(undefined);
        const rolesStr = cookies['@web_admin.roles'];
        if (!rolesStr) return false;

        const userRoles: Role[] = JSON.parse(rolesStr);
        const check = Array.isArray(roles) ? roles : [roles];
        return userRoles.some(r => check.includes(r));
    }

    async function signIn({ userName, password }: SignInProps) {
        try {
            const response = await api.post('/User/Login', {
                email: userName,
                password,
            });

            const { token, nome, empresaId, empresas, roles } = response.data;

            // Bloqueia cliente antes de qualquer cookie
            const rolesUpper: Role[] = (roles as string[]).map(r => r.toUpperCase() as Role);
            const allowedRoles: Role[] = ['ADMINISTRADOR', 'SUPERVISOR', 'SUPORTE'];
            const hasAccess = rolesUpper.some(r => allowedRoles.includes(r));

            if (!hasAccess) {
                toast.error('Você não tem permissão para acessar esta área.');
                return;
            }

            const user: IUsuario = {
                userName,
                nome,
                empresaSelecionada: empresaId,
                roles: rolesUpper,
            };

            setCookie(undefined, '@web_admin.token', token, {
                maxAge: 60 * 60 * 24 * 30,
                path: "/"
            });
            setCookie(undefined, '@web_admin.user', JSON.stringify(user), {
                maxAge: 60 * 60 * 24 * 30,
                path: "/"
            });
            setCookie(undefined, '@web_admin.roles', JSON.stringify(rolesUpper), {
                maxAge: 60 * 60 * 24 * 30,
                path: "/"
            });
            setCookie(undefined, '@web_admin.empresas', JSON.stringify(empresas), {
                maxAge: 60 * 60 * 24 * 30,
                path: "/"
            });

            api.defaults.headers['Authorization'] = `Bearer ${token}`;
            toast.success('Logado com sucesso');
            window.location.href = "/dashboard";
            // Router.push('/dashboard');
        } catch (err: any) {
            toast.error(`Erro ao Acessar: ${err.toString()}`);
        }
    }

    async function signUp({ name, userName, password }: SignUpPropos) {
        try {
            await api.post('/users', { name, userName, password });
            toast.success('Conta criada com sucesso');
            Router.push('/');
        } catch {
            toast.error("Erro ao acessar");
        }
    }

    async function getUser(): Promise<IUsuario | undefined> {
        const cookies = parseCookies(undefined);
        const userStr = cookies['@web_admin.user'];
        if (!userStr) return undefined;

        const u = JSON.parse(userStr) as IUsuario;
        setUser(u);
        return u;
    }

    async function updateUser(user: IUsuario): Promise<void> {
        setCookie(undefined, '@web_admin.user', JSON.stringify(user), {
            maxAge: 60 * 60 * 24 * 30,
            path: "/"
        });
    }

    return (
        <AuthContext.Provider value={{ updateUser, getUser, signIn, signOut, signUp, user, isInRole }}>
            {children}
        </AuthContext.Provider>
    )
}