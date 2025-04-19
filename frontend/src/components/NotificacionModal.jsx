import React, { useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { BsCheckCircleFill } from "react-icons/bs";

const NotificationModal = ({
  isOpen,
  message,
  onClose,
  autoClose,
  showCloseButton = true,
  onCancel,
  variant,
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContent
            as={motion.div}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {variant === "success" && (
              <IconContainer>
                <BsCheckCircleFill size={40} color="#28a745" />
              </IconContainer>
            )}
            <p>{message}</p>
            <ButtonContainer>
              {showCloseButton && (
                <CloseButton onClick={onClose}>Cerrar</CloseButton>
              )}
              {onCancel && (
                <CancelButton onClick={onCancel}>Cancelar</CancelButton>
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
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);

  p {
    color: #000000;
    margin-bottom: 1rem;
  }
`;

const IconContainer = styled.div`
  margin-bottom: 1rem;
`;

const ButtonContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const CloseButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #0056b3;
  }
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #5a6268;
  }
`;