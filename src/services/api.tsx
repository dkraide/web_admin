import axios, { AxiosError } from 'axios';
import { parseCookies } from 'nookies';
import { AuthTokenError } from './errors/AuthTokenError';
import { signOut } from '../contexts/AuthContext';

export function setupAPIClient(ctx = undefined) {
    let cookies = parseCookies(ctx);

    const api = axios.create({
      baseURL: 'https://pdv.krdsys.tech/api',
     //   baseURL: 'http://localhost:7000/api',
        headers: {
            Authorization: `Bearer ${cookies['@web_admin.token']}`,
        }
    });
    api.interceptors.response.use(response => {
        return response;
    }, (error: AxiosError) => {
        if (error.response?.status === 401) {
            //qualquer erro 401 devemos deslogar o usuario
            if (typeof window !== undefined) {
                //Chamar a funcao para deslogar o usuario
                signOut();
            } else {
                return Promise.reject(new AuthTokenError())
            }
        }

        return Promise.reject(error);
    })

    return api;

}