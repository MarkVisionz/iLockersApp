import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import useMediaQuery from "../../../../utils/useMediaQuery";

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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleSortChange = (e) => {
    setSortField(e.target.value);
  };

  const handleFilterChange = (e) => {
    const newFilterOption = e.target.value;
    setFilterOption(newFilterOption);
    // Reset date when changing filter option, unless it's a date-related filter
    if (!newFilterOption.includes("Date") && newFilterOption !== "day") {
      setSpecificDate("");
    }
    // Establecer la fecha actual para "day"
    if (newFilterOption === "day") {
      const today = new Date().toISOString().split("T")[0];
      setSpecificDate(today);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDateChange = (e) => {
    setSpecificDate(e.target.value);
  };

  const toggleFilters = () => {
    setShowMobileFilters((prev) => !prev);
  };

  // Establecer la fecha actual automáticamente cuando se selecciona "day"
  useEffect(() => {
    if (filterOption === "day") {
      const today = new Date().toISOString().split("T")[0];
      setSpecificDate(today);
    }
  }, [filterOption, setSpecificDate]);

  return (
    <FiltersContainer>
      {/* Search Bar - Always visible */}
      <SearchFilterItem>
        <SearchWrapper>
          <SearchIcon aria-hidden="true" />
          <SearchInput
            type="text"
            placeholder="Search by name, amount, or folio"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search notes"
          />
        </SearchWrapper>

        {isMobile && (
          <ToggleFiltersButton
            onClick={toggleFilters}
            aria-expanded={showMobileFilters}
            aria-controls="mobile-filters"
          >
            {showMobileFilters ? "Hide filters" : "Show filters"}
          </ToggleFiltersButton>
        )}
      </SearchFilterItem>

      {/* Other filters - Animated for mobile */}
      <AnimatePresence>
        {(!isMobile || showMobileFilters) && (
          <MotionFiltersWrapper
            id="mobile-filters"
            key="filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <FiltersGrid>
              {/* Filter Options */}
              <FilterItem>
                <Label htmlFor="filter-select">Filter by:</Label>
                <ShowSelect
                  id="filter-select"
                  onChange={handleFilterChange}
                  value={filterOption}
                  aria-label="Filter notes by"
                >
                  <option value="">All</option>
                  <option value="pendiente">Pending</option>
                  <option value="pagado">Dispatched</option>
                  <option value="entregado">Delivered</option>
                  <option value="day">Notes of the day</option>
                  <option value="createdOnDate">Created on specific date</option>
                  <option value="paidOnDate">Paid on specific date</option>
                  <option value="createdAndPaidOnDate">
                    Created and paid on specific date
                  </option>
                </ShowSelect>
              </FilterItem>

              {/* Date Picker - Conditionally rendered only for Date-related filters */}
              {filterOption.includes("Date") && (
                <FilterItem>
                  <Label htmlFor="date-input">Specific Date:</Label>
                  <DateInput
                    id="date-input"
                    type="date"
                    value={specificDate}
                    onChange={handleDateChange}
                    aria-label="Select date"
                    required={filterOption.includes("Date")}
                  />
                </FilterItem>
              )}

              {/* Sort Options */}
              <FilterItem>
                <Label htmlFor="sort-select">Sort by:</Label>
                <SortWrapper>
                  <SortSelect
                    id="sort-select"
                    onChange={handleSortChange}
                    value={sortField}
                    aria-label="Sort notes by"
                  >
                    <option value="">Select</option>
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                  </SortSelect>
                  <SortButton
                    onClick={toggleSortOrder}
                    aria-label={`Sort ${
                      sortOrder === "asc" ? "ascending" : "descending"
                    }`}
                  >
                    {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
                  </SortButton>
                </SortWrapper>
              </FilterItem>
            </FiltersGrid>
          </MotionFiltersWrapper>
        )}
      </AnimatePresence>
    </FiltersContainer>
  );
};

export default Filters;

// Styled Components
const FiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);

  @media (min-width: 769px) {
    padding: 1.5rem;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
`;

const SearchFilterItem = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MotionFiltersWrapper = styled(motion.div)`
  width: 100%;
  overflow: hidden;
`;

const FiltersGrid = styled.div`
  display: grid;
  gap: 1rem;
  width: 100%;

  @media (min-width: 769px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    align-items: center;
    gap: 1.5rem;
  }
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;

  @media (min-width: 769px) {
    flex: 1 1 200px;
  }
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
`;

const SearchWrapper = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  transition: all 0.3s ease;

  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const SearchIcon = styled(IoSearch)`
  position: absolute;
  top: 50%;
  left: 0.8rem;
  transform: translateY(-50%);
  font-size: 1rem;
  color: #aaa;
`;

const ShowSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;

  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const DateInput = styled.input`
  padding: 0.5rem 1rem;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  transition: all 0.3s ease;

  &:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const SortWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
`;

const SortSelect = styled(ShowSelect)``;

const SortButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;

  &:hover {
    background-color: #0056b3;
  }
`;

const ToggleFiltersButton = styled.button`
  padding: 0.5rem;
  font-size: 0.9rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;