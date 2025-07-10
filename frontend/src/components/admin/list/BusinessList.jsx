import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { url, setHeaders } from "../../../features/api";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";
import { toast } from "react-toastify";
import { FaStore } from "react-icons/fa";
import { loginUserSuccess } from "../../../features/authSlice";

const BusinessesList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { _id: userId, businesses } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${url}/businesses?owner=${userId}`,
          setHeaders()
        );
        // Update auth state with fetched businesses
        const userResponse = await axios.get(`${url}/users/${userId}`, setHeaders());
        dispatch(loginUserSuccess(userResponse.data.token));
      } catch (err) {
        toast.error("Error al cargar los negocios");
      } finally {
        setIsLoading(false);
      }
    };
    if (!businesses.length) fetchBusinesses();
  }, [businesses, userId, dispatch]);

  const handleSelectBusiness = (businessId) => {
    navigate(`/admin/notes-summary?businessId=${businessId}`);
  };

  if (isLoading) return <LoadingSpinner message="Cargando negocios..." />;
  if (!businesses.length && !isLoading) {
    return (
      <Container>
        <Title>Mis Negocios</Title>
        <EmptyState>
          <FaStore size={40} />
          <EmptyMessage>No tienes negocios registrados.</EmptyMessage>
          <CreateButton onClick={() => navigate("/setup-business")}>
            Crear Negocio
          </CreateButton>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Mis Negocios</Title>
      <BusinessGrid>
        {businesses.map((business) => (
          <BusinessCard
            key={business._id}
            onClick={() => handleSelectBusiness(business._id)}
          >
            <BusinessName>{business.name}</BusinessName>
            <BusinessDetail>
              Sucursales: {business.branches?.length || 0}
            </BusinessDetail>
            <BusinessDetail>
              Servicios: {business.services?.length || 0}
            </BusinessDetail>
          </BusinessCard>
        ))}
      </BusinessGrid>
    </Container>
  );
};

const Container = styled.div`
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
`;

const EmptyMessage = styled.p`
  color: #666;
  font-size: 1rem;
  margin: 1rem 0;
`;

const CreateButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  &:hover {
    background: #0056b3;
  }
`;

const BusinessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const BusinessCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const BusinessName = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
`;

const BusinessDetail = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
`;

export default BusinessesList;