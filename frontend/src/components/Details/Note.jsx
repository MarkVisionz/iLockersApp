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
  const { currentNote, fetchNoteStatus, error } = useSelector(
    (state) => state.notes
  );

  useEffect(() => {
    dispatch(fetchNoteById({ id: params.id, businessId: params.businessId }));
  }, [dispatch, params.id, params.businessId]);

  const formatServiceName = (name) => {
    const formattedName = name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return formattedName.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const renderServices = (services, suavitelShots, suavitelPrice) => {
    if (!services || !Array.isArray(services) || services.length === 0) {
      return {
        elements: [<NoServices key="no-services">No hay servicios</NoServices>],
        subtotal: 0,
      };
    }

    let subtotal = 0;
    const elements = services.map((service, index) => {
      const totalPrice = service.price * service.quantity;
      subtotal += totalPrice;
      return (
        <ServiceItem key={`${service.serviceId}-${index}`}>
          <ServiceName>{formatServiceName(service.name)}</ServiceName>
          <ServiceInfo>
            <ServiceQuantity>
              x{service.quantity}{" "}
              <UnitPrice>(${service.price.toLocaleString("es-MX")}/u)</UnitPrice>
            </ServiceQuantity>
            <ServicePrice>
              ${totalPrice.toLocaleString("es-MX")}
            </ServicePrice>
          </ServiceInfo>
        </ServiceItem>
      );
    });

    if (suavitelShots > 0) {
      const suavitelTotal = suavitelShots * suavitelPrice;
      elements.push(
        <ServiceItem key="suavitel">
          <ServiceName>Suavitel</ServiceName>
          <ServiceInfo>
            <ServiceQuantity>
              x{suavitelShots}{" "}
              <UnitPrice>(${suavitelPrice.toLocaleString("es-MX")}/shot)</UnitPrice>
            </ServiceQuantity>
            <ServicePrice>
              ${suavitelTotal.toLocaleString("es-MX")}
            </ServicePrice>
          </ServiceInfo>
        </ServiceItem>
      );
      subtotal += suavitelTotal;
    }

    return { elements, subtotal };
  };

  const renderServiceSection = (services, suavitelDesired, suavitelShots, suavitelPrice, total) => {
    const { elements, subtotal } = renderServices(services, suavitelShots, suavitelPrice);

    return (
      <Services>
        {elements}
        <PriceSummary>
          <PriceRow>
            <PriceLabel>Subtotal:</PriceLabel>
            <PriceValue>${subtotal.toLocaleString("es-MX")}</PriceValue>
          </PriceRow>
          <PriceRow isTotal>
            <PriceLabel>Total:</PriceLabel>
            <PriceValue>${total.toLocaleString("es-MX")}</PriceValue>
          </PriceRow>
        </PriceSummary>
      </Services>
    );
  };

  return (
    <StyledNote>
      {fetchNoteStatus === "pending" && !currentNote ? (
        <LoadingWrapper>
          <LoadingSpinner message="Cargando nota..." />
        </LoadingWrapper>
      ) : fetchNoteStatus === "rejected" && !currentNote ? (
        <ErrorMessage>
          <ErrorText>
            {error || "No se pudo cargar la nota. Intenta de nuevo."}
          </ErrorText>
        </ErrorMessage>
      ) : !currentNote ? (
        <ErrorMessage>
          <ErrorText>
            La nota solicitada no existe o no está disponible.
          </ErrorText>
        </ErrorMessage>
      ) : (
        <NoteContainer>
          <Header>
            <TitleContainer>
              <FolioBadge>#</FolioBadge>
              <FolioText>{currentNote.folio}</FolioText>
            </TitleContainer>
            <BackButton onClick={() => navigate(`/owner/local-summary/${currentNote.businessId}`)}>
              <ArrowBackIcon size={16} />
              Volver
            </BackButton>
          </Header>
          <BadgeContainer>
            <CleaningBadge
              $status={
                currentNote.note_status === "entregado"
                  ? "entregado"
                  : currentNote.cleaning_status
              }
            >
              {currentNote.note_status === "entregado"
                ? "Entregado"
                : currentNote.cleaning_status === "sucia"
                ? "Sucia"
                : currentNote.cleaning_status === "lavado"
                ? "Lavado"
                : currentNote.cleaning_status === "listo_para_entregar"
                ? "Para Entregar"
                : ""}
            </CleaningBadge>
          </BadgeContainer>
          <StatusContainer>
            <Status>
              <StatusLabel>Estado:</StatusLabel>
              {renderStatusLabel(currentNote.note_status)}
            </Status>
          </StatusContainer>

          <Section>
            <SectionTitle>
              <SectionIcon>👤</SectionIcon>
              Cliente
            </SectionTitle>
            <DetailList>
              <DetailItem>
                <DetailLabel>Nombre:</DetailLabel>
                <DetailValue>{currentNote.name || "N/A"}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Teléfono:</DetailLabel>
                <DetailValue>+{currentNote.phoneNumber || "N/A"}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Fecha:</DetailLabel>
                <DetailValue>
                  {moment(currentNote.date).format("DD/MM/YYYY HH:mm")}
                </DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Suavitel:</DetailLabel>
                <DetailValue>
                  {currentNote.suavitelDesired ? (
                    <SuavitelYes>Sí</SuavitelYes>
                  ) : (
                    <SuavitelNo>No</SuavitelNo>
                  )}
                </DetailValue>
              </DetailItem>
              {currentNote.method && (
                <DetailItem>
                  <DetailLabel>Método de Pago:</DetailLabel>
                  <DetailValue>
                    {currentNote.method.charAt(0).toUpperCase() +
                      currentNote.method.slice(1)}
                  </DetailValue>
                </DetailItem>
              )}
            </DetailList>
          </Section>

          <Section>
            <SectionTitle>
              <SectionIcon>🧺</SectionIcon>
              Servicios
            </SectionTitle>
            {renderServiceSection(
              currentNote.services,
              currentNote.suavitelDesired,
              currentNote.suavitelShots || 0,
              currentNote.suavitelPrice || 15,
              currentNote.total
            )}
          </Section>

          <Section>
            <SectionTitle>
              <SectionIcon>📝</SectionIcon>
              Observaciones
            </SectionTitle>
            <Observations>
              {currentNote.observations || "Sin observaciones"}
            </Observations>
          </Section>

          <Section>
            <SectionTitle>Pago y Entrega</SectionTitle>
            {renderPaidAndDeliveredInfo(currentNote)}
            {currentNote.abonos?.length > 0 && (
              <AbonosContainer>
                <AbonosTitle>Abonos:</AbonosTitle>
                {currentNote.abonos.map((abono, index) => (
                  <AbonoItem key={index}>
                    <AbonoDate>
                      {moment(abono.date).format("DD/MM/YYYY HH:mm")}
                    </AbonoDate>
                    <AbonoInfo>
                      <AbonoAmount>
                        ${abono.amount.toLocaleString("es-MX")}
                      </AbonoAmount>
                      <AbonoMethod>
                        {abono.method.charAt(0).toUpperCase() +
                          abono.method.slice(1)}
                      </AbonoMethod>
                    </AbonoInfo>
                  </AbonoItem>
                ))}
              </AbonosContainer>
            )}
          </Section>
        </NoteContainer>
      )}
    </StyledNote>
  );
};

const renderStatusLabel = (status) => {
  switch (status) {
    case "pendiente":
      return <Pending>Pendiente</Pending>;
    case "pagado":
      return <Dispatched>Pagado</Dispatched>;
    case "entregado":
      return <Delivered>Entregado</Delivered>;
    default:
      return <Pending>Desconocido</Pending>;
  }
};

const renderPaidAndDeliveredInfo = (note) => {
  return (
    <>
      {note?.paidAt && (
        <PaidAtContainer>
          <PaidAtIcon>💵</PaidAtIcon>
          <PaidAtInfo>
            <PaidAtLabel>Pagado el:</PaidAtLabel>
            <PaidAtDate>
              {moment(note.paidAt).format("DD/MM/YYYY HH:mm")}
            </PaidAtDate>
          </PaidAtInfo>
        </PaidAtContainer>
      )}
      {note?.deliveredAt && (
        <DeliveredAtContainer>
          <DeliveredAtIcon>🚚</DeliveredAtIcon>
          <DeliveredAtInfo>
            <DeliveredAtLabel>Entregado el:</DeliveredAtLabel>
            <DeliveredAtDate>
              {moment(note.deliveredAt).format("DD/MM/YYYY HH:mm")}
            </DeliveredAtDate>
          </DeliveredAtInfo>
        </DeliveredAtContainer>
      )}
    </>
  );
};

// Styled Components
const StyledNote = styled.div`
  margin: 1.5rem auto;
  max-width: 600px;
  width: 95%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #333;
`;

const NoteContainer = styled.div`
  position: relative;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow 0.3s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 6px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #ddd;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const FolioBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #007bff;
  color: #fff;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
`;

const FolioText = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const BackButton = styled.button`
  background: #007bff;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
`;

const ArrowBackIcon = styled(({ size = 16, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
))``;

const BadgeContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
`;

const StatusContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`;

const Status = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: bold;
`;

const StatusLabel = styled.span`
  color: #888;
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #fff;
  border-radius: 8px;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

const SectionIcon = styled.span`
  font-size: 1.2rem;
`;

const DetailList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 1rem;
`;

const DetailLabel = styled.span`
  color: #888;
  font-weight: 500;
  flex: 1;
`;

const DetailValue = styled.span`
  color: #333;
  font-weight: 500;
  flex: 2;
  text-align: right;
`;

const SuavitelYes = styled.span`
  color: #28a745;
  font-weight: bold;
`;

const SuavitelNo = styled.span`
  color: #dc3545;
  font-weight: bold;
`;

const Services = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ServiceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #fff;
  font-size: 1rem;
`;

const ServiceName = styled.span`
  font-weight: 500;
  color: #333;
  flex: 2;
`;

const ServiceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: flex-end;
`;

const ServiceQuantity = styled.span`
  color: #888;
  font-size: 0.95rem;
`;

const UnitPrice = styled.span`
  color: #888;
  font-size: 0.95rem;
`;

const ServicePrice = styled.span`
  font-weight: bold;
  color: #28a745;
`;

const NoServices = styled.p`
  font-size: 1.2rem;
  color: #888;
  text-align: center;
  padding: 0.5rem;
  margin: 0;
`;

const PriceSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #ddd;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  font-weight: ${({ isTotal }) => (isTotal ? "bold" : 500)};
  color: #333;
`;

const PriceLabel = styled.span``;

const PriceValue = styled.span`
  color: ${({ isTotal }) => (isTotal ? "#007bff" : "#333")};
`;

const Observations = styled.p`
  font-size: 1rem;
  color: #333;
  line-height: 1.5;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
  margin: 0;
  max-height: 100px;
  overflow-y: auto;
`;

const PaidAtContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
`;

const PaidAtIcon = styled.span`
  font-size: 1rem;
`;

const PaidAtInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const PaidAtLabel = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #333;
`;

const PaidAtDate = styled.span`
  font-size: 0.95rem;
  color: #888;
`;

const DeliveredAtContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
`;

const DeliveredAtIcon = styled.span`
  font-size: 1rem;
`;

const DeliveredAtInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const DeliveredAtLabel = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: #333;
`;

const DeliveredAtDate = styled.span`
  font-size: 0.95rem;
  color: #888;
`;

const AbonosContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const AbonosTitle = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
`;

const AbonoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #fff;
  border-radius: 4px;
  font-size: 1rem;
`;

const AbonoDate = styled.span`
  color: #888;
  font-size: 0.95rem;
`;

const AbonoInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AbonoAmount = styled.span`
  font-weight: bold;
  color: #28a745;
`;

const AbonoMethod = styled.span`
  color: #888;
  background: #ddd;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.95rem;
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: #dc3545;
  font-size: 1.2rem;
  padding: 1.5rem;
  margin: 1.5rem auto;
  max-width: 500px;
`;

const ErrorText = styled.p`
  margin: 0;
`;

export default Note;