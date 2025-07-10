import { useSelector } from "react-redux";
import styled from "styled-components";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";
import { useMemo } from "react";

const AllTimeData = ({ businessId }) => {
  const { items: notes = [], status, error } = useSelector((state) => state.notes);
  const { businesses } = useSelector((state) => state.auth);

  const isValidBusiness = businesses.some((b) => b._id === businessId);

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => note.businessId === businessId);
    console.log(`Filtered ${filtered.length} notes for AllTimeData, businessId: ${businessId}`);
    return filtered;
  }, [notes, businessId]);

  const totalNotes = filteredNotes.length;

  const totalServices = filteredNotes.reduce(
    (acc, note) => acc + (note.services?.length || 0),
    0
  );

  const totalEarnings = filteredNotes.reduce(
    (acc, note) => acc + (note.total || 0),
    0
  );

  if (!isValidBusiness) {
    return (
      <ErrorContainer>
        <ErrorMessage>Negocio no encontrado o no autorizado</ErrorMessage>
      </ErrorContainer>
    );
  }

  if (status === "pending" && !filteredNotes.length) {
    return <LoadingSpinner message="Cargando datos históricos..." />;
  }

  if (status === "rejected") {
    return (
      <ErrorContainer>
        <ErrorMessage>
          Error al cargar datos: {error || "Por favor intenta de nuevo"}
        </ErrorMessage>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <Title>Datos Históricos</Title>
      <Content>
        {filteredNotes.length === 0 ? (
          <NoData>No hay datos históricos disponibles</NoData>
        ) : (
          <>
            <Info>
              <InfoTitle>Notas creadas</InfoTitle>
              <InfoData>{totalNotes}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Servicios totales</InfoTitle>
              <InfoData>{totalServices}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Ganancias totales</InfoTitle>
              <InfoData>
                {totalEarnings.toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </InfoData>
            </Info>
          </>
        )}
      </Content>
    </Container>
  );
};

const Container = styled.div`
  background: #fff;
  color: #333;
  margin-top: 1.5rem;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  margin-bottom: 1rem;
  color: #333;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 4px;
  background: #f8f9fa;
  &:nth-child(even) {
    background: #e9ecef;
  }
`;

const InfoTitle = styled.div`
  flex: 1;
  font-weight: 600;
`;

const InfoData = styled.div`
  flex: 1;
  font-weight: 700;
  text-align: right;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
`;

const NoData = styled.p`
  text-align: center;
  color: #666;
  margin: 1rem 0;
`;

export default AllTimeData;