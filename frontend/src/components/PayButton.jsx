import axios from "axios";
import { useSelector } from "react-redux";
import { url } from "../features/api";
import styled from "styled-components";
import { useState } from "react";

const PayButton = ({ 
  cartItems, 
  isGuest, 
  onCheckout, 
  children, 
  disabled,
  contactInfo
}) => {
  const user = useSelector((state) => state.auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Usar onCheckout si viene (preferido)
      if (onCheckout) {
        await onCheckout();
        return;
      }

      if (!cartItems || cartItems.length === 0) {
        throw new Error("El carrito está vacío");
      }

      const requestData = {
        cartItems: cartItems.map(item => ({
          id: item._id, // 🔥 corregido aquí
          name: item.name,
          price: item.price,
          cartQuantity: item.cartQuantity,
          image: item.image?.url ? { url: item.image.url } : null
        })),
        userId: isGuest ? null : user._id,
        guestId: isGuest ? user.guestId || null : null,
        contact: isGuest ? {
          email: contactInfo?.email || `guest-${Date.now()}@example.com`,
          name: contactInfo?.name || "Invitado",
          phone: contactInfo?.phone || null
        } : null
      };

      const response = await axios.post(
        `${url}/stripe/create-checkout-session`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No se recibió URL de checkout");
      }
    } catch (err) {
      console.error("Error en checkout:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Error al procesar el pago. Intente nuevamente."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {error && (
        <ErrorMessage>
          {error}
          <RetryButton onClick={handleCheckout}>Reintentar</RetryButton>
        </ErrorMessage>
      )}
      <CheckoutButton 
        onClick={handleCheckout} 
        disabled={disabled || isProcessing}
      >
        {isProcessing ? "Procesando..." : children}
      </CheckoutButton>
    </>
  );
};

export default PayButton;

// Estilos
const CheckoutButton = styled.button`
  background-color: ${props => props.disabled ? '#6c757d' : '#28a745'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  width: 100%;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: ${props => props.disabled ? '#6c757d' : '#218838'};
    box-shadow: ${props => props.disabled ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'};
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RetryButton = styled.button`
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #dc3545;
    color: white;
  }
`;
