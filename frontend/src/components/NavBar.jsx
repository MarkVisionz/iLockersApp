import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styled, { css } from "styled-components";
import { logoutUser } from "../features/authSlice";
import { toast } from "react-toastify";

const NavBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartTotalQuantity } = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const handleLogout = () => {
    dispatch(logoutUser(null));
    navigate("/");
    toast.warning("Sesión cerrada", { position: "bottom-left" });
  };

  return (
    <NavContainer $isHome={isHome}>
      <LogoLink to="/">
        <LogoImage
          src="https://res.cloudinary.com/mkocloud/image/upload/v1715454398/OnlineLaundry/LogosWeb/LogoLaundry_saga4u.png"
          alt="Online Laundry Logo"
        />
      </LogoLink>

      <NavContent>
        {auth._id ? (
          <NavLinks>
            {!auth.isAdmin ? (
              <NavButton to="/user/profile">Perfil</NavButton>
            ) : (
              <>
                <NavButton to="/admin/summary">Admin</NavButton>
                <NavButton to="/laundry-screen">Lavandería</NavButton>
              </>
            )}
            <LogoutButton onClick={handleLogout}>Salir</LogoutButton>
          </NavLinks>
        ) : (
          <AuthLinks>
            <NavButton to="/login">Entrar</NavButton>
            <NavButton to="/register">Registrarse</NavButton>
          </AuthLinks>
        )}

        <CartLink to="/cart" $isHome={isHome}>
          <CartIcon $isHome={isHome}>
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
              <BagQuantity>{cartTotalQuantity}</BagQuantity>
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
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 120px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const NavContent = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const AuthLinks = styled(NavLinks)``;

const NavButton = styled(Link)`
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  text-decoration: none;
  background: linear-gradient(145deg, #141622, #1f1f28);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;

  &:hover {
    background: #007bff;
    color: white;
  }
`;

const LogoutButton = styled.div`
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(145deg, #27272a, #1f1f28);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e74c3c;
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
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
