import { useDispatch, useSelector } from "react-redux";
import { addToCart, clearCart, decreaseCart, removeFromCart, getTotals } from "../features/cartSlice";
import styled from "styled-components";
import {
  AiOutlinePlus,
  AiOutlineMinus,
  AiOutlineShoppingCart,
  AiOutlineDelete,
  AiOutlineMenu,
  AiOutlineClose,
} from "react-icons/ai";
import { useEffect, useState } from "react";
import PayButton from "./PayButton";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner, ErrorMessage } from "./LoadingAndError";

const Cart = () => {
  const { items: products, status } = useSelector((state) => state.products);
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [quantities, setQuantities] = useState({});
  const [cartVisible, setCartVisible] = useState(true);

  useEffect(() => {
    dispatch(getTotals());
  }, [cart.cartItems, dispatch]);

  const handleManualQuantityChange = (productId, value) => {
    const parsed = parseInt(value);
    setQuantities((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) || parsed < 1 ? 1 : parsed,
    }));
  };

  const handleClickQuantity = (productId, type) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const newQty = type === "increase" ? current + 1 : Math.max(1, current - 1);
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToCart = (product) => {
    const quantity = quantities[product._id] || 1;
    for (let i = 0; i < quantity; i++) {
      dispatch(addToCart(product));
    }
    setQuantities((prev) => ({ ...prev, [product._id]: 1 }));
  };

  const handleRemove = (item) => dispatch(removeFromCart(item));
  const handleIncrease = (item) => dispatch(addToCart(item));
  const handleDecrease = (item) => dispatch(decreaseCart(item));
  const handleClearCart = () => dispatch(clearCart());

  return (
    <HomeWrapper>
      <Header>
        <h2>Explora nuestros productos</h2>
        <p>Agrega tu ropa sin salir de casa</p>
      </Header>

      <ResponsiveWrapper>
        <ToggleButton onClick={() => setCartVisible(!cartVisible)}>
          {cartVisible ? <AiOutlineClose /> : <AiOutlineMenu />}
        </ToggleButton>

        {cartVisible && (
          <CartSidebar>
            <CartHeader>
              <AiOutlineShoppingCart /> Carrito
            </CartHeader>
            {cart.cartItems.length === 0 ? (
              <p>Tu carrito está vacío.</p>
            ) : (
              <>
                {cart.cartItems.map((item) => (
                  <CartItem key={item._id}>
                    <span>{item.name}</span>
                    <Quantity>
                      <QtyButton onClick={() => handleDecrease(item)}>
                        <AiOutlineMinus />
                      </QtyButton>
                      <QtyCount>{item.cartQuantity}</QtyCount>
                      <QtyButton onClick={() => handleIncrease(item)}>
                        <AiOutlinePlus />
                      </QtyButton>
                      <RemoveBtn onClick={() => handleRemove(item)}>
                        <AiOutlineDelete />
                      </RemoveBtn>
                    </Quantity>
                  </CartItem>
                ))}
                <TotalRow>
                  <span>Total:</span>
                  <span>$ {cart.cartTotalAmount.toFixed(2)}</span>
                </TotalRow>
                {auth._id ? (
                  <PayButton cartItems={cart.cartItems} />
                ) : (
                  <LoginBtn onClick={() => navigate("/login")}>Inicia sesión para pagar</LoginBtn>
                )}
                <ClearCartBtn onClick={handleClearCart}>
                  <AiOutlineDelete /> Vaciar carrito
                </ClearCartBtn>
              </>
            )}
          </CartSidebar>
        )}

        <Grid>
          {status === "success" ? (
            products.map((product) => (
              <Card key={product._id}>
                <ImageWrapper>
                  <img src={product.image?.url} alt={product.name} />
                </ImageWrapper>
                <Info>
                  <Name>{product.name}</Name>
                  <Weight>Peso Unitario: {product.weight}g</Weight>
                  <Price>Precio: $ {product.price.toFixed(2)}</Price>
                  <QuantityControls>
                    <QtyButton onClick={() => handleClickQuantity(product._id, "decrease")}>
                      <AiOutlineMinus />
                    </QtyButton>
                    <QtyInput
                      type="number"
                      min="1"
                      value={quantities[product._id] || 1}
                      onChange={(e) => handleManualQuantityChange(product._id, e.target.value)}
                    />
                    <QtyButton onClick={() => handleClickQuantity(product._id, "increase")}>
                      <AiOutlinePlus />
                    </QtyButton>
                  </QuantityControls>
                  <AddButton onClick={() => handleAddToCart(product)}>
                    Agregar al carrito
                  </AddButton>
                </Info>
              </Card>
            ))
          ) : status === "pending" ? (
            <LoadingSpinner message={"Cargando productos..."}></LoadingSpinner>
          ) : (
            <ErrorMessage message={"Error al cargar productos"}></ErrorMessage>
          )}
        </Grid>
      </ResponsiveWrapper>
    </HomeWrapper>
  );
};

export default Cart;

// COMPONENTES DE ESTILO

const HomeWrapper = styled.div`
  padding: 2rem;
  background-color: #f4f6f8;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  h2 {
    color: #007bff;
  }

  p {
    color: #666;
  }
`;

const ResponsiveWrapper = styled.div`
  display: flex;
  flex-direction: row-reverse;
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CartSidebar = styled.div`
  width: 300px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 6rem;
  max-height: calc(100vh - 6rem);
  overflow-y: auto;
  align-self: flex-start;
  z-index: 1;

  @media (max-width: 768px) {
    position: static;
    max-height: none;
    width: 100%;
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: #f9f9f9;
  }
`;

const CartHeader = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #333;
`;

const CartItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    color: #c82333;
    transform: scale(1.05);
  }
`;

const ClearCartBtn = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #c82333;
    transform: scale(1.05);
  }
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-weight: bold;
  color: #444;
`;

const LoginBtn = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background: #0056b3;
    transform: scale(1.05);
  }
`;

const Quantity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Grid = styled.div`
  flex: 2;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    width: 100%;
  }
`;

const Card = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const ImageWrapper = styled.div`
  img {
    width: 100%;
    height: 140px;
    object-fit: contain;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Name = styled.h3`
  font-size: 1.1rem;
  color: #333;
`;

const Weight = styled.span`
  color: #777;
`;

const Price = styled.span`
  font-weight: bold;
  color: #444;
`;

const QuantityControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
`;

const QtyButton = styled.button`
  padding: 0.4rem;
  border: none;
  border-radius: 6px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;

  &:hover {
    background: #0056b3;
  }
`;

const QtyCount = styled.span`
  min-width: 20px;
  text-align: center;
`;

const QtyInput = styled.input`
  width: 3rem;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.3rem;
  font-size: 1rem;
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const AddButton = styled.button`
  background: #28a745;
  color: white;
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background: #218838;
    transform: scale(1.05);
  }
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  margin-bottom: 1rem;

  @media (min-width: 769px) {
    display: none;
  }
`;
