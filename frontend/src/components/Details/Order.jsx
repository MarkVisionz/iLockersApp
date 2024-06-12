import { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import axios from "axios";
import { setHeaders, url } from "../../features/api";

const Order = () => {
  const params = useParams();

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
        setLoading(false);
      } catch (err) {
        console.log(err);
      }
    };

    fetchOrder();
  }, [params.id]);

  return (
    <StyledOrder>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <OrdersContainer>
            <h2>Order Details</h2>
            <p>
              Delivery status:{" "}
              {order.delivery_status === "pending" ? (
                <Pending>Pending</Pending>
              ) : order.delivery_status === "dispatched" ? (
                <Dispatched>Dispatched</Dispatched>
              ) : order.delivery_status === "delivered" ? (
                <Delivered>Delivered</Delivered>
              ) : (
                "error"
              )}
            </p>

            <h3>Ordered Products</h3>
            <Items>
              {order.products?.map((product, index) => (
                <Item key={index}>
                  <ProductDetails>
                    <ProductInfo>
                      <ProductImage src={product.image} alt={product.description} />
                      <ProductName>{product.description}</ProductName>
                      <ProductQuantity>x{product.quantity}</ProductQuantity>
                      <ProductPrice>
                        {"$" + (product.amount_total / 100).toLocaleString()}
                      </ProductPrice>
                    </ProductInfo>
                  </ProductDetails>
                </Item>
              ))}
            </Items>
            <div>
              <h3>Total Price</h3>
              <p>{"$" + (order.total / 100).toLocaleString()}</p>
            </div>
            <div>
              <h3>Shipping Details</h3>
              <p>Customer Name: {order.shipping?.name}</p>
              <p>City: {order.shipping?.address.city}</p>
              <p>Email: {order.shipping?.email}</p>
            </div>
          </OrdersContainer>
        </>
      )}
    </StyledOrder>
  );
};

export default Order;

const StyledOrder = styled.div`
  margin: 3rem;
  display: flex;
  justify-content: center;

  h3 {
    margin: 1.5rem 0 0.5rem 0;
  }
`;

const OrdersContainer = styled.div`
  max-width: 500px;
  width: 100%;
  height: auto;
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
  border-radius: 5px;
  padding: 2rem;
`;

const Items = styled.div`
  margin-top: 1rem;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 0.1rem;
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
  margin-bottom: 0.5rem; /* Agrega un margen inferior para separar el nombre del producto del resto de la información */
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly; /* Esto asegura que el precio esté alineado al final */
`;

const ProductQuantity = styled.span`
  margin-right: 1rem; /* Ajusta el margen derecho para un mejor espaciado */
`;

const ProductPrice = styled.span`
  font-weight: bold; /* Puedes agregar este estilo para resaltar el precio */
`;

const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgb(253, 181, 40, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
`;

const Dispatched = styled.span`
  color: rgb(38, 198, 249);
  background-color: rgb(38, 198, 249, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
`;

const Delivered = styled.span`
  color: rgb(102, 108, 255);
  background-color: rgba(102, 108, 255, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
`;
