import axios from "axios";
import { useSelector } from "react-redux";
import { url } from "../features/api";
import styled from "styled-components";

const PayButton = ({ cartItems }) => {
  const user = useSelector((state) => state.auth);

  const handleCheckout = () => {
    axios
      .post(`${url}/stripe/create-checkout-session`, {
        cartItems,
        userId: user._id,
      })
      .then((response) => {
        if (response.data.url) {
          window.location.href = response.data.url;
        }
      })
      .catch((err) => console.log(err.message));
  };

  return <CheckoutButton onClick={handleCheckout}>Pagar Ahora</CheckoutButton>;
};

export default PayButton;

const CheckoutButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: #218838;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    &:active {
      transform: scale(0.98);
    }
    padding: 0.5rem;
    font-size: 0.95rem;
  }
`;
