import React from "react";
import styled from "styled-components";
import { MdOutlineAdminPanelSettings, MdOutlinePerson } from "react-icons/md";
import { FaStore } from "react-icons/fa";
import { AiOutlineSetting, AiOutlineLogout } from "react-icons/ai";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";
import { useNavigate } from "react-router-dom";

const UserProfileHeader = ({ user, auth, orders, onEditProfile, onLogout }) => {
  const navigate = useNavigate();

  // Funciones auxiliares
  const calculateAccountAge = (createdAt) => {
    if (!createdAt) return "N/A";
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffYears = now.getFullYear() - createdDate.getFullYear();
    const diffMonths = now.getMonth() - createdDate.getMonth();
    const totalMonths = diffYears * 12 + diffMonths;
    return totalMonths > 12
      ? `${Math.floor(totalMonths / 12)} años`
      : `${totalMonths} meses`;
  };

  const calculateAllOrders = (orders, authEmail) => {
    if (!orders || !Array.isArray(orders)) return [];
    return orders.filter(
      (order) =>
        order?.userId?.toString() === user?.id?.toString() ||
        (order?.contact?.email === authEmail && order?.isGuestOrder)
    );
  };
  
  const accountAge = calculateAccountAge(user?.createdAt);
  const allOrders = calculateAllOrders(orders, auth.email);

  return (
    <ProfileCard>
      <CardTitle>¡Bienvenido! {user?.name || "Usuario"}</CardTitle>
      <AvatarSection>
        {user?.photoURL ? (
          <Avatar src={user.photoURL} alt={user.name} />
        ) : (
          <AvatarPlaceholder>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarPlaceholder>
        )}
        <RoleTag isAdmin={user?.isAdmin} isOwner={auth.role === "owner"}>
          {user?.isAdmin ? (
            <MdOutlineAdminPanelSettings />
          ) : auth.role === "owner" ? (
            <FaStore />
          ) : (
            <MdOutlinePerson />
          )}
          {user?.isAdmin
            ? "Admin"
            : auth.role === "owner"
            ? "Propietario"
            : "Cliente"}
        </RoleTag>
      </AvatarSection>
      <UserInfo>
        {user?.status === "loading" && (
          <LoadingSpinner message="Cargando información del usuario..." />
        )}
        {user?.error && (
          <ErrorMessage
            message={user.error.message || "Error al obtener datos del usuario"}
          />
        )}
        <InfoItem>
          <strong>Correo:</strong> {user?.email || "N/A"}
        </InfoItem>
        <InfoItem>
          <strong>Total de Órdenes:</strong> {allOrders.length}
        </InfoItem>
        <InfoItem>
          <strong>Antigüedad de la Cuenta:</strong> {accountAge}
        </InfoItem>
      </UserInfo>
      <ButtonGroup>
        <ActionButton onClick={onEditProfile}>
          <AiOutlineSetting /> Editar Perfil
        </ActionButton>
        {auth.role === "owner" && (
          <ActionButton onClick={() => navigate("/owner")}>
            <FaStore /> Panel de Negocios
          </ActionButton>
        )}
        <ActionButton onClick={onLogout}>
          <AiOutlineLogout /> Cerrar Sesión
        </ActionButton>
      </ButtonGroup>
    </ProfileCard>
  );
};

const ProfileCard = styled.div`
  background: linear-gradient(45deg, #007bff, #0056b3);
  color: #fff;
  text-align: center;
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffff;
  margin-bottom: 1rem;
  text-align: center;
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
`;

const Avatar = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const AvatarPlaceholder = styled.div`
  width: 120px;
  height: 120px;
  background: #e5e5ea;
  color: #007aff;
  border: 3px solid #007bff;
  border-radius: 50%;
  font-size: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const RoleTag = styled.div`
  background: ${({ isAdmin, isOwner }) =>
    isAdmin ? "#ffd60a" : isOwner ? "#34c759" : "#e5e5ea"};
  color: ${({ isAdmin, isOwner }) =>
    isAdmin || isOwner ? "#1d1d1f" : "#007aff"};
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserInfo = styled.div`
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const InfoItem = styled.p`
  margin: 0.5rem 0;
  font-size: 0.95rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #d1d1d6;
    cursor: not-allowed;
  }
`;

export default UserProfileHeader;
