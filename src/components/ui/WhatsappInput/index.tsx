import { useState } from 'react';
import styles from '@/components/ui/InputGroup/styles.module.scss';

interface Props {
    title?: string
    width?: string
    minWidth?: string
    // Valor armazenado em E.164, ex: "+5519999998888"
    value?: string
    onChange: (e164: string) => void
}

// So trabalhamos com empresas brasileiras: o DDI +55 e fixo (hardcoded) e o
// usuario digita apenas DDD + numero. O componente devolve o valor ja em E.164.
const DDI = '55';

// Extrai apenas os digitos de DDD+numero (sem o 55), no maximo 11.
function stripDigits(value?: string): string {
    let d = (value || '').replace(/\D/g, '');
    if (d.startsWith(DDI)) {
        d = d.slice(DDI.length);
    }
    return d.slice(0, 11);
}

// Formata DDD+numero em "(19) 99999-8888" (celular) ou "(19) 9999-8888" (fixo).
function formatNacional(digits: string): string {
    const ddd = digits.slice(0, 2);
    const resto = digits.slice(2);

    if (!ddd) {
        return '';
    }
    if (resto.length === 0) {
        return `(${ddd}`;
    }
    if (resto.length <= 4) {
        return `(${ddd}) ${resto}`;
    }
    if (resto.length <= 8) {
        // Fixo: 4 + 4
        return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
    }
    // Celular: 5 + 4
    return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5, 9)}`;
}

export default function WhatsappInput({ title = 'WhatsApp', width, minWidth, value, onChange }: Props) {
    const [digits, setDigits] = useState<string>(() => stripDigits(value));

    // +55 fica sempre visivel e travado no proprio valor do input.
    const display = `+${DDI} ${formatNacional(digits)}`.trim();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const d = stripDigits(e.target.value);
        setDigits(d);
        onChange(d ? `+${DDI}${d}` : '');
    };

    return (
        <div style={{ width: width || '100%', minWidth }} className={styles['group']}>
            <span className={styles['']}></span>
            <input
                value={display}
                onChange={handleChange}
                inputMode="numeric"
                placeholder="+55 (19) 99999-8888"
            />
            <span className={styles['bar']}></span>
            <label>{title}</label>
        </div>
    );
}
