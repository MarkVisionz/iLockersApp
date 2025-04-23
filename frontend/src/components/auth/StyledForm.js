import styled from "styled-components";
import { motion } from "framer-motion";

// Fondo difuminado detrás del formulario
export const BackgroundWrapper = styled.div`
  height: 100vh;
  background: rgba(222, 221, 221, 0.75);
  backdrop-filter: blur(1px);
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
`;

// Contenedor central del contenido
export const PageWrapper = styled.div`
  height: 80vh;
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;

  @media (max-width: 480px) {
    padding: 1rem;
    height: 90vh;
  }
`;

// Formulario principal
export const Form = styled.form`
  max-height: 90vh;
  max-width: 500px;
  width: 100%;
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  overflow-y: auto;

  h2 {
    color: #007bff;
    font-size: 1.8rem;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  &.shake {
    animation: shake 0.5s;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
  }

  @media (max-width: 480px) {
    padding: 1.5rem;

    h2 {
      font-size: 1.5rem;
    }
  }
`;

// Agrupación de campos
export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  label {
    font-weight: 500;
    color: #333;
  }

  input {
    border: 1px solid #ccc;
    padding: 0.8rem;
    border-radius: 8px;
    font-size: 1rem;
    transition: border 0.2s;

    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    &[aria-invalid="true"] {
      border-color: #dc3545;
    }
  }
`;

// Botón de login o registro
export const ButtonLogin = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background: #0069d9;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #94c3ff;
    cursor: not-allowed;
    opacity: 0.8;
  }
`;

// Texto debajo del formulario
export const SignupPrompt = styled.p`
  text-align: center;
  margin-top: 0.5rem;
  color: #666;

  a {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const PasswordWrapper = styled.div`
  position: relative;

  input {
    width: 100%;
    padding-right: 2.5rem;
  }
`;

export const TogglePasswordButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #007bff;
  }
`;

export const ForgotLink = styled.div`
  text-align: right;
  font-size: 0.9rem;
  margin-top: -0.5rem;

  a {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;
