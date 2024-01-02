import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import { faUser, faArrowLeft, faBars, faRightFromBracket, faArrowRight, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { Menu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';
import Image from 'next/image';
import { useWindowSize } from 'rooks';

export default function SideBar({ ...props }) {

    const [user, setUser] = useState<IUsuario | undefined>();
    const [empresa, setEmpresa] = useState(0);
    const [collapsed, setCollapsed] = useState(false);
    const { innerWidth } = useWindowSize();
    const [toggled, setToggled] = useState(false);
    const isMobile = innerWidth < 600;

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
    async function updateEmpresa(EmpresaId) {
        if (EmpresaId == user.empresaSelecionada) {
            return;
        }
        await api.put(`/Empresa/SetEmpresa?EmpresaId=${EmpresaId}`)
            .then(({ data }: AxiosResponse) => {
                updateUser(data);
                window.location.reload();
            }).catch((err: AxiosError) => {
                toast.error(`Erro ao atualizar empresa. ${err.response?.data || err.message}`);
            })
    }
    if (!user) {
        return <>
            <main  {...props} className={styles.mainOff} onClick={() => forceClose()}>

            </main>
        </>
    }
    const subMenuStyle = {
        ['& > a']: {
            '&:hover': {
                backgroundColor: 'black'
            },
            '.ps-open': {
                fontWeight: 'bold',
            },
        },
    }

    return (
        <div className={"container-scroller"}>
            <nav className={[styles["navbar"], styles["default-layout-navbar"], styles["col-lg-12"], styles["p-0"], styles["fixed-top"], styles["d-flex"], styles["flex-row"]].join(' ')}>
                {(collapsed || isMobile) ? <>
                    <a href={'/dashboard'} className={styles.center} style={{ width: '40px', cursor: 'pointer' }}>
                        <Image src={'/krd_logo_icon.png'} alt={'krd'} width={35} height={35} />
                    </a>
                </> : <>
                    <a href={'/dashboard'} className={styles.center} style={{ width: '250px', cursor: 'pointer' }}>
                        <Image src={'/krd_logo.png'} alt={'krd'} width={160} height={60} />
                    </a>
                </>}
                <div style={{ marginRight: 'auto' }}>
                    <a className={styles["menu-btn"]} onClick={() => { setCollapsed(!collapsed); setToggled(!toggled) }}><FontAwesomeIcon color={'var(--main)'} icon={faBars} /></a>
                </div>
                <div style={{ marginRight: 'auto', padding: '5px' }}>
                    <SelectEmpresa width={'250px'} selected={user.empresaSelecionada} setSelected={(v) => {
                        updateEmpresa(v);
                    }} />
                </div>
                <div hidden={innerWidth <= 700} style={{ justifyContent: 'flex-end', marginRight: '10px', display: 'flex', flexDirection: 'row' }}>
                    <span style={{ marginRight: '10px' }}>Bem Vindo, <br /><b>{user.nome}</b></span>
                    <a className={styles["menu-btn"]} onClick={signOut}><FontAwesomeIcon icon={faPowerOff} color={'var(--main)'} /></a>
                </div>
            </nav>
            <div className={[styles["container-fluid"], styles["page-body-wrapper"]].join(' ')}>
                <Sidebar
                    collapsed={collapsed}
                    customBreakPoint={"600px"}
                    className={styles.sideBar}
                    onBackdropClick={() => setToggled(false)}
                    toggled={toggled}>
                    <Menu rootStyles={{
                        background: 'white',
                        flex: '1',
                        height: '100%',
                        paddingTop: innerWidth < 700 ? '70px' : '0',
                    }} >
                        <div
                            hidden={innerWidth > 700}
                            style={{
                                padding: '10px 20px',
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between'
                            }}>
                            <span>Bem Vindo, <br /><b>{user.nome}</b></span>
                            <a className={styles["menu-btn"]} onClick={signOut}><FontAwesomeIcon icon={faPowerOff} color={'var(--main)'} /></a>
                        </div>
                        <div style={{ flex: '1' }}>
                            <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faUser} color={'var(--main)'} />} {...props} label="Usuarios">
                                <MenuItem href={'/usuario'} >Usuarios</MenuItem>
                            </SubMenu>
                            <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faUser} color={'var(--main)'} />} label="Financeiro">
                                <MenuItem href={'/financeiro'} > Duplicatas</MenuItem>
                            </SubMenu>
                            <SubMenu rootStyles={subMenuStyle} icon={<FontAwesomeIcon icon={faUser} color={'var(--main)'} />} label="Empresas">
                                <MenuItem href={'/empresa'} >Empresas</MenuItem>
                                <MenuItem href={'/empresa/dados'} >Dados</MenuItem>
                                <MenuItem href={'/backup'} >Arquivos</MenuItem>
                            </SubMenu>
                        </div>
                    </Menu>
                </Sidebar>
                <main  {...props} className={styles['main-panel']}>
                </main>
            </div>
        </div>
    )
}
