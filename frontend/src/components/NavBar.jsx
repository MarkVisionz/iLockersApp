import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { logoutUser } from "../features/authSlice";
import { toast } from "react-toastify";

const NavBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartTotalQuantity } = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser(null));
    navigate("/");
    toast.warning("Logged out!", { position: "bottom-left" });
  };

  return (
    <NavContainer>
      <LogoLink to="/">
        <LogoImage
          src="https://res.cloudinary.com/mkocloud/image/upload/v1715454398/OnlineLaundry/LogosWeb/LogoLaundry_saga4u.png"
          alt="Online Laundry Logo"
        />
      </LogoLink>

      <CartLink to="/cart">
        <CartIcon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            fill="currentColor"
            className="bi bi-bag"
            viewBox="0 0 16 16"
          >
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
          </svg>
          <BagQuantity>{cartTotalQuantity}</BagQuantity>
        </CartIcon>
      </CartLink>

      {auth._id ? (
        <NavLinks>
          {!auth.isAdmin ? (
            <StyledLink to="/user/profile">Profile</StyledLink>
          ) : (
            <>
              <StyledLink to="/admin/summary">Admin</StyledLink>
              <StyledLink to="/laundry-screen">Laundry Control</StyledLink>
            </>
          )}
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </NavLinks>
      ) : (
        <AuthLinks>
          <StyledLink to="/login">Login</StyledLink>
          <StyledLink to="/register">Register</StyledLink>
        </AuthLinks>
      )}
    </NavContainer>
  );
};

export default NavBar;

/* Styled Components */

// Contenedor Principal del NavBar
const NavContainer = styled.nav`
  position: sticky;
  top: 0;
  height: 90px;
  background: #000000; /* Fondo oscuro */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem 1rem 1rem;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 0 1.5rem;
  }
`;

// Enlace del Logo
const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
`;

// Imagen del Logo
const LogoImage = styled.img`
  width: 150px;
  height: auto;

  @media (max-width: 768px) {
    width: 120px;
  }
`;

// Enlace del Carrito
const CartLink = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  color: white;
  margin-left: auto;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

// Icono del Carrito
const CartIcon = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;

  svg {
    transition: transform 0.2s;
  }

  &:hover svg {
    transform: scale(1.1);
  }
`;

// Cantidad en el Carrito
const BagQuantity = styled.span`
  position: absolute;
  top: -8px;
  right: -10px;
  background: #e74c3c;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// Contenedor de Enlaces de Navegación
const NavLinks = styled.div`
  display: flex;
  align-items: center;
  margin-left: 2rem;

  @media (max-width: 768px) {
    margin-left: 1rem;
  }
`;

// Enlaces de Autenticación
const AuthLinks = styled.div`
  display: flex;
  align-items: center;
  margin-left: 2rem;

  @media (max-width: 768px) {
    margin-left: 1rem;
  }
`;

// Estilo para los Enlaces
const StyledLink = styled(Link)`
  color: white;
  text-decoration: none;
  margin-right: 2rem;
  font-size: 16px;
  position: relative;
  transition: color 0.3s;

  &:hover {
    color: #e74c3c; /* Color al pasar el mouse */
  }

  @media (max-width: 768px) {
    margin-right: 1rem;
    font-size: 14px;
  }
`;

// Botón de Logout
const LogoutButton = styled.div`
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.3s;

  &:hover {
    color: #e74c3c; /* Color al pasar el mouse */
  }

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;
