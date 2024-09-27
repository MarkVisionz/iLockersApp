import styled from "styled-components";
import { NavLink, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaUsers, FaStore, FaClipboard, FaTachometerAlt, FaBars, FaTimes } from "react-icons/fa";
import { useState } from "react";

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!auth.isAdmin) {
    return <AccessDenied>Access Denied. Not an Admin</AccessDenied>;
  }

  return (
    <StyledDashboard>
      <SidebarToggle onClick={toggleSidebar}>
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </SidebarToggle>
      {isSidebarOpen && (
        <SideNav>
          <h3>Quick Links</h3>
          <NavLink
            className={({ isActive }) =>
              isActive ? "link-active" : "link-inactive"
            }
            to="/admin/summary"
          >
            <FaTachometerAlt /> Summary
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "link-active" : "link-inactive"
            }
            to="/admin/products"
          >
            <FaStore /> Products
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "link-active" : "link-inactive"
            }
            to="/admin/orders"
          >
            <FaClipboard /> Orders
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "link-active" : "link-inactive"
            }
            to="/admin/users"
          >
            <FaUsers /> Users
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              isActive ? "link-active" : "link-inactive"
            }
            to="/admin/notes-summary"
          >
            <FaTachometerAlt /> Local Laundry
          </NavLink>
        </SideNav>
      )}
      <Content isSidebarOpen={isSidebarOpen}>
        <Outlet />
      </Content>
    </StyledDashboard>
  );
};

export default Dashboard;

const StyledDashboard = styled.div`
  display: flex;
  min-height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SidebarToggle = styled.button`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: none;
  border: none;
  color: #007bff;
  font-size: 24px;
  cursor: pointer;
  z-index: 10; // Asegura que el botón esté encima del contenido
`;

const SideNav = styled.div`
  /* border-right: 1px solid gray; */
  height: auto;
  width: 200px;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background-color: #f8f9fa;

  h3 {
    margin-bottom: 1rem;
    text-transform: uppercase;
    font-size: 17px;
    @media (max-width: 768px) {
      margin: 0 1rem 0 0; /* Ajusta el margen para dar espacio entre el título y los enlaces */
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  @media (max-width: 768px) {
    flex-direction: row;
    width: 100%;
    height: auto;
    border-right: none;
    /* border-bottom: 1px solid gray; */
    align-items: center; /* Centra los elementos verticalmente */
    justify-content: center; /* Centra los elementos horizontalmente */
    padding: 1rem;
  }

  a {
    text-decoration: none;
    margin-bottom: 1.5rem;
    font-size: 14px;
    display: flex;
    align-items: center;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    transition: background-color 0.3s, color 0.3s;

    &:hover {
      background-color: #007bff;
      color: white;
    }

    svg {
      margin-right: 0.5rem;
      font-size: 18px;
    }

    @media (max-width: 768px) {
      justify-content: center;
      font-size: 16px;
      margin-bottom: 0; /* Elimina el margen inferior para enlaces en línea */
      padding: 1rem; /* Añade padding para hacer que el área clicable sea más grande */
    }
  }
`;

const Content = styled.div`
  flex: 1; // Añade flex: 1 para hacer que el área de contenido ocupe el espacio restante
  padding: 2rem 3rem;
  width: 100%;
  transition: margin-left 0.3s ease;

  @media (min-width: 768px) {
    width: ${({ isSidebarOpen }) => (isSidebarOpen ? "calc(100% - 200px)" : "100%")};
  }

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
  }
`;

const AccessDenied = styled.p`
  text-align: center;
  font-size: 1.5rem;
  color: red;
  margin-top: 2rem;
`;
