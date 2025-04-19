import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import EditService from "../../../EditService";

const ServiceCard = ({ service, setServices, setError, setLoading, handleDelete, loading }) => {
  const [showEdit, setShowEdit] = useState(false);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setShowEdit(true);
  };

  return (
    <CardContainer>
      <ServiceInfo>
        <ServiceName>{service.name}</ServiceName>
        <ServiceType>Tipo: {service.type}</ServiceType>
        {service.type === "simple" && (
          <ServicePrice>Precio: ${service.price?.toLocaleString()}</ServicePrice>
        )}
        {service.type === "sized" && service.sizes?.length > 0 && (
          <ServiceSizes>
            Tallas:
            <SizesList>
              {service.sizes.map((size) => (
                <li key={size.id}>{size.name} (${size.price?.toLocaleString()})</li>
              ))}
            </SizesList>
          </ServiceSizes>
        )}
        <ServiceDays>
          Días:{" "}
          {service.availableDays?.length > 0
            ? service.availableDays
                .map((d) => ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d])
                .join(", ")
            : "Todos"}
        </ServiceDays>
      </ServiceInfo>

      <Actions>
        <ActionButton onClick={handleEditClick}>
          Editar
        </ActionButton>
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(service._id, "servicio");
          }}
          isDelete
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Eliminar
        </ActionButton>
      </Actions>

      {showEdit && (
        <EditService
          service={service}
          setServices={setServices}
          setError={setError}
          setLoading={setLoading}
          onClose={() => setShowEdit(false)}
        />
      )}
    </CardContainer>
  );
};

// Styled Components (los mismos que antes)
export default ServiceCard;

// Styled Components
const CardContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  background-color: white;
  font-family: "Poppins", sans-serif;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
`;

const ServiceInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ServiceName = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: #007bff;
  font-weight: 600;
`;

const ServiceType = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-style: italic;
  color: #555;
`;

const ServicePrice = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: bold;
`;

const ServiceSizes = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
`;

const SizesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.25rem 0 0 0;

  li {
    padding: 0.25rem 0;
    font-size: 0.95rem;
    color: #666;
  }
`;

const ServiceDays = styled.p`
  margin: 0;
  font-size: 1rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
`;

const ActionButton = styled(motion.button)`
  background-color: ${({ isDelete }) => (isDelete ? "#dc3545" : "#007bff")};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
  font-family: "Poppins", sans-serif;

  &:hover:not(:disabled) {
    background-color: ${({ isDelete }) => (isDelete ? "#c82333" : "#0056b3")};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
  }
`;