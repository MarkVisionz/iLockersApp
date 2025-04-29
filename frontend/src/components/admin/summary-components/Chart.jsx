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
import moment from "moment";
import "moment/locale/es";

moment.locale("es");

const Chart = () => {
  const { list: orders, status: ordersStatus } = useSelector((state) => state.orders);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const sales = useMemo(() => {
    if (!Array.isArray(orders) || orders.length === 0) return [];

    const salesByDate = {};
    const today = moment().endOf("day");
    const currentWeekStart = moment().subtract(6, "days").startOf("day");
    const lastWeekStart = moment().subtract(13, "days").startOf("day");
    const lastWeekEnd = moment().subtract(7, "days").endOf("day");

    orders.forEach((order) => {
      if (!order.createdAt || order.delivery_status === "cancelled") return;

      const orderDate = moment(order.createdAt);
      const dateKey = orderDate.format("YYYY-MM-DD");

      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = {
          date: dateKey,
          dayLabel: orderDate.format("ddd D"), // "Dom 28"
          amount: 0,
          orders: 0,
          lastWeekAmount: 0,
        };
      }

      if (orderDate.isBetween(currentWeekStart, today, "days", "[]")) {
        salesByDate[dateKey].amount += order.total || 0;
        salesByDate[dateKey].orders += 1;
      } else if (orderDate.isBetween(lastWeekStart, lastWeekEnd, "days", "[]")) {
        salesByDate[dateKey].lastWeekAmount += order.total || 0;
      }
    });

    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = moment(currentWeekStart).add(i, "days");
      const currentKey = currentDate.format("YYYY-MM-DD");
      const lastWeekKey = moment(lastWeekStart).add(i, "days").format("YYYY-MM-DD");

      const existing = salesByDate[currentKey] || {
        date: currentKey,
        dayLabel: currentDate.format("ddd D"),
        amount: 0,
        orders: 0,
        lastWeekAmount: 0,
      };

      if (salesByDate[lastWeekKey]) {
        existing.lastWeekAmount = salesByDate[lastWeekKey].amount || 0;
      }

      days.push(existing);
    }

    return days.sort((a, b) => moment(a.date).unix() - moment(b.date).unix());
  }, [orders]);

  useMemo(() => {
    if (ordersStatus === "success") {
      setIsInitialLoad(false);
    }
  }, [ordersStatus]);

  const isLoading = isInitialLoad && ordersStatus === "loading";

  return (
    <StyledChart>
      <h3>Ganancias y Órdenes últimos 7 días</h3>
      {isLoading ? (
        <LoadingSpinner message="Cargando gráfica..." />
      ) : sales.length === 0 ? (
        <NoData>No hay datos disponibles para la gráfica</NoData>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sales}
            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dayLabel" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                const { amount = 0, orders = 0, lastWeekAmount = 0 } = payload[0]?.payload || {};
                return (
                  <CustomTooltip>
                    <strong>{label}</strong>
                    <p>Ventas actuales: ${amount.toLocaleString("es-MX")}</p>
                    <p>Órdenes actuales: {orders}</p>
                    <p>Ventas semana pasada: ${lastWeekAmount.toLocaleString("es-MX")}</p>
                  </CustomTooltip>
                );
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              name="Ventas (Actual)"
              stroke="#4b70e2"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              name="Órdenes"
              stroke="#28a745"
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="lastWeekAmount"
              name="Ventas (Semana pasada)"
              stroke="#ff7300"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </StyledChart>
  );
};

export default Chart;

// Styled Components
const StyledChart = styled.div`
  width: 100%;
  height: 320px;
  margin-top: 2rem;
  padding: 1rem;
  border: 2px solid rgba(48, 51, 78, 0.2);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  h3 {
    text-align: center;
    margin-bottom: 1rem;
    color: #333;
  }
`;

const NoData = styled.p`
  text-align: center;
  color: #666;
  font-size: 1rem;
  padding: 1rem;
`;

const CustomTooltip = styled.div`
  background: #fff;
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  line-height: 1.4;
  color: #333;
`;