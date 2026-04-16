import { Role } from "@/interfaces/IUsuario";
import { GetServerSidePropsContext } from "next";
import { parseCookies } from "nookies";

// utils/canSSR.ts
export function canSSRAuth(allowedRoles?: Role[]) {
    return async (ctx: GetServerSidePropsContext) => {
        const cookies = parseCookies(ctx);
        const token = cookies['@web_admin.token'];

        if (!token) {
            return { redirect: { destination: '/', permanent: false } };
        }

        // Se passou roles, verifica
        if (allowedRoles?.length) {
            const rolesStr = cookies['@web_admin.roles'];
            const roles: Role[] = rolesStr ? JSON.parse(rolesStr) : [];
            const hasAccess = roles.some(r => allowedRoles.includes(r));

            if (!hasAccess) {
                return { redirect: { destination: '/dashboard', permanent: false } };
            }
        }

        return { props: {} };
    }
}