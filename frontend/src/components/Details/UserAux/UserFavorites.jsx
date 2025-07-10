import React from "react";
import styled from "styled-components";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";

const UserFavorites = ({ orders, userId, authEmail, favorites }) => {
  const favoriteProducts = React.useMemo(() => {
    const allOrders =
      orders?.filter(
        (order) =>
          order?.userId?.toString() === userId ||
          (order?.contact?.email === authEmail && order?.isGuestOrder)
      ) || [];

    const productCounts = {};
    allOrders.forEach((order) => {
      order?.products?.forEach((product) => {
        const productKey = product?.description || product?.product_id;
        if (!productKey) return;
        if (!productCounts[productKey]) {
          productCounts[productKey] = {
            id: product.product_id || productKey,
            name: product.description || "Producto desconocido",
            image: product.image || "",
            timesOrdered: 0,
            totalQuantity: 0,
          };
        }
        productCounts[productKey].timesOrdered += 1;
        productCounts[productKey].totalQuantity += product.quantity || 0;
      });
    });

    const sortedProducts = Object.values(productCounts).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    return sortedProducts.slice(0, 3).map((product) => ({
      ...product,
      isFavorite: favorites?.includes(product.id) || false,
    }));
  }, [orders, userId, authEmail, favorites]);

  return (
    <Card>
      <CardTitle>Tus 3 Productos Más Pedidos</CardTitle>
      {favoriteProducts.length === 0 ? (
        <EmptyState>No has pedido productos aún.</EmptyState>
      ) : (
        <ProductList>
          {favoriteProducts.map((product) => (
            <ProductItem key={product.id}>
              {product.image && (
                <ProductImage src={product.image} alt={product.name} />
              )}
              <ProductInfo>
                <CustomerName>{product.name}</CustomerName>
                <ProductMeta>
                  <span>
                    <FaStar color="#FFD700" /> Pedido {product.timesOrdered}{" "}
                    veces ({product.totalQuantity} unidades totales)
                  </span>
                </ProductMeta>
              </ProductInfo>
            </ProductItem>
          ))}
        </ProductList>
      )}
    </Card>
  );
};

// Estilos (iguales a los del original)
const Card = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
`;
const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 1rem;
  text-align: center;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #86868b;
  font-size: 0.95rem;
  margin: 1rem 0;
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CustomerName = styled.span`
  font-weight: 500;
  color: #1d1d1f;
`;

const ProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f5f5f7;
  border-radius: 12px;
  font-size: 0.95rem;
`;

const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 1rem;
`;

const ProductInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ProductMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
`;

export default UserFavorites;
