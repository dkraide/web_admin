import React, { FC, useRef, useLayoutEffect, useState } from 'react';

// Interface para definir os tipos das propriedades do componente
interface CircleProgressBarProps {
  /** Porcentagem de preenchimento (0 a 100). (OBRIGATÓRIO) */
  percentage: number;
  /** Texto a ser exibido no centro do círculo. (OBRIGATÓRIO) */
  centerText: string;

  // NOVOS PARÂMETROS
  /** Tamanho total (largura/altura) do componente em pixels. Padrão: 200. (OPCIONAL) */
  size?: number;
  /** Descrição que aparece abaixo da barra. (OPCIONAL) */
  description?: string;

  // PARÂMETROS EXISTENTES
  /** Cor da barra de progresso. Padrão: '#4caf50'. (OPCIONAL) */
  barColor?: string;
  /** Espessura da barra de progresso. Padrão: 10. (OPCIONAL) */
  barThickness?: number;
}

const CircleProgressBar: FC<CircleProgressBarProps> = ({
  percentage,
  centerText,
  size = 200,
  description,
  barColor = '#4caf50',
  barThickness = 10,
}) => {
  const normalizedPercentage = Math.min(100, Math.max(0, percentage));

  // Hooks para Referência e Estado
  const textRef = useRef<SVGTextElement>(null);
  // Tamanho de fonte padrão inicial (baseado na sua proporção anterior)
  const initialFontSize = size * 0.25;
  const [adjustedFontSize, setAdjustedFontSize] = useState(initialFontSize);

  const strokeMargin = 2;
  const radius = (size / 2) - (barThickness / 2) - strokeMargin;
  const viewboxCenter = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (normalizedPercentage / 100) * circumference;

  // Largura máxima disponível: 80% do diâmetro para deixar margem nas bordas
  const availableWidth = radius * 2 * 0.8;

  useLayoutEffect(() => {
    if (!textRef.current) return;

    const textWidth = textRef.current.getBBox().width;

    // Se estiver maior do que a área disponível → reduz
    if (textWidth > availableWidth) {
      const scaleFactor = availableWidth / textWidth;
      const newFontSize = adjustedFontSize * scaleFactor;

      if (newFontSize !== adjustedFontSize) {
        setAdjustedFontSize(newFontSize);
      }
    }

    // ❗ NUNCA aumenta novamente automático.
    // Evita loop infinito e comportamentos estranhos.
  }, [centerText, size]);


  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: `${size}px`,
      height: 'auto',
      textAlign: 'center'
    }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`} // Viewbox dinâmico
        >
          {/* Círculo de fundo (trilha) */}
          <circle
            cx={viewboxCenter}
            cy={viewboxCenter}
            r={radius}
            fill="transparent"
            stroke="#e0e0e0"
            strokeWidth={barThickness}
          />

          {/* Círculo de progresso */}
          <circle
            cx={viewboxCenter}
            cy={viewboxCenter}
            r={radius}
            fill="transparent"
            stroke={barColor}
            strokeWidth={barThickness}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
          />

          {/* Texto central (centerText) com ajuste dinâmico */}
          <text
            ref={textRef} // Referência para medir o texto
            x={viewboxCenter}
            y={viewboxCenter}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={`${adjustedFontSize}px`} // Usa o tamanho de fonte ajustado
            fontWeight="bold"
            fill="#333"
            // O estilo 'whiteSpace: nowrap' garante que a string seja tratada como uma linha única
            style={{ whiteSpace: 'nowrap', transition: 'font-size 0.1s ease-out' }}
          >
            {centerText}
          </text>
        </svg>
      </div>

      {/* Descrição abaixo da barra */}
      {description && (
        <p style={{
          marginTop: '10px',
          fontSize: size * 0.15, // Ajustei para um tamanho mais comum (0.08)
          color: '#555',
          maxWidth: `${size}px`
        }}>
          {description}
        </p>
      )}
    </div>
  );
};

export default CircleProgressBar;