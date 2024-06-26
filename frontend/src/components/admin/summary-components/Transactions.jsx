import styled from "styled-components";
import { useEffect, useState } from "react";
import { setHeaders, url } from "../../../features/api";
import axios from "axios";
import moment from "moment";

const Transactions = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await axios.get(`${url}/orders/?new=true`, setHeaders());
        setOrders(res.data);
      } catch (error) {
        console.log(error);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  return (
    <StyledTransactions>
      {isLoading ? (
        <Loading>Loading transactions...</Loading>
      ) : (
        <>
          <Title>Latest Transactions</Title>
          {orders.length > 0 ? (
            orders.map((order, index) => (
              <Transaction key={index}>
                <CustomerName>{order.shipping.name}</CustomerName>
                <Amount>{(order.total / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</Amount>
                <Time>{moment(order.createdAt).fromNow()}</Time>
              </Transaction>
            ))
          ) : (
            <EmptyState>No transactions found.</EmptyState>
          )}
        </>
      )}
    </StyledTransactions>
  );
};

export default Transactions;

const StyledTransactions = styled.div`
  background: rgb(48, 51, 78);
  color: rgba(234, 234, 255, 0.87);
  padding: 1rem;
  border-radius: 5px;
`;

const Loading = styled.p`
  margin-top: 1rem;
`;

const Title = styled.h3`
  margin-bottom: 1rem;
`;

const Transaction = styled.div`
  display: flex;
  font-size: 14px;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 3px;
  background: rgba(38, 198, 249, 0.12);
  &:nth-child(even) {
    background: rgba(102, 108, 255, 0.12);
  }
`;

const CustomerName = styled.p`
  flex: 1;
`;

const Amount = styled.p`
  flex: 1;
  margin-left: 1.5rem
`;

const Time = styled.p`
  flex: 1;
`;

const EmptyState = styled.p`
  margin-top: 1rem;
  color: rgba(234, 234, 255, 0.6);
`;
