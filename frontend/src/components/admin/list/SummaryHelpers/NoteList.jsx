import React, { useState } from "react";
import styled from "styled-components";
import moment from "moment";
import axios from "axios";
import { url, setHeaders } from "../../../../features/api";
import PasswordConfirmationModal from "../../../PasswordConfirmationModal";
import PaymentMethodModal from "../../../PaymentMethodModal";
import AbonoModal from "../../../AbonoModal";
import PaymentConfirmationModal from "../../../PaymentConfirmationModal";
import { toast } from "react-toastify";

const NoteList = ({ notes, onView, onDispatch, onDeliver, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [currentNote, setCurrentNote] = useState(null);
  const [abonoPaymentMethod, setAbonoPaymentMethod] = useState(null);
  const [localNotes, setLocalNotes] = useState(notes);
  const [showDispatchPaymentModal, setShowDispatchPaymentModal] = useState(false);
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false);
  const [dispatchPaymentMethod, setDispatchPaymentMethod] = useState(null);

  React.useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const confirmPasswordAndDelete = async (password) => {
    try {
      const response = await axios.post(
        `${url}/notes/validate-password`,
        { password },
        setHeaders()
      );

      if (response.data.valid) {
        onDelete(noteToDelete);
        setShowSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setShowSuccess(false);
        }, 2000);
      } else {
        toast.error("Contraseña incorrecta. No se eliminará la nota.");
      }
    } catch (err) {
      console.error("Error validando la contraseña:", err);
      toast.error("Ocurrió un error al validar la contraseña.");
    }
  };

  const handleAbonar = (note) => {
    if (note.note_status === "pagado" || note.note_status === "entregado") {
      toast.error("No se pueden agregar abonos a notas pagadas o entregadas.");
      return;
    }
    setCurrentNote(note);
    setAbonoPaymentMethod(null);
    setShowAbonoModal(true);
  };

  const handleSelectPaymentMethod = (method, isDispatch = false) => {
    if (isDispatch) {
      setDispatchPaymentMethod(method);
    } else {
      setAbonoPaymentMethod(method);
    }
  };

  const handleConfirmAbono = async (amount, method) => {
    const abonoNum = parseFloat(amount);
    if (!abonoNum || abonoNum <= 0) {
      toast.error("Ingrese un monto válido.");
      return;
    }

    const totalAbonado = currentNote.abonos?.reduce((acc, ab) => acc + ab.amount, 0) || 0;
    const restante = currentNote.total - totalAbonado;

    if (abonoNum > restante) {
      toast.error(`El abono excede el restante de $${restante.toFixed(2)}`);
      return;
    }

    try {
      const newAbono = {
        amount: abonoNum,
        method: method,
        date: new Date(),
      };

      const res = await axios.put(
        `${url}/notes/${currentNote._id}`,
        { newAbono },
        setHeaders()
      );

      setLocalNotes((prevNotes) =>
        prevNotes.map((note) =>
          note._id === res.data._id ? res.data : note
        )
      );

      if (window.socket) {
        window.socket.emit("noteUpdated", res.data);
      }

      toast.success("Abono agregado correctamente");
      setShowAbonoModal(false);
      setAbonoPaymentMethod(null);
    } catch (err) {
      console.error("Error al agregar abono:", err);
      toast.error("Error al agregar abono");
    }
  };

  const handleDispatch = async (note) => {
    if (note.paidAt || note.note_status === "pagado" || note.note_status === "entregado") {
      toast.error("La nota ya está pagada o entregada.");
      return;
    }

    const totalAbonado = note.abonos?.reduce((acc, ab) => acc + ab.amount, 0) || 0;
    const restante = note.total - totalAbonado;

    if (restante <= 0 && note.abonos.length > 0) {
      setCurrentNote(note);
      setConfirmMessage(`¿Confirmas marcar la nota ${note.folio} como Pagada?`);
      setConfirmAction(() => async () => {
        try {
          const res = await axios.put(
            `${url}/notes/${note._id}`,
            { 
              note_status: "pagado", 
              paidAt: new Date(), 
              method: note.abonos[note.abonos.length - 1].method 
            },
            setHeaders()
          );

          setLocalNotes((prevNotes) =>
            prevNotes.map((n) => (n._id === res.data._id ? res.data : n))
          );

          if (window.socket) {
            window.socket.emit("noteUpdated", res.data);
          }

          toast.success("Nota marcada como Pagada");
        } catch (err) {
          console.error("Error al marcar como pagado:", err);
          toast.error("Error al marcar como pagado");
        }
      });
      setShowConfirmModal(true);
    } else {
      setCurrentNote(note);
      setDispatchPaymentMethod(null);
      setShowPaymentConfirmationModal(true);
    }
  };

  const confirmDispatch = async () => {
    if (!dispatchPaymentMethod) {
      toast.error("Selecciona un método de pago.");
      return;
    }

    const totalAbonado = currentNote.abonos?.reduce((acc, ab) => acc + ab.amount, 0) || 0;
    const restante = currentNote.total - totalAbonado;

    try {
      const newAbono = {
        amount: restante,
        method: dispatchPaymentMethod,
        date: new Date(),
      };

      const res = await axios.put(
        `${url}/notes/${currentNote._id}`,
        { 
          newAbono, 
          note_status: "pagado", 
          paidAt: new Date(), 
          method: dispatchPaymentMethod 
        },
        setHeaders()
      );

      setLocalNotes((prevNotes) =>
        prevNotes.map((n) => (n._id === res.data._id ? res.data : n))
      );

      if (window.socket) {
        window.socket.emit("noteUpdated", res.data);
      }

      toast.success("Nota marcada como Pagada");
      setShowPaymentConfirmationModal(false);
      setDispatchPaymentMethod(null);
    } catch (err) {
      console.error("Error al marcar como pagado:", err);
      toast.error("Error al marcar como pagado");
    }
  };

  const handleDeliver = async (note) => {
    if (note.deliveredAt || note.note_status === "entregado") {
      toast.error("La nota ya está entregada.");
      return;
    }
    if (note.note_status !== "pagado") {
      toast.error("La nota debe estar Pagada antes de marcarla como Entregada.");
      return;
    }
    if (note.cleaning_status !== "listo_para_entregar") {
      toast.error("La nota debe estar Lista para Entregar antes de marcarla como Entregada.");
      return;
    }

    setCurrentNote(note);
    setConfirmMessage(`¿Confirmas marcar la nota ${note.folio} como Entregada?`);
    setConfirmAction(() => async () => {
      try {
        const res = await axios.put(
          `${url}/notes/${note._id}`,
          { 
            note_status: "entregado", 
            deliveredAt: new Date(), 
            cleaning_status: "entregado" 
          },
          setHeaders()
        );

        setLocalNotes((prevNotes) =>
          prevNotes.map((n) => (n._id === res.data._id ? res.data : n))
        );

        if (window.socket) {
          window.socket.emit("noteUpdated", res.data);
        }

        toast.success("Nota marcada como Entregada");
      } catch (err) {
        console.error("Error al marcar como entregado:", err);
        toast.error("Error al marcar como entregado");
      }
    });
    setShowConfirmModal(true);
  };

  const getTotalAbonos = (note) => note.abonos?.reduce((acc, ab) => acc + ab.amount, 0) || 0;

  const getRestante = (note) => note.total - getTotalAbonos(note);

  const getAbonosSummary = (note) => {
    if (!note.abonos || note.abonos.length === 0) return "$0.00";
    const total = getTotalAbonos(note);
    const methods = [...new Set(note.abonos.map((ab) => ab.method))].join(", ");
    return `$${total.toFixed(2)} (${methods})`;
  };

  return (
    <NoteContainer>
      {localNotes.length ? (
        localNotes.map((note) => (
          <NoteBox key={note._id} onClick={() => onView(note._id)}>
            <BadgeContainer>
              <CleaningBadge $status={note.note_status === "entregado" ? "entregado" : note.cleaning_status}>
                {note.note_status === "entregado" ? "Entregado" : (
                  note.cleaning_status === "sucia" ? "Sucia" :
                  note.cleaning_status === "lavado" ? "Lavado" :
                  note.cleaning_status === "listo_para_entregar" ? "Para Entregar" : ""
                )}
              </CleaningBadge>
            </BadgeContainer>
            <NoteInfo>
              <NoteId>Folio: {note.folio}</NoteId>
              <NoteName>Nombre: {note.name}</NoteName>
              <NoteAmount>Total: ${note.total.toFixed(2)}</NoteAmount>
              {note.note_status !== "pagado" && note.note_status !== "entregado" && note.abonos?.length > 0 && (
                <>
                  <NoteAbonos>Abonado: {getAbonosSummary(note)}</NoteAbonos>
                  <NoteRestante>Restante: ${getRestante(note).toFixed(2)}</NoteRestante>
                </>
              )}
              <NoteStatus>{renderStatus(note.note_status)}</NoteStatus>
              <NoteDate>Fecha: {moment(note.date).format("YYYY-MM-DD HH:mm")}</NoteDate>
            </NoteInfo>
            <Actions>
              <AbonarBtn
                onClick={(e) => {
                  e.stopPropagation();
                  handleAbonar(note);
                }}
                disabled={note.note_status === "pagado" || note.note_status === "entregado"}
              >
                Abonar
              </AbonarBtn>
              <DispatchBtn
                onClick={(e) => {
                  e.stopPropagation();
                  handleDispatch(note);
                }}
                disabled={note.paidAt || note.note_status === "pagado" || note.note_status === "entregado"}
              >
                Pagar
              </DispatchBtn>
              <DeliveryBtn
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeliver(note);
                }}
                disabled={note.deliveredAt || note.note_status !== "pagado" || note.cleaning_status !== "listo_para_entregar"}
                title={note.note_status !== "pagado" ? "La nota debe estar pagada" : note.cleaning_status !== "listo_para_entregar" ? "La nota debe estar lista para entregar" : ""}
              >
                Entregado
              </DeliveryBtn>
              <DeleteBtn
                onClick={(e) => {
                  e.stopPropagation();
                  setNoteToDelete(note._id);
                  setShowModal(true);
                }}
              >
                Eliminar
              </DeleteBtn>
            </Actions>
          </NoteBox>
        ))
      ) : (
        <NoNotes>No se encontraron notas.</NoNotes>
      )}

      <PasswordConfirmationModal
        showModal={showModal}
        handleClose={() => {
          setShowModal(false);
          setShowSuccess(false);
        }}
        handleConfirm={confirmPasswordAndDelete}
        success={showSuccess}
      />

      <AbonoModal
        isOpen={showAbonoModal}
        onClose={() => setShowAbonoModal(false)}
        onConfirm={handleConfirmAbono}
        currentNote={currentNote}
        onPaymentMethodSelect={setAbonoPaymentMethod}
      />

      <PaymentConfirmationModal
        showModal={showPaymentConfirmationModal}
        handleClose={() => setShowPaymentConfirmationModal(false)}
        handleConfirm={confirmDispatch}
        paymentMethod={dispatchPaymentMethod}
        amount={currentNote ? currentNote.total - (currentNote.abonos?.reduce((acc, ab) => acc + ab.amount, 0)) || 0 : 0}
        onSelectPaymentMethod={() => {
          setShowPaymentConfirmationModal(false);
          setShowDispatchPaymentModal(true);
        }}
      />

      <PaymentMethodModal
        isOpen={showDispatchPaymentModal}
        onClose={() => {
          setShowDispatchPaymentModal(false);
          setShowPaymentConfirmationModal(true);
        }}
        onSelect={(method) => {
          setDispatchPaymentMethod(method);
          setShowDispatchPaymentModal(false);
          setShowPaymentConfirmationModal(true);
        }}
        title="Selecciona el Método de Pago"
      />

      {showConfirmModal && (
        <ConfirmModal>
          <ModalContent>
            <ModalTitle>{confirmMessage}</ModalTitle>
            <ModalButtons>
              <ModalButton
                onClick={async () => {
                  await confirmAction();
                  setShowConfirmModal(false);
                }}
                color="#28a745"
              >
                Confirmar
              </ModalButton>
              <CancelButton onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </CancelButton>
            </ModalButtons>
          </ModalContent>
        </ConfirmModal>
      )}
    </NoteContainer>
  );
};

// Resto del código (renderStatus y estilos) se mantiene igual
const renderStatus = (status) => {
  switch (status) {
    case "pendiente":
      return <Pending>Pendiente</Pending>;
    case "pagado":
      return <Dispatched>Pagado</Dispatched>;
    case "entregado":
      return <Delivered>Entregado</Delivered>;
    default:
      return "Error";
  }
};

// Estilos (se mantienen igual)
const NoteContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoteBox = styled.div`
  position: relative;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  background-color: white;
  transition: box-shadow 0.3s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const NoteInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-top: 0.5rem;
`;

const NoteId = styled.p`
  margin: 0 0 0.5rem;
  font-weight: bold;
  color: #007bff;
`;

const NoteName = styled.p`
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
`;

const NoteAmount = styled.p`
  margin: 0 0 0.3rem;
  font-size: 1.1rem;
`;

const NoteAbonos = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: #28a745;
`;

const NoteRestante = styled.p`
  font-size: 0.95rem;
  color: #dc3545;
`;

const NoteStatus = styled.p`
  margin: 0 0 0.5rem;
  font-weight: bold;
  margin-top: 1rem;
`;

const NoteDate = styled.p`
  margin: 0;
  font-size: 1rem;
  margin-top: 1rem;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;

  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 1rem;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const AbonarBtn = styled.button`
  background-color: #ffc107;
  color: #333;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #ffca2c;
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    background-color: #cccccc;
    color: white;
    cursor: not-allowed;
    transform: none;
  }
`;

const DispatchBtn = styled.button`
  background-color: rgb(0, 123, 255);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: rgb(0, 180, 249);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const DeliveryBtn = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #218838;
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const DeleteBtn = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #c82333;
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }
`;

const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const Dispatched = styled.span`
  color: rgb(0, 123, 255);
  background: rgba(0, 123, 255, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const Delivered = styled.span`
  color: rgb(40, 167, 69);
  background: rgba(40, 167, 69, 0.12);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-size: 1rem;
`;

const NoNotes = styled.p`
  text-align: center;
  color: #888;
  font-size: 1.2rem;
`;

const BadgeContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
`;

const CleaningBadge = styled.span`
  background-color: ${({ $status }) =>
    $status === "sucia"
      ? "#ff9800"
      : $status === "lavado"
      ? "#2196f3"
      : $status === "listo_para_entregar"
      ? "#4caf50"
      : $status === "entregado"
      ? "#6c757d"
      : "#6c757d"};
  color: #fff;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
`;

const ConfirmModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  text-align: center;
`;

const ModalButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModalButton = styled.button`
  padding: 0.75rem;
  background-color: ${(props) => props.color || "#007bff"};
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: ${(props) => darken(props.color || "#007bff", 0.1)};
    transform: scale(1.02);
  }
`;

const CancelButton = styled.button`
  padding: 0.75rem;
  background-color: #dc3545;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #c82333;
    transform: scale(1.02);
  }
`;

const darken = (color, amount) => {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

export default NoteList;