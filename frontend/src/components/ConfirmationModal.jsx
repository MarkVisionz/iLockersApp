import React from "react";
import styled from "styled-components";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingAndError";

const ConfirmationModal = ({
  showModal,
  handleClose,
  handleSubmit,
  name,
  calculatedTotal,
  countryCodes,
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  loading,
  submitError,
  folio,
  services,
  date,
  isPaid,
  observations,
  transformServices,
}) => {
  // Función para formatear el nombre del servicio
  const formatServiceName = (serviceName) => {
    return serviceName
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]{2,})([a-z])/g, "$1 $2")
      .replace(/([a-z])([0-9])/g, "$1 $2")
      .replace(/([0-9])([a-z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  // Función para generar el mensaje de WhatsApp
  const generateWhatsAppMessage = (transformedServices) => {
    const servicesDetails = Object.entries(transformedServices)
      .flatMap(([service, details]) => {
        if (details.quantity > 0) {
          return [
            `👋 ${formatServiceName(service)} - Cantidad: ${
              details.quantity
            }, Precio U: $${details.unitPrice} = $${
              details.quantity * details.unitPrice
            }`,
          ];
        } else if (typeof details === "object") {
          return Object.entries(details)
            .filter(([_, subDetails]) => subDetails.quantity > 0)
            .map(
              ([subType, subDetails]) =>
                `\uD83D\uDECF️ ${formatServiceName(
                  service
                )} (${subType}) - Cantidad: ${
                  subDetails.quantity
                }, Precio U: $${subDetails.unitPrice} = $${
                  subDetails.quantity * subDetails.unitPrice
                }`
            );
        }
        return [];
      })
      .join("\n");

    return (
      `😀 Hola, ${name}!\nAquí están los detalles de tu nota:\n\n` +
      `\uD83D\uDCDC Folio: ${folio}\n` +
      `\uD83D\uDED2 Servicios:\n${servicesDetails}\n` +
      `\uD83D\uDCC5 Fecha: ${date}\n` +
      `\uD83D\uDCB0 Total: $${calculatedTotal.toFixed(2)}\n` +
      `\u2705 Pagado: ${isPaid ? "Sí" : "No"}\n` +
      `\uD83D\uDDC2 Observaciones: ${observations}\n` +
      `\uD83D\uDCDE Número Registrado: +${countryCode}${phoneNumber}\n\n` +
      `Gracias por elegirnos!\n\n`
    );
  };

  const openWhatsApp = (transformedServices) => {
    const message = generateWhatsAppMessage(transformedServices);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${countryCode}${phoneNumber}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  const handleConfirm = async () => {
    const transformedServices = transformServices();
    await handleSubmit();
    openWhatsApp(transformedServices);
  };

  if (!showModal) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Hola!, ¿A qué número mandamos tu orden?</Title>
        <InfoText>Nombre del Cliente: {name}</InfoText>
        <InfoText>Total: ${calculatedTotal.toFixed(2)}</InfoText>

        {loading ? (
          <LoadingSpinner message="Guardando..." />
        ) : (
          <>
            <SelectCountry
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              {countryCodes.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </SelectCountry>
            <StyledInput
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="1234567890"
            />
            {submitError && <ErrorMessage message={submitError} />}
            <ButtonContainer>
              <StyledButton onClick={handleConfirm}>Confirmar</StyledButton>
              <CancelButton onClick={handleClose}>Cancelar</CancelButton>
            </ButtonContainer>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

// Estilos
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
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px;
  margin: 15px 0;
  font-size: 1em;
  border: 2px solid #007bff;
  border-radius: 8px;
  outline: none;
  color: #333;
  text-align: center;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #0056b3;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const StyledButton = styled.button`
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

const CancelButton = styled(StyledButton)`
  background: #dc3545;
  margin-right: 0;

  &:hover {
    background: #b02a37;
  }
`;

const SelectCountry = styled.select`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 2px solid #007bff;
  border-radius: 8px;
  color: #333;
  font-size: 1em;
  outline: none;
  cursor: pointer;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #0056b3;
  }
`;

export default ConfirmationModal;