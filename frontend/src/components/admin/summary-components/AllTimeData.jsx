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

  const { list: users, loading: usersLoading, error: usersError } = useSelector((state) => state.users);
  const { list: orders, loading: ordersLoading, error: ordersError } = useSelector((state) => state.orders);
  const { items: products } = useSelector((state) => state.products);

  // Calculate the total earnings from orders
  const calculateEarnings = () => {
    let totalEarnings = 0;
    orders.forEach((order) => {
      totalEarnings += order.total;
    });
    return (totalEarnings / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  return (
    <Container>
      <Title>All Time Data</Title>
      <Content>
        {usersLoading || ordersLoading ? (
          <Loading>Loading...</Loading>
        ) : usersError || ordersError ? (
          <Error>Error: {usersError || ordersError}</Error>
        ) : (
          <>
            <Info>
              <InfoTitle>Users</InfoTitle>
              <InfoData>{users.length}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Products</InfoTitle>
              <InfoData>{products.length}</InfoData>
            </Info>
            <Info>
              <InfoTitle>Orders</InfoTitle>
              <InfoData>{orders.length}</InfoData>
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
