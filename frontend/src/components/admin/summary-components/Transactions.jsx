import styled from "styled-components";
import { useMemo, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPeriodDates } from "../laundry-components/Helpers/dateUtils.js";
import OrdersPeriodSection from "../laundry-components/Helpers/OrdersPeriodSections.jsx";
import moment from "moment";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { LoadingSpinner } from "../../LoadingAndError.jsx";
import { ordersFetch } from "../../../features/ordersSlice";
import "react-toastify/dist/ReactToastify.css";

const Transactions = () => {
  const dispatch = useDispatch();
  const { list: orders, status, error } = useSelector((state) => state.orders);

  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [exportSelectedPeriod, setExportSelectedPeriod] = useState("daily");
  const [showExportSection, setShowExportSection] = useState(false);

  useEffect(() => {
    dispatch(ordersFetch());
  }, [dispatch]);

  const getPeriodData = useCallback(
    (period) => {
      const { startDate, endDate } = getPeriodDates(period);
      const filteredOrders = orders.filter((order) => {
        if (!order?.createdAt || order.delivery_status === "cancelled")
          return false;
        const orderDate = moment(order.createdAt);
        return orderDate.isBetween(startDate, endDate, undefined, "[]");
      });
      const totalSales = filteredOrders.reduce(
        (sum, o) => sum + (o.total || 0) / 100,
        0
      );
      return {
        orders: filteredOrders,
        total: totalSales.toFixed(2),
        count: filteredOrders.length,
        startDate: startDate.format("DD/MM/YYYY"),
        endDate: endDate.format("DD/MM/YYYY"),
      };
    },
    [orders]
  );

  const dailyData = useMemo(() => getPeriodData("daily"), [getPeriodData]);
  const weeklyData = useMemo(() => getPeriodData("weekly"), [getPeriodData]);
  const monthlyData = useMemo(() => getPeriodData("monthly"), [getPeriodData]);

  const toggleExportSection = () => setShowExportSection((prev) => !prev);

  const handleExportPeriodChange = (e) => {
    setExportSelectedPeriod(e.target.value);
    if (e.target.value !== "custom") {
      setReportStartDate("");
      setReportEndDate("");
    }
  };

  const prepareExportData = () => {
    const { startDate, endDate } = getPeriodDates(
      exportSelectedPeriod,
      reportStartDate,
      reportEndDate
    );
    return orders
      .filter((order) => {
        if (!order?.createdAt) return false;
        const orderDate = moment(order.createdAt);
        return orderDate.isBetween(startDate, endDate, undefined, "[]");
      })
      .map((order) => ({
        Folio: order._id,
        "Nombre del Cliente": order.shipping?.name || "Cliente desconocido",
        Total: (order.total || 0) / 100,
        Fecha: moment(order.createdAt).format("DD/MM/YYYY HH:mm"),
        "Estado del Pedido": order.delivery_status || "Sin estado",
        "Estado de Pago": order.payment_status || "Desconocido",
        "Método de Pago": order.payment_method || "No especificado",
      }));
  };

  const exportToExcel = () => {
    if (
      exportSelectedPeriod === "custom" &&
      (!reportStartDate || !reportEndDate)
    ) {
      toast.error("Por favor selecciona un rango de fechas válido.");
      return;
    }
    const data = prepareExportData();
    if (data.length === 0) {
      toast.warning("No hay datos para exportar en el periodo seleccionado.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { Reporte: worksheet },
      SheetNames: ["Reporte"],
    };
    XLSX.writeFile(
      workbook,
      `Reporte_${exportSelectedPeriod}_${moment().format(
        "YYYYMMDD_HHmmss"
      )}.xlsx`
    );
    toast.success("Reporte exportado exitosamente.");
  };

  const latestTransactions = useMemo(() => {
    return orders
      .filter((order) => order.delivery_status !== "cancelled")
      .sort((a, b) => moment(b.createdAt) - moment(a.createdAt))
      .slice(0, 5);
  }, [orders]);

  if (status === "pending") return <LoadingSpinner />;
  if (status === "rejected")
    return (
      <StyledTransactions>
        <ErrorMessage>{error}</ErrorMessage>
      </StyledTransactions>
    );

  return (
    <StyledTransactions>
      <Header>
        <Title>Resumen de Órdenes</Title>
        <ButtonContainer>
          <ToggleExportButton onClick={toggleExportSection}>
            {showExportSection ? "Ocultar Reportes" : "Mostrar Reportes"}
          </ToggleExportButton>
        </ButtonContainer>
      </Header>

      {showExportSection && (
        <ReportFilterContainer>
          <PeriodSelector>
            <label htmlFor="exportPeriod">Selecciona el Periodo:</label>
            <select
              id="exportPeriod"
              value={exportSelectedPeriod}
              onChange={handleExportPeriodChange}
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="custom">Personalizado</option>
            </select>
          </PeriodSelector>

          {exportSelectedPeriod === "custom" && (
            <CustomDateRange>
              <div>
                <label htmlFor="exportStartDate">Fecha de Inicio:</label>
                <input
                  type="date"
                  id="exportStartDate"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="exportEndDate">Fecha de Fin:</label>
                <input
                  type="date"
                  id="exportEndDate"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                />
              </div>
            </CustomDateRange>
          )}

          <ExportButtons>
            <ExportButton onClick={exportToExcel}>
              Exportar Reporte
            </ExportButton>
          </ExportButtons>
        </ReportFilterContainer>
      )}

      <PeriodsContainer>
        <OrdersPeriodSection
          title="Diario"
          orders={dailyData.orders}
          totalSales={dailyData.total}
          count={dailyData.count}
          color="#28a745"
        />
        <OrdersPeriodSection
          title="Semanal"
          orders={weeklyData.orders}
          totalSales={weeklyData.total}
          count={weeklyData.count}
          color="#4b70e2"
        />
        <OrdersPeriodSection
          title="Mensual"
          orders={monthlyData.orders}
          totalSales={monthlyData.total}
          count={monthlyData.count}
          color="#6f42c1"
        />
      </PeriodsContainer>

      <Title>Últimas Transacciones</Title>
      {orders.length > 0 ? (
        <TransactionList>
          {latestTransactions.map((order, index) => (
            <TransactionItem key={index}>
              <CustomerName>
                {order?.customer_name ?? "Cliente desconocido"}
              </CustomerName>
              <Amount>
                {((order?.total || 0) / 100).toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </Amount>
              <Time>{moment(order?.createdAt).fromNow()}</Time>
            </TransactionItem>
          ))}
        </TransactionList>
      ) : (
        <EmptyState>No se encontraron transacciones.</EmptyState>
      )}
    </StyledTransactions>
  );
};

export default Transactions;

// Styled Components
const StyledTransactions = styled.div`
  padding: 1rem;
  border-radius: 5px;
  background-color: #f9f9f9;
  color: #333;
  transition: background-color 0.3s ease, color 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #333;
  text-align: center;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
`;

const ToggleExportButton = styled.button`
  padding: 0.8rem;
  background: linear-gradient(45deg, #4b70e2, #3a5bb8);
  color: #fff;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    background: linear-gradient(45deg, #3a5bb8, #4b70e2);
  }

  &:active {
    transform: translateY(0) scale(1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ReportFilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  border: 1px solid #ddd;
  padding: 1.5rem;
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: max-height 0.3s ease, opacity 0.3s ease;
`;

const PeriodSelector = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  label {
    margin-bottom: 0.3rem;
    font-weight: bold;
    color: #333;
  }

  select {
    padding: 0.5rem 0.7rem;
    border-radius: 8px;
    border: 1px solid #ccc;
    transition: border-color 0.3s, box-shadow 0.3s;

    &:focus {
      border-color: #4b70e2;
      box-shadow: 0 0 5px rgba(75, 112, 226, 0.5);
      outline: none;
    }
  }
`;

const CustomDateRange = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.5rem;

  div {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    label {
      margin-bottom: 0.3rem;
      font-weight: bold;
      color: #333;
    }

    input {
      padding: 0.5rem 0.7rem;
      border-radius: 8px;
      border: 1px solid #ccc;
      transition: border-color 0.3s, box-shadow 0.3s;

      &:focus {
        border-color: #4b70e2;
        box-shadow: 0 0 5px rgba(75, 112, 226, 0.5);
        outline: none;
      }
    }
  }
`;

const ExportButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const ExportButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: linear-gradient(45deg, #4b70e2, #3a5bb8);
  color: #fff;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    background: linear-gradient(45deg, #3a5bb8, #4b70e2);
  }

  &:active {
    transform: translateY(0) scale(1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const PeriodsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ErrorMessage = styled.div`
  color: red;
  text-align: center;
  margin: 1rem 0;
  font-weight: bold;
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eef2ff;
  padding: 1rem 1.2rem;
  border-radius: 10px;
  transition: box-shadow 0.5s ease, transform 0.4s ease;

  &:hover {
    box-shadow: 0 6px 12px rgba(75, 112, 226, 0.2);
    transform: translateY(-1px);
  }
`;

const CustomerName = styled.span`
  flex: 2;
  font-weight: 600;
  font-size: 1rem;
`;

const Amount = styled.span`
  flex: 1;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  color: #28a745;
`;

const Time = styled.span`
  flex: 1;
  text-align: right;
  font-size: 0.85rem;
  color: #666;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #aaa;
  margin-top: 1rem;
`;
