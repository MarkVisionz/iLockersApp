import styled, { css } from "styled-components";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaUsers,
  FaStore,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaTshirt,
  FaReceipt,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 1023 });
  const [activePath, setActivePath] = useState("");

  // Actualizar ruta activa
  useEffect(() => {
    setActivePath(location.pathname.split("/")[2] || "summary");
  }, [location]);

  // Controlar sidebar en diferentes dispositivos
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => isMobile && setIsSidebarOpen(false);

  if (!auth.isAdmin) {
    return (
      <AccessDeniedContainer>
        <AccessDenied>
          Acceso denegado. No tienes permisos de administrador.
        </AccessDenied>
      </AccessDeniedContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Mobile Header */}
      <MobileHeader isMobile={isMobile}>
        <MenuButton onClick={toggleSidebar} aria-label="Toggle menu">
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </MenuButton>
        <PageTitle>{getPageTitle(activePath)}</PageTitle>
      </MobileHeader>

      {/* Backdrop */}
      {isMobile && isSidebarOpen && <Backdrop onClick={closeSidebar} />}

      <DashboardLayout isMobile={isMobile}>
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} isMobile={isMobile}>
          <SidebarHeader>
            <AdminTitle>Panel Admin</AdminTitle>
          </SidebarHeader>

          <NavMenu>
            {navItems.map((item) => (
              <StyledNavLink
                key={item.path}
                to={`/admin/${item.path}`}
                onClick={closeSidebar}
                $isActive={activePath === item.path}
              >
                <item.icon />
                <span>{item.label}</span>
              </StyledNavLink>
            ))}
          </NavMenu>
        </Sidebar>

        {/* Main Content */}
        <MainContent isOpen={isSidebarOpen} isMobile={isMobile}>
          <OutletContainer>
            <Outlet />
          </OutletContainer>
        </MainContent>
      </DashboardLayout>
    </DashboardContainer>
  );
};

// Datos de navegación
const navItems = [
  { path: "summary", label: "Laundry App", icon: FaTachometerAlt },
  { path: "products", label: "Productos", icon: FaStore },
  { path: "users", label: "Usuarios", icon: FaUsers },
  { path: "notes-summary", label: "Lavandería Local", icon: FaReceipt },
  { path: "services", label: "Servicios", icon: FaTshirt },
];

// Helper para títulos de página
const getPageTitle = (path) => {
  const item = navItems.find((i) => i.path === path);
  return item ? item.label : "Dashboard";
};

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc;
`;

const DashboardLayout = styled.div`
  display: flex;
  flex: 1;
  flex-direction: ${({ isMobile }) => (isMobile ? "column" : "row")};
  min-height: calc(100vh - 60px);
`;

const MobileHeader = styled.header`
  display: ${({ isMobile }) => (isMobile ? "flex" : "none")};
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  height: 60px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: #4b5563;
  font-size: 1.25rem;
  cursor: pointer;
  margin-right: 1rem;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PageTitle = styled.h1`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Backdrop = styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100vh - 60px);
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  backdrop-filter: blur(3px);
  transition: opacity 0.3s ease;
`;

const Sidebar = styled.aside`
  width: ${({ isMobile }) => (isMobile ? "280px" : "250px")};
  background: #ffffff;
  padding: 1.5rem;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: ${({ isMobile, isOpen }) =>
    !isMobile && isOpen ? "2px 0 10px rgba(0, 0, 0, 0.05)" : "none"};
  overflow-y: auto;

  // En móviles, el sidebar es un panel deslizante
  ${({ isMobile, isOpen }) =>
    isMobile &&
    css`
      position: fixed;
      top: 60px;
      left: 0;
      bottom: 0;
      z-index: 95;
      transform: translateX(${isOpen ? "0" : "-100%"});
      box-shadow: ${isOpen ? "4px 0 15px rgba(0, 0, 0, 0.08)" : "none"};
    `}

  // En escritorio, el sidebar es estático
  ${({ isMobile }) =>
    !isMobile &&
    css`
      display: flex;
      position: sticky;
      top: 0;
      height: 100vh;
    `}
`;

const SidebarHeader = styled.div`
  padding: 0 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const AdminTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  gap: 0.5rem;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: #4b5563;
  text-decoration: none;
  transition: all 0.2s ease;

  svg {
    margin-right: 0.75rem;
    font-size: 1rem;
    color: ${({ $isActive }) => ($isActive ? "#3b82f6" : "#6b7280")};
    flex-shrink: 0;
  }

  span {
    font-weight: 500;
    white-space: nowrap;
  }

  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
    svg {
      color: #3b82f6;
    }
  }

  ${({ $isActive }) =>
    $isActive &&
    css`
      background-color: #eff6ff;
      color: #1d4ed8;
      font-weight: 600;
      svg {
        color: #3b82f6;
      }
    `}
`;

const MainContent = styled.main`
  flex: 1;
  padding: ${({ isMobile }) => (isMobile ? "1.5rem 1rem" : "2rem 2.5rem")};
  margin-top: ${({ isMobile, isOpen }) => (isMobile && isOpen ? "60px" : "0")};
  transition: all 0.3s ease;
  background-color: #f8fafc;
  min-height: calc(100vh - 60px);
`;

const OutletContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const AccessDeniedContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8fafc;
`;

const AccessDenied = styled.div`
  padding: 2rem;
  background-color: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: #dc2626;
  font-size: 1.125rem;
  font-weight: 500;
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

export default Dashboard;