import styled from "styled-components";
import Widget from "./summary-components/Widget";
import { FaUsers, FaChartBar, FaClipboard } from "react-icons/fa";
import Chart from "./summary-components/Chart";
import Transactions from "./summary-components/Transactions";
import AllTimeData from "./summary-components/AllTimeData";
import OrdersList from "./list/OrdersList";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { url } from "../../features/api";
import socket from "../../features/socket";
import {
  fetchOrderStats,
  fetchIncomeStats,
  fetchWeekSales,
  updateStats,
} from "../../features/ordersSlice";

const Summary = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector((state) => state.orders);

  const [users, setUsers] = useState([]);
  const [usersPerc, setUsersPerc] = useState(0);
  const [socketStatus, setSocketStatus] = useState("disconnected");

  const compare = (a, b) => (a._id < b._id ? 1 : -1);

  useEffect(() => {
    // Fetch manual de stats de usuarios
    const fetchUsersStats = async () => {
      try {
        const res = await fetch(`${url}/users/stats`);
        const data = await res.json();
        const sorted = data.sort(compare);
        setUsers(sorted);

        if (sorted.length >= 2 && sorted[1].total !== 0) {
          setUsersPerc(
            ((sorted[0].total - sorted[1].total) / sorted[1].total) * 100
          );
        } else {
          setUsersPerc(0);
        }
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        setUsers([]);
        setUsersPerc(0);
      }
    };

    fetchUsersStats();
  }, []);

  useEffect(() => {
    dispatch(fetchOrderStats());
    dispatch(fetchIncomeStats());
    dispatch(fetchWeekSales());
  }, [dispatch]);

  useEffect(() => {
    const handleStatsUpdated = (payload) => {
      dispatch(updateStats(payload));
    };

    socket.on("connect", () => {
      setSocketStatus("connected");
    });

    socket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    socket.on("statsUpdated", handleStatsUpdated);

    return () => {
      socket.off("statsUpdated", handleStatsUpdated);
    };
  }, [dispatch]);

  const sortedOrders = useMemo(() => [...(stats.orders || [])].sort(compare), [stats.orders]);
  const sortedIncome = useMemo(() => [...(stats.income || [])].sort(compare), [stats.income]);

  const ordersPerc =
    sortedOrders.length >= 2 && sortedOrders[1].total !== 0
      ? ((sortedOrders[0].total - sortedOrders[1].total) / sortedOrders[1].total) * 100
      : 0;

  const incomePerc =
    sortedIncome.length >= 2 && sortedIncome[1].total !== 0
      ? ((sortedIncome[0].total - sortedIncome[1].total) / sortedIncome[1].total) * 100
      : 0;

  const data = [
    {
      icon: <FaUsers />,
      digits: users[0]?.total ?? 0,
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
      digits: sortedIncome[0]?.total ? (sortedIncome[0].total / 100).toFixed(2) : "0.00",
      isMoney: true,
      title: "Earnings",
      color: "rgb(253, 181, 40)",
      bgColor: "rgb(253, 181, 40, 0.12)",
      percentage: incomePerc,
    },
  ];

  return (
    <StyledSummary>
      <MainStats>
        <Overview>
          <Title>
            <h2>Overview</h2>
            <p>How your Laundry is performing compared to the previous month</p>
            <SocketStatus status={socketStatus}>
              {socketStatus === "connected" ? "🟢 Conectado" : "🔴 Desconectado"}
            </SocketStatus>
          </Title>
          <WidgetWrapper>
            {data.map((data, index) => (
              <Widget key={index} data={data} />
            ))}
          </WidgetWrapper>
        </Overview>
        <Chart data={stats.weekly} />
        <OrdersList />
      </MainStats>
      <SideStats>
        <Transactions />
        <AllTimeData />
      </SideStats>
    </StyledSummary>
  );
};

export default Summary;



// Estilos mejorados
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
    status === "connected" ? "#28a745" : 
    status === "disconnected" ? "#dc3545" : 
    status === "error" ? "#ffc107" : "#6c757d"};
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