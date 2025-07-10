import React from "react";
import styled from "styled-components";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const UserQuickActions = ({ isAdmin, role, onCreateBusiness }) => {

  const navigate = useNavigate();

  return (
    <Card>
      <CardTitle>Acciones Rápidas</CardTitle>
      <ButtonGroup>
        {isAdmin && (
          <QuickActionButton onClick={() => navigate("/admin/summary")}>
            Panel de Administrador
          </QuickActionButton>
        )}
        <QuickActionButton onClick={() => navigate("/support")}>
          Contactar Soporte
        </QuickActionButton>
        {role === "owner" && (
          <QuickActionButton onClick={onCreateBusiness}>
            <FaPlus /> Crear Negocio
          </QuickActionButton>
        )}
      </ButtonGroup>
    </Card>
  );
};

// Estilos (iguales a los del original)
const Card = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

 const CardTitle = styled.h2`
    font-size: 1.5rem;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 1rem;
    text-align: center;
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

const QuickActionButton = styled(ActionButton)`
width: 100%;
justify-content: center;
`;



export default UserQuickActions;