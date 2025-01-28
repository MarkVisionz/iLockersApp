import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  clearCart,
  addToCart,
  decreaseCart,
  removeFromCart,
  getTotals,
} from "../features/cartSlice";
import PayButton from "./PayButton";
import {
  AiOutlineArrowLeft,
  AiOutlineDelete,
  AiOutlineMinus,
  AiOutlinePlus,
  AiOutlineShoppingCart,
} from "react-icons/ai";

const Cart = () => {
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getTotals());
  }, [cart, dispatch]);

  const handleIncreaseCart = (cartItem) => {
    dispatch(addToCart(cartItem));
  };

  const handleDecreaseCart = (cartItem) => {
    dispatch(decreaseCart(cartItem));
  };

  const handleRemoveFromCart = (cartItem) => {
    dispatch(removeFromCart(cartItem));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  return (
    <CartWrapper>
      <CartHeader>
        <h1>Your Laundry Bag</h1>
        <p>Review your items before checking out.</p>
      </CartHeader>

      {cart.cartItems.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <AiOutlineShoppingCart size={100} color="#ddd" />
          </EmptyIcon>
          <h2>Your bag is empty!</h2>
          <p>Looks like you haven't added anything yet.</p>
          <StartShopping to="/">
            <AiOutlineArrowLeft size={20} /> Start Shopping
          </StartShopping>
        </EmptyState>
      ) : (
        <Content>
          <TableHeader>
            <div>Product</div>
            <div>Price</div>
            <div>Quantity</div>
            <div>Total</div>
          </TableHeader>

          <CartList>
            {cart.cartItems.map((item) => (
              <CartItem key={item._id}>
                <ProductInfo>
                  <ProductImage src={item.image?.url} alt={item.name} />
                  <ProductTitle>
                    <ProductName>{item.name}</ProductName>
                    <RemoveButton onClick={() => handleRemoveFromCart(item)}>
                      <AiOutlineDelete size={16} /> Remove
                    </RemoveButton>
                  </ProductTitle>
                </ProductInfo>
                <Price>${item.price.toFixed(2)}</Price>
                <Quantity>
                  <QuantityButton onClick={() => handleDecreaseCart(item)}>
                    <AiOutlineMinus />
                  </QuantityButton>
                  <QuantityCount>{item.cartQuantity}</QuantityCount>
                  <QuantityButton onClick={() => handleIncreaseCart(item)}>
                    <AiOutlinePlus />
                  </QuantityButton>
                </Quantity>
                <Total>${(item.cartQuantity * item.price).toFixed(2)}</Total>
              </CartItem>
            ))}
          </CartList>

          <CartFooter>
            <ClearCartButton onClick={handleClearCart}>
              <AiOutlineDelete size={18} /> Clear Bag
            </ClearCartButton>

            <ContinueShopping to="/">
              <AiOutlineArrowLeft size={20} /> Continue Shopping
            </ContinueShopping>
            <CartSummary>
              <SummaryRow>
                <span>Subtotal</span>
                <span>${cart.cartTotalAmount.toFixed(2)}</span>
              </SummaryRow>
              <SummaryRow>
                <span>Taxes/Delivery Calculated at checkout</span>
              </SummaryRow>
              {auth._id ? (
                <PayButtonStyled>
                  <PayButton cartItems={cart.cartItems} />
                </PayButtonStyled>
              ) : (
                <LoginButton onClick={() => navigate("/login")}>
                  Login to Checkout
                </LoginButton>
              )}
            </CartSummary>
          </CartFooter>
        </Content>
      )}
    </CartWrapper>
  );
};

export default Cart;

// Styled Components
const CartWrapper = styled.div`
  max-width: 1200px;
  margin: 1.5rem auto;
  padding: 2rem;
  background: #f8faff;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
`;

const ProductTitle = styled.div`
  text-align: center;
`;

const EmptyIcon = styled.div`
  margin-bottom: 1.5rem;
`;

const CartHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    color: #333;
  }

  p {
    font-size: 1rem;
    color: #555;
  }
`;

const PayButtonStyled = styled.div`
  button {
    background: #28a745;
    color: white;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background: #218838;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
`;

const StartShopping = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.2rem;
  margin-top: 1rem;
  color: #007bff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  align-items: center;

  &:hover {
    color: #0056b3;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  background: #e9ecef;
  padding: 1rem;
  border-radius: 8px;
  font-weight: bold;
  color: #555;
`;

const CartList = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const CartItem = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #ddd;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 1rem;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ProductImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
`;

const ProductName = styled.h3`
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const RemoveButton = styled.button`
  background: none;
  color: #ff6b6b;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    color: #ff1e1e;
  }
`;

const Price = styled.div`
  font-size: 1rem;
  color: #555;
`;

const Quantity = styled.div`
  display: flex;
  align-items: center;
`;

const QuantityButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }
`;

const QuantityCount = styled.div`
  margin: 0 0.5rem;
  font-weight: bold;
`;

const Total = styled.div`
  font-weight: bold;
`;

const CartFooter = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ClearCartButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background: #ff1e1e;
  }
`;

const CartSummary = styled.div`
  margin: 2rem 0;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-evenly;
  padding: 0.5rem 0;
`;

const LoginButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 8px;

  &:hover {
    background: #0056b3;
  }
`;

const ContinueShopping = styled(Link)`
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  color: #007bff;
  text-decoration: none;

  &:hover {
    color: #0056b3;
  }
`;
