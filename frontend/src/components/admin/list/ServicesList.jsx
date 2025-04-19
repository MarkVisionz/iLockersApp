import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchServices,
  deleteService,
  clearAllServicesThunk,
} from "../../../features/servicesSlice";
import { ErrorMessage, LoadingSpinner } from "../../LoadingAndError";
import FilterBar from "./ListHelpers/ServiceHelper/FilterBar";
import ServiceCard from "./ListHelpers/ServiceHelper/ServiceCard";
import Pagination from "./SummaryHelpers/pagination";
import SimpleConfirmationModal from "../../SimpleModal";

const ServicesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const services = useSelector((state) => state.services.items);
  const status = useSelector((state) => state.services.status);
  const error = useSelector((state) => state.services.error);

  const [loading, setLoading] = useState({ action: false });
  const [sortConfig, setSortConfig] = useState({ field: "", direction: "ascending" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemType, setItemType] = useState("servicio");
  const itemsPerPage = 5;

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchServices());
    }
  }, [dispatch, status]);

  const filteredServices = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return services.filter((service) =>
      [service.name, service.type, service.price?.toString(), service._id]
        .filter(Boolean)
        .some((val) => val.toString().toLowerCase().includes(lowerCaseQuery))
    );
  }, [services, searchQuery]);

  const sortedServices = useMemo(() => {
    if (!sortConfig.field) return filteredServices;

    return [...filteredServices].sort((a, b) => {
      const { field, direction } = sortConfig;
      const order = direction === "ascending" ? 1 : -1;

      if (field === "name" || field === "type") {
        return a[field].localeCompare(b[field]) * order;
      } else if (field === "price") {
        const priceA = a.type === "simple" ? a.price : Math.min(...(a.sizes?.map((s) => s.price) || [0])) || 0;
        const priceB = b.type === "simple" ? b.price : Math.min(...(b.sizes?.map((s) => s.price) || [0])) || 0;
        return (priceA - priceB) * order;
      }
      return 0;
    });
  }, [filteredServices, sortConfig]);

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedServices.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedServices, currentPage]);

  const handleDelete = (id, type) => {
    if (!id) {
      toast.error("ID del servicio no válido");
      return;
    }
    setItemToDelete(id);
    setItemType(type);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    setLoading((prev) => ({ ...prev, action: true }));
    try {
      if (itemToDelete === "all") {
        await dispatch(clearAllServicesThunk()).unwrap();
      } else if (itemToDelete) {
        await dispatch(deleteService(itemToDelete));
      }
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast.error("Error al eliminar el servicio.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
      setShowModal(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteAll = () => {
    if (filteredServices.length === 0) {
      toast.info("No hay servicios para eliminar.");
      return;
    }
    setItemToDelete("all");
    setItemType("servicio");
    setShowModal(true);
  };

  if (status === "loading") {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      {error && <ErrorMessage message={error} />}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        navigate={navigate}
      />

      {filteredServices.length > 0 && (
        <DeleteAllButton onClick={handleDeleteAll}>
          Borrar todos los servicios
        </DeleteAllButton>
      )}

      <ServicesContainer>
        {paginatedServices.length ? (
          paginatedServices.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              loading={loading.action}
              handleDelete={() => handleDelete(service._id, "servicio")}
            />
          ))
        ) : (
          <EmptyState>No hay servicios disponibles.</EmptyState>
        )}
      </ServicesContainer>

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalNotes={filteredServices.length}
        itemsPerPage={itemsPerPage}
      />

      <SimpleConfirmationModal
        showModal={showModal}
        handleClose={() => setShowModal(false)}
        handleConfirm={confirmDelete}
        userName={
          itemToDelete === "all"
            ? "todos los servicios"
            : itemToDelete
            ? filteredServices.find((service) => service._id === itemToDelete)?.name
            : ""
        }
        itemType={itemType}
      />
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  margin-top: 1rem;
  font-family: "Poppins", sans-serif;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const ServicesContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled.p`
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
  font-family: "Poppins", sans-serif;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #b02a37;
  }
`;

export default ServicesList;
