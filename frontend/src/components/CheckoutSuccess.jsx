import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { clearCart, getTotals } from "../features/cartSlice";
import { Link } from "react-router-dom";
import { AiOutlineCheckCircle } from "react-icons/ai";

const CheckoutSuccess = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(clearCart());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getTotals());
  }, [cart, dispatch]);

  return (
    <Container>
      <SuccessIcon>
        <AiOutlineCheckCircle />
      </SuccessIcon>
      <Title>¡Pago exitoso!</Title>
      <Subtitle>Tu orden está siendo procesada.</Subtitle>
      <Message>Te notificaremos una vez que tu ropa este lista!</Message>
      <SupportText>
        ¿Tienes alguna duda? Escríbenos a{" "}
        <strong>support@easylaundry.com</strong>
      </SupportText>
      <StyledLink to="/">Regresar al inicio</StyledLink>
    </Container>
  );
};

export default CheckoutSuccess;

// Styled Components
const Container = styled.div`
  min-height: 80vh;
  max-width: 500px;
  width: 100%;
  margin: auto;
  margin-top: 2rem;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  animation: fadeInScale 0.8s ease forwards;

  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: scale(0.95);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (max-width: 768px) {
    padding: 2rem 1rem;
    margin-top: 2rem;
  }
`;


const SuccessIcon = styled.div`
  font-size: 4rem;
  color: #28a745;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  color: #28a745;
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.h4`
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #555;
  font-size: 1rem;
  margin-bottom: 0.5rem;
`;

const SupportText = styled.p`
  font-size: 0.9rem;
  color: #777;
  margin-top: 1rem;
`;

const StyledLink = styled(Link)`
  margin-top: 2rem;
  padding: 0.75rem 2rem;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  transition: background 0.3s ease, transform 0.2s ease;

  &:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;
