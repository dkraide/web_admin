import { Tab, Tabs } from 'react-bootstrap';
import PagamentosTab from '@/components/Financeiro/Parceiros/PagamentosTab';
import MensalidadesRepasseTab from '@/components/Financeiro/Parceiros/MensalidadesRepasseTab';
import { canSSRAuth } from '@/utils/CanSSRAuth';

export default function FinanceiroParceiros() {
    return (
        <div style={{ padding: 16 }}>
            <h4>Parceiros — Financeiro</h4>
            <hr />
            <Tabs defaultActiveKey="pagamentos" id="financeiro-parceiros-tabs" className="mb-3">
                <Tab eventKey="pagamentos" title="Pagamentos de Parceiro">
                    <PagamentosTab />
                </Tab>
                <Tab eventKey="mensalidades" title="Mensalidades para repasse">
                    <MensalidadesRepasseTab />
                </Tab>
            </Tabs>
        </div>
    );
}

export const getServerSideProps = canSSRAuth(['ADMINISTRADOR']);
