import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { useEffect } from "react";
import { usersFetch } from "../../../features/usersSlice";
import { FaUsers, FaTshirt, FaClipboardList, FaMoneyBillWave } from "react-icons/fa";

const AllTimeData = () => {
  const dispatch = useDispatch();

  const { list: users = [], status: usersStatus, error: usersError } = useSelector((state) => state.users);
  const { list: orders = [], status: ordersStatus, error: ordersError } = useSelector((state) => state.orders);
  const { items: products = [] } = useSelector((state) => state.products);

  const isLoading = usersStatus === "pending" || ordersStatus === "pending";
  const isError = usersError || ordersError;

  const calculateEarnings = () => {
    const totalEarnings = orders?.reduce((sum, order) => sum + (order?.total || 0), 0);
    return (totalEarnings / 100).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  useEffect(() => {
    if (usersStatus !== "succeeded") dispatch(usersFetch());
  }, [dispatch, usersStatus]);

  return (
    <Container>
      <h3>Resumen Acumulado</h3>
      <StatsGrid>
        {isLoading ? (
          <Loading>Cargando...</Loading>
        ) : isError ? (
          <Error>Error: {usersError || ordersError}</Error>
        ) : (
          <>
            <StatCard>
              <IconWrapper>
                <FaUsers />
              </IconWrapper>
              <Data>
                <Label>Usuarios</Label>
                <Value>{users.length}</Value>
              </Data>
            </StatCard>
            <StatCard>
              <IconWrapper>
                <FaTshirt />
              </IconWrapper>
              <Data>
                <Label>Productos</Label>
                <Value>{products.length}</Value>
              </Data>
            </StatCard>
            <StatCard>
              <IconWrapper>
                <FaClipboardList />
              </IconWrapper>
              <Data>
                <Label>Órdenes</Label>
                <Value>{orders.length}</Value>
              </Data>
            </StatCard>
            <StatCard>
              <IconWrapper>
                <FaMoneyBillWave />
              </IconWrapper>
              <Data>
                <Label>Ganancias</Label>
                <Value>{calculateEarnings()}</Value>
              </Data>
            </StatCard>
          </>
        )}
      </StatsGrid>
    </Container>
  );
};

export default AllTimeData;

// Styled components

const Container = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
`;

const StatsGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-top: 1rem;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f4f7ff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(75, 112, 226, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background: #e8edff;
    transform: translateY(-2px);
  }
`;

const IconWrapper = styled.div`
  font-size: 1.8rem;
  color: #4b70e2;
  margin-right: 1rem;
`;

const Data = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  font-size: 0.9rem;
  color: #777;
`;

const Value = styled.span`
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
`;

const Loading = styled.p`
  text-align: center;
  margin: 1rem 0;
`;

const Error = styled.p`
  text-align: center;
  color: red;
  font-weight: bold;
`;
