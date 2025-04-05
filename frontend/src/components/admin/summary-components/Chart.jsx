// components/summary-components/Chart.jsx
import { useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { fetchWeekSales, updateStatsFromSocket } from "../../../features/ordersSlice";
import socket from "../../../features/socket";
import { LoadingSpinner } from "../../LoadingAndError";

const Chart = () => {
  const dispatch = useDispatch();
  const { stats } = useSelector((state) => state.orders);
  const loading = stats.loading;
  const weekSales = stats.weekly;

  // Formatear y ordenar los datos semanalmente
  const sales = useMemo(() => {
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return [...(weekSales || [])]
      .sort((a, b) => a._id - b._id)
      .map((item) => ({
        day: DAYS[item._id - 1],
        amount: item.total / 100,
      }));
  }, [weekSales]);

  useEffect(() => {
    dispatch(fetchWeekSales());

    const handleStatsUpdate = (payload) => {
      if (payload?.type === "weekly") {
        dispatch(updateStatsFromSocket(payload));
      }
    };

    socket.on("statsUpdated", handleStatsUpdate);

    return () => {
      socket.off("statsUpdated", handleStatsUpdate);
    };
  }, [dispatch]);

  return (
    <>
      {loading ? (
        <LoadingSpinner message="Cargando gráfica..." />
      ) : (
        <StyledChart>
          <h3>Ganancias últimos 7 días (MXN)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sales}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </StyledChart>
      )}
    </>
  );
};

export default Chart;

const StyledChart = styled.div`
  width: 100%;
  height: 300px;
  margin-top: 2rem;
  padding: 1rem;
  border: 2px solid rgba(48, 51, 78, 0.2);
  border-radius: 5px;

  h3 {
    margin-bottom: 1rem;
  }
`;
