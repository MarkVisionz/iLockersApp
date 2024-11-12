import { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import axios from "axios";
import { setHeaders, url } from "../../features/api";
import { useNavigate } from "react-router-dom";
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
        const noteData = noteRes.data;
        setNote(noteData);
        setLoading(false);
      } catch (err) {
        console.log("Error fetching note:", err);
        setLoading(false);
      }
    };

    fetchNote();
  }, [params.id]);

  const formatServiceName = (name) => {
    return name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const renderServices = (services, parentName = "") => {
    const items = [];
    Object.entries(services).forEach(([serviceName, details]) => {
      const fullServiceName = parentName + serviceName;
      if (details.quantity > 0) {
        const totalPrice = details.unitPrice * details.quantity;
        items.push(
          <Item key={fullServiceName}>
            <ServiceDetails>
              <ServiceInfo>
                <ServiceName>{formatServiceName(fullServiceName)}</ServiceName>
                <ServiceQuantity>x{details.quantity}</ServiceQuantity>
                <ServicePrice>${totalPrice}</ServicePrice>
              </ServiceInfo>
            </ServiceDetails>
          </Item>
        );
      } else if (typeof details === "object" && details !== null) {
        items.push(...renderServices(details, fullServiceName));
      }
    });
    return items;
  };

  return (
    <StyledNote>
      {loading ? (
        <LoadingSpinner message={`Loading...`}></LoadingSpinner>
      ) : (
        <NoteContainer>
          <Header>
            <h2>Note Details</h2>
          </Header>

          <Status>
            Note Status:{" "}
            {note.note_status === "pendiente" ? (
              <Pending>Pending</Pending>
            ) : note.note_status === "pagado" ? (
              <Paid>Paid</Paid>
            ) : note.note_status === "entregado" ? (
              <Delivered>Delivered</Delivered>
            ) : (
              "Error"
            )}
          </Status>

          <Section>
            <h3>Customer Details</h3>
            <p>Customer Name: {note.name}</p>
            <p>Phone Number: {note.phoneNumber}</p>
            <p>Folio: {note.folio}</p>
            <p>Date: {moment(note.date).format("YYYY-MM-DD HH:mm")}</p>
            <p>
              <Suav>Suavitel: {note.suavitelDesired ? "Yes" : "No"}</Suav>
            </p>
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
            Total Price: <span>${note.total}</span>
          </TotalPrice>

          <Section>
            <h3>Observations</h3>
            <p>{note.observations}</p>

            <BackButton onClick={() => navigate("/admin/notes-summary")}>
              Back to Dashboard
            </BackButton>
          </Section>

          {(note.note_status === "pagado" ||
            note.note_status === "entregado") &&
            note.paidAt && (
              <PaidAtContainer>
                <PaidAtLabel>Paid At:</PaidAtLabel>
                <PaidAtDate>
                  {moment(note.paidAt).format("YYYY-MM-DD HH:mm")}
                </PaidAtDate>
              </PaidAtContainer>
            )}
        </NoteContainer>
      )}
    </StyledNote>
  );
};

export default Note;

// Styled Components

const BackButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  margin-top: 1rem;
  border-radius: 5px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const StyledNote = styled.div`
  margin: 3rem;
  display: flex;
  justify-content: center;
  @media (max-width: 768px) {
    margin: 1.5rem;
  }
`;

const NoteContainer = styled.div`
  max-width: 520px;
  width: 90%;
  background: linear-gradient(135deg, #ffffff 0%, #f7f8fa 100%);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const Header = styled.div`
  text-align: left;
  margin-bottom: 2rem;
  h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #4a4a4a;
  }
`;

const Status = styled.p`
  font-size: 1.2rem;
  font-weight: bold;
  margin: 1.5rem 0;
`;

const Section = styled.div`
  margin-bottom: 2rem;
  h3 {
    margin-bottom: 1rem;
    font-size: 1.4rem;
    font-weight: 600;
    color: #333;
  }
  p {
    margin: 0.5rem 0;
    font-size: 1rem;
    color: #666;
  }
`;

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f3f3f3;
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

const ServicePrice = styled.span`
  color: black;
  font-weight: 700;
`;

const ServiceDetails = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ServiceName = styled.span`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const ServiceInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ServiceQuantity = styled.span`
  margin-right: 1rem;
`;

const Pending = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 16px;
`;

const Suav = styled.span`
  color: rgb(253, 181, 40);
  background: rgba(253, 181, 40, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 16px;
`;

const Paid = styled.span`
  color: rgb(38, 198, 249);
  background-color: rgba(38, 198, 249, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 16px;
`;

const Delivered = styled.span`
  color: rgb(102, 108, 255);
  background-color: rgba(102, 108, 255, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 16px;
`;

const TotalPrice = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #000;
  text-align: right;
  margin-top: 2rem;
  span {
    font-size: 2rem;
  }
`;

const PaidAtContainer = styled.div`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f3f3f3;
  border-radius: 5px;
  display: flex;
  align-items: center;
`;

const PaidAtLabel = styled.span`
  font-weight: bold;
  color: black;
  margin-right: 0.5rem;
`;

const PaidAtDate = styled.span`
  color: black;
  font-size: 1rem;
  font-style: italic;
`;
