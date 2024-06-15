import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { productDelete } from "../../../features/productsSlice";
import EditProduct from "../EditProduct";
import { PrimaryButton } from "../CommonStyled";

const ProductsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.products);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setFilteredItems(
      items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.price.toString().includes(searchQuery) ||
          item._id.includes(searchQuery)
      )
    );
  }, [items, searchQuery]);

  const handleDelete = (id) => {
    dispatch(productDelete(id));
    console.log("Deleting");
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSortArrow = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ↑" : " ↓";
    }
    return "";
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    return (
      <Pagination>
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <PageNumber>{currentPage}</PageNumber>
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={
            currentPage === Math.ceil(filteredItems.length / itemsPerPage)
          }
        >
          Next
        </Button>
      </Pagination>
    );
  };

  const handleSortChange = (e) => {
    const selectedSort = e.target.value;
    if (
      selectedSort === "name" ||
      selectedSort === "weight" ||
      selectedSort === "price" ||
      selectedSort === "sold"
    ) {
      handleSort(selectedSort);
    }
  };

  return (
    <Container>
      <FiltersContainer>
        <SearchInput
          type="text"
          placeholder="Search by name, price, or ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SortContainer>
          <SortLabel></SortLabel>
          <SortSelect onChange={handleSortChange}>
          <option value="">Sort by</option>
            <option value="name">Name</option>
            <option value="weight">Weight</option>
            <option value="price">Price</option>
            <option value="sold">Most Sold</option>
          </SortSelect>
        </SortContainer>
        <PrimaryButton
          onClick={() => navigate("/admin/products/create-product")}
        >
          Create
        </PrimaryButton>
      </FiltersContainer>

      <ProductContainer>
        {paginatedItems.length ? (
          paginatedItems.map((item) => (
            <ProductCard key={item._id}>
              <ProductInfo onClick={() => navigate(`/product/${item._id}`)}>
                <ProductId>ID: {item._id}</ProductId>
                <ImageContainer>
                  <ProductImage src={item.image.url} alt={item.name} />
                </ImageContainer>
                <ProductName>Name: {item.name}</ProductName>
                <ProductWeight>Weight: {item.weight}g</ProductWeight>
                <ProductPrice>
                  Price: ${item.price.toLocaleString()}
                </ProductPrice>
                <ProductSold>Sold: {item.sold}</ProductSold>
              </ProductInfo>
              <Actions>
                <DeleteBtn onClick={() => handleDelete(item._id)}>
                  Delete
                </DeleteBtn>
                <EditProduct prodId={item._id} />
                <ViewBtn onClick={() => navigate(`/product/${item._id}`)}>
                  View
                </ViewBtn>
              </Actions>
            </ProductCard>
          ))
        ) : (
          <NoProducts>No products available.</NoProducts>
        )}
      </ProductContainer>
      {renderPagination()}
    </Container>
  );
};

export default ProductsList;

const Container = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  width: 100%;
  max-width: 300px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto; /* Mueve el SortContainer hacia la derecha */
`;

const SortLabel = styled.label`
  margin-right: 0.5rem;
`;

const SortSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 1rem; /* Espacio entre el label y el dropdown */
`;

const ProductContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ProductCard = styled.div`
  flex: 1 1 calc(50% - 1rem); /* 50% width minus gap size */
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductId = styled.p`
  margin: 0 0 0.5rem;
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
  object-fit: cover;
`;

const ProductName = styled.p`
  margin: 0 0 0.5rem;
`;

const ProductWeight = styled.p`
  margin: 0 0 0.5rem;
`;

const ProductPrice = styled.p`
  margin: 0 0 0.5rem;
`;

const ProductSold = styled.p`
  margin: 0 0 0.5rem;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const DeleteBtn = styled.button`
  background-color: rgb(255, 77, 73);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: rgb(200, 50, 50);
  }
`;

const ViewBtn = styled.button`
    background-color: rgb(114, 225, 40);
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;

    &:hover {
      background-color: rgb(100, 200, 30);
    }
  `;

const NoProducts = styled.p`
    margin: 0;
    text-align: center;
    font-style: italic;
    color: #888;
  `;

const Pagination = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1rem;
  `;

const Button = styled.button`
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 3px;
    cursor: pointer;

    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background-color: #0056b3;
    }
  `;

const PageNumber = styled.span`
    margin: 0 1rem;
    font-size: 1.2rem;
    font-weight: bold;
  `;



