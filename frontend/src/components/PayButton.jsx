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

  return <CheckoutButton onClick={handleCheckout}>Check out</CheckoutButton>;
};

export default PayButton;

const CheckoutButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  cursor: pointer;
  width: 100%;
  transition: background 0.3s ease;

  &:hover {
    background: #218838;
  }
`;
