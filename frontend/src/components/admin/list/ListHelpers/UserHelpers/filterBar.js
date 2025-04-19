import React, { useState } from "react";
import styled from "styled-components";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import useMediaQuery from "../../../../../utils/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";

const FilterBar = ({
  searchQuery,
  setSearchQuery,
  sortConfig,
  setSortConfig,
  onlyShow,
  setOnlyShow,
}) => {
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleSortChange = (e) => {
    setSortConfig({ ...sortConfig, field: e.target.value });
  };

  const toggleSortOrder = () => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const handleShowChange = (e) => {
    setOnlyShow(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleFilters = () => {
    setShowMobileFilters((prev) => !prev);
  };

  return (
    <FiltersContainer>
      {/* Search Bar - Siempre visible */}
      <SearchFilterItem>
        <SearchWrapper>
          <SearchIcon aria-hidden="true" />
          <SearchInput
            type="text"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search users"
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

      {/* Otros filtros */}
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
              <FilterItem>
                <Label htmlFor="filter-select">Filter:</Label>
                <ShowSelect 
                  id="filter-select"
                  onChange={handleShowChange} 
                  value={onlyShow}
                  aria-label="Filter users"
                >
                  <option value="">All</option>
                  <option value="newUsers">New Users</option>
                </ShowSelect>
              </FilterItem>

              <FilterItem>
                <Label htmlFor="sort-select">Sort by:</Label>
                <SortWrapper>
                  <SortSelect 
                    id="sort-select"
                    onChange={handleSortChange} 
                    value={sortConfig.field}
                    aria-label="Sort users by"
                  >
                    <option value="">Select</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="isAdmin">Role</option>
                    <option value="createdAt">Creation Date</option>
                  </SortSelect>
                  <SortButton 
                    onClick={toggleSortOrder}
                    aria-label={`Sort ${sortConfig.direction === "ascending" ? "descending" : "ascending"}`}
                  >
                    {sortConfig.direction === "ascending" ? (
                      <FaArrowUp />
                    ) : (
                      <FaArrowDown />
                    )}
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

export default FilterBar;

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

  @media (min-width: 601px) {
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

  @media (min-width: 601px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    align-items: center;
  }
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;

  @media (min-width: 601px) {
    flex: 1 1 200px;
  }
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
`;

const SortWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
`;

const SortSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  flex: 1;
  transition: border-color 0.3s ease;
  width: 100%;

  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const SortButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;

  &:hover {
    background-color: #0056b3;
  }
`;

const ShowSelect = styled(SortSelect)``;

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
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #007bff;
    outline: none;
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

const ToggleFiltersButton = styled.button`
  padding: 0.5rem;
  font-size: 0.9rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  @media (min-width: 601px) {
    display: none;
  }
`;