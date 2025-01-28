import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styled from "styled-components";
import { setHeaders, url } from "../../features/api";
import { LoadingSpinner } from "../LoadingAndError"; // Asegúrate de tener un spinner de carga

const Order = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${url}/orders/findOne/${params.id}`,
          setHeaders()
        );
        setOrder(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const deliveryStatus = order.delivery_status || ""; // Asegúrate de que delivery_status tenga un valor por defecto

  return (
    <StyledOrder>
      {loading ? (
        <LoadingSpinner message="Loading order details..." />
      ) : (
        <OrdersContainer>
          <Header>
            <h2>Order Details</h2>
            <BackButton onClick={() => navigate("/admin/orders")}>
              Back to Dashboard
            </BackButton>
          </Header>

          <DeliveryStatus status={deliveryStatus}>
            {deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}
          </DeliveryStatus>

          <Section>
            <h3>Ordered Products</h3>
            <Items>
              {order.products?.map((product, index) => (
                <Item key={index}>
                  <ProductImage src={product.image} alt={product.description} />
                  <ProductDetails>
                    <ProductName>{product.description}</ProductName>
                    <ProductInfo>
                      <ProductQuantity>x{product.quantity}</ProductQuantity>
                      <ProductPrice>
                        ${(product.amount_total / 100).toLocaleString()}
                      </ProductPrice>
                    </ProductInfo>
                  </ProductDetails>
                </Item>
              ))}
            </Items>
          </Section>

          <Section>
            <h3>Total Price</h3>
            <TotalPrice>${(order.total / 100).toLocaleString()}</TotalPrice>
          </Section>

          <Section>
            <h3>Shipping Details</h3>
            <DetailItem>Customer Name: {order.shipping?.name}</DetailItem>
            <DetailItem>City: {order.shipping?.address.city}</DetailItem>
            <DetailItem>Email: {order.shipping?.email}</DetailItem>
          </Section>
        </OrdersContainer>
      )}
    </StyledOrder>
  );
};

export default Order;

// Styled Components

const StyledOrder = styled.div`
  margin: 2rem;
  display: flex;
  justify-content: center;
`;

const OrdersContainer = styled.div`
  max-width: 500px;
  width: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f7f8fa 100%);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.6rem;
    color: #4a4a4a;
  }
`;

const DeliveryStatus = styled.span`
  color: ${({ status }) => {
    switch (status) {
      case "pending":
        return "rgb(253, 181, 40)";
      case "dispatched":
        return "rgb(38, 198, 249)";
      case "delivered":
        return "rgb(102, 108, 255)";
      default:
        return "black";
    }
  }};
  background: ${({ status }) => {
    switch (status) {
      case "pending":
        return "rgba(253, 181, 40, 0.12)";
      case "dispatched":
        return "rgba(38, 198, 249, 0.12)";
      case "delivered":
        return "rgba(102, 108, 255, 0.12)";
      default:
        return "none";
    }
  }};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 1.1rem;
`;

const BackButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
  font-size: 1rem;

  &:hover {
    background-color: #0056b3;
  }
`;

const Section = styled.div`
  margin-top: 1.5rem;

  h3 {
    margin-bottom: 0.5rem;
    font-size: 1.4rem;
    color: #333;
  }
`;

const Items = styled.div`
  margin-top: 1rem;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 1rem;
`;

const ProductImage = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  margin-right: 1rem;
`;

const ProductDetails = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ProductName = styled.span`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const ProductInfo = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ProductQuantity = styled.span`
  margin-right: 1rem;
`;

const ProductPrice = styled.span`
  font-weight: bold;
`;

const TotalPrice = styled.p`
  font-size: 1.2rem;
  font-weight: bold;
  color: #4a4a4a;
`;

const DetailItem = styled.p`
  margin: 0.2rem 0;
  color: #555;
`;
