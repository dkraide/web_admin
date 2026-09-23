import { useEffect, useState } from "react";
import { api } from "@/services/apiClient";
import { AxiosError, AxiosResponse } from "axios";
import Loading from "@/components/Loading";
import { InputGroup } from "@/components/ui/InputGroup";
import { toast } from "react-toastify";
import styles from './styles.module.scss';
import IDuplicata from "@/interfaces/IDuplicata";
import BaseModal from "@/components/Modals/Base/Index";
import CustomButton from "@/components/ui/Buttons";
import { addDays, format } from "date-fns";
import SelectSimNao from "@/components/Selects/SelectSimNao";


interface props {
    isOpen: boolean
    id: number
    setClose: (res?: boolean) => void
    color?: string
}
type emailProps = {
    assunto: string
    corpo: string
    para: string
    enviaBoleto: boolean
    enviaNFSE: boolean
}

type Layout = 'padrao' | 'boleto' | 'nfse'

const layoutOptions: { value: Layout, label: string }[] = [
    { value: 'padrao', label: 'Padrão' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'nfse', label: 'NFS-e' },
]

const estilo = `
    body { font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1); }
    h1 { color: #333; text-align: center; }
    p { font-size: 16px; line-height: 1.6; color: #666; }
    .details { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; }
    .details p { margin: 10px 0; }
    .header { width: 100%; max-width: 700px; margin: 0 auto; display: flex; justify-content: center; text-align: center; }
    .footer { margin-top: 20px; text-align: center; color: #999; font-size: 14px; }
`

function montaEmail(layout: Layout, d: IDuplicata): { assunto: string, corpo: string } {
    const empresa = d.empresa?.nomeFantasia
    const vencimento = format(new Date(d.dataVencimento), 'dd/MM/yy')
    const limite = format(addDays(new Date(d.dataVencimento), 20), 'dd/MM/yy')
    const linkBoleto = `https://pdv.krdsys.tech/api/boleto/impressao?id=${d.id}`

    let assunto = ''
    let titulo = ''
    let conteudo = ''
    if (layout === 'boleto') {
        assunto = 'Seu boleto da KRD System está disponível!'
        titulo = 'Seu boleto está disponível!'
        conteudo = `
             <p>Olá <strong>${empresa}</strong>, seu boleto está disponível!</p>
             <p>Para sua comodidade, o boleto segue anexo a este e-mail e também pode ser acessado pelo link abaixo:</p>
             <div class="details">
               <p><strong>Data de Vencimento:</strong> ${vencimento}</p>
               <p><strong>Valor:</strong> R$ ${d.valor.toFixed(2)}</p>
               <a href="${linkBoleto}">Acesse seu boleto clicando AQUI</a>
             </div>
             <p>Em caso de dúvidas, estamos à disposição.</p>`
    } else if (layout === 'nfse') {
        assunto = 'Sua NFS-e da KRD System está disponível!'
        titulo = 'Sua NFS-e está disponível!'
        conteudo = `
             <p>Olá <strong>${empresa}</strong>, sua NFS-e está disponível!</p>
             <p>A Nota Fiscal de Serviço Eletrônica referente à sua mensalidade segue anexa a este e-mail.</p>
             <div class="details">
               <p><strong>Data de Emissão:</strong> ${format(new Date(d.dataEmissao), 'dd/MM/yy')}</p>
               <p><strong>Valor:</strong> R$ ${d.valor.toFixed(2)}</p>
             </div>
             <p>Em caso de dúvidas, estamos à disposição.</p>`
    } else {
        assunto = 'Sua Fatura da KRD System chegou!'
        titulo = 'Sua Fatura da KRD System chegou'
        conteudo = `
             <p>Olá <strong>${empresa}</strong>,</p>
             <p>Informamos que está disponível a mensalidade referente ao mês e ano. A seguir estão os detalhes:</p>
             <div class="details">
               <p><strong>Data de Vencimento:</strong> ${vencimento}</p>
               <p><strong>Data Limite de Pagamento:</strong> ${limite}</p>
               <p><strong>Valor:</strong> R$ ${d.valor.toFixed(2)}</p>
               <a href="${linkBoleto}">Gere seu boleto clicando AQUI</a>
             </div>
             <p>Por favor, efetue o pagamento até a data limite para evitar que seu sistema seja bloqueado.</p>`
    }

    const corpo = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>${estilo}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://i.imgur.com/c4BTc2E.png" alt="Logo da Empresa" style="max-width:400px;width:50%">
    </div>
    <h1>${titulo}</h1>${conteudo}
    <p>Atenciosamente,</p>
    <p>Equipe KRD System</p>
    <div class="footer">
      <p>Este é um e-mail automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>`
    return { assunto, corpo }
}

export default function EnviarEmailForm({ isOpen, id, setClose, color }: props) {
    const [objeto, setObjeto] = useState<IDuplicata>()
    const [loading, setLoading] = useState<boolean>(true);
    const [layout, setLayout] = useState<Layout>('padrao')
    const [preview, setPreview] = useState<boolean>(true)
    const [email, setEmail] = useState<emailProps>({assunto: '', corpo: '', para: '', enviaBoleto: true, enviaNFSE: true})
    useEffect(() => {
        if (id > 0) {
            api.get(`/Financeiro/Select?id=${id}`)
                .then(({ data }: AxiosResponse) => {
                    setObjeto(data);
                    setLoading(false);
                })
                .catch((err) => {
                    toast.error(`Erro ao buscar dados. ${err.message}`)
                    setLoading(false);
                })
        }
    }, []);

    useEffect(() => {
        if (!objeto) {
            return;
        }
        const { assunto, corpo } = montaEmail(layout, objeto)
        setEmail(prev => ({
            ...prev,
            assunto,
            corpo,
            para: prev.para || objeto?.empresa?.email,
            enviaBoleto: layout !== 'nfse',
            enviaNFSE: layout !== 'boleto' && !!objeto.protocolo,
        }))
    }, [objeto, layout])


    if (!objeto) {
        return <></>
    }

    const handleEnviar = async () => {
        setLoading(true);
        const data = {
           duplicataId: objeto.id,
           para: email.para,
           corpo: email.corpo,
           assunto: email.assunto,
           enviaBoleto: email.enviaBoleto,
           enviaNFSe: email.enviaNFSE
        };
        await api.post(`/Financeiro/SendEmail`, data).then(({data}) => {
            toast.success(`Sucesso!`);
            setClose();
        }).catch((err: AxiosError) => {
            toast.error(`Erro. ${err.response?.data || err.message}`)
        })
        setLoading(false);

    }



    return (
        <BaseModal color={color} title={'Enviar Duplicata por Email'} isOpen={isOpen} setClose={setClose}>
            {loading ? (
                <Loading />
            ) : (
                <div className={styles.container}>
                    <div className={styles.protocolo}>
                        <InputGroup width={'10%'} value={objeto.id} title={'Duplicata'} />
                        <InputGroup width={'50%'} value={objeto.empresa?.nomeFantasia} title={'Cliente'} />
                        <InputGroup width={'10%'} value={format(new Date(objeto.dataEmissao), 'dd/MM/yy')} title={'Emissao'} />
                        <InputGroup width={'15%'} value={format(new Date(objeto.dataVencimento), 'dd/MM/yy')} title={'Vencimento'} />
                        <InputGroup width={'15%'} value={objeto.valor.toFixed(2)} title={'Valor'} />
                    </div>
                    <div className={styles.protocolo}>
                        <InputGroup onChange={({currentTarget}) => {setEmail({...email, para: currentTarget.value})}}  value={email?.para} title={'Para (coloque os emails separados por virgula se for mais de um)'}/>
                    </div>
                    <div className={styles.protocolo}>
                        <InputGroup onChange={({currentTarget}) => {setEmail({...email, assunto: currentTarget.value})}}  width={'50%'} value={email?.assunto} title={'Assunto'}/>
                        <SelectSimNao width={'20%'} selected={email.enviaBoleto} title={'Anexa Boleto'} setSelected={(v) => {setEmail({...email, enviaBoleto: v})}}/>
                        <SelectSimNao width={'20%'} selected={email.enviaNFSE} title={'Anexa NFSe'} setSelected={(v) => {setEmail({...email, enviaNFSE: v})}}/>
                        <div className={styles.layouts}>
                            <span>Layout:</span>
                            {layoutOptions.map(o => (
                                <button key={o.value} type="button"
                                    className={layout === o.value ? styles.ativo : ''}
                                    onClick={() => setLayout(o.value)}>{o.label}</button>
                            ))}
                            <span className={styles.spacer} />
                            <button type="button" className={preview ? styles.ativo : ''} onClick={() => setPreview(true)}>Pré-visualizar</button>
                            <button type="button" className={!preview ? styles.ativo : ''} onClick={() => setPreview(false)}>Editar HTML</button>
                        </div>
                        {preview ? (
                            <iframe className={styles.corpo} title={'Pré-visualização'} sandbox="" srcDoc={email.corpo} />
                        ) : (
                            <textarea onChange={({currentTarget}) => {setEmail({...email, corpo: currentTarget.value})}}  className={styles.corpo}   value={email?.corpo} title={'Corpo'}/>
                        )}
                    </div>
                    <div className={styles.buttons}>
                        <CustomButton style={{height: 40}} onClick={handleEnviar}>Enviar Email</CustomButton>
                    </div>
                </div>
            )}
        </BaseModal>
    )
}