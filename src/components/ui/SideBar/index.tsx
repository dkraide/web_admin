import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './styles.module.scss';
import { useContext, useEffect, useState } from 'react';
import { faUser, faArrowLeft, faBars, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '@/contexts/AuthContext';
import IUsuario from '@/interfaces/IUsuario';
import Link from 'next/link';
import SelectEmpresa from '@/components/Selects/SelectEmpresa';
import { api } from '@/services/apiClient';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

export default function SideBar({ ...props }) {

    const [user, setUser] = useState<IUsuario | undefined>();
    const [empresa, setEmpresa] = useState(0);
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
    function changeArrow(eventx: HTMLElement) {
        let height = 0;
        const event = eventx.parentNode as HTMLElement;
        const child = event
            .getElementsByTagName('span')[0]
            .getElementsByTagName('div')[0];
        const ul = event
            .getElementsByTagName('ul')[0];
        for (var i = 0; i < ul.children.length; i++) {
            height += ul.children[i].clientHeight + 5;
        }
        if (event.classList.contains(styles.active)) {
            event.classList.remove(styles.active);
            child.classList.remove(styles.activeIcon);
            ul.setAttribute('style', `height:${0}px`);
        } else {
            event.classList.add(styles.active);
            child.classList.add(styles.activeIcon);
            ul.setAttribute('style', `height:${height}px`);
        }
    }
    function openMenu(event: HTMLElement) {
        var parent = event.parentNode?.parentNode as HTMLElement;
        if (parent.classList.contains(styles.activeMenu)) {
            parent.classList.remove(styles.activeMenu);
        } else {
            parent.classList.add(styles.activeMenu);
        }
    }
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
    return (
        <>
            <aside id="sideBar_krd" className={styles.sideBar}>
                <header className={styles.sideBarHeader}>
                    <i onClick={(e) => { openMenu(e.currentTarget) }}><FontAwesomeIcon icon={faBars} /></i>
                    <Link href={`/dashboard`} prefetch={false}><h1>KRD System</h1></Link>
                    <p>Bem vindo, <FontAwesomeIcon onClick={() => { signOut() }} className={styles.icon} icon={faRightFromBracket} /></p>
                    <b>{user?.nome} </b>
                </header>
                <nav>
                    <button>
                        <span onClick={(e) => { changeArrow(e.currentTarget) }}>
                            <i><FontAwesomeIcon color={'#fff'} icon={faUser} /></i>
                            <span>
                                Empresas
                            </span>
                            <div>
                                <i className="icon"><FontAwesomeIcon color={'#fff'} icon={faArrowLeft} /></i>
                            </div>
                        </span>
                        <ul className={styles.ul}>
                            <Link className={styles.li} href={'/empresa'}>
                                <i><FontAwesomeIcon icon={faUser} color={'#fff'} /></i>
                                <span>Empresas</span>
                            </Link>
                            <Link className={styles.li} href={'/backup'}>
                                <i><FontAwesomeIcon icon={faUser} color={'#fff'} /></i>
                                <span>Arquivos</span>
                            </Link>
                        </ul>
                    </button>
                    <button>
                        <span onClick={(e) => { changeArrow(e.currentTarget) }}>
                            <i><FontAwesomeIcon color={'#fff'} icon={faUser} /></i>
                            <span>
                                Usuarios
                            </span>
                            <div>
                                <i className="icon"><FontAwesomeIcon color={'#fff'} icon={faArrowLeft} /></i>
                            </div>
                        </span>
                        <ul className={styles.ul}>
                            <Link className={styles.li} href={'/usuario'}>
                                <i><FontAwesomeIcon icon={faUser} color={'#fff'} /></i>
                                <span>Usuarios</span>
                            </Link>
                        </ul>
                    </button>
                    <button>
                        <span onClick={(e) => { changeArrow(e.currentTarget) }}>
                            <i><FontAwesomeIcon color={'#fff'} icon={faUser} /></i>
                            <span>
                                Financeiro
                            </span>
                            <div>
                                <i className="icon"><FontAwesomeIcon color={'#fff'} icon={faArrowLeft} /></i>
                            </div>
                        </span>
                        <ul className={styles.ul}>
                            <Link className={styles.li} href={'/financeiro'}>
                                <i><FontAwesomeIcon icon={faUser} color={'#fff'} /></i>
                                <span>Duplicatas</span>
                            </Link>
                        </ul>
                    </button>
                </nav>
            </aside>
            <main  {...props} className={styles.main} onClick={() => forceClose()}>

            </main>
        </>
    )
}
