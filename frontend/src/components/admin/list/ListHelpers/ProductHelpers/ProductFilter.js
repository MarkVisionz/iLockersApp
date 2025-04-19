import React, { useState } from "react";
import styled from "styled-components";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import useMediaQuery from "../../../../../utils/useMediaQuery";

const ProductFilters = ({
  searchQuery,
  setSearchQuery,
  sortConfig,
  setSortConfig,
  navigate,
  hideCreateButton = false,
}) => {
  const isMobile = useMediaQuery("(max-width: 600px)");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  const toggleFilters = () => {
    setShowMobileFilters((prev) => !prev);
  };

  return (
    <FiltersContainer>
      {/* Search Bar - Always visible */}
      <SearchFilterItem>
        <SearchWrapper>
          <SearchIcon aria-hidden="true" />
          <SearchInput
            type="text"
            placeholder="Nombre, precio, categoría o ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar productos"
          />
        </SearchWrapper>

        {isMobile && (
          <ToggleFiltersButton
            onClick={toggleFilters}
            aria-expanded={showMobileFilters}
            aria-controls="mobile-filters"
          >
            {showMobileFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </ToggleFiltersButton>
        )}

        {!hideCreateButton && (
          <CreateButton
            onClick={() => navigate("/admin/products/create-product")}
            aria-label="Crear nuevo producto"
          >
            Crear
          </CreateButton>
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
              {/* Category filter */}
              <FilterItem>
                <Label htmlFor="category-select">Categoría:</Label>
                <SortSelect
                  id="category-select"
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value === "all" ? "" : e.target.value
                    )
                  }
                  value={searchQuery === "" ? "all" : searchQuery}
                  aria-label="Filtrar por categoría"
                >
                  <option value="all">Todas</option>
                  <option value="ropa común">Ropa común</option>
                  <option value="ropa de cama">Ropa de cama</option>
                </SortSelect>
              </FilterItem>

              {/* Sort filter */}
              <FilterItem>
                <Label htmlFor="sort-select">Ordenar por:</Label>
                <SortWrapper>
                  <SortSelect
                    id="sort-select"
                    onChange={handleSortChange}
                    value={sortConfig.field}
                    aria-label="Ordenar productos por"
                  >
                    <option value="">Ordenar por</option>
                    <option value="name">Nombre</option>
                    <option value="weight">Peso</option>
                    <option value="price">Precio</option>
                    <option value="sold">Más vendidos</option>
                    <option value="category">Categoría</option>
                  </SortSelect>
                  <SortButton
                    onClick={toggleSortOrder}
                    aria-label={`Orden ${
                      sortConfig.direction === "ascending"
                        ? "ascendente"
                        : "descendente"
                    }`}
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

export default ProductFilters;

// Styled Components
const FiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;

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

  @media (min-width: 601px) {
    flex: 1 1 300px;
    max-width: auto;
    flex-direction: row;
    align-items: center;
  }
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
    gap: 1.5rem;
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
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
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
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;

  &:hover {
    background-color: #0056b3;
  }

  &:focus {
    outline: 2px solid #0056b3;
    outline-offset: 2px;
  }
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

const ToggleFiltersButton = styled.button`
  padding: 0.5rem;
  font-size: 0.9rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  @media (min-width: 601px) {
    display: none;
  }
`;

const CreateButton = styled.button`
  background:#0056b3;
  color: white;
  border: none;
  padding: 0.5rem 3rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background-color: #007bff;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;
