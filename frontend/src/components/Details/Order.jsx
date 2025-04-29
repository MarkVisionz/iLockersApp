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
  const contact = order.contact || {};
  const customerName = contact.name || "Sin nombre";
  const phoneNumber = contact.phone || "No registrado";

  const generateWhatsAppMessage = useMemo(
    () => () => {
      const name = contact.name || "cliente";
      const date = order.createdAt
        ? new Date(order.createdAt).toLocaleString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Fecha no disponible";
      const total = order.total
        ? order.total.toLocaleString("es-MX", {
            style: "currency",
            currency: "MXN",
          })
        : "$0.00";

      const productsList =
        order.products
          ?.map((p) => {
            return `🫚 ${p.description || "Producto"} x${p.quantity || 1} = ${
              p.amount_total
                ? p.amount_total.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })
                : "$0.00"
            }`;
          })
          .join("\n") || "No hay productos registrados.";

      return (
        `👋 Hola, ${name}!\n` +
        `Aquí está el resumen de tu orden:\n\n` +
        `🤾 Orden ID: ${order._id || "N/A"}\n` +
        `📅 Fecha: ${date}\n` +
        `🧼 Servicios:\n${productsList}\n\n` +
        `💰 Total: ${total}\n` +
        `📍 Dirección: ${shipping?.line1 || "No disponible"}, ${
          shipping?.city || ""
        }\n` +
        `✅ ¡Gracias por confiar en nosotros!`
      );
    },
    [order, contact, shipping]
  );

  const sendWhatsAppReceipt = () => {
    if (!contact.phone) {
      alert("Este pedido no tiene un número de teléfono registrado.");
      return;
    }
    const message = generateWhatsAppMessage();
    const phone = contact.phone.replace(/\D/g, "");
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
            <DetailItem>Phone: {phoneNumber}</DetailItem>
          </Section>

          <Section>
            <h3>Ordered Products</h3>
            <Items>
              {order.products?.length ? (
                order.products.map((product, index) => (
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
                            (
                            {product.unit_amount
                              ? (product.unit_amount / 100).toLocaleString(
                                  "es-MX",
                                  {
                                    style: "currency",
                                    currency: "MXN",
                                  }
                                )
                              : "N/A"}{" "}
                            c/u)
                          </UnitPrice>
                        </ProductQuantity>
                        <ProductPrice>
                          {product.amount_total
                            ? (product.amount_total / 100).toLocaleString(
                                "es-MX",
                                {
                                  style: "currency",
                                  currency: "MXN",
                                }
                              )
                            : "N/A"}
                        </ProductPrice>
                      </ProductInfo>
                    </ProductDetails>
                  </Item>
                ))
              ) : (
                <p>No hay productos registrados</p>
              )}
            </Items>
          </Section>

          <SectionWhats>
            <TotalPrice>
              <h3>Total Price</h3>
              {order.total
                ? order.total.toLocaleString("es-MX", {
                    style: "currency",
                    currency: "MXN",
                  })
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
  margin: 1.5rem;
  display: flex;
  justify-content: center;
`;

const OrdersContainer = styled.div`
  width: 100%;
  max-width: 500px;
  background: #ffffff;
  border-radius: 12px;
  padding: 1.2rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h2 {
    font-size: 1.4rem;
    font-weight: 600;
    color: #212529;
  }
`;

const DeliveryStatus = styled.span`
  align-self: flex-start;
  margin-bottom: 1rem;
  font-weight: bold;
  font-size: 0.95rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: ${({ status }) => {
    switch (status) {
      case "pending": return "rgba(253, 181, 40, 0.15)";
      case "dispatched": return "rgba(38, 198, 249, 0.15)";
      case "delivered": return "rgba(102, 108, 255, 0.15)";
      case "cancelled": return "rgba(220, 53, 69, 0.15)";
      default: return "#f0f0f0";
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case "pending": return "#fdb528";
      case "dispatched": return "#26c6f9";
      case "delivered": return "#666cff";
      case "cancelled": return "#dc3545";
      default: return "#888";
    }
  }};
`;

const Section = styled.div`
  margin-top: 1.2rem;

  h3 {
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
    color: #343a40;
  }
`;

const SectionWhats = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Items = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const Item = styled.div`
  background: #f8f9fa;
  padding: 0.8rem;
  border-radius: 8px;
  display: flex;
  gap: 0.8rem;
  align-items: center;
  transition: background-color 0.3s;

  &:hover {
    background: #e6e9ec;
  }
`;

const ProductImage = styled.img`
  width: 55px;
  height: 55px;
  object-fit: cover;
  border-radius: 8px;
  background: #e9ecef;
`;

const ProductDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProductName = styled.span`
  font-weight: 600;
  color: #212529;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
`;

const ProductInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #555;
`;

const ProductQuantity = styled.span`
`;

const ProductPrice = styled.span`
  font-weight: bold;
`;

const UnitPrice = styled.span`
  color: #6c757d;
  font-size: 0.8rem;
`;

const TotalPrice = styled.p`
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 1rem;
`;

const DetailItem = styled.p`
  margin: 0.4rem 0;
  font-size: 0.95rem;
  color: #495057;
`;

const BackButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const WhatsAppButton = styled.button`
  background-color: #25d366;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #1ebe5d;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.8rem;
`;

