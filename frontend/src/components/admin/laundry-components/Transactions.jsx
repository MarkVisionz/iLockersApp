import styled from "styled-components";
import { useEffect, useState } from "react";
import axios from "axios";
import { setHeaders, url } from "../../../features/api";
import moment from "moment";

const Transactions = () => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await axios.get(`${url}/notes`, setHeaders());
        setNotes(res.data);
      } catch (error) {
        console.log(error);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const calculateSalesAndCashInHand = (filteredNotes, periodStartDate) => {
    let totalSales = 0;
    let cashInHand = 0;

    filteredNotes.forEach((note) => {
      // Calculate total sales based on note creation date
      totalSales += note.total;

      // Check if the payment date is within the period
      if (note.note_status === "pagado") {
        const paymentDate = moment(note.paidAt);
        if (paymentDate.isSameOrAfter(periodStartDate)) {
          cashInHand += note.total;
        }
      }
      // Handle abonos if applicable
    });

    return { totalSales, cashInHand };
  };

  const filterNotesByPeriod = (period) => {
    const now = moment();
    let startDate;

    switch (period) {
      case "day":
        startDate = now.startOf('day');
        break;
      case "week":
        startDate = now.startOf('week').add(1, 'day'); // Asumiendo que la semana comienza el lunes
        break;
      case "month":
        startDate = now.startOf('month');
        break;
      default:
        startDate = now;
    }

    return notes.filter((note) => {
      const noteDate = moment(note.createdAt);
      return noteDate.isSameOrAfter(startDate);
    });
  };

  const dailyNotes = filterNotesByPeriod("day");
  const weeklyNotes = filterNotesByPeriod("week");
  const monthlyNotes = filterNotesByPeriod("month");

  const { totalSales: dailySales, cashInHand: dailyCashInHand } = calculateSalesAndCashInHand(dailyNotes, moment().startOf('day'));
  const { totalSales: weeklySales, cashInHand: weeklyCashInHand } = calculateSalesAndCashInHand(weeklyNotes, moment().startOf('week').add(1, 'day'));
  const { totalSales: monthlySales, cashInHand: monthlyCashInHand } = calculateSalesAndCashInHand(monthlyNotes, moment().startOf('month'));

  return (
    <StyledTransactions>
      {isLoading ? (
        <Loading>Loading notes...</Loading>
      ) : (
        <>
          <Title>Data Overview</Title>
          <PeriodsContainer>
            <PeriodContainer>
              <Subtitle>Daily</Subtitle>
              <Info>
                <InfoTitle>Notes Created</InfoTitle>
                <InfoData>{dailyNotes.length}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Total Sales</InfoTitle>
                <InfoData>{(dailySales).toLocaleString("en-US", { style: "currency", currency: "USD" })}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Cash In Hand</InfoTitle>
                <InfoData>{(dailyCashInHand).toLocaleString("en-US", { style: "currency", currency: "USD" })}</InfoData>
              </Info>
            </PeriodContainer>

            <PeriodContainer>
              <Subtitle>Weekly</Subtitle>
              <Info>
                <InfoTitle>Notes Created</InfoTitle>
                <InfoData>{weeklyNotes.length}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Total Sales</InfoTitle>
                <InfoData>{(weeklySales).toLocaleString("en-US", { style: "currency", currency: "USD" })}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Cash In Hand</InfoTitle>
                <InfoData>{(weeklyCashInHand).toLocaleString("en-US", { style: "currency", currency: "USD" })}</InfoData>
              </Info>
            </PeriodContainer>

            <PeriodContainer>
              <Subtitle>Monthly</Subtitle>
              <Info>
                <InfoTitle>Notes Created</InfoTitle>
                <InfoData>{monthlyNotes.length}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Total Sales</InfoTitle>
                <InfoData>{(monthlySales).toLocaleString("en-US", { style: "currency", currency: "USD" })}</InfoData>
              </Info>
              <Info>
                <InfoTitle>Cash In Hand</InfoTitle>
                <InfoData>{(monthlyCashInHand).toLocaleString("en-US", { style: "currency", currency: "USD" })}</InfoData>
              </Info>
            </PeriodContainer>
          </PeriodsContainer>
        </>
      )}
    </StyledTransactions>
  );
};

export default Transactions;

const StyledTransactions = styled.div`
  border-radius: 5px;
`;

const Loading = styled.p`
  margin-top: 1rem;
  color: #000;
`;

const Title = styled.h3`
  margin-bottom: 1rem;
  color: #000;
`;

const PeriodsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PeriodContainer = styled.div`
  background-color: rgb(48, 51, 78);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
`;

const Subtitle = styled.h4`
  margin-bottom: 1rem;
  color: rgba(234, 234, 255, 0.87);
`;

const Info = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-top: 1rem;
  padding: 0.5rem;
  border-radius: 5px;
  background: rgba(38, 198, 249, 0.12);
  &:nth-child(even) {
    background: rgba(102, 108, 255, 0.12);
  }
`;

const InfoTitle = styled.p`
  flex: 1;
  color: rgba(234, 234, 255, 0.87);
`;

const InfoData = styled.p`
  flex: 1;
  text-align: right;
  font-weight: bold;
  margin-left: 1.5rem;
  color: rgba(234, 234, 255, 0.87);
`;
