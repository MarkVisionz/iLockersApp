import React from "react";
import styled from "styled-components";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";

const ProductFilters = ({
  searchQuery,
  setSearchQuery,
  sortConfig,
  setSortConfig,
  navigate,
}) => {
  const handleSortChange = (e) => {
    setSortConfig((prevSortField) => ({
      ...prevSortField,
      field: e.target.value,
    }));
  };

  const toggleSortOrder = () => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  return (
    <FiltersContainer>
      {/* Sort Options */}
      <FilterItem>
        <Label>Sort by:</Label>
        <SortWrapper>
          <SortSelect onChange={handleSortChange} value={sortConfig.field}>
            <option value="">Sort by</option>
            <option value="name">Name</option>
            <option value="weight">Weight</option>
            <option value="price">Price</option>
            <option value="sold">Most Sold</option>
          </SortSelect>
          <SortButton onClick={toggleSortOrder}>
            {sortConfig.direction === "ascending" ? (
              <FaArrowUp />
            ) : (
              <FaArrowDown />
            )}
          </SortButton>
        </SortWrapper>
      </FilterItem>

      {/* Search Input */}
      <FilterItem>
        <Label>Search:</Label>
        <SearchWrapper>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Search by name, price, or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* Create Button */}
          <PrimaryButton
            onClick={() => navigate("/admin/products/create-product")}
          >
            Create
          </PrimaryButton>
        </SearchWrapper>
      </FilterItem>
    </FiltersContainer>
  );
};

export default ProductFilters;

// Styled Components
const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: bold;
  color: #333;
`;

const FilterItem = styled.div`
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const SortWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SearchIcon = styled(IoSearch)`
  position: absolute;
  top: 50%;
  left: 0.8rem;
  transform: translateY(-50%);
  font-size: 1.2rem;
  color: #aaa;

  @media (max-width: 600px) {
    font-size: 1rem;
  }
`;

const SortSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  flex: 1;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #007bff;
    outline: none;
  }

  @media (max-width: 600px) {
    width: 100%;
    font-size: 0.9rem;
  }
`;

const SortButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  @media (max-width: 600px) {
    width: 100%;
    font-size: 0.9rem;
    padding: 0.5rem;
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  padding-left: 2.5rem; /* To account for the icon */
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #007bff;
    outline: none;
  }

  @media (max-width: 600px) {
    font-size: 0.9rem;
  }
`;

const PrimaryButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 600px) {
    width: 100%;
    font-size: 0.9rem;
    padding: 0.5rem;
  }
`;
