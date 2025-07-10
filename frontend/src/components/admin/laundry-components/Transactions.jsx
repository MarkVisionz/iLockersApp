import styled from "styled-components";
import { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { getPeriodDates } from "./Helpers/dateUtils";
import PeriodSection from "./Helpers/PeriodSection";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";
import moment from "moment";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Transactions = ({ businessId }) => {
  const navigate = useNavigate();
  const { items: notes = [], status, error } = useSelector((state) => state.notes);
  const { businesses } = useSelector((state) => state.auth);

  const isValidBusiness = businesses.some((b) => b._id === businessId);

  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [exportSelectedPeriod, setExportSelectedPeriod] = useState("daily");
  const [showExportSection, setShowExportSection] = useState(false);

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => note.businessId === businessId);
    console.log(`Filtered ${filtered.length} notes for businessId: ${businessId}`);
    return filtered;
  }, [notes, businessId]);

  const { startDate: exportStartDate, endDate: exportEndDate } = useMemo(
    () => getPeriodDates(exportSelectedPeriod, reportStartDate, reportEndDate),
    [exportSelectedPeriod, reportStartDate, reportEndDate]
  );

  const filterNotesByPeriod = (startDate, endDate) => {
    return filteredNotes.reduce(
      (acc, note) => {
        const noteDate = moment(note.createdAt);
        const paymentDate = note.paidAt ? moment(note.paidAt) : null;

        if (noteDate.isBetween(startDate, endDate, undefined, "[]")) {
          acc.createdNotes.push(note);
        }

        if (
          note.paidAt &&
          paymentDate.isBetween(startDate, endDate, undefined, "[]")
        ) {
          acc.paidNotes.push(note);
        }

        return acc;
      },
      { createdNotes: [], paidNotes: [] }
    );
  };

  const calculateTotals = (filteredNotes) => {
    return filteredNotes.reduce(
      (acc, note) => {
        acc.totalSales += note.total || 0;
        acc.cashInHand += note.paidAt ? note.total || 0 : 0;
        return acc;
      },
      { totalSales: 0, cashInHand: 0 }
    );
  };

  const latestTransactions = useMemo(() => {
    return [...filteredNotes]
      .sort((a, b) => moment(b.createdAt) - moment(a.createdAt))
      .slice(0, 5);
  }, [filteredNotes]);

  const prepareExportData = () => {
    const { createdNotes, paidNotes } = filterNotesByPeriod(
      exportStartDate,
      exportEndDate
    );
    const uniqueNotes = new Set();
    const combinedNotes = [];

    [...createdNotes, ...paidNotes].forEach((note) => {
      if (!uniqueNotes.has(note.folio)) {
        uniqueNotes.add(note.folio);
        combinedNotes.push(note);
      }
    });

    return combinedNotes.map((note) => ({
      Folio: note.folio || "N/A",
      "Nombre del Cliente": note.name || "Sin nombre",
      Cantidad: note.total || 0,
      "Fecha de Creación": moment(note.createdAt).format("DD/MM/YYYY"),
      "Fecha de Pago": note.paidAt
        ? moment(note.paidAt).format("DD/MM/YYYY")
        : "No Pagado",
      Estado: note.note_status || "Desconocido",
    }));
  };

  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [fileName]: worksheet },
      SheetNames: [fileName],
    };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    toast.success("Reporte exportado exitosamente.");
  };

  const handleExportPeriodChange = useCallback((e) => {
    setExportSelectedPeriod(e.target.value);
    if (e.target.value !== "custom") {
      setReportStartDate("");
      setReportEndDate("");
    }
  }, []);

  const handleExport = () => {
    if (exportSelectedPeriod === "custom") {
      if (!reportStartDate || !reportEndDate) {
        toast.error(
          "Por favor, selecciona ambas fechas para el reporte personalizado."
        );
        return;
      }

      const startDateMoment = moment(reportStartDate);
      const endDateMoment = moment(reportEndDate);

      if (
        !startDateMoment.isValid() ||
        !endDateMoment.isValid() ||
        startDateMoment.isAfter(endDateMoment)
      ) {
        toast.error("Las fechas seleccionadas no son válidas.");
        return;
      }
    }

    const exportData = prepareExportData();
    const fileName = `Reporte_${exportSelectedPeriod}_${moment().format(
      "YYYYMMDD_HHmmss"
    )}`;
    exportToExcel(exportData, fileName);
  };

  const toggleExportSection = () => {
    setShowExportSection((prev) => !prev);
  };

  const dailyStartDate = useMemo(() => moment().startOf("day"), []);
  const dailyEndDate = useMemo(() => moment().endOf("day"), []);
  const weeklyStartDate = useMemo(() => moment().startOf("isoWeek"), []);
  const weeklyEndDate = useMemo(() => moment().endOf("isoWeek"), []);
  const monthlyStartDate = useMemo(() => moment().startOf("month"), []);
  const monthlyEndDate = useMemo(() => moment().endOf("month"), []);

  const dailyFilteredNotes = filterNotesByPeriod(dailyStartDate, dailyEndDate);
  const weeklyFilteredNotes = filterNotesByPeriod(
    weeklyStartDate,
    weeklyEndDate
  );
  const monthlyFilteredNotes = filterNotesByPeriod(
    monthlyStartDate,
    monthlyEndDate
  );

  if (!isValidBusiness) {
    return (
      <ErrorContainer>
        <ErrorMessage>Negocio no encontrado o no autorizado</ErrorMessage>
      </ErrorContainer>
    );
  }

  if (status === "pending" && !filteredNotes.length) {
    return <LoadingSpinner message="Cargando transacciones..." />;
  }

  if (status === "rejected") {
    return (
      <ErrorContainer>
        <ErrorMessage>
          Error al cargar transacciones: {error || "Por favor intenta de nuevo"}
        </ErrorMessage>
      </ErrorContainer>
    );
  }

  return (
    <StyledTransactions>
      <Header>
        <Title>Resumen de Transacciones</Title>
        <ButtonContainer>
          <ToggleExportButton onClick={toggleExportSection}>
            {showExportSection ? "Ocultar Reportes" : "Mostrar Reportes"}
          </ToggleExportButton>
          <CreateNoteButton
            onClick={() => navigate("/laundry-note", { state: { businessId } })}
          >
            Crear Nota
          </CreateNoteButton>
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
            <ExportButton onClick={handleExport}>Exportar Reporte</ExportButton>
          </ExportButtons>
        </ReportFilterContainer>
      )}

      <PeriodsContainer>
        <PeriodSection
          title="Diario"
          createdNotes={dailyFilteredNotes.createdNotes}
          totalSales={calculateTotals(dailyFilteredNotes.createdNotes).totalSales}
          cashInHand={calculateTotals(dailyFilteredNotes.paidNotes).cashInHand}
          color="#28a745"
        />
        <PeriodSection
          title="Semanal"
          createdNotes={weeklyFilteredNotes.createdNotes}
          totalSales={calculateTotals(weeklyFilteredNotes.createdNotes).totalSales}
          cashInHand={calculateTotals(weeklyFilteredNotes.paidNotes).cashInHand}
          color="#4b70e2"
        />
        <PeriodSection
          title="Mensual"
          createdNotes={monthlyFilteredNotes.createdNotes}
          totalSales={calculateTotals(monthlyFilteredNotes.createdNotes).totalSales}
          cashInHand={calculateTotals(monthlyFilteredNotes.paidNotes).cashInHand}
          color="#6f42c1"
        />
      </PeriodsContainer>

      <Title>Últimas Transacciones</Title>
      {latestTransactions.length > 0 ? (
        <TransactionList>
          {latestTransactions.map((note) => (
            <TransactionItem key={note._id}>
              <CustomerName>{note.name || "Sin nombre"}</CustomerName>
              <Amount>
                {(note.total || 0).toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </Amount>
              <Time>{moment(note.createdAt).fromNow()}</Time>
            </TransactionItem>
          ))}
        </TransactionList>
      ) : (
        <EmptyState>No se encontraron transacciones.</EmptyState>
      )}
    </StyledTransactions>
  );
};

const StyledTransactions = styled.div`
  padding: 1rem;
  border-radius: 8px;
  background-color: #f9f9f9;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  margin: 1rem 0;
  color: #333;
  text-align: center;
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
`;

const CreateNoteButton = styled(ToggleExportButton)``;

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
`;

const PeriodSelector = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const CustomDateRange = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
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
`;

const PeriodsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
`;

const CustomerName = styled.span`
  flex: 2;
  font-weight: 600;
`;

const Amount = styled.span`
  flex: 1;
  text-align: center;
  font-weight: 700;
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

export default Transactions;