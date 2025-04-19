import { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { url } from "../../features/api";
import { useDispatch } from "react-redux";
import { addToCart } from "../../features/cartSlice";
import { LoadingSpinner } from "../LoadingAndError";

const Product = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${url}/products/find/${params.id}`);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    navigate("/cart");
  };

  return (
    <StyledProduct>
      <ProductContainer>
        {loading ? (
          <LoadingSpinner>Loading...</LoadingSpinner>
        ) : (
          <>
            <ImageContainer>
              <img src={product.image?.url} alt={product.name} />
            </ImageContainer>
            <ProductDetails>
              <h3>{product.name}</h3>
              <p>
                <span>Categoría:</span> {product.category}
              </p>
              <p>
                <span>Weight:</span> {product.weight}g
              </p>
              {product.description && (
                <p>
                  <span>Descripción:</span> {product.description}
                </p>
              )}
              <Price>${product.price?.toLocaleString()}</Price>
              <AddToCartButton onClick={() => handleAddToCart(product)}>
                Add to Cart
              </AddToCartButton>
            </ProductDetails>
          </>
        )}
      </ProductContainer>
    </StyledProduct>
  );
};

export default Product;

const StyledProduct = styled.div`
  margin: 3rem;
  display: flex;
  justify-content: center;
`;

const ProductContainer = styled.div`
  max-width: 500px;
  width: 100%;
  display: flex;
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
  border-radius: 5px;
  padding: 2rem;
  background-color: #fff;
`;

const ImageContainer = styled.div`
  flex: 1;
  img {
    width: 100%;
    border-radius: 5px;
  }
`;

const ProductDetails = styled.div`
  flex: 2;
  margin-left: 2rem;
  h3 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  p span {
    font-weight: bold;
  }
`;

const Price = styled.div`
  margin: 1rem 0;
  font-weight: bold;
  font-size: 1.5rem;
`;

const AddToCartButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;
