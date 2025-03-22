import styled from "styled-components";
import Widget from "./summary-components/Widget";
import { FaUsers, FaChartBar, FaClipboard } from "react-icons/fa";
import Chart from "./summary-components/Chart";
import { useState, useEffect } from "react";
import { setHeaders, url } from "../../features/api";
import axios from "axios";
import Transactions from "./summary-components/Transactions";
import AllTimeData from "./summary-components/AllTimeData";

const Summary = () => {
  const [users, setUsers] = useState([]);
  const [usersPerc, setUsersPerc] = useState(0);
  const [orders, setOrders] = useState([]);
  const [ordersPerc, setOrdersPerc] = useState(0);
  const [income, setIncome] = useState([]);
  const [incomePerc, setIncomePerc] = useState(0);

  function compare(a, b) {
    if (a._id < b._id) {
      return 1;
    }
    if (a._id > b._id) {
      return -1;
    }
    return 0;
  }

  // USERS FETCH
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${url}/users/stats`, setHeaders());

        res.data.sort(compare);
        setUsers(res.data);
        setUsersPerc(
          ((res.data[0].total - res.data[1].total) / res.data[1].total) * 100
        );
      } catch (err) {
        console.log(err);
      }
    }
    fetchData();
  }, []);

  // ORDERS FETCH
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${url}/orders/stats`, setHeaders());

        res.data.sort(compare);
        setOrders(res.data);
        setOrdersPerc(
          ((res.data[0].total - res.data[1].total) / res.data[1].total) * 100
        );
      } catch (err) {
        console.log(err);
      }
    }
    fetchData();
  }, []);

  // EARNINGS FETCH
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${url}/orders/income/stats`, setHeaders());

        res.data.sort(compare);
        setIncome(res.data);
        setIncomePerc(
          ((res.data[0].total - res.data[1].total) / res.data[1].total) * 100
        );
      } catch (err) {
        console.log(err);
      }
    }
    fetchData();
  }, []);

  const data = [
    {
      icon: <FaUsers />,
      digits: users[0]?.total,
      isMoney: false,
      title: "Users",
      color: "rgb(102, 108, 255)",
      bgColor: "rgb(102, 108, 255, 0.12)",
      percentage: usersPerc,
    },
    {
      icon: <FaClipboard />,
      digits: orders[0]?.total,
      isMoney: false,
      title: "Orders",
      color: "rgb(38, 198, 249)",
      bgColor: "rgb(38, 198, 249, 0.12)",
      percentage: ordersPerc,
    },
    {
      icon: <FaChartBar />,
      digits: income[0]?.total ? income[0]?.total / 100 : "",
      isMoney: true,
      title: "Earnings",
      color: "rgb(253, 181, 40)",
      bgColor: "rgb(253, 181, 40, 0.12)",
      percentage: incomePerc,
    },
  ];

  return (
    <StyledSummary>
      <MainStats>
        <Overview>
          <Title>
            <h2>Overview</h2>
            <p>How your Laundry is performing compared to the previous month</p>
          </Title>
          <WidgetWrapper>
            {data?.map((data, index) => (
              <Widget key={index} data={data} />
            ))}
          </WidgetWrapper>
        </Overview>
        <Chart />
      </MainStats>
      <SideStats>
        <Transactions />
        <AllTimeData />
      </SideStats>
    </StyledSummary>
    
  );
};

export default Summary;

const StyledSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem;
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
  p {
    font-size: 14px;
    color: rgba(234, 234, 255, 0.68);
  }
`;

const Overview = styled.div`
  background: rgb(48, 51, 78);
  color: rgba(234, 234, 255, 0.87);
  padding: 1.5rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
    padding: 1rem;
  }
`;

const WidgetWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
  justify-content: space-between;

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
