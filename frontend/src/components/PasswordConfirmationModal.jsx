import React from "react";
import styled, { keyframes } from "styled-components";

const PasswordConfirmationModal = ({
  showModal,
  handleClose,
  handleConfirm,
  success
}) => {
  const [inputPassword, setInputPassword] = React.useState("");

  const handleSubmit = () => {
    handleConfirm(inputPassword);
    setInputPassword("");
  };

  if (!showModal) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Confirmación de Seguridad</Title>
        <Message>
          Ingresa la contraseña del administrador para continuar:
        </Message>
        <Input
          type="password"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          placeholder="Contraseña"
        />
        <ButtonContainer>
          <ConfirmButton onClick={handleSubmit}>Confirmar</ConfirmButton>
          <CancelButton onClick={handleClose}>Cancelar</CancelButton>
        </ButtonContainer>
        {success && <AnimatedSuccess>✅ Contraseña correcta, nota eliminada.</AnimatedSuccess>}
      </ModalContent>
    </ModalOverlay>
  );
};

export default PasswordConfirmationModal;

const Title = styled.h3`
  color: #007bff;
  font-size: 1.4em;
  margin-bottom: 15px;
`;

const Message = styled.p`
  color: #555;
  font-size: 1.1em;
  margin: 8px 0;
`;

const Input = styled.input`
  padding: 0.6rem;
  font-size: 1rem;
  width: 100%;
  margin: 1rem 0;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
`;

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

const fadeInOut = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
`;

const AnimatedSuccess = styled.div`
  margin-top: 1rem;
  padding: 0.8rem;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  text-align: center;
  animation: ${fadeInOut} 2s ease-in-out forwards;
`;
