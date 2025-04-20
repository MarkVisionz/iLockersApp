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

// Componente AllTimeData
const AllTimeData = () => {
  // Obtener datos del estado
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

  // Determinar estados de carga y error
  const isLoading = (usersStatus === "loading" || ordersStatus === "loading") && isInitialLoad;
  const isError = usersError || ordersError;

  // Calcular estadísticas de usuarios por proveedor de autenticación
  const authProviderStats = useMemo(() => {
    const stats = {
      google: 0,
      facebook: 0,
      apple: 0,
      password: 0
    };

    users.forEach(user => {
      switch(user.authProvider) {
        case 'google.com':
          stats.google++;
          break;
        case 'facebook.com':
          stats.facebook++;
          break;
        case 'apple.com':
          stats.apple++;
          break;
        case 'password':
          stats.password++;
          break;
        default:
          stats.password++; // Por defecto
      }
    });

    return stats;
  }, [users]);

  // Calcular estadísticas de órdenes
  const orderStatistics = useMemo(() => {
    const totalOrders = orders.length;
    const cancelledOrders = orders.filter(order => order.delivery_status === 'cancelled').length;
    const completedOrders = orders.filter(order => order.delivery_status === 'delivered').length;
    
    // Calcular ganancias totales (sumando todas las órdenes no canceladas)
    const totalEarnings = orders.reduce((sum, order) => {
      return order.delivery_status !== 'cancelled' ? sum + (order.total || 0) : sum;
    }, 0);

    return {
      totalOrders,
      cancelledOrders,
      completedOrders,
      totalEarnings: (totalEarnings / 100).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      })
    };
  }, [orders]);

  // Calcular total de notas/órdenes de todos los meses
  const totalNotes = useMemo(() => {
    if (!orderStats.orders || !Array.isArray(orderStats.orders)) return 0;
    return orderStats.orders.reduce((sum, month) => sum + (month.total || 0), 0);
  }, [orderStats.orders]);

  // Marcar la carga inicial como completa cuando los datos estén listos
  useMemo(() => {
    if (usersStatus === "success" && ordersStatus === "success") {
      setIsInitialLoad(false);
    }
  }, [usersStatus, ordersStatus]);

  if (isError) {
    return (
      <Container>
        <h3>Resumen Acumulado</h3>
        <Error>Error al cargar datos: {usersError || ordersError}</Error>
      </Container>
    );
  }

  return (
    <Container>
      <h3>Resumen Acumulado</h3>
      {isLoading ? (
        <Loading>Cargando estadísticas completas...</Loading>
      ) : (
        <>
          <StatsGrid>
            <StatCard>
              <IconWrapper>
                <FaUsers />
              </IconWrapper>
              <Data>
                <Label>Total Usuarios</Label>
                <Value>{users.length}</Value>
                <AuthStats>
                  <AuthStat color="#DB4437">
                    <FaGoogle /> {authProviderStats.google}
                  </AuthStat>
                  <AuthStat color="#4267B2">
                    <FaFacebook /> {authProviderStats.facebook}
                  </AuthStat>
                  <AuthStat color="#000000">
                    <FaApple /> {authProviderStats.apple}
                  </AuthStat>
                  <AuthStat color="#666666">
                    <FaKey /> {authProviderStats.password}
                  </AuthStat>
                </AuthStats>
              </Data>
            </StatCard>
            
            <StatCard>
              <IconWrapper>
                <FaTshirt />
              </IconWrapper>
              <Data>
                <Label>Total Productos</Label>
                <Value>{products.length}</Value>
              </Data>
            </StatCard>
            
            <StatCard>
              <IconWrapper>
                <FaClipboardList />
              </IconWrapper>
              <Data>
                <Label>Total Órdenes</Label>
                <Value>{orderStatistics.totalOrders}</Value>
                <OrderDetails>
                  <Detail>Completadas: {orderStatistics.completedOrders}</Detail>
                  <Detail>Canceladas: {orderStatistics.cancelledOrders}</Detail>
                  <Detail>Notas: {totalNotes}</Detail>
                </OrderDetails>
              </Data>
            </StatCard>
            
            <StatCard>
              <IconWrapper>
                <FaMoneyBillWave />
              </IconWrapper>
              <Data>
                <Label>Ganancias Totales</Label>
                <Value>{orderStatistics.totalEarnings}</Value>
              </Data>
            </StatCard>
          </StatsGrid>
        </>
      )}
    </Container>
  );
};

export default AllTimeData;

// Styled components
const Container = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;

  h3 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  margin-top: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  @media (min-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
`;

const StatCard = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background: #f4f7ff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(75, 112, 226, 0.1);
  transition: all 0.2s ease;
  min-height: 100px;
  max-width: 300px;
  overflow: hidden;

  &:hover {
    background: #e8edff;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 0.8rem;
    min-height: 80px;
  }
`;

const IconWrapper = styled.div`
  font-size: 1.5rem;
  color: #4b70e2;
  margin-right: 0.8rem;
  margin-top: 0.2rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-right: 0.5rem;
  }
`;

const Data = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* Evita desborde del contenido */
`;

const Label = styled.span`
  font-size: 0.85rem;
  color: #777;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const Value = styled.span`
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const AuthStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.2rem;

  @media (max-width: 768px) {
    gap: 0.3rem;
  }
`;

const AuthStat = styled.span`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: ${props => props.color}20;
  color: ${props => props.color};
  white-space: nowrap;

  svg {
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;

    svg {
      font-size: 0.7rem;
    }
  }
`;

const OrderDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.2rem;
`;

const Detail = styled.span`
  font-size: 0.75rem;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 0.65rem;
  }
`;

const Loading = styled.p`
  text-align: center;
  margin: 1rem 0;
  color: #666;
  font-size: 1rem;
`;

const Error = styled.p`
  text-align: center;
  color: #dc2626;
  font-weight: bold;
  padding: 1rem;
  background: #fef2f2;
  border-radius: 6px;
  font-size: 0.9rem;
`;