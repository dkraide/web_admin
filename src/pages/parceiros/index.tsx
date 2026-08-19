import { useContext } from 'react';
import styles from './styles.module.scss';
import { AuthContext } from '@/contexts/AuthContext';
import { Tab, Tabs } from 'react-bootstrap';
import TabEmpresas from '@/components/Parceiros/Tabs/Empresas';
import TabUsuarios from '@/components/Parceiros/Tabs/Usuarios';
import TabFinanceiro from '@/components/Parceiros/Tabs/Financeiro';
import TabSaudeLoja from '@/components/Parceiros/Tabs/SaudeLoja';
import TabChamados from '@/components/Parceiros/Tabs/Chamados';


export default function Parceiros() {
    const { user } = useContext(AuthContext);
    return (
        <div className={styles.container}>
            <h5>Bem vindo, {user?.nome} ao portal de parceiros.</h5>
            <hr/>
            <Tabs
                defaultActiveKey="empresas"
                id="uncontrolled-tab-example"
                className="mb-3"
            >
                <Tab eventKey="saude" title="Saúde das lojas">
                    <TabSaudeLoja/>
                </Tab>
                <Tab eventKey="chamados" title="Chamados">
                    <TabChamados/>
                </Tab>
                <Tab  eventKey="financeiro" title="Financeiro">
                    <TabFinanceiro/>
                </Tab>
                <Tab eventKey="empresas" title="Empresas">
                    <TabEmpresas/>
                </Tab>
                <Tab eventKey="usuarios" title="Usuarios">
                   <TabUsuarios/>
                </Tab>
            </Tabs>
        </div>
    )
}