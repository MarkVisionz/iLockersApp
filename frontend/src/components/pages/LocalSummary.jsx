import styled from "styled-components";
import Widget from "../admin/laundry-components/Widget";
import { FaClipboard, FaChartBar } from "react-icons/fa";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Transactions from "../admin/laundry-components/Transactions";
import AllTimeData from "../admin/laundry-components/AllTimeData";
import NotesSummary from "../admin/list/NotesSummary";
import moment from "moment";
import { fetchNotesStats, fetchIncomeStats, resetError } from "../../features/notesSlice";
import { ErrorMessage, LoadingSpinner } from "../LoadingAndError";
import socket from "../../features/socket";
import { toast } from "react-toastify";

const LocalSummary = () => {
  const dispatch = useDispatch();
  const { stats, statsStatus, error } = useSelector((state) => state.notes);

  useEffect(() => {
    if (statsStatus === "idle" || statsStatus === "rejected") {
      dispatch(fetchNotesStats());
      dispatch(fetchIncomeStats());
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
  }, [dispatch, statsStatus]);

  const handleRetry = () => {
    dispatch(resetError());
    dispatch(fetchNotesStats());
    dispatch(fetchIncomeStats());
  };

  const calculatePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonth = moment().month() + 1;
  const previousMonth = moment().month();

  const notesCurrent =
    stats.notes?.find((item) => item._id === currentMonth)?.total || 0;
  const notesPrevious =
    stats.notes?.find((item) => item._id === previousMonth)?.total || 0;
  const incomeCurrent =
    stats.income?.find((item) => item._id === currentMonth)?.total || 0;
  const incomePrevious =
    stats.income?.find((item) => item._id === previousMonth)?.total || 0;

  const notesPercentage = calculatePercentage(notesCurrent, notesPrevious);
  const incomePercentage = calculatePercentage(incomeCurrent, incomePrevious);

  const data = [
    {
      icon: <FaClipboard />,
      digits: notesCurrent,
      isMoney: false,
      title: "Notas",
      color: "#00d532",
      bgColor: "rgba(0, 255, 115, 0.12)",
      percentage: notesPercentage,
    },
    {
      icon: <FaChartBar />,
      digits: incomeCurrent,
      isMoney: true,
      title: "Ventas",
      color: "rgb(253, 181, 40)",
      bgColor: "rgb(253, 181, 40, 0.12)",
      percentage: incomePercentage,
    },
  ];

  return (
    <StyledSummary>
      {statsStatus === "pending" && !stats.notes?.length && !stats.income?.length ? (
        <LoadingSpinner message={"Loading statistics..."} />
      ) : statsStatus === "rejected" && !stats.notes?.length && !stats.income?.length ? (
        <ErrorContainer>
          <ErrorMessage>
            Error loading statistics: {error || "Please try again later"}
          </ErrorMessage>
          <RetryButton onClick={handleRetry}>Retry</RetryButton>
        </ErrorContainer>
      ) : (
        <>
          <MainStats>
            <Overview>
              <Title>
                <h2>Resumen</h2>
                <p>Cómo está funcionando tu lavandería en comparación con el mes anterior</p>
                <SocketStatus status={socket.connected ? "connected" : "disconnected"}>
                  {socket.connected ? "🟢 Conectado" : "🔴 Desconectado"}
                </SocketStatus>
              </Title>
              <WidgetWrapper>
                {data.map((data, index) => (
                  <Widget key={index} data={data} />
                ))}
              </WidgetWrapper>
            </Overview>
            <NotesSummary />
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

export default LocalSummary;

const StyledSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem;
  width: 100%;
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