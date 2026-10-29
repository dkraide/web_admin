import { Tab, Tabs } from 'react-bootstrap';
import TefContratosTab from '@/components/Financeiro/Tef/TefContratosTab';
import TefPlanosTab from '@/components/Financeiro/Tef/TefPlanosTab';
import TefDespesasTab from '@/components/Financeiro/Tef/TefDespesasTab';
import TefMargemTab from '@/components/Financeiro/Tef/TefMargemTab';
import { canSSRAuth } from '@/utils/CanSSRAuth';

export default function FinanceiroTef() {
    return (
        <div style={{ padding: 16 }}>
            <h4>TEF — Planos, contratos e custos</h4>
            <hr />
            <Tabs defaultActiveKey="contratos" id="financeiro-tef-tabs" className="mb-3" mountOnEnter>
                <Tab eventKey="contratos" title="Contratos">
                    <TefContratosTab />
                </Tab>
                <Tab eventKey="planos" title="Planos">
                    <TefPlanosTab />
                </Tab>
                <Tab eventKey="despesas" title="Despesas da KRD">
                    <TefDespesasTab />
                </Tab>
                <Tab eventKey="margem" title="Margem">
                    <TefMargemTab />
                </Tab>
            </Tabs>
        </div>
    );
}

export const getServerSideProps = canSSRAuth(['ADMINISTRADOR']);
