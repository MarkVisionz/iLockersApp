// src/components/modals/GuestCheckoutModal.jsx
import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineClose } from "react-icons/ai";

const GuestCheckoutModal = ({ isOpen, onLogin, onGuest, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ModalContainer
            as={motion.div}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <CloseButton onClick={onClose}>
              <AiOutlineClose />
            </CloseButton>
            <Title>¿Cómo quieres continuar?</Title>
            <Description>
              Puedes iniciar sesión para una mejor experiencia o continuar como invitado.
            </Description>
            <ButtonGroup>
              <ActionButton onClick={onLogin}>Iniciar sesión</ActionButton>
              <GuestButton onClick={onGuest}>Continuar como invitado</GuestButton>
            </ButtonGroup>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default GuestCheckoutModal;

// Estilos
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  position: relative;
  text-align: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;

  &:hover {
    color: #333;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #007bff;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #555;
  margin-bottom: 2rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }
`;

const GuestButton = styled.button`
  padding: 0.75rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #218838;
  }
`;
