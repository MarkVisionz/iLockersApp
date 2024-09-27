import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { notesFetch } from "../../../features/notesSlice"; // Asegúrate de tener este thunk

const AllTimeData = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(notesFetch());
  }, [dispatch]);

  const { items: notes, loading: notesLoading, error: notesError } = useSelector((state) => state.notes);

  // Calcular el total de notas creadas
  const totalNotes = notes.length;

  // Calcular el total de servicios (supongamos que cada nota tiene un campo 'services' que es un array)
  const totalServices = notes.reduce((acc, note) => acc + note.services.length, 0);

  // Calcular las ganancias totales
  const calculateEarnings = () => {
    let totalEarnings = 0;
    notes.forEach((note) => {
      totalEarnings += note.total;
    });
    return (totalEarnings).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  return (
    <Container>
      <Title>All Time Data</Title>
      <Content>
        {notesLoading ? (
          <Loading>Loading...</Loading>
        ) : notesError ? (
          <Error>Error: {notesError}</Error>
        ) : (
          <>
            <Info>
              <InfoTitle>Notas Creadas</InfoTitle>
              <InfoData>{totalNotes}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Servicios</InfoTitle>
              <InfoData>{totalServices}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Earnings</InfoTitle>
              <InfoData>{calculateEarnings()}</InfoData>
            </Info>
          </>
        )}
      </Content>
    </Container>
  );
};

export default AllTimeData;

const Container = styled.div`
  background-color: rgb(48, 51, 78);
  color: rgba(234, 234, 255, 0.87);
  margin-top: 1.5rem;
  border-radius: 5px;
  padding: 1rem;
  font-size: 14px;
`;

const Title = styled.h3`
  margin-bottom: 1rem;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
`;

const Info = styled.div`
  display: flex;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 3px;
  background: rgba(38, 198, 249, 0.12);
  &:nth-child(even) {
    background: rgba(102, 108, 255, 0.12);
  }
`;

const InfoTitle = styled.div`
  flex: 1;
`;

const InfoData = styled.div`
  flex: 1;
  font-weight: 700;
`;

const Loading = styled.p`
  margin-top: 1rem;
`;

const Error = styled.p`
  margin-top: 1rem;
  color: red;
`;
