import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { LoadingSpinner } from "../LoadingAndError";
import { useSelector } from "react-redux";

const Order = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { list: orders, status } = useSelector((state) => state.orders);
  const { isAdmin } = useSelector((state) => state.auth);

  const order = useMemo(
    () => orders.find((o) => o._id === id) || {},
    [orders, id]
  );

  const deliveryStatus = order.delivery_status || "pending";
  const shipping = order.shipping || {};
  const customerName = order.customer_name || "Sin nombre";

  const generateWhatsAppMessage = useMemo(
    () => () => {
      const name = order.customer_name || "cliente";
      const date = order.createdAt
        ? new Date(order.createdAt).toLocaleString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Fecha no disponible";
      const total = order.total ? (order.total / 100).toFixed(2) : "0.00";

      const productsList =
        order.products
          ?.map((p) => {
            return `🫚 ${p.description || "Producto"} x${p.quantity || 1} = $${
              p.amount_total ? (p.amount_total / 100).toFixed(2) : "0.00"
            }`;
          })
          .join("\n") || "No hay productos registrados.";

      return (
        `👋 Hola, ${name}!\n` +
        `Aquí está el resumen de tu orden:\n\n` +
        `🤾 Orden ID: ${order._id || "N/A"}\n` +
        `📅 Fecha: ${date}\n` +
        `🧼 Servicios:\n${productsList}\n\n` +
        `💰 Total: $${total}\n` +
        `📍 Dirección: ${shipping?.line1 || "No disponible"}, ${
          shipping?.city || ""
        }\n` +
        `✅ ¡Gracias por confiar en nosotros!`
      );
    },
    [order]
  );

  const sendWhatsAppReceipt = () => {
    if (!order.phone) {
      alert("Este pedido no tiene un número de teléfono registrado.");
      return;
    }

    const message = generateWhatsAppMessage();
    const phone = order.phone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleBackClick = () => {
    if (isAdmin) {
      navigate("/admin/summary");
    } else {
      navigate("/");
    }
  };

  return (
    <StyledOrder>
      {status === "loading" ? (
        <LoadingSpinner message="Loading order details..." />
      ) : !order._id ? (
        <OrdersContainer>
          <Header>
            <h2>Order Details</h2>
            <BackButton onClick={handleBackClick}>Back to Dashboard</BackButton>
          </Header>
          <p>Orden no encontrada</p>
        </OrdersContainer>
      ) : (
        <OrdersContainer>
          <Header>
            <h2>Order Details</h2>
            <BackButton onClick={handleBackClick}>Back to Dashboard</BackButton>
          </Header>

          <DeliveryStatus status={deliveryStatus}>
            {deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}
          </DeliveryStatus>

          <Section>
            <h3>Shipping Details</h3>
            <DetailItem>Customer Name: {customerName}</DetailItem>
            <DetailItem>City: {shipping.city || "N/A"}</DetailItem>
            <DetailItem>Address: {shipping.line1 || "N/A"}</DetailItem>
            <DetailItem>
              Postal Code: {shipping.postal_code || "N/A"}
            </DetailItem>
            <DetailItem>Phone: {order.phone || "No registrado"}</DetailItem>
          </Section>

          <Section>
            <h3>Ordered Products</h3>
            <Items>
              {order.products?.map((product, index) => (
                <Item key={index}>
                  <ProductImage
                    src={product.image || "https://via.placeholder.com/60"}
                    alt={product.description || "Producto"}
                  />
                  <ProductDetails>
                    <ProductName>
                      {product.description || "Sin descripción"}
                    </ProductName>
                    <ProductInfo>
                      <ProductQuantity>
                        x{product.quantity || 1}{" "}
                        <UnitPrice>
                          (${product.unit_amount
                            ? (product.unit_amount / 100).toLocaleString(
                                "es-MX"
                              )
                            : "N/A"}{" "}
                          c/u)
                        </UnitPrice>
                      </ProductQuantity>
                      <ProductPrice>
                        {product.amount_total
                          ? `$${(product.amount_total / 100).toLocaleString(
                              "es-MX"
                            )}`
                          : "N/A"}
                      </ProductPrice>
                    </ProductInfo>
                  </ProductDetails>
                </Item>
              )) || <p>No hay productos registrados</p>}
            </Items>
          </Section>

          <SectionWhats>
            <TotalPrice>
              <h3>Total Price</h3>
              {order.total
                ? `$${(order.total / 100).toLocaleString("es-MX")}`
                : "No total disponible"}
            </TotalPrice>

            {isAdmin && (
              <ButtonGroup>
                <WhatsAppButton onClick={sendWhatsAppReceipt}>
                  Enviar por WhatsApp
                </WhatsAppButton>
              </ButtonGroup>
            )}
          </SectionWhats>
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
      case "cancelled":
        return "rgb(220, 53, 69)";
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
      case "cancelled":
        return "rgba(220, 53, 69, 0.12)";
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

const SectionWhats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;

  h3 {
    font-size: 1.6rem;
    color: #000;
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
  font-size: 1.8rem;
  font-weight: bold;
  color: #000;
  margin-bottom: 1.2rem;
`;

const DetailItem = styled.p`
  margin: 0.2rem 0;
  color: #555;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const WhatsAppButton = styled.button`
  background-color: #25d366; /* Verde WhatsApp */
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #1ebe5d;
  }

  &:focus {
    outline: none;
  }
`;

const UnitPrice = styled.span`
  color: #888;
  font-size: 0.9rem;
`;