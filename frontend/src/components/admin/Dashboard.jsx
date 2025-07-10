import React, { useState, useEffect, useMemo, useCallback } from "react";
import styled, { css } from "styled-components";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaUsers,
  FaStore,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaReceipt,
  FaPlus,
} from "react-icons/fa";
import { useMediaQuery } from "react-responsive";
import { Dialog, DialogContent } from "@mui/material";
import { toast } from "react-toastify";
import SetUpBusiness from "./SetUpBusiness";
import SimpleConfirmationModal from "../SimpleModal";
import {
  businessDeleted,
  deleteBusiness,
  clearBusinessState,
} from "../../features/businessSlice";
import { resetNotes } from "../../features/notesSlice";
import { resetServices } from "../../features/servicesSlice";

// Componente principal optimizado
const Dashboard = React.memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 1023 });

  // Selectores optimizados para Redux
  const { businesses, role, defaultBusiness, userId, loading } = useSelector(
    (state) => ({
      businesses: state.auth?.businesses || [],
      role: state.auth?.role,
      defaultBusiness: state.auth?.defaultBusiness,
      userId: state.auth?._id,
      loading: state.auth?.loading,
    })
  );

  // Estados locales
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [activePath, setActivePath] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [activeBusinessId, setActiveBusinessId] = useState(null);
  const [isCreateBusinessModalOpen, setIsCreateBusinessModalOpen] =
    useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState(null);

  // Memoizar navItems para evitar recreación en cada render
  const ownerNavItems = useMemo(
    () => [
      ...businesses.map((b) => ({
        path: `local-summary/${b._id}`,
        label: b.name,
        icon: FaReceipt,
      })),
      { path: "create-business", label: "Crear Negocio", icon: FaPlus },
    ],
    [businesses]
  );

  const adminNavItems = useMemo(
    () => [
      { path: "summary", label: "Laundry App", icon: FaTachometerAlt },
      { path: "products", label: "Productos", icon: FaStore },
      { path: "users", label: "Usuarios", icon: FaUsers },
      { path: "notes-summary", label: "Lavandería Local", icon: FaReceipt },
      { path: "services", label: "Servicios", icon: FaStore },
    ],
    []
  );

  // Callbacks memorizados
  const toggleSidebar = useCallback(
    () => setIsSidebarOpen((prev) => !prev),
    []
  );
  const closeSidebar = useCallback(
    () => isMobile && setIsSidebarOpen(false),
    [isMobile]
  );

  const handleDeleteBusiness = useCallback((businessId) => {
    setBusinessToDelete(businessId);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteBusiness = useCallback(async () => {
    if (!businessToDelete) return;
    setShowDeleteModal(false);
    try {
      await dispatch(deleteBusiness({ businessId: businessToDelete })).unwrap();
      dispatch(businessDeleted(businessToDelete));
      dispatch(resetNotes());
      dispatch(resetServices());
      dispatch(clearBusinessState());
      toast.success("Negocio eliminado exitosamente");
    } catch (err) {
      toast.error(err.message || "Error al eliminar el negocio");
    }
  }, [businessToDelete, dispatch]);

  // Efectos optimizados
  useEffect(() => {
    const pathSegments = location.pathname.split("/");
    const basePath = pathSegments[1];
    const section = pathSegments[2] || "summary";

    setActivePath(section);

    if (
      basePath === "owner" &&
      !pathSegments[3] &&
      businesses.length > 0 &&
      section !== "create-business"
    ) {
      const defaultBusinessId = defaultBusiness || businesses[0]?._id;
      if (defaultBusinessId && location.pathname === "/owner") {
        navigate(`/owner/local-summary/${defaultBusinessId}`, {
          replace: true,
        });
      }
    } else if (pathSegments[3]) {
      const newBusinessId = pathSegments[3];
      setActiveBusinessId(newBusinessId);

      if (section.startsWith("local-summary")) setActiveTab("summary");
      else if (section.startsWith("services")) setActiveTab("services");
      else if (section.startsWith("status")) setActiveTab("status");
    } else {
      setActiveBusinessId(null);
      setActiveTab(section);
    }
  }, [location, businesses, defaultBusiness, navigate]);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (
      businessToDelete &&
      !businesses.find((b) => b._id === businessToDelete)
    ) {
      if (businesses.length === 0) {
        navigate("/owner", { replace: true });
      } else {
        const nextBusiness = businesses.find((b) => b._id !== businessToDelete);
        navigate(`/owner/local-summary/${nextBusiness._id}`);
      }
      setBusinessToDelete(null);
    }
  }, [businesses, businessToDelete, navigate]);

  // Renderizado condicional optimizado
  const renderOwnerTabs = useCallback(() => {
    const activeBusiness = businesses.find((b) => b._id === activeBusinessId);
    if (!activeBusiness) return null;

    return (
      <TabsContainer $isHidden={isCreateBusinessModalOpen}>
        <BusinessTabsContainer key={activeBusiness._id}>
          <BusinessTabsTitle>{activeBusiness.name}</BusinessTabsTitle>
          <BusinessTabs>
            <Tab
              $active={activeTab === "summary"}
              onClick={() => {
                setActiveTab("summary");
                navigate(`/owner/local-summary/${activeBusiness._id}`);
              }}
            >
              Resumen
            </Tab>
            <Tab
              $active={activeTab === "services"}
              onClick={() => {
                setActiveTab("services");
                navigate(`/owner/services/${activeBusiness._id}`);
              }}
            >
              Servicios
            </Tab>
            <Tab
              $active={activeTab === "status"}
              onClick={() => {
                setActiveTab("status");
                navigate(`/laundry-status/${activeBusiness._id}`);
              }}
            >
              Estado de Notas
            </Tab>
            <DeleteButton
              onClick={() => handleDeleteBusiness(activeBusiness._id)}
            >
              Eliminar Negocio
            </DeleteButton>
          </BusinessTabs>
        </BusinessTabsContainer>
      </TabsContainer>
    );
  }, [
    activeBusinessId,
    activeTab,
    businesses,
    handleDeleteBusiness,
    isCreateBusinessModalOpen,
    navigate,
  ]);

  // Función helper memoizada para títulos de página
  const pageTitle = useMemo(() => {
    if (role === "admin") {
      const item = adminNavItems.find((i) => i.path === activePath);
      return item ? item.label : "Dashboard";
    }

    if (activePath.startsWith("local-summary") && activeBusinessId) {
      return (
        businesses.find((b) => b._id === activeBusinessId)?.name || "Dashboard"
      );
    }

    if (activePath.startsWith("services") && activeBusinessId) {
      const business = businesses.find((b) => b._id === activeBusinessId);
      return business ? `Servicios - ${business.name}` : "Servicios";
    }

    return activePath === "create-business"
      ? "Crear Nuevo Negocio"
      : "Dashboard";
  }, [activePath, activeBusinessId, businesses, role, adminNavItems]);

  if (loading) {
    return <LoadingContainer>Cargando...</LoadingContainer>;
  }

  if (role !== "owner" && role !== "admin") {
    return (
      <AccessDeniedContainer>
        <AccessDenied>
          Acceso denegado. No tienes permisos suficientes.
        </AccessDenied>
      </AccessDeniedContainer>
    );
  }

  return (
    <DashboardContainer>
      <MobileHeader $isMobile={isMobile}>
        <MenuButton onClick={toggleSidebar} aria-label="Toggle menu">
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </MenuButton>
        <PageTitle>{pageTitle}</PageTitle>
      </MobileHeader>

      {isMobile && isSidebarOpen && <Backdrop onClick={closeSidebar} />}

      <DashboardLayout $isMobile={isMobile}>
        <Sidebar $isOpen={isSidebarOpen} $isMobile={isMobile}>
          <SidebarHeader>
            <AdminTitle>
              {role === "admin" ? "Panel Admin" : "Mi Negocio"}
            </AdminTitle>
          </SidebarHeader>

          <NavMenu>
            {(role === "admin" ? adminNavItems : ownerNavItems).map((item) => (
              <StyledNavLink
                key={item.path}
                to={
                  item.path === "create-business" ? "#" : `/owner/${item.path}`
                }
                onClick={(e) => {
                  if (item.path === "create-business") {
                    e.preventDefault();
                    setIsCreateBusinessModalOpen(true);
                  } else {
                    closeSidebar();
                  }
                }}
                $isActive={location.pathname.includes(item.path)}
              >
                <item.icon />
                <span>{item.label}</span>
              </StyledNavLink>
            ))}
          </NavMenu>
        </Sidebar>

        <MainContent $isOpen={isSidebarOpen} $isMobile={isMobile}>
          {role === "owner" && (
            <>
              {businesses.length > 0 && renderOwnerTabs()}
              {businesses.length === 0 && (
                <NoBusinessesContainer>
                  <NoBusinessesMessage>
                    No tienes negocios registrados. ¡Crea uno nuevo!
                  </NoBusinessesMessage>
                  <CreateBusinessButton
                    onClick={() => setIsCreateBusinessModalOpen(true)}
                  >
                    Crear Negocio
                  </CreateBusinessButton>
                </NoBusinessesContainer>
              )}
            </>
          )}
          <OutletContainer>
            <Outlet
              context={{ businessId: activeBusinessId, activeTab }}
              key={activeBusinessId}
            />
          </OutletContainer>
        </MainContent>
      </DashboardLayout>

      <Dialog
        open={isCreateBusinessModalOpen}
        onClose={() => setIsCreateBusinessModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <SetUpBusiness
          isModal
          onClose={() => setIsCreateBusinessModalOpen(false)}
          userId={userId}
          userEmail={userId ? "user@example.com" : ""}
        />
      </Dialog>

      <SimpleConfirmationModal
        showModal={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={confirmDeleteBusiness}
        userName={
          businesses.find((b) => b._id === businessToDelete)?.name || "negocio"
        }
        itemType="negocio"
      />
    </DashboardContainer>
  );
});

export default Dashboard;

// Componentes Styled optimizados con React.memo
const DashboardContainer = React.memo(styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc;
`);

const DashboardLayout = React.memo(styled.div`
  display: flex;
  flex: 1;
  flex-direction: ${({ $isMobile }) => ($isMobile ? "column" : "row")};
  min-height: calc(100vh - 60px);
`);

const MobileHeader = React.memo(styled.header`
  display: ${({ $isMobile }) => ($isMobile ? "flex" : "none")};
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  height: 60px;
`);

const MenuButton = React.memo(styled.button`
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
`);

const PageTitle = React.memo(styled.h1`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`);

const Backdrop = React.memo(styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100vh - 60px);
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  backdrop-filter: blur(3px);
  transition: opacity 0.3s ease;
`);

const Sidebar = React.memo(styled.aside`
  width: ${({ $isMobile }) => ($isMobile ? "280px" : "250px")};
  background: #ffffff;
  padding: 1.5rem;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: ${({ $isMobile, $isOpen }) =>
    !$isMobile && $isOpen ? "2px 0 10px rgba(0, 0, 0, 0.05)" : "none"};
  overflow-y: auto;

  ${({ $isMobile, $isOpen }) =>
    $isMobile &&
    css`
      position: fixed;
      top: 60px;
      left: 0;
      bottom: 0;
      z-index: 95;
      transform: translateX(${$isOpen ? "0" : "-100%"});
      box-shadow: ${$isOpen ? "4px 0 15px rgba(0, 0, 0, 0.08)" : "none"};
    `}

  ${({ $isMobile }) =>
    !$isMobile &&
    css`
      display: flex;
      position: sticky;
      top: 0;
      height: 100vh;
    `}
`);

const SidebarHeader = React.memo(styled.div`
  padding: 0 0 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`);

const AdminTitle = React.memo(styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`);

const NavMenu = React.memo(styled.nav`
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  gap: 0.5rem;
`);

const StyledNavLink = React.memo(styled(NavLink)`
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
`);

const MainContent = React.memo(styled.main`
  flex: 1;
  padding: ${({ $isMobile }) => ($isMobile ? "1.5rem 1rem" : "2rem 2.5rem")};
  margin-top: ${({ $isMobile, $isOpen }) =>
    $isMobile && $isOpen ? "60px" : "0"};
  transition: all 0.3s ease;
  background-color: #f8fafc;
  min-height: calc(100vh - 60px);
`);

const OutletContainer = React.memo(styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`);

const TabsContainer = React.memo(styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0 0;
  visibility: ${({ $isHidden }) => ($isHidden ? "hidden" : "visible")};
`);

const BusinessTabsContainer = React.memo(styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`);

const BusinessTabsTitle = React.memo(styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem;
  padding-left: 0.5rem;
`);

const BusinessTabs = React.memo(styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
`);

const Tab = React.memo(styled.button`
  background: ${({ $active }) => ($active ? "#1d4ed8" : "#e5e7eb")};
  color: ${({ $active }) => ($active ? "#fff" : "#1f2937")};
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => ($active ? "#1e40af" : "#d1d5db")};
  }
`);

const DeleteButton = React.memo(styled.button`
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #b02a37;
  }
`);

const NoBusinessesContainer = React.memo(styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin: 2rem auto;
  max-width: 600px;
  width: 100%;
`);

const NoBusinessesMessage = React.memo(styled.p`
  font-size: 1.2rem;
  color: #1f2937;
  margin-bottom: 1.5rem;
  text-align: center;
`);

const CreateBusinessButton = React.memo(styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`);

const LoadingContainer = React.memo(styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8fafc;
  font-size: 1.125rem;
  color: #1f2937;
`);

const AccessDeniedContainer = React.memo(styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8fafc;
`);

const AccessDenied = React.memo(styled.div`
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
`);
