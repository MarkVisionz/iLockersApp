import styled from "styled-components";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { setHeaders, url } from "../../../features/api";
import moment from "moment";
import * as XLSX from "xlsx";

const Transactions = () => {
  // Estados para Exportación
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [exportSelectedPeriod, setExportSelectedPeriod] = useState("daily"); // "daily", "weekly", "monthly", "custom"

  // Estado para controlar la visibilidad de la sección de exportación
  const [showExportSection, setShowExportSection] = useState(false);

  // Estados para los Gráficos
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notes from API
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await axios.get(`${url}/notes`, setHeaders());
        setNotes(res.data);
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  // Filtrar notas por fecha de creación
  const filterNotesByCreatedAtPeriod = (startDate, endDate = null) => {
    return notes.filter((note) => {
      const noteDate = moment(note.createdAt);
      if (endDate) {
        return noteDate.isBetween(startDate, endDate, undefined, "[]");
      }
      return noteDate.isSameOrAfter(startDate);
    });
  };

  // Filtrar notas por fecha de pago
  const filterNotesByPaidAtPeriod = (startDate, endDate = null) => {
    return notes.filter((note) => {
      if (note.note_status !== "pagado" || !note.paidAt) return false;
      const paymentDate = moment(note.paidAt);
      if (endDate) {
        return paymentDate.isBetween(startDate, endDate, undefined, "[]");
      }
      return paymentDate.isSameOrAfter(startDate);
    });
  };

  // Calcular Total Sales basado en createdAt
  const calculateTotalSales = (filteredNotes) => {
    return filteredNotes.reduce((acc, note) => acc + note.total, 0);
  };

  // Calcular Cash In Hand basado en paidAt
  const calculateCashInHand = (filteredNotes) => {
    return filteredNotes.reduce((acc, note) => acc + note.total, 0);
  };

  // Determinar el rango de fechas basado en el periodo seleccionado para Exportación
  const getExportPeriodDates = () => {
    const now = moment();
    let startDate;
    let endDate = null;

    switch (exportSelectedPeriod) {
      case "daily":
        startDate = now.clone().startOf("day");
        endDate = now.clone().endOf("day");
        break;
      case "weekly":
        startDate = now.clone().startOf("week").add(1, "day"); // Semana comienza el lunes
        endDate = now.clone().endOf("week").add(1, "day");
        break;
      case "monthly":
        startDate = now.clone().startOf("month");
        endDate = now.clone().endOf("month");
        break;
      case "custom":
        startDate = reportStartDate
          ? moment(reportStartDate).startOf("day")
          : null;
        endDate = reportEndDate ? moment(reportEndDate).endOf("day") : null;
        break;
      default:
        startDate = now.clone().startOf("day");
        endDate = now.clone().endOf("day");
    }

    return { startDate, endDate };
  };

  const { startDate: exportStartDate, endDate: exportEndDate } = useMemo(
    () => getExportPeriodDates(),
    [exportSelectedPeriod, reportStartDate, reportEndDate]
  );

  // Filtrar notas para Exportación
  const exportCreatedNotes = useMemo(() => {
    if (exportSelectedPeriod === "custom" && exportStartDate && exportEndDate) {
      return filterNotesByCreatedAtPeriod(exportStartDate, exportEndDate);
    }
    return filterNotesByCreatedAtPeriod(exportStartDate, exportEndDate);
  }, [notes, exportSelectedPeriod, exportStartDate, exportEndDate]);

  const exportPaidNotes = useMemo(() => {
    if (exportSelectedPeriod === "custom" && exportStartDate && exportEndDate) {
      return filterNotesByPaidAtPeriod(exportStartDate, exportEndDate);
    }
    return filterNotesByPaidAtPeriod(exportStartDate, exportEndDate);
  }, [notes, exportSelectedPeriod, exportStartDate, exportEndDate]);

  // Preparar datos para exportar
  const prepareExportData = () => {
    return exportCreatedNotes.map((note) => ({
      Folio: note.folio,
      "Nombre del Cliente": note.name,
      Cantidad: note.total,
      "Fecha de Creación": moment(note.createdAt).format("DD/MM/YYYY"),
      "Fecha de Pago": note.paidAt
        ? moment(note.paidAt).format("DD/MM/YYYY")
        : "No Pagado",
      Estado: note.note_status,
    }));
  };

  // Datos para exportar
  const exportData = prepareExportData();

  // Función para exportar datos a Excel
  const exportToExcel = (data, fileName) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = {
        Sheets: { [fileName]: worksheet },
        SheetNames: [fileName],
      };
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      alert("Reporte exportado exitosamente.");
    } catch (error) {
      console.error("Error exportando a Excel:", error);
      alert("Hubo un error al exportar el reporte.");
    }
  };

  // Función para manejar el cambio de periodo de Exportación
  const handleExportPeriodChange = (e) => {
    setExportSelectedPeriod(e.target.value);
    // Reset custom dates
    if (e.target.value !== "custom") {
      setReportStartDate("");
      setReportEndDate("");
    }
  };

  // ---------------------
  // Datos para Gráficos
  // ---------------------

  // Función para determinar el rango de fechas para cada gráfico
  const getChartPeriodDates = (period) => {
    const now = moment();
    let startDate;
    let endDate = null;

    switch (period) {
      case "daily":
        startDate = now.clone().startOf("day");
        endDate = now.clone().endOf("day");
        break;
      case "weekly":
        startDate = now.clone().startOf("week").add(1, "day"); // Semana comienza el lunes
        endDate = now.clone().endOf("week").add(1, "day");
        break;
      case "monthly":
        startDate = now.clone().startOf("month");
        endDate = now.clone().endOf("month");
        break;
      default:
        startDate = now.clone().startOf("day");
        endDate = now.clone().endOf("day");
    }

    return { startDate, endDate };
  };

  // Filtrar notas para cada gráfico
  const createdNotesDaily = useMemo(() => {
    const { startDate, endDate } = getChartPeriodDates("daily");
    return filterNotesByCreatedAtPeriod(startDate, endDate);
  }, [notes]);

  const paidNotesDaily = useMemo(() => {
    const { startDate, endDate } = getChartPeriodDates("daily");
    return filterNotesByPaidAtPeriod(startDate, endDate);
  }, [notes]);

  const createdNotesWeekly = useMemo(() => {
    const { startDate, endDate } = getChartPeriodDates("weekly");
    return filterNotesByCreatedAtPeriod(startDate, endDate);
  }, [notes]);

  const paidNotesWeekly = useMemo(() => {
    const { startDate, endDate } = getChartPeriodDates("weekly");
    return filterNotesByPaidAtPeriod(startDate, endDate);
  }, [notes]);

  const createdNotesMonthly = useMemo(() => {
    const { startDate, endDate } = getChartPeriodDates("monthly");
    return filterNotesByCreatedAtPeriod(startDate, endDate);
  }, [notes]);

  const paidNotesMonthly = useMemo(() => {
    const { startDate, endDate } = getChartPeriodDates("monthly");
    return filterNotesByPaidAtPeriod(startDate, endDate);
  }, [notes]);

  // Calcular Totales para cada gráfico
  const totalSalesDaily = useMemo(
    () => calculateTotalSales(createdNotesDaily),
    [createdNotesDaily]
  );
  const cashInHandDaily = useMemo(
    () => calculateCashInHand(paidNotesDaily),
    [paidNotesDaily]
  );

  const totalSalesWeekly = useMemo(
    () => calculateTotalSales(createdNotesWeekly),
    [createdNotesWeekly]
  );
  const cashInHandWeekly = useMemo(
    () => calculateCashInHand(paidNotesWeekly),
    [paidNotesWeekly]
  );

  const totalSalesMonthly = useMemo(
    () => calculateTotalSales(createdNotesMonthly),
    [createdNotesMonthly]
  );
  const cashInHandMonthly = useMemo(
    () => calculateCashInHand(paidNotesMonthly),
    [paidNotesMonthly]
  );

  // ---------------------
  // Función para Toggle de la Sección de Reportes
  // ---------------------
  const toggleExportSection = () => {
    setShowExportSection((prev) => !prev);
  };

  // ---------------------
  // Renderizado del Componente
  // ---------------------
  return (
    <StyledTransactions>
      {isLoading ? (
        <Loading>Cargando notas...</Loading>
      ) : (
        <>
          <Header>
            <Title>Resumen de Datos</Title>
            <ToggleExportButton onClick={toggleExportSection}>
              {showExportSection ? "Ocultar Reportes" : "Mostrar Reportes"}
            </ToggleExportButton>
          </Header>

          {/* Sección de Reportes (Visible/Oculto) */}
          {showExportSection && (
            <ReportFilterContainer>
              {/* Selector de Periodo para Exportación */}
              <PeriodSelector>
                <label htmlFor="exportPeriod">
                  Selecciona el Periodo para Reporte:
                </label>
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

              {/* Selector de Fechas Personalizadas */}
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

              {/* Botón de Exportación */}
              <ExportButtons>
                <ExportButton
                  onClick={() => {
                    if (exportSelectedPeriod === "custom") {
                      if (!reportStartDate || !reportEndDate) {
                        alert(
                          "Por favor, selecciona ambas fechas para el reporte personalizado."
                        );
                        return;
                      }
                      if (
                        moment(reportEndDate).isBefore(moment(reportStartDate))
                      ) {
                        alert(
                          "La fecha de fin no puede ser anterior a la fecha de inicio."
                        );
                        return;
                      }
                    }
                    exportToExcel(
                      exportData,
                      `Reporte_${exportSelectedPeriod}_${moment().format(
                        "YYYYMMDD_HHmmss"
                      )}`
                    );
                  }}
                  aria-label="Exportar reporte"
                >
                  Exportar Reporte
                </ExportButton>
              </ExportButtons>
            </ReportFilterContainer>
          )}

          {/* Contenedor de Periodos para Gráficos */}
          <PeriodsContainer>
            {/* Daily Section */}
            <PeriodContainer color="#4b70e2">
              <Subtitle>Diario</Subtitle>
              <Info>
                <InfoTitle>Notas Creadas</InfoTitle>
                <InfoData>{createdNotesDaily.length}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Total Ventas</InfoTitle>
                <InfoData>
                  {totalSalesDaily.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </InfoData>
              </Info>
              <Info>
                <InfoTitle>Cash In Hand</InfoTitle>
                <InfoData>
                  {cashInHandDaily.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </InfoData>
              </Info>
            </PeriodContainer>

            {/* Weekly Section */}
            <PeriodContainer color="#28a745">
              <Subtitle>Semanal</Subtitle>
              <Info>
                <InfoTitle>Notas Creadas</InfoTitle>
                <InfoData>{createdNotesWeekly.length}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Total Ventas</InfoTitle>
                <InfoData>
                  {totalSalesWeekly.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </InfoData>
              </Info>
              <Info>
                <InfoTitle>Cash In Hand</InfoTitle>
                <InfoData>
                  {cashInHandWeekly.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </InfoData>
              </Info>
            </PeriodContainer>

            {/* Monthly Section */}
            <PeriodContainer color="#6f42c1">
              <Subtitle>Mensual</Subtitle>
              <Info>
                <InfoTitle>Notas Creadas</InfoTitle>
                <InfoData>{createdNotesMonthly.length}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Total Ventas</InfoTitle>
                <InfoData>
                  {totalSalesMonthly.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </InfoData>
              </Info>
              <Info>
                <InfoTitle>Cash In Hand</InfoTitle>
                <InfoData>
                  {cashInHandMonthly.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })}
                </InfoData>
              </Info>

              {/* Código Comentado para Futuras Implementaciones */}
              {/*
              <ToggleSection>
                <ToggleButton onClick={() => setShowMonthlyCashNotes(!showMonthlyCashNotes)}>
                  {showMonthlyCashNotes ? "Ocultar Notas Cash In Hand" : "Mostrar Notas Cash In Hand"}
                </ToggleButton>
                {showMonthlyCashNotes && (
                  <NotesList>
                    {paidNotes.map((note) => (
                      <NoteItem key={note.id}>
                        <p><strong>Folio:</strong> {note.folio}</p>
                        <p><strong>Cliente:</strong> {note.name}</p>
                        <p><strong>Cantidad:</strong> {note.total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</p>
                        <p><strong>Fecha de Pago:</strong> {moment(note.paidAt).format("DD/MM/YYYY")}</p>
                      </NoteItem>
                    ))}
                  </NotesList>
                )}
              </ToggleSection>

              <ToggleSection>
                <ToggleButton onClick={() => setShowMonthlySalesNotes(!showMonthlySalesNotes)}>
                  {showMonthlySalesNotes ? "Ocultar Notas de Ventas" : "Mostrar Notas de Ventas"}
                </ToggleButton>
                {showMonthlySalesNotes && (
                  <SalesList>
                    {createdNotes.map((note) => (
                      <SaleItem key={note.id}>
                        <p><strong>Folio:</strong> {note.folio}</p>
                        <p><strong>Cliente:</strong> {note.name}</p>
                        <p><strong>Cantidad:</strong> {note.total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</p>
                        <p><strong>Fecha de Creación:</strong> {moment(note.createdAt).format("DD/MM/YYYY")}</p>
                      </SaleItem>
                    ))}
                  </SalesList>
                )}
              </ToggleSection>
              */}
            </PeriodContainer>
          </PeriodsContainer>
        </>
      )}
    </StyledTransactions>
  );
};

export default Transactions;

/* Styled Components */

// Contenedor Principal de Transactions
const StyledTransactions = styled.div`
  padding: 2rem;
  border-radius: 5px;
  background-color: #f9f9f9; /* Fondo claro */
  color: #333; /* Color de texto oscuro */
  transition: background-color 0.3s ease, color 0.3s ease;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

// Estilo para el Mensaje de Carga
const Loading = styled.p`
  margin-top: 1rem;
  color: #555;
  text-align: center;
`;

// Título Principal
const Title = styled.h3`
  margin-bottom: 2rem;
  color: #333;
  text-align: center;
`;

// Contenedor para el Header que incluye el Título y el Botón de Toggle
const Header = styled.div`
  display: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
`;

// Botón para Toggle de la Sección de Reportes
const ToggleExportButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: linear-gradient(45deg, #6c757d, #5a6268);
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
    background: linear-gradient(45deg, #5a6268, #6c757d);
  }

  &:active {
    transform: translateY(0) scale(1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

// Contenedor para el Filtro de Reportes
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

// Selector de Periodo para Exportación
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

// Selector de Rango de Fechas Personalizado para Exportación
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

// Contenedor para los Botones de Exportar
const ExportButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

// Botón de Exportación
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

// Contenedor de Periodos para Gráficos
const PeriodsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 768px) {
    flex-direction: column; /* Mantener en columna para ser una barra lateral */
  }
`;

// Contenedor de Cada Periodo (Daily, Weekly, Monthly)
const PeriodContainer = styled.div`
  background-color: ${(props) => props.color || "#4b70e2"}; /* Color dinámico */
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex: 1;
  color: #fff;
  transition: background 0.3s ease, transform 0.3s ease;

  &:hover {
    background-color: ${(props) => darkenColor(props.color, 0.1)};
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

// Función para oscurecer el color en hover
const darkenColor = (color, amount) => {
  // Usamos una función simple para oscurecer el color
  // Para una solución más robusta, considera usar una biblioteca como polished
  const num = parseInt(color.replace("#", ""), 16);
  let r = (num >> 16) - Math.round(255 * amount);
  let g = ((num >> 8) & 0x00ff) - Math.round(255 * amount);
  let b = (num & 0x0000ff) - Math.round(255 * amount);

  r = r < 0 ? 0 : r;
  g = g < 0 ? 0 : g;
  b = b < 0 ? 0 : b;

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

// Subtítulo de Cada Periodo
const Subtitle = styled.h4`
  margin-bottom: 1rem;
  color: #eaeaff;
  border-bottom: 2px solid #fff;
  padding-bottom: 0.5rem;
`;

// Contenedor de Información
const Info = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.3s ease;

  &:nth-child(even) {
    background: rgba(255, 255, 255, 0.15);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

// Título de la Información
const InfoTitle = styled.p`
  flex: 1;
  color: #eaeaff;
`;

// Datos de la Información
const InfoData = styled.p`
  flex: 1;
  text-align: right;
  font-weight: bold;
  margin-left: 1.5rem;
  color: #eaeaff;

  @media (max-width: 768px) {
    text-align: left;
    margin-left: 0;
    margin-top: 0.5rem;
  }
`;

// Sección de Toggle para Mostrar/Ocultar Notas
const ToggleSection = styled.div`
  margin-top: 1rem;
`;

// Botón para Toggle
const ToggleButton = styled.button`
  padding: 0.3rem 0.6rem;
  background-color: #fff;
  color: ${(props) => props.color || "#4b70e2"};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #f0f0f0;
    transform: scale(1.05);
  }
`;

// Lista de Notas para Cash In Hand
const NotesList = styled.div`
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 5px;
`;

// Item de Nota en Cash In Hand
const NoteItem = styled.div`
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  &:last-child {
    border-bottom: none;
  }

  p {
    margin: 0.2rem 0;
    font-size: 12px;
  }
`;

// Lista de Notas para Sales
const SalesList = styled.div`
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 5px;
`;

// Item de Nota en Sales
const SaleItem = styled.div`
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  &:last-child {
    border-bottom: none;
  }

  p {
    margin: 0.2rem 0;
    font-size: 12px;
  }
`;
