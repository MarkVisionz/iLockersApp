import React, { useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { BsCheckCircleFill, BsXCircleFill, BsInfoCircleFill } from "react-icons/bs";

const NotificationModal = ({
  isOpen,
  message,
  onClose,
  autoClose = 3000,
  showCloseButton = true,
  onCancel,
  variant = "success"
}) => {
  // Efecto para cierre automático
  useEffect(() => {
    let timer;
    if (isOpen && autoClose) {
      timer = setTimeout(() => {
        onClose?.();
      }, autoClose);
    }
    return () => clearTimeout(timer);
  }, [isOpen, autoClose, onClose]);

  const getIcon = () => {
    switch (variant) {
      case "success": return <BsCheckCircleFill size={40} color="#28a745" />;
      case "error": return <BsXCircleFill size={40} color="#dc3545" />;
      case "info": return <BsInfoCircleFill size={40} color="#17a2b8" />;
      default: return <BsCheckCircleFill size={40} color="#28a745" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // Cierra al hacer clic fuera
        >
          <ModalContent
            as={motion.div}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Previene que el clic se propague al overlay
          >
            <IconContainer>{getIcon()}</IconContainer>
            <Message>{message}</Message>
            <ButtonContainer>
              {onCancel && (
                <Button onClick={onCancel} variant="secondary">
                  Cancelar
                </Button>
              )}
              {showCloseButton && (
                <Button 
                  onClick={onClose} // Cierre manual directo
                  variant={variant}
                  autoFocus
                >
                  Aceptar
                </Button>
              )}
            </ButtonContainer>
          </ModalContent>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
`;

const IconContainer = styled.div`
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  ${({ variant }) =>
    variant === "success"
      ? `
    background-color: #28a745;
    color: white;
    &:hover {
      background-color: #218838;
    }
  `
      : variant === "error"
      ? `
    background-color: #dc3545;
    color: white;
    &:hover {
      background-color: #c82333;
    }
  `
      : variant === "secondary"
      ? `
    background-color: #6c757d;
    color: white;
    &:hover {
      background-color: #5a6268;
    }
  `
      : `
    background-color: #007bff;
    color: white;
    &:hover {
      background-color: #0069d9;
    }
  `}
`;