import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import moment from "moment";
import { notesFetch, notesEdit, resetError } from "../../features/notesSlice";
import { toast } from "react-toastify";
import { FaEye, FaArrowLeft, FaSort, FaSync } from "react-icons/fa";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import socket from "../../features/socket";

const LaundryStatusScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { businessId } = useParams();
  const {
    items = [],
    status,
    editStatus,
    error,
  } = useSelector((state) => state.notes);
  const { businesses, isBusinessOwner } = useSelector((state) => state.auth);
  const [noteLoading, setNoteLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const prevItemsRef = useRef(items);

  // Validate businessId and fetch notes
  useEffect(() => {
    if (!businessId || !businesses.some((b) => b._id === businessId)) {
      console.warn("Invalid or unauthorized businessId:", businessId);
      if (isBusinessOwner && businesses.length === 0) {
        navigate("/setup-business");
      } else if (businesses.length > 0) {
        navigate(`/laundry-status/${businesses[0]._id}`);
      }
      return;
    }

    console.log(`Despachando notesFetch para businessId: ${businessId}`);
    dispatch(notesFetch({ businessId }));
  }, [dispatch, businessId, navigate, businesses, isBusinessOwner]);

  // Detect changes in items for notifications
  useEffect(() => {
    const prevItems = prevItemsRef.current;
    const prevIds = new Set(prevItems.map((item) => item._id));
    const currentIds = new Set(items.map((item) => item._id));

    // Detect new notes
    const newNotes = items.filter((item) => !prevIds.has(item._id));
    if (newNotes.length > 0) {
      newNotes.forEach((note) => {
        if (note.businessId === businessId) {
          toast.info(`Nueva nota creada: ${note.folio}`);
        }
      });
    }

    // Detect deleted notes
    const deletedNotes = prevItems.filter((item) => !currentIds.has(item._id));
    if (deletedNotes.length > 0) {
      deletedNotes.forEach((note) => {
        if (note.businessId === businessId) {
          toast.info(`Nota eliminada: ${note.folio}`);
        }
      });
    }

    // Detect updated notes
    items.forEach((current) => {
      const prev = prevItems.find((item) => item._id === current._id);
      if (prev && current.businessId === businessId) {
        if (current.cleaning_status !== prev.cleaning_status) {
          toast.info(`Nota ${current.folio} actualizada a ${
            current.cleaning_status === "sucia" ? "Sucia" :
            current.cleaning_status === "lavado" ? "Lavado" :
            current.cleaning_status === "listo_para_entregar" ? "Listo para Entregar" : "Entregado"
          }`);
        }
      }
    });

    prevItemsRef.current = items;
  }, [items, businessId]);

  // Debug duplicate notes
  useEffect(() => {
    const ids = items.map((note) => note._id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) {
      console.warn("Duplicate note IDs detected:", duplicates);
    }
  }, [items]);

  // Memoize notes by status with search and sort
  const notesByStatus = useMemo(() => {
    const filteredItems = items.filter(
      (note) => note.cleaning_status !== "entregado" &&
      [
        note.folio?.toLowerCase() || "",
        note.name?.toLowerCase() || "",
      ].some((field) => field.includes(searchQuery.toLowerCase()))
    );

    const sortNotes = (notes) => {
      return [...notes].sort((a, b) => {
        let aField = sortField === "date" ? moment(a.date) : a[sortField];
        let bField = sortField === "date" ? moment(b.date) : b[sortField];

        if (sortField === "name" || sortField === "folio") {
          aField = aField?.toLowerCase() || "";
          bField = bField?.toLowerCase() || "";
        }

        if (!aField && !bField) return 0;
        if (!aField) return 1;
        if (!bField) return -1;

        return sortOrder === "desc" ? (aField < bField ? 1 : -1) : (aField > bField ? 1 : -1);
      });
    };

    return {
      sucia: sortNotes(filteredItems.filter((note) => note.cleaning_status === "sucia")),
      lavado: sortNotes(filteredItems.filter((note) => note.cleaning_status === "lavado")),
      listo_para_entregar: sortNotes(filteredItems.filter((note) => note.cleaning_status === "listo_para_entregar")),
    };
  }, [items, searchQuery, sortField, sortOrder]);

  const handleChangeStatus = async (note, newStatus) => {
    if (note.cleaning_status === newStatus) return;
    if (newStatus === "entregado") {
      toast.error("El cambio a 'Entregado' debe realizarse en la parte de administración.");
      return;
    }

    console.log("Changing cleaning_status:", {
      folio: note.folio,
      note_status: note.note_status,
      currentCleaningStatus: note.cleaning_status,
      newCleaningStatus: newStatus,
    });

    setNoteLoading((prev) => ({ ...prev, [note._id]: true }));

    try {
      const payload = {
        _id: note._id,
        businessId,
        cleaning_status: newStatus,
      };
      await dispatch(notesEdit(payload)).unwrap();
      toast.success(
        `Estado actualizado a ${
          newStatus === "lavado" ? "Lavado" : "Listo para Entregar"
        }`
      );
    } catch (error) {
      console.error("Error updating cleaning_status:", error);
      toast.error(
        error.message || "Error al actualizar el estado. Intenta de nuevo."
      );
    } finally {
      setNoteLoading((prev) => ({ ...prev, [note._id]: false }));
    }
  };

  const handleRetry = () => {
    console.log(`Reintentando carga de datos para businessId: ${businessId}`);
    dispatch(resetError());
    dispatch(notesFetch({ businessId }));
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const businessName = businesses.find((b) => b._id === businessId)?.name || "Negocio";

  if (status === "rejected") {
    return (
      <ErrorContainer>
        <ErrorMessage message={error || "Error al cargar notas"} />
        <RetryButton onClick={handleRetry}>
          <FaSync /> Reintentar
        </RetryButton>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          Estado de Notas - {businessName}
          <SocketStatus status={socket.connected ? "connected" : "disconnected"}>
            {socket.connected ? "🟢 Conectado" : "🔴 Desconectado"}
          </SocketStatus>
        </Title>
        <HeaderControls>
          <SearchInput
            type="text"
            placeholder="Buscar por folio o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SortContainer>
            <SortSelect
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
            >
              <option value="date">Fecha</option>
              <option value="folio">Folio</option>
              <option value="name">Nombre</option>
            </SortSelect>
            <SortButton onClick={toggleSortOrder} title={sortOrder === "asc" ? "Ordenar descendente" : "Ordenar ascendente"}>
              <FaSort />
              {sortOrder === "asc" ? "↑" : "↓"}
            </SortButton>
          </SortContainer>
          <BackButton onClick={() => navigate(`/owner/local-summary/${businessId}`)}>
            <FaArrowLeft /> Volver a Resumen
          </BackButton>
        </HeaderControls>
      </Header>
      {status === "pending" && !items.length ? (
        <LoadingContainer>
          <LoadingSpinner message="Cargando notas..." />
        </LoadingContainer>
      ) : (
        <ColumnsContainer>
          {/* SUCIA */}
          <Column $status="sucia">
            <CategoryTitle>Sucia ({notesByStatus.sucia.length})</CategoryTitle>
            {notesByStatus.sucia.length ? (
              notesByStatus.sucia.map((note) => (
                <NoteBox key={note._id}>
                  <BadgeContainer>
                    <CleaningBadge $status="sucia">Sucia</CleaningBadge>
                  </BadgeContainer>
                  <NoteInfo>
                    <p>
                      <strong>Folio:</strong> {note.folio}
                    </p>
                    <p>
                      <strong>Nombre:</strong> {note.name}
                    </p>
                    <p>
                      <strong>Total:</strong> ${note.total.toLocaleString("es-MX")}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      {note.note_status === "pagado" ? "Pagado" : "Pendiente"}
                    </p>
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {moment(note.date).format("YYYY-MM-DD HH:mm")}
                    </p>
                    {note.abonos.length > 0 && (
                      <p>
                        <strong>Abono:</strong> $
                        {note.abonos.reduce((sum, a) => sum + a.amount, 0).toLocaleString("es-MX")} (
                        {note.abonos[0].method.charAt(0).toUpperCase() + note.abonos[0].method.slice(1)})
                      </p>
                    )}
                  </NoteInfo>
                  <ButtonContainer>
                    <StatusButton
                      onClick={() => handleChangeStatus(note, "lavado")}
                      disabled={noteLoading[note._id] || editStatus === "pending"}
                      title="Pasar la ropa a Lavado"
                    >
                      {noteLoading[note._id] ? <Spinner /> : "Pasar a Lavado"}
                    </StatusButton>
                    <DetailButton
                      onClick={() => navigate(`/note/${note._id}/${businessId}`)}
                      disabled={noteLoading[note._id] || editStatus === "pending"}
                      title="Ver detalles de la nota"
                    >
                      <FaEye /> Ver Detalles
                    </DetailButton>
                  </ButtonContainer>
                </NoteBox>
              ))
            ) : (
              <EmptyMessage>No hay ropa sucia.</EmptyMessage>
            )}
          </Column>

          {/* LAVADO */}
          <Column $status="lavado">
            <CategoryTitle>Lavado/Secado ({notesByStatus.lavado.length})</CategoryTitle>
            {notesByStatus.lavado.length ? (
              notesByStatus.lavado.map((note) => (
                <NoteBox key={note._id}>
                  <BadgeContainer>
                    <CleaningBadge $status="lavado">Lavado</CleaningBadge>
                  </BadgeContainer>
                  <NoteInfo>
                    <p>
                      <strong>Folio:</strong> {note.folio}
                    </p>
                    <p>
                      <strong>Nombre:</strong> {note.name}
                    </p>
                    <p>
                      <strong>Total:</strong> ${note.total.toLocaleString("es-MX")}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      {note.note_status === "pagado" ? "Pagado" : "Pendiente"}
                    </p>
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {moment(note.date).format("YYYY-MM-DD HH:mm")}
                    </p>
                    {note.abonos.length > 0 && (
                      <p>
                        <strong>Abono:</strong> $
                        {note.abonos.reduce((sum, a) => sum + a.amount, 0).toLocaleString("es-MX")} (
                        {note.abonos[0].method.charAt(0).toUpperCase() + note.abonos[0].method.slice(1)})
                      </p>
                    )}
                  </NoteInfo>
                  <ButtonContainer>
                    <StatusButton
                      onClick={() => handleChangeStatus(note, "listo_para_entregar")}
                      disabled={noteLoading[note._id] || editStatus === "pending"}
                      title="Marcar como Listo para Entregar"
                    >
                      {noteLoading[note._id] ? <Spinner /> : "Listo para Entregar"}
                    </StatusButton>
                    <DetailButton
                      onClick={() => navigate(`/note/${note._id}/${businessId}`)}
                      disabled={noteLoading[note._id] || editStatus === "pending"}
                      title="Ver detalles de la nota"
                    >
                      <FaEye /> Ver Detalles
                    </DetailButton>
                  </ButtonContainer>
                </NoteBox>
              ))
            ) : (
              <EmptyMessage>No hay ropa lavada.</EmptyMessage>
            )}
          </Column>

          {/* LISTO PARA ENTREGAR */}
          <Column $status="listo_para_entregar">
            <CategoryTitle>Listo para Entregar ({notesByStatus.listo_para_entregar.length})</CategoryTitle>
            {notesByStatus.listo_para_entregar.length ? (
              notesByStatus.listo_para_entregar.map((note) => (
                <NoteBox key={note._id}>
                  <BadgeContainer>
                    <CleaningBadge $status="listo_para_entregar">Para Entregar</CleaningBadge>
                  </BadgeContainer>
                  <NoteInfo>
                    <p>
                      <strong>Folio:</strong> {note.folio}
                    </p>
                    <p>
                      <strong>Nombre:</strong> {note.name}
                    </p>
                    <p>
                      <strong>Total:</strong> ${note.total.toLocaleString("es-MX")}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      {note.note_status === "pagado" ? "Pagado" : "Pendiente"}
                    </p>
                    <p>
                      <strong>Fecha:</strong>{" "}
                      {moment(note.date).format("YYYY-MM-DD HH:mm")}
                    </p>
                    {note.abonos.length > 0 && (
                      <p>
                        <strong>Abono:</strong> $
                        {note.abonos.reduce((sum, a) => sum + a.amount, 0).toLocaleString("es-MX")} (
                        {note.abonos[0].method.charAt(0).toUpperCase() + note.abonos[0].method.slice(1)})
                      </p>
                    )}
                  </NoteInfo>
                  <ButtonContainer>
                    <StatusButton
                      onClick={() =>
                        alert(
                          "El cliente debe ser marcado como entregado en la parte de administración."
                        )
                      }
                      disabled={true}
                      title="Marcar como recogido por el cliente"
                    >
                      Cliente Recogió
                    </StatusButton>
                    <DetailButton
                      onClick={() => navigate(`/note/${note._id}/${businessId}`)}
                      disabled={noteLoading[note._id] || editStatus === "pending"}
                      title="Ver detalles de la nota"
                    >
                      <FaEye /> Ver Detalles
                    </DetailButton>
                  </ButtonContainer>
                </NoteBox>
              ))
            ) : (
              <EmptyMessage>No hay ropa lista para entregar.</EmptyMessage>
            )}
          </Column>
        </ColumnsContainer>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%);
  border-radius: 16px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  margin: 2rem auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  @media (max-width: 1024px) {
    padding: 1.5rem;
    margin: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SocketStatus = styled.span`
  font-size: 0.9rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  background-color: ${({ status }) => (status === "connected" ? "#22c55e" : "#ef4444")};
  color: white;
  font-weight: 500;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.7rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  width: 250px;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SortSelect = styled.select`
  padding: 0.7rem 1.2rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  background-color: #fff;
  transition: border-color 0.3s ease;
`;

const SortButton = styled.button`
  padding: 0.7rem;
  background-color: #4b5563;
  color: white;
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #374151;
    transform: scale(1.05);
  }
`;

const BackButton = styled.button`
  padding: 0.7rem 1.5rem;
  background-color: #4b5563;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #374151;
    transform: scale(1.05);
  }
`;

const ColumnsContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const Column = styled.div`
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  background-color: ${({ $status }) =>
    $status === "sucia" ? "rgba(255, 152, 0, 0.08)" :
    $status === "lavado" ? "rgba(33, 150, 243, 0.08)" :
    "rgba(76, 175, 80, 0.08)"};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 1024px) {
    flex: none;
    min-width: 100%;
  }
`;

const CategoryTitle = styled.h2`
  text-align: center;
  margin-bottom: 1rem;
  font-size: 1.6rem;
  font-weight: 600;
  color: ${({ $status }) =>
    $status === "sucia" ? "#f97316" :
    $status === "lavado" ? "#1d4ed8" :
    "#15803d"};
`;

const NoteBox = styled.div`
  position: relative;
  border: none;
  border-radius: 10px;
  padding: 1.5rem;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: slideIn 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const NoteInfo = styled.div`
  p {
    margin: 0.5rem 0;
    line-height: 1.6;
    font-size: 1.1rem;
    color: #1f2937;
    font-weight: 400;

    strong {
      color: #111827;
      font-weight: 600;
    }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StatusButton = styled.button`
  background-color: #3b82f6;
  color: #fff;
  border: none;
  padding: 0.8rem 1.8rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #2563eb;
    transform: scale(1.05);
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.8rem;
  }
`;

const DetailButton = styled(StatusButton)`
  background-color: #22c55e;

  &:hover {
    background-color: #16a34a;
  }
`;

const Spinner = styled.div`
  border: 3px solid #fff;
  border-top: 3px solid transparent;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 2rem 0;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
`;

const RetryButton = styled.button`
  padding: 0.8rem 1.8rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 500;
  transition: background-color 0.3s ease;

  &:hover {
    background: #2563eb;
  }
`;

const BadgeContainer = styled.div`
  position: absolute;
  top: -12px;
  left: -12px;
  z-index: 10;
`;

const CleaningBadge = styled.span`
  background-color: ${({ $status }) =>
    $status === "sucia" ? "#f97316" :
    $status === "lavado" ? "#1d4ed8" :
    $status === "listo_para_entregar" ? "#15803d" : "#6b7280"};
  color: #fff;
  padding: 0.5rem 1.2rem;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  border: 2px solid #fff;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
`;

export default LaundryStatusScreen;