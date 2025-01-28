import styled from "styled-components";
import Widget from "./summary-components/Widget";
import { FaClipboard, FaChartBar } from "react-icons/fa";
import { useState, useEffect } from "react";
import { setHeaders, url } from "../../features/api";
import axios from "axios";
import Transactions from "./laundry-components/Transactions";
import AllTimeData from "./laundry-components/AllTimeData";
import NotesSummary from "./list/NotesSummary";
import moment from "moment";

const LocalSummary = () => {
  const [notesData, setNotesData] = useState({ current: 0, previous: 0 });
  const [incomeData, setIncomeData] = useState({ current: 0, previous: 0 });

  useEffect(() => {
    const fetchNotesData = async () => {
      try {
        const res = await axios.get(`${url}/notes/stats`, setHeaders());
        const currentMonthData = res.data.find(item => item._id === moment().month() + 1) || { total: 0 };
        const previousMonthData = res.data.find(item => item._id === moment().month()) || { total: 0 };
        setNotesData({ current: currentMonthData.total, previous: previousMonthData.total });
      } catch (err) {
        console.log(err);
      }
    };

    const fetchIncomeData = async () => {
      try {
        const res = await axios.get(`${url}/notes/income/stats`, setHeaders());
        const currentMonthData = res.data.find(item => item._id === moment().month() + 1) || { total: 0 };
        const previousMonthData = res.data.find(item => item._id === moment().month()) || { total: 0 };
        setIncomeData({ current: currentMonthData.total, previous: previousMonthData.total });
      } catch (err) {
        console.log(err);
      }
    };

    fetchNotesData();
    fetchIncomeData();
  }, []);

  const calculatePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const notesPercentage = calculatePercentage(notesData.current, notesData.previous);
  const incomePercentage = calculatePercentage(incomeData.current, incomeData.previous);

  const data = [
    {
      icon: <FaClipboard />,
      digits: notesData.current,
      isMoney: false,
      title: "Notas",
      color: "#00d532", // Azul de la paleta
      bgColor: "rgba(0, 255, 115, 0.12)", // Azul oscuro con opacidad
      percentage: notesPercentage,
    },
    {
      icon: <FaChartBar />,
      digits: incomeData.current,
      isMoney: true,
      title: "Ganancias",
      color: "rgb(253, 181, 40)", 
      bgColor: "rgb(253, 181, 40, 0.12)", 
      percentage: incomePercentage,
    },
  ];

  return (
    <StyledSummary>
      <MainStats>
        <Overview>
          <Title>
            <h2>Resumen</h2>
            <p>Cómo está funcionando tu lavandería en comparación con el mes anterior</p>
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
    </StyledSummary>
  );
};

export default LocalSummary;

const StyledSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  /* padding: 1rem; */
  width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
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
    color: #ffffff; // Color de subtítulos
    margin-bottom: 0.5rem; // Espaciado
  }
  p {
    font-size: 14px;
    color: #ffffff; // Texto secundario
  }
`;

const Overview = styled.div`
  background: linear-gradient(45deg, #4b70e2, #3a5bb8);
  color: #ffffff; // Color de subtítulos
  padding: 2rem; // Padding aumentado para más espacio
  border-radius: 15px; // Bordes redondeados
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); // Sombra sutil
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
    padding: 1.5rem; // Ajustar el padding en dispositivos pequeños
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
