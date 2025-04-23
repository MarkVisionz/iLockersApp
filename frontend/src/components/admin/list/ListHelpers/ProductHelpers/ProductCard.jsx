import React, { useState } from "react";
import styled from "styled-components";
import EditProduct from "../../../EditProduct";

const ProductCard = ({ item, handleDelete, navigate }) => {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <CardContainer>
      <ProductInfo>
        <ProductId>ID: {item._id}</ProductId>
        <ImageContainer>
          <ProductImage src={item.image?.url} alt={item.name} />
        </ImageContainer>
        <ProductName>{item.name}</ProductName>
        <ProductCategory>Categoría: {item.category}</ProductCategory>
        <ProductDescription>{item.description || "Sin descripción"}</ProductDescription>
        <ProductWeight>Peso: {item.weight}g</ProductWeight>
        <ProductPrice>Precio: ${item.price.toLocaleString()}</ProductPrice>
        <ProductSold>Vendidos: {item.sold}</ProductSold>
      </ProductInfo>

      <Actions>
        <ActionButton onClick={(e) => {
          e.stopPropagation();
          handleDelete(item._id);
        }} isDelete>
          Eliminar
        </ActionButton>

        <ActionButton onClick={(e) => {
          e.stopPropagation();
          setShowEdit(true);
        }}>
          Editar
        </ActionButton>

        <ActionView onClick={(e) => {
          e.stopPropagation();
          navigate(`/product/${item._id}`);
        }}>
          Ver
        </ActionView>
      </Actions>

      {showEdit && (
        <EditProduct prodId={item._id} onClose={() => setShowEdit(false)} />
      )}
    </CardContainer>
  );
};

export default ProductCard;

// Styled Components
const CardContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  background-color: white;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ProductId = styled.p`
  margin: 0 0 0.5rem;
  font-weight: bold;
  color: #007bff;
`;

const ImageContainer = styled.div`
  width: 100px;
  height: 100px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProductImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const ProductName = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
`;

const ProductCategory = styled.p`
  margin: 0 0 0.3rem;
  font-size: 1rem;
  font-style: italic;
  color: #555;
`;

const ProductDescription = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: #666;
`;

const ProductWeight = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1rem;
`;

const ProductPrice = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: bold;
`;

const ProductSold = styled.p`
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
`;

const ActionButton = styled.button`
  background-color: ${({ isDelete }) => (isDelete ? 'red' : '#007bff')};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: ${({ isDelete }) => (isDelete ? '#c82333' : '#0056b3')};
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }
`;

const ActionView = styled.button`
  background-color: rgb(38, 198, 249);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(0, 180, 249);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }
`;
