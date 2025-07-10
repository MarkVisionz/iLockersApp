import React from "react";
import styled from "styled-components";

const SimpleConfirmationModal = ({
  showModal,
  handleClose,
  handleConfirm,
  userName,
  itemType,
}) => {
  if (!showModal) return null;

  const getMessage = () => {
    switch (itemType) {
      case "producto":
        return `¿Estás seguro de eliminar este producto: ${userName}?`;
      case "usuario":
        return `¿Estás seguro de eliminar este usuario: ${userName}?`;
      case "negocio":
        return `¿Estás seguro de eliminar este negocio: ${userName}?\nEsto eliminará todas las notas y servicios asociados.`;
      default:
        return `¿Estás seguro de eliminar este elemento: ${userName}?`;
    }
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <Message>{getMessage()}</Message>
        <ButtonContainer>
          <ConfirmButton onClick={handleConfirm}>Confirmar</ConfirmButton>
          <CancelButton onClick={handleClose}>Cancelar</CancelButton>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background-color: #f9f9f9;
  padding: 30px;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
  color: #333;
`;

const Message = styled.p`
  color: #555;
  font-size: 1.1em;
  margin: 8px 0;
  white-space: pre-line; /* Respeta los saltos de línea */
  line-height: 1.5; /* Mejora la legibilidad */
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  margin-top: 20px;
`;

const ConfirmButton = styled.button`
  background: #007bff;
  color: white;
  font-size: 1em;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #0056b3;
  }
`;

const CancelButton = styled(ConfirmButton)`
  background: #dc3545;

  &:hover {
    background: #b02a37;
  }
`;

export default SimpleConfirmationModal;
