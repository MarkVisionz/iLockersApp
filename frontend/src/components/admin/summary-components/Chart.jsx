import { useMemo, useState } from "react";
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
import { useSelector } from "react-redux";
import { LoadingSpinner } from "../../LoadingAndError";

const Chart = ({ data = [] }) => {
  const { status: ordersStatus } = useSelector((state) => state.orders);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Formatear y ordenar los datos semanalmente
  const sales = useMemo(() => {
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return [...data]
      .sort((a, b) => (a._id || 0) - (b._id || 0))
      .map((item) => ({
        day: DAYS[(item._id || 1) - 1] || "Unknown",
        amount: (item.total || 0) / 100,
      }));
  }, [data]);

  // Marcar la carga inicial como completa cuando los datos estén listos
  useMemo(() => {
    if (ordersStatus === "success") {
      setIsInitialLoad(false);
    }
  }, [ordersStatus]);

  // Determinar si se debe mostrar el spinner
  const isLoading = isInitialLoad && ordersStatus === "loading";

  return (
    <StyledChart>
      <h3>Ganancias últimos 7 días (MXN)</h3>
      {isLoading ? (
        <LoadingSpinner message="Cargando gráfica..." />
      ) : sales.length === 0 ? (
        <NoData>No hay datos disponibles para la gráfica</NoData>
      ) : (
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
      )}
    </StyledChart>
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
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  h3 {
    margin-bottom: 1rem;
    color: #333;
  }
`;

const NoData = styled.p`
  text-align: center;
  color: #666;
  padding: 1rem;
  font-size: 1rem;
`;