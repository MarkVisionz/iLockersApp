// components/Transactions.jsx
import styled from "styled-components";
import { useState, useMemo, useCallback } from "react";
import { useFetchNotes } from "./Helpers/FetchNotes";
import { getPeriodDates } from "./Helpers/dateUtils";
import PeriodSection from "./Helpers/PeriodSection";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../LoadingAndError";
import moment from "moment"; // Asegúrate de importar moment
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Transactions = () => {
  const navigate = useNavigate();
  const { notes, isLoading, error } = useFetchNotes();

  // Estados para Exportación
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [exportSelectedPeriod, setExportSelectedPeriod] = useState("daily");
  const [showExportSection, setShowExportSection] = useState(false);

  // Estado para el periodo de las secciones
  const [periodSelected, setPeriodSelected] = useState("daily");

  const { startDate: exportStartDate, endDate: exportEndDate } = useMemo(
    () => getPeriodDates(exportSelectedPeriod, reportStartDate, reportEndDate),
    [exportSelectedPeriod, reportStartDate, reportEndDate]
  );

  const filterNotesByPeriod = (startDate, endDate) => {
    return notes.reduce((acc, note) => {
      const noteDate = moment(note.createdAt);
      const paymentDate = note.paidAt ? moment(note.paidAt) : null;
  
      if (noteDate.isBetween(startDate, endDate, undefined, "[]")) {
        acc.createdNotes.push(note);
      }
  
      if (note.note_status === "pagado" && paymentDate && paymentDate.isBetween(startDate, endDate, undefined, "[]")) {
        acc.paidNotes.push(note);
      }
  
      return acc;
    }, { createdNotes: [], paidNotes: [] });
  };

  // Filtrado para cada periodo
  const dailyStartDate = useMemo(() => moment().startOf('day'), []);
  const dailyEndDate = useMemo(() => moment().endOf('day'), []);
  const weeklyStartDate = useMemo(() => moment().startOf('isoWeek'), []);
  const weeklyEndDate = useMemo(() => moment().endOf('isoWeek'), []);
  const monthlyStartDate = useMemo(() => moment().startOf('month'), []);
  const monthlyEndDate = useMemo(() => moment().endOf('month'), []);

  const dailyFilteredNotes = filterNotesByPeriod(dailyStartDate, dailyEndDate);
  const weeklyFilteredNotes = filterNotesByPeriod(weeklyStartDate, weeklyEndDate);
  const monthlyFilteredNotes = filterNotesByPeriod(monthlyStartDate, monthlyEndDate);

  const calculateTotals = (filteredNotes) => {
    return filteredNotes.reduce((acc, note) => {
      acc.totalSales += note.total;
      acc.cashInHand += note.note_status === "pagado" ? note.total : 0;
      return acc;
    }, { totalSales: 0, cashInHand: 0 });
  };

  const prepareExportData = () => {
    const { createdNotes, paidNotes } = filterNotesByPeriod(exportStartDate, exportEndDate);
    const uniqueNotes = new Set();
    const combinedNotes = [];

    [...createdNotes, ...paidNotes].forEach(note => {
      if (!uniqueNotes.has(note.folio)) {
        uniqueNotes.add(note.folio);
        combinedNotes.push(note);
      }
    });

    return combinedNotes.map((note) => ({
      Folio: note.folio,
      "Nombre del Cliente": note.name,
      Cantidad: note.total,
      "Fecha de Creación": moment(note.createdAt).format("DD/MM/YYYY"),
      "Fecha de Pago": note.paidAt ? moment(note.paidAt).format("DD/MM/YYYY") : "No Pagado",
      Estado: note.note_status,
    }));
  };

  const exportToExcel = ( data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = {
      Sheets: { [fileName]: worksheet },
      SheetNames: [fileName],
    };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    toast.success("Reporte exportado exitosamente.");
  };

  const toggleExportSection = () => {
    setShowExportSection((prev) => !prev);
  };

  const handleExportPeriodChange = useCallback((e) => {
    setExportSelectedPeriod(e.target.value);
    // Resetear fechas al cambiar el periodo
    if (e.target.value !== "custom") {
      setReportStartDate("");
      setReportEndDate("");
    }
  }, []);

  const handleExport = () => {
    // Validación de fechas para el periodo personalizado
    if (exportSelectedPeriod === "custom") {
      if (!reportStartDate || !reportEndDate) {
        toast.error("Por favor, selecciona ambas fechas para el reporte personalizado.");
        return;
      }

      const startDateMoment = moment(reportStartDate);
      const endDateMoment = moment(reportEndDate);

      if (!startDateMoment.isValid() || !endDateMoment.isValid() || startDateMoment.isAfter(endDateMoment)) {
        toast.error("Las fechas seleccionadas no son válidas. Asegúrate de que la fecha de inicio sea anterior a la fecha de fin.");
        return;
      }
    }

    const exportData = prepareExportData();
    const fileName = `Reporte_${exportSelectedPeriod}_${moment().format("YYYYMMDD_HHmmss")}`;
    exportToExcel(exportData, fileName);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <StyledTransactions>
        <ErrorMessage>{error}</ErrorMessage>
      </StyledTransactions>
    );
  }

  return (
    <StyledTransactions>
      <Header>
        <Title>Resumen de Datos</Title>
        <ButtonContainer>
          <ToggleExportButton onClick={toggleExportSection}>
            {showExportSection ? "Ocultar Reportes" : "Mostrar Reportes"}
          </ToggleExportButton>
          <CreateNoteButton onClick={() => navigate("/laundry-note")}>
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
            <ExportButton
              onClick={handleExport}
              aria-label="Exportar reporte"
            >
              Exportar Reporte
            </ExportButton>
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
    </StyledTransactions>
  );
};

export default Transactions;

// Styled Components
const StyledTransactions = styled.div`
  padding: 2rem;
  border-radius: 5px;
  background-color: #f9f9f9;
  color: #333;
  transition: background-color 0.3s ease, color 0.3s ease;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  margin-bottom: 2rem;
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
  padding:  0.8rem;
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

const CreateNoteButton = styled.button`
  padding: 0.9rem;
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