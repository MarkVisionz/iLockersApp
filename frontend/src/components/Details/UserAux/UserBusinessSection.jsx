import React from "react";
import styled from "styled-components";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";


const CARD_THEMES = [
  "linear-gradient(45deg, #ff6200, #ff8c00)",
  "linear-gradient(45deg, #1a3c34, #2a5d53)",
  "linear-gradient(45deg, #004d7a, #008793)",
  "linear-gradient(45deg, #4b2e2e, #6b4e4e)",
];

const UserBusinessSection = ({
  businesses,
  businessStats,
  onEditBusiness,
  onDeleteBusiness,
  onCreateBusiness,
}) => {
  const formatAddress = (address) => {
    if (!address || typeof address !== "object") return "N/A";
    const { street, city, state, postalCode, country } = address;
    return [street, city, state, postalCode, country]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <Card>
      <CardTitle>Tus Negocios</CardTitle>
      {businesses.length === 0 ? (
        <EmptyState>
          No hay negocios registrados.
          <ActionButton onClick={onCreateBusiness}>
            <FaPlus /> Crear Negocio
          </ActionButton>
        </EmptyState>
      ) : (
        <BusinessList>
          {businesses.map((business, index) => {
            const stats = businessStats.find(
              (s) => s?.businessId === business?._id
            ) || {
              totalSales: 0,
              totalNotes: 0,
            };
            return (
              <BusinessCard
                key={business?._id || index}
                theme={CARD_THEMES[index % CARD_THEMES.length]}
              >
                <BusinessInfo>
                  <BusinessName>
                    {business?.name || "Negocio desconocido"}
                  </BusinessName>
                  <BusinessMeta>
                    <span>Dirección: {formatAddress(business?.address)}</span>
                    <span>Ventas Totales: ${stats.totalSales.toFixed(2)}</span>
                    <span>Notas Totales: {stats.totalNotes}</span>
                  </BusinessMeta>
                </BusinessInfo>
                <ButtonGroup>
                  <ActionButton
                    onClick={() => onEditBusiness(business)}
                    disabled={!business?._id}
                  >
                    <FaEdit /> Editar
                  </ActionButton>
                  <ActionButton
                    onClick={() => onDeleteBusiness(business?._id)}
                    style={{ background: "#ff3b30" }}
                    disabled={!business?._id}
                  >
                    <FaTrash /> Eliminar
                  </ActionButton>
                </ButtonGroup>
              </BusinessCard>
            );
          })}
        </BusinessList>
      )}
    </Card>
  );
};

// Estilos (iguales a los del original)
const Card = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const BusinessList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BusinessCard = styled.div`
  background: ${({ theme }) => theme};
  color: #fff;
  border-radius: 18px;
  padding: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 1rem;
  text-align: center;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #86868b;
  font-size: 0.95rem;
  margin: 1rem 0;
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

const BusinessInfo = styled.div`
    margin-bottom: 1rem;
  `;

  const BusinessName = styled.h3`
    font-size: 1.2rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.5rem;
  `;

  const BusinessMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #fff;
  `;


export default UserBusinessSection;
