import React from "react";
import styled from "styled-components";
import { FaStore, FaDollarSign, FaStickyNote } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const CARD_THEMES = [
  "#ff6200",
  "#1a3c34",
  "#004d7a",
  "#4b2e2e",
];

const UserBusinessStats = ({ businesses, businessStats }) => {
  const businessSummary = React.useMemo(() => {
    const totalBusinesses = businesses.length;
    const totalSales = businessStats.reduce(
      (sum, stat) => sum + (stat?.totalSales || 0),
      0
    );
    const totalNotes = businessStats.reduce(
      (sum, stat) => sum + (stat?.totalNotes || 0),
      0
    );
    return { totalBusinesses, totalSales, totalNotes };
  }, [businesses, businessStats]);

  const widgetData = [
    {
      title: "Total Negocios",
      digits: businessSummary.totalBusinesses,
      isMoney: false,
      icon: <FaStore />,
      color: "#fff",
      bgColor: "rgba(0, 123, 255, 0.3)",
    },
    {
      title: "Ventas Totales",
      digits: businessSummary.totalSales,
      isMoney: true,
      icon: <FaDollarSign />,
      color: "#fff",
      bgColor: "rgba(40, 167, 69, 0.3)",
    },
    {
      title: "Notas Totales",
      digits: businessSummary.totalNotes,
      isMoney: false,
      icon: <FaStickyNote />,
      color: "#fff",
      bgColor: "rgba(255, 193, 7, 0.3)",
    },
  ];

  const chartData = React.useMemo(() => {
    // Get unique months with data for 2025
    const currentYear = new Date().getFullYear(); // 2025
    const monthSet = new Set();
    businessStats.forEach((stat) => {
      (stat.monthlySales || []).forEach((sale) => {
        if (sale._id.year === currentYear && sale.total > 0) {
          monthSet.add(`${sale._id.year}-${sale._id.month.toString().padStart(2, "0")}`);
        }
      });
    });
    const months = Array.from(monthSet).sort(); // Sort chronologically

    // If no data, return empty chart
    if (months.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const datasets = businesses.map((business, index) => {
      const stat = businessStats.find((s) => s?.businessId === business?._id) || { monthlySales: [] };
      const data = months.map((month) => {
        const sale = (stat.monthlySales || []).find(
          (m) => `${m._id.year}-${m._id.month.toString().padStart(2, "0")}` === month
        );
        return sale ? sale.total : 0;
      });
      return {
        label: business?.name || "Negocio desconocido",
        data,
        fill: false,
        borderColor: CARD_THEMES[index % CARD_THEMES.length],
        backgroundColor: CARD_THEMES[index % CARD_THEMES.length],
        pointBackgroundColor: CARD_THEMES[index % CARD_THEMES.length],
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: CARD_THEMES[index % CARD_THEMES.length],
        tension: 0.4, // Smooth lines
      };
    });

    return {
      labels: months.map((month) => {
        const [year, monthNum] = month.split("-");
        return new Date(year, monthNum - 1).toLocaleString("es-MX", {
          month: "short",
          year: "numeric",
        });
      }),
      datasets,
    };
  }, [businesses, businessStats]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Ventas Mensuales por Negocio (2025)" },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: $${context.raw.toLocaleString("es-MX")}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Ventas ($)" },
        ticks: {
          callback: (value) => `$${value.toLocaleString("es-MX")}`,
        },
      },
      x: {
        title: { display: true, text: "Mes" },
      },
    },
  };

  return (
    <Card>
      <CardTitle>Desempeño de Negocios</CardTitle>
      {businesses.length === 0 || chartData.datasets.length === 0 ? (
        <EmptyState>No hay datos de ventas disponibles para 2025.</EmptyState>
      ) : (
        <>
          <WidgetWrapper>
            {widgetData.map((item, index) => (
              <Widget key={index} data={item} />
            ))}
          </WidgetWrapper>
          <ChartContainer>
            <Line data={chartData} options={chartOptions} />
          </ChartContainer>
        </>
      )}
    </Card>
  );
};

const Widget = ({ data }) => {
  return (
    <StyledWidget>
      <Icon color={data.color} bgcolor={data.bgColor}>
        {data.icon}
      </Icon>
      <Text>
        <h3>
          {data.digits === 0
            ? "0"
            : data.isMoney
            ? "$" + data.digits.toLocaleString()
            : data.digits.toLocaleString()}
        </h3>
        <p>{data.title}</p>
      </Text>
    </StyledWidget>
  );
};

// Estilos (sin cambios)
const Card = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
`;

const WidgetWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  width: 100%;
  justify-items: center;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StyledWidget = styled(motion.div).attrs({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  max-width: 200px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 1rem;
  text-align: center;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #86868b;
  font-size: 0.95rem;
  margin: 1rem 0;
`;

const Icon = styled.div`
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  color: ${({ color }) => color};
  background: ${({ bgcolor }) => bgcolor};
  border-radius: 8px;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Text = styled.div`
  text-align: center;
  h3 {
    font-weight: 900;
    color: #1d1d1f;
    font-size: 1.3rem;
  }
  p {
    font-size: 0.9rem;
    color: #1d1d1f;
    margin-top: 0.25rem;
  }
`;

const ChartContainer = styled.div`
  padding: 1rem;
  background: #fff;
  border-radius: 12px;
`;

export default UserBusinessStats;