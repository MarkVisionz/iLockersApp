import { useEffect } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchNoteById } from "../../features/notesSlice";
import { LoadingSpinner } from "../LoadingAndError";
import moment from "moment";

const Note = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentNote, fetchNoteStatus, error } = useSelector((state) => state.notes);

  useEffect(() => {
    dispatch(fetchNoteById(params.id));
  }, [dispatch, params.id]);

  const formatServiceName = (name) => {
    const formattedName = name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return formattedName.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const renderServices = (services, parentName = "") => {
    if (!services) return [<p key="no-services">No services available</p>];
    return Object.entries(services).flatMap(([serviceName, details]) => {
      const fullServiceName = parentName + serviceName;
      if (details?.quantity > 0) {
        const totalPrice = details.unitPrice * details.quantity;
        return (
          <ServiceItem key={fullServiceName}>
            <ServiceDetails>
              <ServiceName>{formatServiceName(fullServiceName)}</ServiceName>
              <ServiceInfo>
                <ServiceQuantity>
                  x{details.quantity}{" "}
                  <UnitPrice>
                    (${details.unitPrice ? details.unitPrice.toLocaleString("es-MX") : "N/A"} c/u)
                  </UnitPrice>
                </ServiceQuantity>
                <ServicePrice>${totalPrice ? totalPrice.toLocaleString("es-MX") : "N/A"}</ServicePrice>
              </ServiceInfo>
            </ServiceDetails>
          </ServiceItem>
        );
      } else if (typeof details === "object" && details !== null) {
        return renderServices(details, fullServiceName + " ");
      }
      return null;
    });
  };

  return (
    <StyledNote>
      {fetchNoteStatus === "pending" && !currentNote ? (
        <LoadingSpinner message="Loading..." />
      ) : fetchNoteStatus === "rejected" && !currentNote ? (
        <ErrorMessage>
          Error: {error || "Failed to load note. Please try again."}
        </ErrorMessage>
      ) : !currentNote ? (
        <ErrorMessage>Note not found.</ErrorMessage>
      ) : (
        <NoteContainer>
          <Header>
            <h2>Note Details</h2>
            <BackButton onClick={() => navigate("/admin/notes-summary")}>
              Back to Dashboard
            </BackButton>
          </Header>

          <Status>Note Status: {renderStatusLabel(currentNote.note_status)}</Status>

          <Section>
            <h3>Customer Details</h3>
            <DetailItem>Folio: {currentNote.folio || "N/A"}</DetailItem>
            <DetailItem>Customer Name: {currentNote.name || "N/A"}</DetailItem>
            <DetailItem>Phone: {currentNote.phoneNumber || "N/A"}</DetailItem>
            <DetailItem>
              Date: {moment(currentNote.date).format("YYYY-MM-DD HH:mm") || "N/A"}
            </DetailItem>
            <DetailItem>
              Suavitel: {currentNote.suavitelDesired ? "Yes" : "No"}
            </DetailItem>
          </Section>

          <Section>
            <h3>Ordered Services</h3>
            <Services>
              {renderServices(currentNote.services).length > 0 ? (
                renderServices(currentNote.services)
              ) : (
                <p>No services available</p>
              )}
            </Services>
          </Section>

          <TotalPrice>
            <h3>Total:</h3>
            <span>${currentNote.total ? currentNote.total.toLocaleString("es-MX") : "0"}</span>
          </TotalPrice>

          <Section>
            <h3>Observations</h3>
            <DetailItem>{currentNote.observations || "None"}</DetailItem>
          </Section>

          {renderPaidAndDeliveredInfo(currentNote)}
        </NoteContainer>
      )}
    </StyledNote>
  );
};

const renderStatusLabel = (status) => {
  const statusStyles = {
    pendiente: {
      color: "rgb(253, 181, 40)",
      background: "rgba(253, 181, 40, 0.12)",
    },
    pagado: {
      color: "rgb(0, 123, 255)",
      background: "rgba(0, 123, 255, 0.12)",
    },
    entregado: {
      color: "rgb(40, 167, 69)",
      background: "rgba(40, 167, 69, 0.12)",
    },
  };

  const { color, background } = statusStyles[status] || {
    color: "black",
    background: "none",
  };

  return (
    <StatusLabel style={{ color, background }}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
    </StatusLabel>
  );
};

const renderPaidAndDeliveredInfo = (note) => {
  return (
    <>
      {note?.paidAt && (
        <PaidAtContainer>
          <PaidAtLabel>Pagado:</PaidAtLabel>
          <PaidAtDate>{moment(note.paidAt).format("YYYY-MM-DD HH:mm")}</PaidAtDate>
        </PaidAtContainer>
      )}
      {note?.deliveredAt && (
        <DeliveredAtContainer>
          <DeliveredAtLabel>Entregado:</DeliveredAtLabel>
          <DeliveredAtDate>
            {moment(note.deliveredAt).format("YYYY-MM-DD HH:mm")}
          </DeliveredAtDate>
        </DeliveredAtContainer>
      )}
    </>
  );
};

// Styled Components
const StyledNote = styled.div`
  margin: 2rem;
  display: flex;
  justify-content: center;
  @media (max-width: 768px) {
    margin: 1rem;
  }
`;

const NoteContainer = styled.div`
  max-width: 520px;
  width: 90%;
  background: linear-gradient(135deg, #ffffff 0%, #f7f8fa 100%);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.6rem;
    font-weight: 600;
    color: #4a4a4a;
  }
`;

const Status = styled.p`
  font-size: 1.1rem;
  font-weight: bold;
  margin: 1rem 0;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  h3 {
    margin-bottom: 0.5rem;
    font-size: 1.3rem;
    font-weight: 600;
    color: #333;
  }
`;

const DetailItem = styled.p`
  margin: 0.3rem 0;
  font-size: 1rem;
  color: #666;
`;

const TotalPrice = styled.div`
  font-size: 1.8rem;
  color: #000;
  margin-top: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.2rem;
  h3 {
    font-size: 1.6rem;
  }
`;

const BackButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 0.4rem 0.8rem;
  border: none;
  margin-top: 0.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const Services = styled.div`
  margin-top: 1rem;
`;

const ServiceItem = styled.div`
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 1rem;
`;

const ServiceDetails = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ServiceInfo = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ServiceName = styled.span`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const ServiceQuantity = styled.span`
  margin-right: 1rem;
`;

const ServicePrice = styled.span`
  font-weight: bold;
`;

const UnitPrice = styled.span`
  color: #888;
  font-size: 0.9rem;
`;

const StatusLabel = styled.span`
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 14px;
`;

const PaidAtContainer = styled.div`
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  background-color: #f3f3f3;
  border-radius: 5px;
  display: flex;
  align-items: center;
`;

const DeliveredAtContainer = styled.div`
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  background-color: #f3f3f3;
  border-radius: 5px;
  display: flex;
  align-items: center;
`;

const DeliveredAtLabel = styled.span`
  font-weight: bold;
  color: black;
  margin-right: 0.3rem;
`;

const PaidAtLabel = styled.span`
  font-weight: bold;
  color: black;
  margin-right: 0.3rem;
`;

const DeliveredAtDate = styled.span`
  color: black;
  font-size: 0.9rem;
  font-style: italic;
`;

const PaidAtDate = styled.span`
  color: black;
  font-size: 0.9rem;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2rem;
  color: #dc3545;
`;

export default Note;