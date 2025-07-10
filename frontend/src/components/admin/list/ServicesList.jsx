import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchServices,
  deleteService,
  clearAllServicesThunk,
  resetServices,
} from "../../../features/servicesSlice";
import { ErrorMessage, LoadingSpinner } from "../../LoadingAndError";
import FilterBar from "./ListHelpers/ServiceHelper/FilterBar";
import ServiceCard from "./ListHelpers/ServiceHelper/ServiceCard";
import Pagination from "./SummaryHelpers/pagination";
import SimpleConfirmationModal from "../../SimpleModal";

const ServicesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { businessId, activeTab } = useOutletContext();
  const { businesses, user, isAdmin } = useSelector((state) => state.auth);
  const { items: services, status, error } = useSelector((state) => state.services);

  const effectiveBusinessId = isAdmin ? null : businessId;

  const [loading, setLoading] = useState({ action: false });
  const [sortConfig, setSortConfig] = useState({ field: "", direction: "ascending" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemType, setItemType] = useState("servicio");
  const itemsPerPage = 5;

  useEffect(() => {
    console.log("ServicesList useEffect:", {
      status,
      activeTab,
      effectiveBusinessId,
      businessId,
      businesses: businesses.map((b) => b._id),
    });

    if (!effectiveBusinessId && !isAdmin) {
      console.warn("No se proporcionó un businessId válido");
      return;
    }

    if (activeTab === "services") {
      console.log(`Despachando resetServices y fetchServices para businessId: ${effectiveBusinessId}`);
      dispatch(resetServices());
      dispatch(fetchServices({ businessId: effectiveBusinessId })).then((action) => {
        if (fetchServices.fulfilled.match(action)) {
          console.log("Servicios cargados en ServicesList:", action.payload);
        } else {
          console.error("Error al cargar servicios:", action.payload);
        }
      });
    }
  }, [dispatch, effectiveBusinessId, activeTab]);

  const filteredServices = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = services.filter(
      (service) =>
        (!effectiveBusinessId || String(service.businessId) === String(effectiveBusinessId)) &&
        [service.name, service.type, service.price?.toString(), service._id, service.category]
          .filter(Boolean)
          .some((val) => val.toString().toLowerCase().includes(lowerCaseQuery))
    );
    console.log(`Filtered ${filtered.length} services for businessId: ${effectiveBusinessId}`, {
      allServices: services.length,
      filteredServices: filtered.map((service) => ({
        _id: service._id,
        name: service.name,
        businessId: service.businessId,
      })),
    });
    return filtered;
  }, [services, searchQuery, effectiveBusinessId]);

  const sortedServices = useMemo(() => {
    if (!sortConfig.field) return filteredServices;

    return [...filteredServices].sort((a, b) => {
      const { field, direction } = sortConfig;
      const order = direction === "ascending" ? 1 : -1;

      if (field === "name" || field === "type" || field === "category") {
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
        await dispatch(clearAllServicesThunk({ businessId: effectiveBusinessId })).unwrap();
        toast.success("Todos los servicios eliminados exitosamente");
      } else if (itemToDelete) {
        await dispatch(deleteService({ id: itemToDelete, businessId: effectiveBusinessId })).unwrap();
        toast.success("Servicio eliminado exitosamente");
      }
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast.error(err.message || "Error al eliminar el servicio.");
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

  if (!isAdmin && !effectiveBusinessId) {
    return (
      <Container>
        <ErrorMessage message="No se seleccionó un negocio válido" />
      </Container>
    );
  }

  if (status === "loading") {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  if (status === "rejected") {
    return (
      <Container>
        <ErrorMessage message={error || "Error al cargar servicios"} />
      </Container>
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
        businessId={effectiveBusinessId}
      />

      {filteredServices.length > 0 && !isAdmin && (
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
              businessId={effectiveBusinessId}
              loading={loading.action}
              handleDelete={() => handleDelete(service._id, "servicio")}
            />
          ))
        ) : (
          <NoDataMessage>
            <p>Tu negocio está listo, pero aún no tienes servicios registrados.</p>
            <CreateNoteButton
              onClick={() => navigate(`/owner/services/${effectiveBusinessId}/create`)}
            >
              Crear tu primer servicio
            </CreateNoteButton>
          </NoDataMessage>
        )}
      </ServicesContainer>

      {sortedServices.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalNotes={sortedServices.length}
          itemsPerPage={itemsPerPage}
        />
      )}

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

const NoDataMessage = styled.div`
  text-align: center;
  color: #666;
  margin: 2rem 0;
`;

const CreateNoteButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  &:hover {
    background-color: #0056b3;
  }
`;

export default ServicesList;