import styled from "styled-components";
import Widget from "../admin/summary-components/Widget";
import { FaUsers, FaChartBar, FaClipboard } from "react-icons/fa";
import Chart from "../admin/summary-components/Chart";
import Transactions from "../admin/summary-components/Transactions";
import AllTimeData from "../admin/summary-components/AllTimeData";
import OrdersList from "../admin/list/OrdersList";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import socket from "../../features/socket";
import {
  fetchOrderStats,
  fetchIncomeStats,
  fetchWeekSales,
  updateStats,
} from "../../features/ordersSlice";
import { LoadingSpinner } from "../LoadingAndError";

const Summary = () => {
  const dispatch = useDispatch();
  const { stats, status, error } = useSelector((state) => state.orders);

  // Datos simulados para usuarios (sin socket)
  const usersData = useMemo(
    () => [
      { _id: "current_month", total: 150 },
      { _id: "previous_month", total: 120 },
    ],
    []
  );

  const compare = (a, b) => (a._id < b._id ? 1 : -1);

  // Carga inicial y WebSocket
  useEffect(() => {
    dispatch(fetchOrderStats());
    dispatch(fetchIncomeStats());
    dispatch(fetchWeekSales());

    const handleStatsUpdated = (payload) => {
      dispatch(updateStats(payload));
    };

    socket.on("statsUpdated", handleStatsUpdated);

    return () => {
      socket.off("statsUpdated", handleStatsUpdated);
    };
  }, [dispatch]);

  // Datos ordenados y porcentajes
  const sortedOrders = useMemo(
    () => [...(stats?.orders || [])].sort(compare),
    [stats?.orders]
  );
  const sortedIncome = useMemo(
    () => [...(stats?.income || [])].sort(compare),
    [stats?.income]
  );
  const sortedUsers = useMemo(() => [...usersData].sort(compare), [usersData]);

  const usersPerc = useMemo(
    () =>
      sortedUsers.length >= 2 && sortedUsers[1].total !== 0
        ? ((sortedUsers[0].total - sortedUsers[1].total) / sortedUsers[1].total) *
          100
        : 0,
    [sortedUsers]
  );

  const ordersPerc = useMemo(
    () =>
      sortedOrders.length >= 2 && sortedOrders[1].total !== 0
        ? ((sortedOrders[0].total - sortedOrders[1].total) /
            sortedOrders[1].total) *
          100
        : 0,
    [sortedOrders]
  );

  const incomePerc = useMemo(
    () =>
      sortedIncome.length >= 2 && sortedIncome[1].total !== 0
        ? ((sortedIncome[0].total - sortedIncome[1].total) /
            sortedIncome[1].total) *
          100
        : 0,
    [sortedIncome]
  );

  const data = useMemo(
    () => [
      {
        icon: <FaUsers />,
        digits: sortedUsers[0]?.total ?? 0,
        isMoney: false,
        title: "Users",
        color: "rgb(255, 99, 132)",
        bgColor: "rgba(255, 99, 132, 0.12)",
        percentage: usersPerc,
      },
      {
        icon: <FaClipboard />,
        digits: sortedOrders[0]?.total ?? 0,
        isMoney: false,
        title: "Orders",
        color: "#00d532",
        bgColor: "rgba(0, 255, 115, 0.12)",
        percentage: ordersPerc,
      },
      {
        icon: <FaChartBar />,
        digits: sortedIncome[0]?.total
          ? (sortedIncome[0].total / 100).toFixed(2)
          : "0.00",
        isMoney: true,
        title: "Earnings",
        color: "rgb(253, 181, 40)",
        bgColor: "rgb(253, 181, 40, 0.12)",
        percentage: incomePerc,
      },
    ],
    [sortedUsers, sortedOrders, sortedIncome, usersPerc, ordersPerc, incomePerc]
  );

  return (
    <StyledSummary>
      {status === "loading" && !stats?.orders?.length ? (
        <LoadingSpinner message={"Loading statistics..."}></LoadingSpinner>
      ) : status === "failed" && !stats?.orders?.length ? (
        <LoadingMessage>
          Error loading statistics: {error || "Please try again later"}
        </LoadingMessage>
      ) : (
        <>
          <MainStats>
            <Overview>
              <Title>
                <h2>Overview</h2>
                <p>
                  How your Laundry is performing compared to the previous month
                </p>
                <SocketStatus
                  status={socket.connected ? "connected" : "disconnected"}
                >
                  {socket.connected ? "🟢 Conectado" : "🔴 Desconectado"}
                </SocketStatus>
              </Title>
              <WidgetWrapper>
                {data.map((data, index) => (
                  <Widget key={index} data={data} />
                ))}
              </WidgetWrapper>
            </Overview>
            <Chart data={stats?.weekly || []} />
            <OrdersList />
          </MainStats>
          <SideStats>
            <Transactions />
            <AllTimeData />
          </SideStats>
        </>
      )}
    </StyledSummary>
  );
};

export default Summary;

// Estilos
const StyledSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem;
  width: 100%;
  min-height: 80vh;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2rem;
  color: #555;
`;

const MainStats = styled.div`
  flex: 2;
  width: 100%;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const Title = styled.div`
  h2 {
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 14px;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }
`;

const SocketStatus = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  background-color: ${({ status }) =>
    status === "connected" ? "#28a745" : "#dc3545"};
  color: white;
`;

const Overview = styled.div`
  background: linear-gradient(45deg, #4b70e2, #3a5bb8);
  color: #ffffff;
  padding: 1.5rem;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
    padding: 1rem;
  }
`;

const WidgetWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
  justify-content: space-around;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SideStats = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;

  @media (max-width: 768px) {
    flex: 1;
    margin-top: 1rem;
  }
`;