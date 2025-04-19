import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { productDelete } from "../../../features/productsSlice";
import ProductFilters from "./ListHelpers/ProductHelpers/ProductFilter";
import ProductCard from "./ListHelpers/ProductHelpers/ProductCard";
import Pagination from "./SummaryHelpers/pagination";
import styled from "styled-components";
import SimpleConfirmationModal from "../../SimpleModal";
import { toast } from "react-toastify";

const ProductsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.products);

  const [sortConfig, setSortConfig] = useState({
    field: "",
    direction: "ascending",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemType, setItemType] = useState("producto");

  const filteredItems = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return items.filter((item) =>
      [item.name, item.price, item.category, item.description, item._id]
        .filter(Boolean)
        .some((val) =>
          val.toString().toLowerCase().includes(lowerCaseQuery)
        )
    );
  }, [items, searchQuery]);

  const sortedItems = useMemo(() => {
    if (!sortConfig.field) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const { field, direction } = sortConfig;
      const order = direction === "ascending" ? 1 : -1;

      if (typeof a[field] === "string" && typeof b[field] === "string") {
        return a[field].localeCompare(b[field]) * order;
      } else {
        return (a[field] - b[field]) * order;
      }
    });
  }, [filteredItems, sortConfig]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedItems, currentPage]);

  const handleDelete = (id, type) => {
    setItemToDelete(id);
    setItemType(type);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete === "all") {
      await Promise.all(
        filteredItems.map((item) =>
          dispatch(productDelete({ id: item._id, silent: true }))
        )
      );
      toast.success("Todos los productos han sido eliminados.");
    } else if (itemToDelete) {
      dispatch(productDelete({ id: itemToDelete }));
    }
    setShowModal(false);
  };

  const handleDeleteAll = () => {
    if (filteredItems.length === 0) {
      toast.info("No hay productos para eliminar.");
      return;
    }
    setItemToDelete("all");
    setItemType("producto");
    setShowModal(true);
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
      {filteredItems.length > 0 && (
        <DeleteAllButton onClick={handleDeleteAll}>
          Borrar todos los productos
        </DeleteAllButton>
      )}

      <ProductContainer>
        {paginatedItems.length ? (
          paginatedItems.map((item) => (
            <ProductCard
              key={item._id}
              item={item}
              handleDelete={() => handleDelete(item._id, "producto")}
              navigate={navigate}
            />
          ))
        ) : (
          <NoProducts>No hay productos disponibles.</NoProducts>
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
          itemToDelete === "all"
            ? "todos los productos"
            : itemToDelete
            ? filteredItems.find((item) => item._id === itemToDelete)?.name
            : ""
        }
        itemType={itemType}
      />
    </Container>
  );
};

export default ProductsList;

const Container = styled.div`
  width: 100%;
  margin-top: 1rem;
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

const DeleteAllButton = styled.button`
  margin: 1rem auto;
  background-color: #dc3545;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;

  &:hover {
    background-color: #b02a37;
  }
`;
