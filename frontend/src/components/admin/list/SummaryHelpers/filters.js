// Filters.js
import React from "react";
import styled from "styled-components";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const Filters = ({
  sortField,
  setSortField,
  sortOrder,
  toggleSortOrder,
  filterOption,
  setFilterOption,
  specificDate,
  setSpecificDate,
  searchQuery,
  setSearchQuery,
}) => {
  const handleSortChange = (e) => {
    setSortField(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDateChange = (e) => {
    setSpecificDate(e.target.value);
  };

  return (
    <FiltersContainer>
      <FilterItem>
        <SortSelect onChange={handleSortChange} value={sortField}>
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
        </SortSelect>
        <SortButton onClick={toggleSortOrder}>
          {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
        </SortButton>
      </FilterItem>
      <FilterItem>
        <ShowSelect onChange={handleFilterChange} value={filterOption}>
          <option value="">Filter by</option>
          <option value="pendiente">Pending</option>
          <option value="pagado">Dispatched</option>
          <option value="entregado">Delivered</option>
          <option value="day">Notes of the day</option>
          <option value="createdOnDate">Created on specific date</option>
          <option value="paidOnDate">Paid on specific date</option>
          <option value="createdAndPaidOnDate">Created and paid on specific date</option>
        </ShowSelect>
      </FilterItem>
      <FilterItem>
        <DateInput
          type="date" // Cambiado a tipo "date"
          value={specificDate}
          onChange={handleDateChange}
        />
      </FilterItem>
      <FilterItem>
        <SearchInput
          type="text"
          placeholder="Search by name, amount, or folio"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </FilterItem>
    </FiltersContainer>
  );
};

export default Filters;

// Styled Components
const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: flex-start;
`;

const FilterItem = styled.div`
  flex: 1 1 120px;
  min-width: 150px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 600px) {
    flex: 1 1 100%;
  }
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const DateInput = styled.input`
  padding: 0.5rem 1rem;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const SortSelect = styled.select`
  padding: 0.5rem 1rem;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
`;

const SortButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #333;
  margin-left: 7px;

  &:hover {
    color: #007bff;
  }
`;

const ShowSelect = styled.select`
  padding: 0.5rem 1rem;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
`;

