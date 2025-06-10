import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUsers, FaChartBar, FaClipboard } from "react-icons/fa";
import styled from "styled-components";
import Widget from "../admin/summary-components/Widget";
import Chart from "../admin/summary-components/Chart";
import Transactions from "../admin/summary-components/Transactions";
import AllTimeData from "../admin/summary-components/AllTimeData";
import OrdersList from "../admin/list/OrdersList";
import {
  ordersFetch,
  fetchOrderStats,
  fetchIncomeStats,
  fetchWeekSales,
  resetError,
} from "../../features/ordersSlice";
import { usersFetch } from "../../features/usersSlice";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import { toast } from "react-toastify";
import socket from "../../features/socket";

const Summary = () => {
  const dispatch = useDispatch();
  const { list, stats, status: ordersStatus, stats: { status: statsStatus }, error: ordersError } = useSelector(
    (state) => state.orders
  );
  const { list: users = [], status: usersStatus, error: usersError } = useSelector(
    (state) => state.users
  );
  const [currentDate] = useState(new Date());
  const [widgetData, setWidgetData] = useState([
    {
      icon: <FaUsers />,
      digits: 0,
      isMoney: false,
      title: "Users",
      color: "rgb(255, 99, 132)",
      bgColor: "rgba(255, 99, 132, 0.12)",
      percentage: 0,
    },
    {
      icon: <FaClipboard />,
      digits: 0,
      isMoney: false,
      title: "Orders",
      color: "#00d532",
      bgColor: "rgba(0, 255, 115, 0.12)",
      percentage: 0,
    },
    {
      icon: <FaChartBar />,
      digits: "0.00",
      isMoney: true,
      title: "Sales",
      color: "rgb(253, 181, 40)",
      bgColor: "rgb(253, 181, 40, 0.12)",
      percentage: 0,
    },
  ]);

  // Debug duplicate orders
  useEffect(() => {
    const ids = list.map((order) => order._id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) {
      console.warn("Duplicate order IDs detected:", duplicates);
    }
  }, [list]);

  useEffect(() => {
    if (ordersStatus === "idle" || ordersStatus === "failed" || 
        statsStatus === "idle" || statsStatus === "failed" || 
        usersStatus === "pending" || usersStatus === "rejected") {
      dispatch(ordersFetch());
      dispatch(fetchOrderStats());
      dispatch(fetchIncomeStats());
      dispatch(fetchWeekSales());
      dispatch(usersFetch());
    }

    // Socket.IO connection status
    const handleConnect = () => toast.success("Conexión con el servidor establecida");
    const handleDisconnect = () => toast.warning("Conexión con el servidor perdida");
    const handleConnectError = (err) => toast.error(`Error de conexión: ${err.message}`);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [dispatch, ordersStatus, statsStatus, usersStatus]);

  const handleRetry = () => {
    dispatch(resetError());
    dispatch(ordersFetch());
    dispatch(fetchOrderStats());
    dispatch(fetchIncomeStats());
    dispatch(fetchWeekSales());
    dispatch(usersFetch());
  };

  const getValidUsers = () => {
    try {
      return Array.isArray(users)
        ? users.filter(user => user?.createdAt && !user.isGuest)
        : [];
    } catch (error) {
      console.error("Error filtering users:", error);
      return [];
    }
  };

  const currentMonth = currentDate.getUTCMonth();
  const currentYear = currentDate.getUTCFullYear();

  const previousMonthDate = new Date(currentDate);
  previousMonthDate.setUTCMonth(previousMonthDate.getUTCMonth() - 1);
  const previousMonth = previousMonthDate.getUTCMonth();
  const previousYear = previousMonthDate.getUTCFullYear();

  const { sortedOrders, sortedIncome, userStats } = useMemo(() => {
    try {
      const sortedOrders = [...(stats?.orders || [])].sort((a, b) => (a._id < b._id ? 1 : -1));
      const sortedIncome = [...(stats?.income || [])].sort((a, b) => (a._id < b._id ? 1 : -1));

      const validUsers = getValidUsers();
      
      const userStats = [
        {
          _id: "current_month",
          total: validUsers.filter(user => {
            try {
              const created = new Date(user.createdAt);
              return (
                created.getUTCMonth() === currentMonth && 
                created.getUTCFullYear() === currentYear
              );
            } catch {
              return false;
            }
          }).length
        },
        {
          _id: "previous_month",
          total: validUsers.filter(user => {
            try {
              const created = new Date(user.createdAt);
              return (
                created.getUTCMonth() === previousMonth && 
                created.getUTCFullYear() === previousYear
              );
            } catch {
              return false;
            }
          }).length
        }
      ];

      return { sortedOrders, sortedIncome, userStats };
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return {
        sortedOrders: [],
        sortedIncome: [],
        userStats: [
          { _id: "current_month", total: 0 },
          { _id: "previous_month", total: 0 }
        ]
      };
    }
  }, [stats, users, currentMonth, currentYear, previousMonth, previousYear]);

  const { usersPerc, ordersPerc, incomePerc } = useMemo(() => {
    const calculatePercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number.isFinite((current - previous) / previous) 
        ? ((current - previous) / previous) * 100 
        : 0;
    };

    return {
      usersPerc: calculatePercentage(
        userStats[0]?.total || 0,
        userStats[1]?.total || 0
      ),
      ordersPerc: calculatePercentage(
        sortedOrders[0]?.total || 0,
        sortedOrders[1]?.total || 0
      ),
      incomePerc: calculatePercentage(
        sortedIncome[0]?.total || 0,
        sortedIncome[1]?.total || 0
      )
    };
  }, [userStats, sortedOrders, sortedIncome]);

  useEffect(() => {
    try {
      const currentUsers = userStats[0]?.total || 0;
      const currentOrders = sortedOrders[0]?.total || 0;
      const currentIncome = sortedIncome[0]?.total ? (sortedIncome[0].total).toFixed(2) : "0.00";

      setWidgetData([
        {
          icon: <FaUsers />,
          digits: currentUsers,
          isMoney: false,
          title: "Users",
          color: "rgb(255, 99, 132)",
          bgColor: "rgba(255, 99, 132, 0.12)",
          percentage: usersPerc,
        },
        {
          icon: <FaClipboard />,
          digits: currentOrders,
          isMoney: false,
          title: "Orders",
          color: "#00d532",
          bgColor: "rgba(0, 255, 115, 0.12)",
          percentage: ordersPerc,
        },
        {
          icon: <FaChartBar />,
          digits: currentIncome,
          isMoney: true,
          title: "Sales",
          color: "rgb(253, 181, 40)",
          bgColor: "rgb(253, 181, 40, 0.12)",
          percentage: incomePerc,
        },
      ]);
    } catch (error) {
      console.error("Error updating widget data:", error);
    }
  }, [userStats, sortedOrders, sortedIncome, usersPerc, ordersPerc, incomePerc]);

  if ((statsStatus === "loading" && !stats.orders.length && !stats.income.length) || 
      usersStatus === "pending" && !users.length) {
    return <LoadingSpinner message={"Loading statistics..."} />;
  }

  if ((statsStatus === "failed" && !stats.orders.length && !stats.income.length) || 
      usersStatus === "rejected" && !users.length) {
    return (
      <ErrorContainer>
        <ErrorMessage>
          Error loading data: {ordersError || usersError || "Please try again later"}
        </ErrorMessage>
        <RetryButton onClick={handleRetry}>Retry</RetryButton>
      </ErrorContainer>
    );
  }

  // Filter orders for OrdersList
  const activeOrders = list.filter(order => order.delivery_status !== "cancelled");

  return (
    <StyledSummary>
      <MainStats>
        <Overview>
          <Title>
            <h2>Overview</h2>
            <p>How your Laundry is performing compared to the previous month (Users excludes guests)</p>
            <SocketStatus status={socket.connected ? "connected" : "disconnected"}>
              {socket.connected ? "🟢 Conectado" : "🔴 Desconectado"}
            </SocketStatus>
          </Title>
          <WidgetWrapper>
            {widgetData.map((data, index) => (
              <Widget key={index} data={data} />
            ))}
          </WidgetWrapper>
        </Overview>
        <Chart />
        <OrdersList orders={activeOrders} />
      </MainStats>
      <SideStats>
        <Transactions />
        <AllTimeData />
      </SideStats>
    </StyledSummary>
  );
};

export default Summary;

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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
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