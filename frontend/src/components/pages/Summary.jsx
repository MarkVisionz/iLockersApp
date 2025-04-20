import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaUsers, FaChartBar, FaClipboard } from "react-icons/fa";
import styled from "styled-components";
import Widget from "../admin/summary-components/Widget";
import Chart from "../admin/summary-components/Chart";
import Transactions from "../admin/summary-components/Transactions";
import AllTimeData from "../admin/summary-components/AllTimeData";
import OrdersList from "../admin/list/OrdersList";
import socket from "../../features/socket";
import {
  fetchOrderStats,
  fetchIncomeStats,
  fetchWeekSales,
} from "../../features/ordersSlice";
import { usersFetch } from "../../features/usersSlice";
import { LoadingSpinner } from "../LoadingAndError";
import { toast } from "react-toastify";

const Summary = () => {
  const dispatch = useDispatch();
  const { stats, status: ordersStatus, error: ordersError } = useSelector(
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
      title: "Earnings",
      color: "rgb(253, 181, 40)",
      bgColor: "rgb(253, 181, 40, 0.12)",
      percentage: 0,
    },
  ]);

  // Función segura para filtrar usuarios
  const getValidUsers = () => {
    try {
      return Array.isArray(users) 
        ? users.filter(user => user?.createdAt) 
        : [];
    } catch (error) {
      console.error("Error filtering users:", error);
      return [];
    }
  };

  // Función para comparar estadísticas
  const compareStats = (a, b) => {
    if (a._id === "current_month") return -1;
    if (b._id === "current_month") return 1;
    return 0;
  };

  useEffect(() => {
    // Cargar datos iniciales
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchOrderStats()),
          dispatch(fetchIncomeStats()),
          dispatch(fetchWeekSales()),
          dispatch(usersFetch()),
        ]);
      } catch (error) {
        toast.error("Error al cargar datos iniciales");
        console.error("Error loading initial data:", error);
      }
    };

    loadData();

    // Configurar listeners de socket
    const handleSocketConnect = () => {
      toast.success("Conexión con el servidor establecida");
    };

    const handleSocketDisconnect = () => {
      toast.warning("Conexión con el servidor perdida");
    };

    const handleSocketError = (error) => {
      toast.error(`Error de conexión: ${error.message}`);
    };

    // Suscribir a eventos de conexión
    socket.on("connect", handleSocketConnect);
    socket.on("disconnect", handleSocketDisconnect);
    socket.on("connect_error", handleSocketError);

    return () => {
      // Limpiar listeners de conexión
      socket.off("connect", handleSocketConnect);
      socket.off("disconnect", handleSocketDisconnect);
      socket.off("connect_error", handleSocketError);
    };
  }, [dispatch]);

  // Obtener fechas para el mes actual y anterior
  const currentMonth = currentDate.getUTCMonth();
  const currentYear = currentDate.getUTCFullYear();

  const previousMonthDate = new Date(currentDate);
  previousMonthDate.setUTCMonth(previousMonthDate.getUTCMonth() - 1);
  const previousMonth = previousMonthDate.getUTCMonth();
  const previousYear = previousMonthDate.getUTCFullYear();

  // Calcular estadísticas con manejo seguro de errores
  const { sortedOrders, sortedIncome, userStats } = useMemo(() => {
    try {
      const sortedOrders = [...(stats?.orders || [])].sort((a, b) => (a._id < b._id ? 1 : -1));
      const sortedIncome = [...(stats?.income || [])].sort((a, b) => (a._id < b._id ? 1 : -1));

      const validUsers = getValidUsers();
      
      // Calcular usuarios por mes
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
      ].sort(compareStats);

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

  // Calcular porcentajes con manejo seguro
  const { usersPerc, ordersPerc, incomePerc } = useMemo(() => {
    const calculatePercentage = (current, previous) => {
      return previous > 0 ? ((current - previous) / previous) * 100 : 0;
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

  // Actualizar datos de widgets con manejo seguro
  useEffect(() => {
    try {
      const currentUsers = userStats[0]?.total || 0;
      const currentOrders = sortedOrders[0]?.total || 0;
      const currentIncome = sortedIncome[0]?.total ? (sortedIncome[0].total / 100).toFixed(2) : "0.00";

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
          title: "Earnings",
          color: "rgb(253, 181, 40)",
          bgColor: "rgb(253, 181, 40, 0.12)",
          percentage: incomePerc,
        },
      ]);
    } catch (error) {
      console.error("Error updating widget data:", error);
    }
  }, [userStats, sortedOrders, sortedIncome, usersPerc, ordersPerc, incomePerc]);

  // Renderizado condicional
  if ((ordersStatus === "loading" && !stats?.orders?.length) || usersStatus === "loading") {
    return <LoadingSpinner message={"Loading statistics..."} />;
  }

  if ((ordersStatus === "failed" && !stats?.orders?.length) || usersStatus === "rejected") {
    return (
      <LoadingMessage>
        Error loading data: {ordersError || usersError || "Please try again later"}
      </LoadingMessage>
    );
  }

  return (
    <StyledSummary>
      <MainStats>
        <Overview>
          <Title>
            <h2>Overview</h2>
            <p>How your Laundry is performing compared to the previous month</p>
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
        <Chart data={stats?.weekly || []} />
        <OrdersList />
      </MainStats>
      <SideStats>
        <Transactions />
        <AllTimeData />
      </SideStats>
    </StyledSummary>
  );
};

// Estilos (se mantienen igual)
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