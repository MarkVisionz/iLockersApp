// LoadingAndError.js
import React from 'react';
import styled from 'styled-components';


// Componente LoadingSpinner
const LoadingSpinner = ({ message }) => {
  return (
    <SpinnerContainer>
      {message}
    </SpinnerContainer>
  );
};

// Componente ErrorMessage
const ErrorMessage = ({ message }) => {
  return (
    <StyledErrorMessage>
      {message}
    </StyledErrorMessage>
  );
};

// Exportar ambos componentes
export { LoadingSpinner, ErrorMessage };


// Estilos para el LoadingSpinner
const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #007bff; /* Color del texto del spinner */
  margin: 20px 0; /* Espaciado alrededor del spinner */

  &::before {
    content: '';
    border: 4px solid rgba(0, 123, 255, 0.3); /* Color del borde del spinner */
    border-radius: 50%;
    border-top-color: #007bff; /* Color del borde superior */
    width: 20px; /* Ancho del spinner */
    height: 20px; /* Alto del spinner */
    animation: spin 0.6s linear infinite; /* Animación de rotación */
    margin-right: 10px; /* Espaciado entre el spinner y el texto */
  }

  @keyframes spin {
    to {
      transform: rotate(360deg); /* Rotación completa */
    }
  }
`;

// Estilos para el ErrorMessage
const StyledErrorMessage = styled.div`
  color: red; /* Color del texto de error */
  font-size: 14px; /* Tamaño de fuente */
  margin-top: 5px; /* Espaciado superior */
  margin-bottom: 5px; /* Espaciado inferior */
  background-color: #f8d7da; /* Fondo claro para el mensaje de error */
  border: 1px solid #f5c6cb; /* Borde del mensaje de error */
  border-radius: 4px; /* Bordes redondeados */
  padding: 10px; /* Espaciado interno */
`;