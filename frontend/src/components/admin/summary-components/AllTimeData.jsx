import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { usersFetch } from "../../../features/usersSlice";
import { ordersFetch } from "../../../features/ordersSlice";

const AllTimeData = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(usersFetch());
    dispatch(ordersFetch());
  }, [dispatch]);

  const {
    list: users = [],
    status: usersStatus,
    error: usersError,
  } = useSelector((state) => state.users);

  const {
    list: orders = [],
    status: ordersStatus,
    error: ordersError,
  } = useSelector((state) => state.orders);

  const {
    items: products = [],
  } = useSelector((state) => state.products);

  // Calcular ganancias totales
  const calculateEarnings = () => {
    const totalEarnings = orders?.reduce((sum, order) => {
      return sum + (order?.total || 0);
    }, 0);

    // Stripe devuelve en centavos (MXN) → dividir entre 100
    return (totalEarnings / 100).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  const isLoading = usersStatus === "pending" || ordersStatus === "pending";
  const isError = usersError || ordersError;

  return (
    <Container>
      <Title>Datos Acumulados</Title>
      <Content>
        {isLoading ? (
          <Loading>Cargando...</Loading>
        ) : isError ? (
          <Error>Error: {usersError || ordersError}</Error>
        ) : (
          <>
            <Info>
              <InfoTitle>Usuarios</InfoTitle>
              <InfoData>{users?.length ?? 0}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Productos</InfoTitle>
              <InfoData>{products?.length ?? 0}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Órdenes</InfoTitle>
              <InfoData>{orders?.length ?? 0}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Ganancias</InfoTitle>
              <InfoData>{calculateEarnings()}</InfoData>
            </Info>
          </>
        )}
      </Content>
    </Container>
  );
};

export default AllTimeData;

// Estilos

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
