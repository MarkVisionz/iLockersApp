import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styled, { css } from "styled-components";
import { logoutUser } from "../features/authSlice";
import { toast } from "react-toastify";
import { useMediaQuery } from "react-responsive";
import { useEffect } from "react";

const NavBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartTotalQuantity } = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isVerySmallScreen = useMediaQuery({ maxWidth: 400 });

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate("/");
      toast.warning("Sesión cerrada", { position: "bottom-left" });
    } catch (error) {
      toast.error("Error al cerrar sesión", { position: "bottom-left" });
    }
  };

  // Limpieza adicional para asegurar que el estado se resetea
  useEffect(() => {
    if (!auth.isAuthenticated && (auth.role || auth._id)) {
      // Forzar recarga si el estado parece inconsistente
      window.location.reload();
    }
  }, [auth.isAuthenticated, auth.role, auth._id]);

  return (
    <NavContainer $isHome={isHome}>
      <LogoLink to="/" aria-label="Ir a la página principal">
        <LogoImage
          src="https://res.cloudinary.com/mkocloud/image/upload/v1715454398/OnlineLaundry/LogosWeb/LogoLaundry_saga4u.png"
          srcSet="
            https://res.cloudinary.com/mkocloud/image/upload/w_80/v1715454398/OnlineLaundry/LogosWeb/LogoLaundry_saga4u.png 80w,
            https://res.cloudinary.com/mkocloud/image/upload/w_120/v1715454398/OnlineLaundry/LogosWeb/LogoLaundry_saga4u.png 120w"
          sizes="(max-width: 768px) 80px, 120px"
          alt="Online Laundry Logo"
          $isMobile={isMobile}
          $isVerySmallScreen={isVerySmallScreen}
          loading="lazy"
        />
      </LogoLink>

      <NavContent $isMobile={isMobile}>
        {auth.isAuthenticated ? (
          <NavLinks $isMobile={isMobile}>
            {auth.role === "owner" && (
              <NavButton to="/owner" $isMobile={isMobile}>
                Resumen Local
              </NavButton>
            )}
            {auth.role === "admin" && (
              <>
                <NavButton to="/admin/summary" $isMobile={isMobile}>Admin</NavButton>
                <NavButton to="/laundry-screen" $isMobile={isMobile}>Lavandería</NavButton>
              </>
            )}
            {auth._id && (
              <NavButton to={`/user/${auth._id}`} $isMobile={isMobile}>Perfil</NavButton>
            )}
            <LogoutButton onClick={handleLogout} $isMobile={isMobile} aria-label="Cerrar sesión">
              Salir
            </LogoutButton>
          </NavLinks>
        ) : (
          <AuthLinks $isMobile={isMobile}>
            <NavButton to="/login" $isMobile={isMobile}>Entrar</NavButton>
            <NavButton to="/register" $isMobile={isMobile}>Registrarse</NavButton>
          </AuthLinks>
        )}

        <CartLink to="/cart" $isHome={isHome} aria-label={`Ver carrito con ${cartTotalQuantity} ítems`}>
          <CartIcon $isHome={isHome} $isMobile={isMobile}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
            </svg>
            {cartTotalQuantity > 0 && (
              <BagQuantity $isMobile={isMobile}>{cartTotalQuantity}</BagQuantity>
            )}
          </CartIcon>
        </CartLink>
      </NavContent>
    </NavContainer>
  );
};

export default NavBar;

const NavContainer = styled.nav`
  position: sticky;
  top: 0;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 999;
  transition: all 0.3s ease-in-out;

  ${(props) =>
    props.$isHome
      ? css`
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          box-shadow: 0 0px 10px rgba(255, 255, 255, 0.5);
          border-bottom: 1px solid rgba(200, 200, 200, 0.2);

          &::after {
            content: "";
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 100%;
            height: 18px;
            background: radial-gradient(white 30%, transparent 70%);
            filter: blur(10px);
            opacity: 0.8;
            pointer-events: none;
          }
        `
      : css`
          background: rgba(10, 10, 10, 0.85);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        `}

  @media (max-width: 768px) {
    padding: 0 1rem;
    height: 70px;
  }

  @media (max-width: 400px) {
    padding: 0 0.5rem;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: ${(props) =>
    props.$isVerySmallScreen ? "60px" : props.$isMobile ? "80px" : "120px"};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const NavContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => (props.$isMobile ? "0.75rem" : "2rem")};
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${(props) => (props.$isMobile ? "0.5rem" : "1.5rem")};
`;

const AuthLinks = styled(NavLinks)``;

const NavButton = styled(NavLink)`
  padding: ${(props) => (props.$isMobile ? "0.4rem 0.8rem" : "0.5rem 1.2rem")};
  border-radius: 20px;
  font-size: ${(props) => (props.$isMobile ? "12px" : "14px")};
  font-weight: 500;
  color: white;
  text-decoration: none;
  background: linear-gradient(145deg, #141622, #1f1f28);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: #007bff;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }

  &.active {
    background: #0056b3;
    color: white;
    border-color: #0056b3;
  }
`;

const LogoutButton = styled.button`
  padding: ${(props) => (props.$isMobile ? "0.4rem 0.8rem" : "0.5rem 1.2rem")};
  border-radius: 20px;
  font-size: ${(props) => (props.$isMobile ? "12px" : "14px")};
  font-weight: 500;
  background: linear-gradient(145deg, #27272a, #1f1f28);
  color: white;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: #e74c3c;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
  }
`;

const CartLink = styled(Link)`
  position: relative;
  display: flex;
  align-items: center;
  color: ${(props) => (props.$isHome ? "#111" : "white")};
`;

const CartIcon = styled.div`
  position: relative;

  svg {
    transition: transform 0.2s ease;
    color: ${(props) => (props.$isHome ? "#111" : "white")};
    width: ${(props) => (props.$isMobile ? "22px" : "26px")};
    height: ${(props) => (props.$isMobile ? "22px" : "26px")};
  }

  &:hover svg {
    transform: scale(1.1);
  }
`;

const BagQuantity = styled.span`
  position: absolute;
  top: -8px;
  right: -12px;
  background: #e74c3c;
  color: white;
  width: ${(props) => (props.$isMobile ? "16px" : "20px")};
  height: ${(props) => (props.$isMobile ? "16px" : "20px")};
  font-size: ${(props) => (props.$isMobile ? "10px" : "12px")};
  font-weight: 600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

