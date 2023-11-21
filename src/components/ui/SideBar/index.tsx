import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import { faUser, faArrowLeft, faBars, faRightFromBracket, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import Link from 'next/link';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { Menu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';

export default function SideBar({ ...props }) {

    const [user, setUser] = useState<IUsuario | undefined>();
    const [empresa, setEmpresa] = useState(0);
    const [collapsed, setCollapsed] = useState(false);
    const test = async () => {
        var u = await getUser();
        if (u) {
            setUser(u);
            setEmpresa(u.empresaSelecionada);
        }
    }
    useEffect(() => {
        test();
    }, []);
    const { getUser, signOut, updateUser } = useContext(AuthContext);
    function forceClose() {
        var menu = document.getElementById("sideBar_krd");
        menu?.classList.remove(styles.activeMenu);
    }
    async function updateEmpresa(EmpresaId){
        if(EmpresaId == user.empresaSelecionada){
            return;
        }
        await api.put(`/Empresa/SetEmpresa?EmpresaId=${EmpresaId}`)
        .then(({data}: AxiosResponse) => {
             updateUser(data);
             window.location.reload();
        }).catch((err: AxiosError)=> {
                toast.error(`Erro ao atualizar empresa. ${err.response?.data || err.message}`);
        })
    }
    if (!user) {
        return <>
            <main  {...props} className={styles.mainOff} onClick={() => forceClose()}>

            </main>
        </>
    }
    
    const menuItemStyle = {
        background: 'rgb(5,98,180, 0.35)',
        "&:hover": {
            background: '#fff !important',
        },
    }
    const textcolor = '#039bda';
    
    return (
        <div style={{ display: 'flex', height: '100vh', minHeight: '100% !important' }}>
            <Sidebar collapsed={collapsed} rootStyles={{
                backgroundColor: 'rgb(5,98,180)',

                background: 'linear-gradient(180deg, rgba(4,113,190,1) 17%, rgba(3,135,205,1) 52%, rgba(3,155,218,1) 79%, rgba(0,212,255,1) 100%);',
            }}>
                <Menu>
                    <div className={styles.openClose}>
                        <a onClick={() => { setCollapsed(!collapsed) }}>
                            <FontAwesomeIcon color={textcolor} icon={!collapsed ? faArrowLeft : faArrowRight} size={'2x'}></FontAwesomeIcon>
                        </a>
                    </div>
                    <div style={{ display: collapsed ? 'none' : 'block', padding: '0px 5px' }}>
                        <h2 style={{ color: textcolor, fontWeight: 'bold' }}>KRD System</h2>
                    </div>
                    <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />} {...props} label="Usuarios">
                        <MenuItem href={'/usuario'} style={menuItemStyle}>Usuarios</MenuItem>
                    </SubMenu>
                    <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />}  label="Financeiro">
                        <MenuItem href={'/financeiro'} style={menuItemStyle}> Duplicatas</MenuItem>
                    </SubMenu>
                    <SubMenu icon={<FontAwesomeIcon icon={faUser} color={textcolor} />} label="Empresas">
                        <MenuItem href={'/empresa'} style={menuItemStyle}>Empresas</MenuItem>
                        <MenuItem href={'/backup'} style={menuItemStyle}>Arquivos</MenuItem>
                    </SubMenu>
                </Menu>
            </Sidebar>
            <main  {...props} className={styles.main} onClick={() => forceClose()}>
            </main>
        </div>
    )
}
