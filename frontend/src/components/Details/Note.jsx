import { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { setHeaders, url } from "../../features/api";
import { LoadingSpinner } from "../LoadingAndError";
import moment from "moment";

const Note = () => {
  const params = useParams();
  const [note, setNote] = useState({ services: {} });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        const noteRes = await axios.get(
          `${url}/notes/findOne/${params.id}`,
          setHeaders()
        );
        setNote(noteRes.data);
      } catch (err) {
        console.error("Error fetching note:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [params.id]);

  const formatServiceName = (name) => {
    // Separar palabras por mayúsculas, guiones y espacios
    const formattedName = name
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Separar camelCase
      .replace(/_/g, " ") // Reemplazar guiones bajos por espacios
      .replace(/-/g, " ") // Reemplazar guiones por espacios
      .replace(/\s+/g, " ") // Reemplazar múltiples espacios por uno solo
      .trim(); // Eliminar espacios al inicio y al final

    // Capitalizar la primera letra de cada palabra
    return formattedName.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const renderServices = (services, parentName = "") => {
    return Object.entries(services).flatMap(([serviceName, details]) => {
      const fullServiceName = parentName + serviceName;
      if (details.quantity > 0) {
        const totalPrice = details.unitPrice * details.quantity;
        return (
          <ServiceItem key={fullServiceName}>
            <ServiceDetails>
              <ServiceInfo>
                <ServiceName>{formatServiceName(fullServiceName)}</ServiceName>
                <ServiceQuantity>x{details.quantity}</ServiceQuantity>
                <ServicePrice>${totalPrice}</ServicePrice>
              </ServiceInfo>
            </ServiceDetails>
          </ServiceItem>
        );
      } else if (typeof details === "object" && details !== null) {
        return renderServices(details, fullServiceName + " "); // Agregar un espacio para evitar concatenaciones incorrectas
      }
      return null;
    });
  };

  return (
    <StyledNote>
      {loading ? (
        <LoadingSpinner message={`Loading...`} />
      ) : (
        <NoteContainer>
          <Header>
            <h2>Note Details</h2>
            <BackButton onClick={() => navigate("/admin/notes-summary")}>
              Back to Dashboard
            </BackButton>
          </Header>

          <Status>Note Status: {renderStatusLabel(note.note_status)}</Status>

          <Section>
            <h3>Customer Details</h3>
            <DetailItem>Folio: {note.folio}</DetailItem>
            <DetailItem>Customer Name: {note.name}</DetailItem>
            <DetailItem>Phone: {note.phoneNumber}</DetailItem>
            <DetailItem>
              Date: {moment(note.date).format("YYYY-MM-DD HH:mm")}
            </DetailItem>
            <DetailItem>
              Suavitel: {note.suavitelDesired ? "Yes" : "No"}
            </DetailItem>
          </Section>

          <Section>
            <h3>Ordered Services</h3>
            {renderServices(note.services).length > 0 ? (
              renderServices(note.services)
            ) : (
              <p>No services available</p>
            )}
          </Section>

          <TotalPrice>
            <h3>Total:</h3>
             <span>${note.total}</span>
          </TotalPrice>

          <Section>
            <h3>Observations</h3>
            <DetailItem>{note.observations}</DetailItem>
          </Section>

          {renderPaidAndDeliveredInfo(note)}
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </StatusLabel>
  );
};

const renderPaidAndDeliveredInfo = (note) => {
  return (
    <>
      {note.paidAt && (
        <PaidAtContainer>
          <PaidAtLabel>Pagado:</PaidAtLabel>
          <PaidAtDate>{moment(note.paidAt).format("YYYY-MM-DD HH:mm")}</PaidAtDate>
        </PaidAtContainer>
      )}
      {note.deliveredAt && (
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

const ServiceItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: #f3f3f3;
  border-radius: 6px;
  margin-bottom: 1rem;
`;

const ServiceDetails = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ServiceInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ServiceName = styled.span`
  font-weight: bold;
  margin-bottom: 0.3rem;
`;

const ServiceQuantity = styled.span`
  margin-right: 0.5rem;
`;

const ServicePrice = styled.span`
  color: black;
  font-weight: 700;
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

export default Note;
