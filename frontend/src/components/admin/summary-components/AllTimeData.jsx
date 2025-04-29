import { useSelector } from "react-redux";
import styled from "styled-components";
import { useMemo, useState } from "react";
import { 
  FaUsers, 
  FaTshirt, 
  FaClipboardList, 
  FaMoneyBillWave,
  FaGoogle,
  FaFacebook,
  FaApple,
  FaKey
} from "react-icons/fa";
import { motion } from "framer-motion";

const AllTimeData = () => {
  const { 
    list: users = [], 
    status: usersStatus, 
    error: usersError 
  } = useSelector((state) => state.users);
  
  const { 
    list: orders = [], 
    stats: orderStats = {},
    status: ordersStatus, 
    error: ordersError 
  } = useSelector((state) => state.orders);
  
  const { 
    items: products = [] 
  } = useSelector((state) => state.products);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const isLoading = (usersStatus === "loading" || ordersStatus === "loading") && isInitialLoad;
  const isError = usersError || ordersError;

  const authProviderStats = useMemo(() => {
    const stats = {
      google: 0,
      facebook: 0,
      apple: 0,
      password: 0
    };

    users.forEach(user => {
      switch(user.authProvider) {
        case 'google.com': stats.google++; break;
        case 'facebook.com': stats.facebook++; break;
        case 'apple.com': stats.apple++; break;
        default: stats.password++; 
      }
    });

    return stats;
  }, [users]);

  const orderStatistics = useMemo(() => {
    const totalOrders = orders.length;
    const cancelledOrders = orders.filter(order => order.delivery_status === 'cancelled').length;
    const completedOrders = orders.filter(order => order.delivery_status === 'delivered').length;
    
    const totalEarnings = orders.reduce((sum, order) => {
      return order.delivery_status !== 'cancelled' ? sum + (order.total || 0) : sum;
    }, 0);

    return {
      totalOrders,
      cancelledOrders,
      completedOrders,
      totalEarnings: (totalEarnings).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      })
    };
  }, [orders]);


  useMemo(() => {
    if (usersStatus === "success" && ordersStatus === "success") {
      setIsInitialLoad(false);
    }
  }, [usersStatus, ordersStatus]);

  if (isError) {
    return (
      <Container>
        <Header>
          <Title>Resumen General</Title>
        </Header>
        <ErrorMessage>Error al cargar datos: {usersError || ordersError}</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Resumen General</Title>
        <Subtitle>Estadísticas acumuladas de la plataforma</Subtitle>
      </Header>
      
      {isLoading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Cargando estadísticas...</LoadingText>
        </LoadingContainer>
      ) : (
        <StatsGrid>
          {/* Fila 1 */}
          <StatsRow>
            <StatsCard 
              as={motion.div}
              whileHover={{ y: -3 }}
              color="#4b70e2"
            >
              <CardIcon color="#4b70e2">
                <FaUsers />
              </CardIcon>
              <CardContent>
                <CardValue>{users.length}</CardValue>
                <CardLabel>Usuarios</CardLabel>
                <AuthProviders>
                  <ProviderBadge color="#DB4437">
                    <FaGoogle size={10} /> {authProviderStats.google}
                  </ProviderBadge>
                  <ProviderBadge color="#4267B2">
                    <FaFacebook size={10} /> {authProviderStats.facebook}
                  </ProviderBadge>
                  <ProviderBadge color="#000000">
                    <FaApple size={10} /> {authProviderStats.apple}
                  </ProviderBadge>
                  <ProviderBadge color="#666666">
                  <FaKey size={10} /> {authProviderStats.password}
                </ProviderBadge>
                </AuthProviders>
              </CardContent>
            </StatsCard>

            <StatsCard 
              as={motion.div}
              whileHover={{ y: -3 }}
              color="#28a745"
            >
              <CardIcon color="#28a745">
                <FaTshirt />
              </CardIcon>
              <CardContent>
                <CardValue>{products.length}</CardValue>
                <CardLabel>Productos</CardLabel>
              </CardContent>
            </StatsCard>
          </StatsRow>

          {/* Fila 2 */}
          <StatsRow>
            <StatsCard 
              as={motion.div}
              whileHover={{ y: -3 }}
              color="#dc3545"
            >
              <CardIcon color="#dc3545">
                <FaClipboardList />
              </CardIcon>
              <CardContent>
                <CardValue>{orderStatistics.totalOrders}</CardValue>
                <CardLabel>Órdenes</CardLabel>
                <OrderDetails>
                  <Detail positive>{orderStatistics.completedOrders} completadas</Detail>
                  <Detail negative>{orderStatistics.cancelledOrders} canceladas</Detail>
                </OrderDetails>
              </CardContent>
            </StatsCard>

            <StatsCard 
              as={motion.div}
              whileHover={{ y: -3 }}
              color="#ffc107"
            >
              <CardIcon color="#ffc107">
                <FaMoneyBillWave />
              </CardIcon>
              <CardContent>
                <CardValue>{orderStatistics.totalEarnings}</CardValue>
                <CardLabel>Ganancias</CardLabel>
              </CardContent>
            </StatsCard>
          </StatsRow>
        </StatsGrid>
      )}
    </Container>
  );
};

export default AllTimeData;

// Estilos
const Container = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  color: #2d3748;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #718096;
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
`;

const StatsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
`;

const StatsCard = styled.div`
  flex: 1;
  position: relative;
  padding: 1.25rem 1rem;
  background: #fff;
  border-radius: 10px;
  border-left: 3px solid ${props => props.color};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 120px;
  overflow: hidden;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${props => props.color}05;
    z-index: 0;
  }
`;

const CardIcon = styled.div`
  position: absolute;
  top: 0.8rem;
  left: 0.8rem;
  font-size: 1.1rem;
  color: ${props => props.color};
  z-index: 1;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding-top: 0.5rem;
  z-index: 1;
`;

const CardValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.25rem;
`;

const CardLabel = styled.div`
  font-size: 0.85rem;
  color: #718096;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const AuthProviders = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
  width: 100%;
  max-width: 160px;
`;

const ProviderBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  padding: 0.3rem 0.4rem;
  border-radius: 12px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  font-weight: 500;
  white-space: nowrap;
  text-align: center;
`;

const OrderDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const Detail = styled.span`
  font-size: 0.75rem;
  color: ${props => props.positive ? '#38a169' : props.negative ? '#e53e3e' : '#718096'};
  font-weight: 500;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #edf2f7;
  border-top: 3px solid #4b70e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  color: #718096;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #e53e3e;
  font-weight: 500;
  padding: 1rem;
  background: #fff5f5;
  border-radius: 8px;
  border: 1px solid #fed7d7;
  font-size: 0.9rem;
`;