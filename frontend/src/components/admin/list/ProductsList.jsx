import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { productDelete } from "../../../features/productsSlice";
import ProductFilters from "./ListHelpers/ProductHelpers/ProductFilter";
import ProductCard from "./ListHelpers/ProductHelpers/ProductCard";
import Pagination from "./SummaryHelpers/pagination";
import styled from "styled-components";
import SimpleConfirmationModal from "../../SimpleModal";

const ProductsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.products);
  
  const [sortConfig, setSortConfig] = useState({ field: "", direction: "ascending" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemType, setItemType] = useState('producto'); // 'producto' o 'usuario'

  const filteredItems = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerCaseQuery) ||
      item.price.toString().includes(lowerCaseQuery) ||
      item._id.includes(lowerCaseQuery)
    );
  }, [items, searchQuery]);

  const sortedItems = useMemo(() => {
    if (!sortConfig.field) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const { field, direction } = sortConfig;
      const order = direction === "ascending" ? 1 : -1;

      if (typeof a[field] === 'string' && typeof b[field] === 'string') {
        return a[field].localeCompare(b[field]) * order;
      } else {
        return (a[field] - b[field]) * order; // Asumiendo que son números
      }
    });
  }, [filteredItems, sortConfig]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedItems, currentPage]);

  const handleDelete = (id, type) => {
    setItemToDelete(id);
    setItemType(type); // Establecer el tipo de elemento
    setShowModal(true); // Mostrar el modal de confirmación
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      dispatch(productDelete(itemToDelete)).catch((error) => {
        console.error("Error deleting item:", error);
        // Aquí podrías mostrar un mensaje de error en la interfaz
      });
    }
    setShowModal(false); // Cerrar el modal
  };

  return (
    <Container>
      <ProductFilters 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        sortConfig={sortConfig} 
        setSortConfig={setSortConfig}
        navigate={navigate}
      />
      <ProductContainer>
        {paginatedItems.length ? (
          paginatedItems.map((item) => (
            <ProductCard 
              key={item._id} 
              item={item} 
              handleDelete={() => handleDelete(item._id, 'producto')} // Pasar el tipo 'producto'
              navigate={navigate} 
            />
          ))
        ) : (
          <NoProducts>No products available.</NoProducts>
        )}
      </ProductContainer>
      <Pagination 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        totalNotes={filteredItems.length} 
        itemsPerPage={itemsPerPage} 
      />
      <SimpleConfirmationModal
        showModal={showModal}
        handleClose={() => setShowModal(false)}
        handleConfirm={confirmDelete}
        userName={
          itemToDelete
            ? filteredItems.find((item) => item._id === itemToDelete)?.name
            : ""
        }
        itemType={itemType} // Pasar el tipo de elemento al modal
      />
    </Container>
  );
};

export default ProductsList;

const Container = styled.div`
  width: 100%;
  margin-top: 2rem;
`;

const ProductContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoProducts = styled.p`
  margin: 0;
  text-align: center;
  font-style: italic;
  color: #888;
`;