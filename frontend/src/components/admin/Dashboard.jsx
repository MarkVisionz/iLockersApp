import styled from "styled-components";
import { NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaUsers,
  FaStore,
  FaClipboard,
  FaTachometerAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 769);

  // Manejar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 769) {
        setIsMobile(true);
        setIsSidebarOpen(false); // Cerrar sidebar en móvil
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true); // Abrir sidebar en escritorio
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Inicializar

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Alternar la visibilidad de la barra lateral
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Cerrar la barra lateral al seleccionar un enlace (en móvil)
  const handleLinkClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  if (!auth.isAdmin) {
    return <AccessDenied>Access Denied. Not an Admin</AccessDenied>;
  }

  return (
    <>
      {/* Navbar solo visible en móvil */}
      {isMobile && (
        <MobileNavbar>
          <SidebarToggle onClick={toggleSidebar}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </SidebarToggle>
        </MobileNavbar>
      )}

      {/* Backdrop cuando el sidebar está abierto en móvil */}
      {isMobile && isSidebarOpen && <Backdrop onClick={toggleSidebar} />}

      <StyledDashboard isSidebarOpen={isSidebarOpen} isMobile={isMobile}>
        {/* Sidebar */}
        <SideNav isOpen={isSidebarOpen} isMobile={isMobile}>
          <h3>Quick Links</h3>
          <StyledNavLink to="/admin/summary" onClick={handleLinkClick}>
            <FaTachometerAlt /> Summary
          </StyledNavLink>
          <StyledNavLink to="/admin/products" onClick={handleLinkClick}>
            <FaStore /> Products
          </StyledNavLink>
          <StyledNavLink to="/admin/orders" onClick={handleLinkClick}>
            <FaClipboard /> Orders
          </StyledNavLink>
          <StyledNavLink to="/admin/users" onClick={handleLinkClick}>
            <FaUsers /> Users
          </StyledNavLink>
          <StyledNavLink to="/admin/notes-summary" onClick={handleLinkClick}>
            <FaTachometerAlt /> Local Laundry
          </StyledNavLink>
        </SideNav>

        {/* Contenido Principal */}
        <Content isSidebarOpen={isSidebarOpen} isMobile={isMobile}>
          <Outlet />
        </Content>
      </StyledDashboard>
    </>
  );
};

export default Dashboard;

/* Styled Components */

/* Contenedor Principal */
const StyledDashboard = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f0f2f5; /* Color de fondo más suave */
  transition: all 0.3s ease;

  @media (min-width: 769px) {
    flex-direction: row;
  }
`;

/* Navbar para Pantallas Móviles */
const MobileNavbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: none; /* Fondo semi-transparente */
  position: fixed;
  top: 1;
  width: 100%;
  z-index: 20; /* Asegura que la navbar esté encima */
`;

/* Botón de Toggle del Sidebar */
const SidebarToggle = styled.button`
  background: none;
  border: none;
  color: #007bff; /* Color del icono */
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #0056b3; /* Color al pasar el mouse */
  }

  @media (min-width: 769px) {
    display: none; /* Ocultar en pantallas grandes */
  }
`;

/* Backdrop */
const Backdrop = styled.div`
  position: fixed;
  top: 60px; /* Altura de la MobileNavbar */
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  background: rgba(0, 0, 0, 0.3);
  z-index: 10;
`;

/* Sidebar */
const SideNav = styled.div`
  background-color: #ffffff; /* Fondo blanco para contraste */
  width: 100%;
  padding: ${({ isOpen, isMobile }) =>
    isMobile ? (isOpen ? "1rem" : "0") : "2rem"};
  box-shadow: ${({ isMobile }) =>
    isMobile ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none"};
  transition: all 0.3s ease;
  display: ${({ isOpen, isMobile }) => (isMobile ? (isOpen ? "flex" : "none") : "flex")};
  flex-direction: column;
  position: ${({ isMobile }) => (isMobile ? "relative" : "relative")};
  top: ${({ isMobile }) => (isMobile ? "0" : "auto")};
  left: 0;
  z-index: 15;

  h3 {
    margin-bottom: 1rem;
    text-transform: uppercase;
    font-size: 18px; /* Tamaño de fuente */
    color: #333; /* Color de texto más oscuro */
    text-align: center;

    @media (min-width: 769px) {
      text-align: left;
      margin-bottom: 2rem;
    }
  }

  a {
    text-decoration: none;
    margin-bottom: 1.5rem;
    font-size: 16px; /* Tamaño de fuente */
    display: flex;
    align-items: center;
    font-weight: 600; /* Grosor de fuente */
    padding: 0.5rem 1rem;
    border-radius: 5px;
    transition: background-color 0.3s, color 0.3s;
    color: black; /* Color de los enlaces */

    &:hover {
      background-color: #007bff;
      color: white;
    }

    svg {
      margin-right: 0.5rem;
      font-size: 20px; /* Tamaño de icono */
    }

    @media (min-width: 769px) {
      margin-bottom: 1.5rem;
      width: 100%;
    }
  }

  @media (min-width: 769px) {
    width: 220px;
    padding: 2rem;
    box-shadow: none;
    align-items: flex-start;
  }
`;

/* Estilo para los NavLinks */
const StyledNavLink = styled(NavLink)`
  text-decoration: none;
  margin-bottom: 1rem;
  font-size: 16px; /* Tamaño de fuente */
  display: flex;
  align-items: center;
  font-weight: 600; /* Grosor de fuente */
  padding: 0.5rem 1rem;
  border-radius: 5px;
  transition: background-color 0.3s, color 0.3s;
  color: black; /* Color de los enlaces */

  &.active {
    background-color: #007bff;
    color: white;
  }

  &:hover {
    background-color: #007bff;
    color: white;
  }

  svg {
    margin-right: 0.5rem;
    font-size: 20px; /* Tamaño de icono */
  }

  @media (min-width: 769px) {
    margin-bottom: 1.5rem;
    width: 100%;
  }
`;

/* Contenido Principal */
const Content = styled.div`
  flex: 1;
  padding: ${({ isMobile }) => (isMobile ? "2rem 1rem" : "2rem 3rem")};
  margin-top: ${({ isMobile, isSidebarOpen }) =>
    isMobile && isSidebarOpen ? "60px" : "0"};
  transition: all 0.3s ease;

  @media (min-width: 769px) {
    padding: 2rem 3rem;
    margin-top: 0;
  }
`;

/* Mensaje de Acceso Denegado */
const AccessDenied = styled.p`
  text-align: center;
  font-size: 1.5rem;
  color: red;
  margin-top: 2rem;
`;
