import React from "react";
import styled from "styled-components";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingAndError";

const ConfirmationModal = ({
  showModal,
  handleClose,
  handleSubmit,
  name,
  total,
  phoneNumber,
  countryCode,
  onPhoneChange,
  onCountryCodeChange,
  loading,
  error,
  folio,
}) => {
  if (!showModal) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Confirmar Nota</Title>
        <InfoText>
          <strong>Cliente:</strong> {name}
        </InfoText>
        <InfoText>
          <strong>Folio:</strong> {folio}
        </InfoText>
        <InfoText>
          <strong>Total:</strong> ${total.toFixed(2)}
        </InfoText>

        {loading ? (
          <LoadingSpinner message="Guardando..." />
        ) : (
          <>
            <PhoneContainer>
              <SelectCountry
                value={countryCode}
                onChange={(e) => onCountryCodeChange(e.target.value)}
              >
                <option value="52">🇲🇽 +52</option>
                <option value="1">🇺🇸 +1</option>
              </SelectCountry>
              <StyledInput
                type="tel"
                value={phoneNumber}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="Número de teléfono"
              />
            </PhoneContainer>

            {error && <ErrorMessage message={error} />}

            <ButtonContainer>
              <ConfirmButton onClick={handleSubmit}>Confirmar</ConfirmButton>
              <CancelButton onClick={handleClose}>Cancelar</CancelButton>
            </ButtonContainer>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

// Estilos (usando tus estilos originales con pequeñas adaptaciones)
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

const Title = styled.h3`
  color: #007bff;
  font-size: 1.4em;
  margin-bottom: 15px;
`;

const InfoText = styled.p`
  color: #555;
  font-size: 1.1em;
  margin: 8px 0;
  text-align: center;
`;

const PhoneContainer = styled.div`
  display: flex;
  gap: 10px; /* Espacio entre elementos */
  margin: 20px 0;
  align-items: center; /* Alinea verticalmente */
`;

const SelectCountry = styled.select`
  padding: 10px;
  border: 2px solid #007bff;
  border-radius: 8px;
  color: #333;
  font-size: 1em;
  outline: none;
  cursor: pointer;
  transition: border-color 0.3s ease;
  flex: 1; /* Ocupa espacio disponible */
  max-width: 120px; /* Ancho máximo para el select */

  &:focus {
    border-color: #0056b3;
  }
`;

const StyledInput = styled.input`
  padding: 10px;
  border: 2px solid #007bff;
  border-radius: 8px;
  font-size: 1em;
  outline: none;
  color: #333;
  transition: border-color 0.3s ease;
  flex: 3; /* Ocupa más espacio que el select */
  min-width: 0; /* Permite que se reduzca */

  &:focus {
    border-color: #0056b3;
  }

  /* Estilos para placeholder */
  &::placeholder {
    color: #999;
    text-align: left;
    padding-left: 5px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
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
  flex: 1;
  margin-right: 10px;

  &:hover {
    background: #0056b3;
  }
`;

const CancelButton = styled(ConfirmButton)`
  background: #dc3545;
  margin-right: 0;

  &:hover {
    background: #b02a37;
  }
`;


export default ConfirmationModal;