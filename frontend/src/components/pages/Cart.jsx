import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  clearCart,
  decreaseCart,
  removeFromCart,
  getTotals,
} from "../../features/cartSlice";
import { createGuestUser } from "../../features/usersSlice";
import styled from "styled-components";
import { AiOutlinePlus, AiOutlineMinus, AiOutlineShoppingCart, AiOutlineDelete, AiOutlineClose, AiOutlineUp } from "react-icons/ai";
import { useEffect, useState, useCallback, memo } from "react";
import PayButton from "../PayButton";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import Pagination from "../admin/list/SummaryHelpers/pagination";
import { motion, AnimatePresence } from "framer-motion";
import ProductFilters from "../admin/list/ListHelpers/ProductHelpers/ProductFilter";
import GuestCheckoutModal from "../GuestCheckoutModal";
import axios from "axios";
import { url } from "../../features/api";

// Variantes de animación
const cartVariants = { hidden: { y: 50, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25 } }, exit: { y: 50, opacity: 0 } };
const itemVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { duration: 0.2 } }, exit: { opacity: 0, x: 10, transition: { duration: 0.2 } } };

const itemsPerPage = 6;

const Cart = memo(() => {
  const { items: products, status } = useSelector((state) => state.products);
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const { currentGuest } = useSelector((state) => state.users);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [quantities, setQuantities] = useState({});
  const [cartVisible, setCartVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: "", direction: "ascending" });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [checkoutAsGuest, setCheckoutAsGuest] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [hasAttemptedCheckout, setHasAttemptedCheckout] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleManualQuantityChange = useCallback((productId, value) => {
    const parsed = parseInt(value);
    setQuantities((prev) => ({ ...prev, [productId]: isNaN(parsed) || parsed < 1 ? 1 : parsed }));
  }, []);

  const handleClickQuantity = useCallback((productId, type) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const newQty = type === "increase" ? current + 1 : Math.max(1, current - 1);
      return { ...prev, [productId]: newQty };
    });
  }, []);

  const handleAddToCart = useCallback((product) => {
    const quantity = quantities[product._id] || 1;
    for (let i = 0; i < quantity; i++) {
      dispatch(addToCart(product));
    }
    setQuantities((prev) => ({ ...prev, [product._id]: 1 }));
  }, [quantities, dispatch]);

  const handleRemove = useCallback((item) => dispatch(removeFromCart(item)), [dispatch]);
  const handleIncrease = useCallback((item) => dispatch(addToCart(item)), [dispatch]);
  const handleDecrease = useCallback((item) => dispatch(decreaseCart(item)), [dispatch]);
  const handleClearCart = useCallback(() => dispatch(clearCart()), [dispatch]);
  const handleScrollTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  const getGuestId = useCallback(async () => {
    try {
      const contactInfo = { 
        email: `guest-${Date.now()}@example.com`,
        name: `Invitado-${Math.random().toString(36).substring(2, 8)}`,
        phone: `+52${Math.floor(1000000000 + Math.random() * 9000000000)}`
      };
      const response = await dispatch(createGuestUser(contactInfo)).unwrap();
      return response.guestId || response._id;
    } catch (error) {
      console.error("Error al crear guest:", error);
      setError(error.message || "No pudimos crear una sesión temporal.");
      throw new Error("GUEST_CREATION_FAILED");
    }
  }, [dispatch]);

  const handleCheckout = useCallback(async () => {
    if (hasCheckedOut || cart.cartItems.length === 0 || hasAttemptedCheckout) return;
  
    setIsLoading(true);
    setError(null);
    setHasAttemptedCheckout(true);
  
    try {
      let guestIdValue = null;
  
      if (checkoutAsGuest) {
        guestIdValue = await getGuestId(); // 🔥 generamos guestId, pero ya no generamos contact
      }
  
      const response = await axios.post(
        `${url}/stripe/create-checkout-session`,
        {
          cartItems: cart.cartItems.map(item => ({
            id: item._id,
            name: item.name,
            price: item.price,
            cartQuantity: item.cartQuantity,
            image: item.image,
          })),
          userId: auth._id || null,
          guestId: checkoutAsGuest ? guestIdValue : null, // 🔥 enviamos solo el guestId
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );
  
      if (response.data.url) {
        setHasCheckedOut(true);
        window.location.href = response.data.url;
      } else {
        throw new Error("No se recibió la URL de Stripe");
      }
    } catch (error) {
      console.error("Error en checkout:", error);
      setError(error.message || "Error al iniciar el pago. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [
    cart.cartItems,
    auth._id,
    checkoutAsGuest,
    hasCheckedOut,
    hasAttemptedCheckout,
    getGuestId
  ]);
  

  const handleCheckoutClick = () => {
    if (cart.cartItems.length === 0) {
      setError("El carrito está vacío");
      return;
    }
    if (auth._id) {
      handleCheckout();
    } else {
      setGuestModalOpen(true);
    }
  };

  const handleLoginRedirect = () => {
    setGuestModalOpen(false);
    navigate("/login");
  };

  const handleGuestContinue = () => {
    setGuestModalOpen(false);
    setCheckoutAsGuest(true);
    setHasCheckedOut(false);
    setHasAttemptedCheckout(false);
  };

  const handleRetryCheckout = () => {
    setError(null);
    setHasCheckedOut(false);
    setHasAttemptedCheckout(false);
    handleCheckout();
  };

  useEffect(() => {
    if (checkoutAsGuest && !hasCheckedOut && cart.cartItems.length > 0 && !isLoading && !hasAttemptedCheckout) {
      handleCheckout();
    }
  }, [
    checkoutAsGuest,
    hasCheckedOut,
    cart.cartItems,
    isLoading,
    hasAttemptedCheckout,
    handleCheckout,
  ]);

  useEffect(() => {
    dispatch(getTotals());
  }, [cart.cartItems, dispatch]);

  const filteredProducts = products
    .filter(product => {
      const matchesName = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || product.category?.toLowerCase().includes(categoryFilter.toLowerCase());
      return matchesName && matchesCategory;
    })
    .sort((a, b) => {
      const { field, direction } = sortConfig;
      if (!field) return 0;
      let aValue = a[field];
      let bValue = b[field];
      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();
      if (aValue < bValue) return direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    useEffect(() => {
      const handleScroll = () => {
        if (window.scrollY > 300) {
          setShowScrollTop(true);
        } else {
          setShowScrollTop(false);
        }
      };
    
      window.addEventListener("scroll", handleScroll);
    
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);
    

  const totalFiltered = filteredProducts.length;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <HomeWrapper>
      <GuestCheckoutModal
        isOpen={guestModalOpen}
        onLogin={handleLoginRedirect}
        onGuest={handleGuestContinue}
        onClose={() => setGuestModalOpen(false)}
      />
      {error && (
        <ErrorMessageWrapper>
          <ErrorMessage message={error} />
          <RetryButton onClick={handleRetryCheckout}>Reintentar</RetryButton>
        </ErrorMessageWrapper>
      )}
      {isLoading && <LoadingSpinner message="Iniciando pago..." />}
      <Header>
        <h2>Explora nuestros productos</h2>
        <p>Agrega tu ropa sin salir de casa</p>
      </Header>

      <DesktopFiltersWrapper>
        <ProductFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          navigate={navigate}
          hideCreateButton={true}
        />
      </DesktopFiltersWrapper>

      <ResponsiveWrapper>
        <ToggleButton
          onClick={() => setCartVisible(!cartVisible)}
          aria-label={cartVisible ? "Cerrar carrito" : "Abrir carrito"}
        >
          {cartVisible ? <AiOutlineClose /> : <AiOutlineShoppingCart />}
          {cart.cartItems.length > 0 && (
            <CartBadge>{cart.cartItems.length}</CartBadge>
          )}
        </ToggleButton>

        <AnimatePresence>
          {cartVisible && (
            <CartSidebar
              as={motion.div}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={cartVariants}
            >
              <MobileCloseButton
                onClick={() => setCartVisible(false)}
                aria-label="Cerrar carrito"
              >
                <AiOutlineClose />
              </MobileCloseButton>
              <PullIndicator />
              <CartHeader>
                <AiOutlineShoppingCart /> Carrito
                {cart.cartItems.length > 0 && (
                  <span
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                      marginLeft: "0.3rem",
                    }}
                  >
                    ({cart.cartItems.length})
                  </span>
                )}
              </CartHeader>
              {cart.cartItems.length === 0 ? (
                <EmptyMessage>Tu carrito está vacío.</EmptyMessage>
              ) : (
                <>
                  <CartItemsContainer>
                    <AnimatePresence>
                      {cart.cartItems.map((item) => (
                        <CartItem
                          key={item._id}
                          as={motion.div}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={itemVariants}
                        >
                          <ItemInfo>
                            <span>{item.name}</span>
                            <Price>
                              $ {(item.price * item.cartQuantity).toFixed(2)}
                            </Price>
                          </ItemInfo>
                          <Quantity>
                            <QtyButton
                              onClick={() => handleDecrease(item)}
                              aria-label={`Disminuir cantidad de ${item.name}`}
                            >
                              <AiOutlineMinus />
                            </QtyButton>
                            <QtyCount>{item.cartQuantity}</QtyCount>
                            <QtyButton
                              onClick={() => handleIncrease(item)}
                              aria-label={`Aumentar cantidad de ${item.name}`}
                            >
                              <AiOutlinePlus />
                            </QtyButton>
                          </Quantity>
                          <RemoveBtn
                            onClick={() => handleRemove(item)}
                            aria-label={`Eliminar ${item.name} del carrito`}
                          >
                            <AiOutlineDelete />
                          </RemoveBtn>
                        </CartItem>
                      ))}
                    </AnimatePresence>
                  </CartItemsContainer>
                  <TotalRow>
                    <span>Total:</span>
                    <span>$ {cart.cartTotalAmount.toFixed(2)}</span>
                  </TotalRow>
                  {cart.cartItems.length > 0 &&
                    (auth._id || checkoutAsGuest ? (
                      <PayButton
                        cartItems={cart.cartItems}
                        isGuest={checkoutAsGuest}
                        onCheckout={handleCheckout}
                        disabled={isLoading}
                      >
                        Pagar ahora
                      </PayButton>
                    ) : (
                      <LoginBtn onClick={handleCheckoutClick}>
                        Continuar para pagar
                      </LoginBtn>
                    ))}
                  <ClearCartBtn onClick={handleClearCart}>
                    <AiOutlineDelete /> Vaciar carrito
                  </ClearCartBtn>
                </>
              )}
            </CartSidebar>
          )}
        </AnimatePresence>

        <MobileFiltersWrapper>
          <ProductFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            navigate={navigate}
            hideCreateButton={true}
          />
        </MobileFiltersWrapper>

        <Grid>
          {status === "success" ? (
            <AnimatePresence>
              {paginatedProducts.map((product) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <ImageWrapper>
                      <img src={product.image?.url} alt={product.name} />
                    </ImageWrapper>
                    <CategoryTag>
                      {product.category || "Sin categoría"}
                    </CategoryTag>
                    <Info>
                      <Name>{product.name}</Name>
                      <Weight>Peso Unitario: {product.weight}g</Weight>
                      <Price>Precio: $ {product.price.toFixed(2)}</Price>
                      <QuantityControls>
                        <QtyButton
                          onClick={() =>
                            handleClickQuantity(product._id, "decrease")
                          }
                          aria-label={`Disminuir cantidad de ${product.name}`}
                        >
                          <AiOutlineMinus />
                        </QtyButton>
                        <QtyInput
                          type="number"
                          min="1"
                          value={quantities[product._id] || 1}
                          onChange={(e) =>
                            handleManualQuantityChange(
                              product._id,
                              e.target.value
                            )
                          }
                          aria-label={`Cantidad de ${product.name}`}
                        />
                        <QtyButton
                          onClick={() =>
                            handleClickQuantity(product._id, "increase")
                          }
                          aria-label={`Aumentar cantidad de ${product.name}`}
                        >
                          <AiOutlinePlus />
                        </QtyButton>
                      </QuantityControls>
                      <AddButton
                        onClick={() => handleAddToCart(product)}
                        aria-label={`Agregar ${product.name} al carrito`}
                      >
                        Agregar al carrito
                      </AddButton>
                    </Info>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : status === "pending" ? (
            <LoadingSpinner message={"Cargando productos..."} />
          ) : (
            <ErrorMessage message={"Error al cargar productos"} />
          )}
        </Grid>
      </ResponsiveWrapper>

      {totalFiltered > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalNotes={totalFiltered}
          itemsPerPage={itemsPerPage}
        />
      )}

      {showScrollTop && (
        <ScrollTopButton
          onClick={handleScrollTop}
          aria-label="Volver al inicio"
          cartVisible={cartVisible}
        >
          <AiOutlineUp />
        </ScrollTopButton>
      )}
    </HomeWrapper>
  );
});

// Estilos (sin cambios, se mantienen igual)
const ErrorMessageWrapper = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;

const RetryButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background: #0056b3;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const HomeWrapper = styled.div`
  padding: 2rem;
  background-color: #f4f6f8;
  position: relative;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: 80px;
  }
`;

const ResponsiveWrapper = styled.div`
  display: flex;
  flex-direction: row-reverse;
  gap: 2rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  h2 {
    color: #007bff;
    font-size: 2rem;
    font-weight: 600;
  }

  p {
    color: #666;
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 1.5rem;
    }
    p {
      font-size: 0.9rem;
    }
  }
`;

const CartSidebar = styled.div`
  width: 300px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 6rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
  align-self: flex-start;
  z-index: 10;

  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 20px 20px 0 0;
    padding: 1.5rem 1rem;
    box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-height: 70vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    top: auto;
    margin: 0;
  }
`;

const PullIndicator = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    width: 50px;
    height: 4px;
    background: #ccc;
    border-radius: 2px;
    margin: 0 auto 1rem;
    transition: background 0.3s ease;
  }
`;

const MobileCloseButton = styled.button`
  display: none;

  @media (max-width: 768px) {
    display: block;
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #666;
    padding: 0.5rem;
    z-index: 1001;
    cursor: pointer;

    &:hover {
      color: #333;
    }
  }
`;

const CartHeader = styled.h4`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.2rem;
    justify-content: center;
    padding-top: 0.5rem;
  }
`;

const EmptyMessage = styled.p`
  color: #666;
  text-align: center;
  margin: 2rem 0;
  font-size: 1rem;

  @media (max-width: 768px) {
    margin: 1.5rem 0;
    font-size: 0.9rem;
  }
`;

const CartItemsContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  @media (max-width: 768px) {
    max-height: calc(70vh - 200px);
    -webkit-overflow-scrolling: touch;
  }
`;

const CartItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  position: relative;

  @media (max-width: 768px) {
    padding: 1rem 0;
    gap: 0.75rem;

    &:active {
      background-color: #f8f9fa;
    }
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Price = styled.span`
  font-size: 0.9rem;
  color: #444;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const Quantity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
    background: #f8f9fa;
    padding: 0.5rem;
    border-radius: 8px;
    margin-left: auto;
  }
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
  transition: background 0.3s ease, transform 0.1s ease;

  &:hover {
    background: #0056b3;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 1.8rem;
    height: 1.8rem;
    font-size: 0.9rem;
  }
`;

const QtyCount = styled.span`
  min-width: 20px;
  text-align: center;
  font-size: 1rem;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.5rem;
  transition: color 0.3s ease, transform 0.2s ease;

  &:hover {
    color: #c82333;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    position: absolute;
    font-size: 1.1rem;
    padding: 0.1rem;
    right: 0;
    top: 0;
  }
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 1.5rem 0;
  font-weight: bold;
  color: #444;
  font-size: 1.1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;

  @media (max-width: 768px) {
    font-size: 1.05rem;
    margin: 1.25rem 0;
  }
`;

const ActionButton = styled.button`
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

  @media (max-width: 768px) {
    &:active {
      transform: scale(0.98);
    }
    padding: 0.5rem;
    font-size: 0.95rem;
  }
`;

const LoginBtn = styled(ActionButton)`
  background: #007bff;
  color: white;

  &:hover {
    background: #0056b3;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ClearCartBtn = styled(ActionButton)`
  background-color: #dc3545;
  color: white;

  &:hover {
    background-color: #c82333;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ToggleButton = styled.button`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 3rem;
    height: 3rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 999;
    font-size: 1.5rem;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      background: #0056b3;
    }

    &:active {
      transform: scale(0.95);
    }
  }
`;

const CartBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
`;

const DesktopFiltersWrapper = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileFiltersWrapper = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    width: 100%;
    margin-top: 0.5rem;
  }
`;

const Grid = styled.div`
  flex: 2;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    width: 100%;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const Card = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 10px;
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    height: 150px;
    margin-bottom: 0.75rem;
  }
`;

const CategoryTag = styled.span`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #007bff;
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.4rem;
  }
`;

const Name = styled.h3`
  font-size: 1.1rem;
  color: #333;
  margin: 0;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Weight = styled.span`
  color: #777;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const QuantityControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;

  @media (max-width: 768px) {
    margin: 0.5rem 0;
  }
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

  @media (max-width: 768px) {
    width: 2.5rem;
    font-size: 0.9rem;
    padding: 0.25rem;
  }
`;

const AddButton = styled.button`
  background: #28a745;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  width: 100%;
  font-weight: 500;
  margin-top: 0.5rem;

  &:hover {
    background: #218838;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.6rem;
    font-size: 0.9rem;
  }
`;

const ScrollTopButton = styled.button`
  position: fixed;
  bottom: 5rem;
  right: 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  z-index: 1000;

  &:hover {
    background: #0056b3;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (min-width: 769px) {
    display: none;
  }
  @media (max-width: 768px) {
    display: ${(props) => (props.cartVisible ? "none" : "flex")};
  }
`;

export default Cart;