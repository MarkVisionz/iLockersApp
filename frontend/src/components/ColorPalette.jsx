// ColorPalette.jsx
import React from 'react';
import styled from 'styled-components';
import colors from './colors'; // Asegúrate de importar tu archivo de colores

const ColorPaletteContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 2rem 0;
`;

const ColorBox = styled.div`
  width: 200px;  /* Aumenté el ancho para mostrar mejor el degradado */
  height: 100px; /* Aumenté la altura para mostrar mejor el degradado */
  margin: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: white; /* Color del texto en el cuadro */
  font-weight: bold;
  text-align: center;
`;

const ColorCode = styled.span`
  margin-top: 5px;
`;

const ColorPalette = () => {
  const gradients = [
    { name: "Primary Gradient", value: "linear-gradient(45deg, #4b70e2, #3a5bb8)" },
    { name: "Success Gradient", value: "linear-gradient(45deg, #28a745, #218838)" },
    { name: "Warning Gradient", value: "linear-gradient(45deg, #ffcc00, #e0a800)" },
    { name: "Error Gradient", value: "linear-gradient(45deg, red, darkred)" },
  ];

  return (
    <ColorPaletteContainer>
      {gradients.map((gradient, index) => (
        <ColorBox key={index} style={{ background: gradient.value }}>
          <ColorCode>{gradient.name}</ColorCode>
          <ColorCode>{gradient.value}</ColorCode>
        </ColorBox>
      ))}
    </ColorPaletteContainer>
  );
};

export default ColorPalette;