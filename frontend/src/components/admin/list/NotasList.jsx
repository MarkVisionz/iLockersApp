import React, {
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { notesCreate } from "../../../features/notesSlice";
import ServiceButton from "../ServiceButton";
import ServiceWithSize from "../ServiceWithSize";
import ConfirmationModal from "../../ConfirmationModal"; // Importa el modal
import { ErrorMessage } from "../../LoadingAndError";
import { validate } from "./validateNote";
import moment from "moment";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

// Reducer para manejar el estado del formulario
const formReducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_SERVICES":
      return { ...state, services: { ...state.services, ...action.services } };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const initialState = {
  name: "",
  folio: `FOLIO-${Math.floor(Math.random() * 1000000)}`,
  date: moment().format("YYYY-MM-DD HH:mm"),
  services: {
    ropaPorKilo: 0,
    promoMartes: 0,
    secado: 0,
    lavadoExpress: 0,
    toallasSabanas: 0,
    cortinasManteles: 0,
    cubrecolchon: 0,
    hamaca: 0,
    tennis: 0,
    edredon: {},
    cobija: {},
    almohada: {},
    extras: {},
  },
  observations: "",
  abono: 0,
  suavitelDesired: false,
  isPaid: false,
  cleaningStatus: "sucia",
  deliveredAt: "",
  paidAt: "",
  selectedSize: {
    edredon: "individual",
    cobija: "individual",
    almohada: "chica",
    extras: "suavitel",
  },
  phoneNumber: "",
  countryCode: "52",
  errors: {},
};

const LaundryNote = () => {
  const [state, dispatchState] = useReducer(formReducer, initialState);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false); // Estado para controlar el modal
  const [loading, setLoading] = useState(false); // Estado para manejar la carga
  const [submitError, setSubmitError] = useState(null); // Estado para manejar errores de envío

  const {
    name,
    folio,
    date,
    services,
    observations,
    abono,
    suavitelDesired,
    isPaid,
    cleaningStatus,
    deliveredAt,
    paidAt,
    selectedSize,
    phoneNumber,
    countryCode,
    errors,
  } = state;

  const today = new Date().getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const isPromoDay = today === 2 || today === 4; // Martes o Jueves

  const filteredServices = { ...services };

  if (isPromoDay) {
    delete filteredServices.ropaPorKilo;
  } else {
    delete filteredServices.promoMartes;
  }

  const prices = useMemo(
    () => ({
      ropaPorKilo: 14,
      promoMartes: 13,
      secado: 10,
      lavadoExpress: 18,
      toallasSabanas: 16,
      vanishCloroSuavitel: 15,
      edredon: {
        individual: 70,
        matrimonial: 80,
        queenKing: 100,
      },
      cobija: {
        individual: 40,
        matrimonial: 50,
        queenKing: 60,
      },
      extras: {
        suavitel: 15,
        cloro: 10,
        vanish: 15,
      },
      almohada: {
        chica: 30,
        mediana: 60,
        grande: 90,
      },
      cubrecolchon: 60,
      hamaca: 70,
      tennis: 120,
      cortinasManteles: 16,
    }),
    []
  );

  const calculateSubtotal = useCallback((services, prices) => {
    return Object.entries(services).reduce((acc, [service, value]) => {
      if (typeof value === "object") {
        return (
          acc +
          Object.entries(value).reduce((subAcc, [size, quantity]) => {
            return subAcc + quantity * (prices[service][size] || 0);
          }, 0)
        );
      }
      return acc + value * (prices[service] || 0);
    }, 0);
  }, []);

  const calculatedTotal = useMemo(() => {
    const subtotal = calculateSubtotal(services, prices);
    return (
      subtotal -
      abono +
      (suavitelDesired
        ? Math.ceil(services.ropaPorKilo / 6) * prices.vanishCloroSuavitel
        : 0)
    );
  }, [services, abono, suavitelDesired, prices, calculateSubtotal]);

  const handleSubmit = async () => {
    const validationErrors = validate(name, abono, services);
    if (Object.keys(validationErrors).length > 0) {
      dispatchState({
        type: "SET_FIELD",
        field: "errors",
        value: validationErrors,
      });
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const transformedServices = transformServices(services, prices);
      await dispatch(
        notesCreate({
          name,
          folio,
          date: moment().format("YYYY-MM-DD HH:mm"),
          services: transformedServices,
          observations,
          abono,
          suavitelDesired,
          total: calculatedTotal,
          note_status: isPaid ? "pagado" : "pendiente",
          cleaningStatus,
          paidAt: isPaid ? moment().format("YYYY-MM-DD HH:mm") : null,
          deliveredAt,
          phoneNumber: `${countryCode}${phoneNumber}`,
        })
      );
      dispatchState({ type: "RESET" });
      handleCloseModal();
    } catch (error) {
      console.error("Error creating note:", error);
      setSubmitError("Error al crear la nota. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const transformServices = (services, prices) => {
    return Object.entries(services).reduce((acc, [service, value]) => {
      if (typeof value === "object") {
        const sizes = Object.entries(value).filter(
          ([size, quantity]) => quantity > 0
        );
        if (sizes.length > 0) {
          acc[service] = sizes.reduce(
            (sizeAcc, [size, quantity]) => ({
              ...sizeAcc,
              [size]: { quantity, unitPrice: prices[service][size] },
            }),
            {}
          );
        }
      } else if (value > 0) {
        acc[service] = { quantity: value, unitPrice: prices[service] };
      }
      return acc;
    }, {});
  };

  const handleOpenModal = () => {
    const validationErrors = validate(name, abono, services);
    if (Object.keys(validationErrors).length > 0) {
      dispatchState({
        type: "SET_FIELD",
        field: "errors",
        value: validationErrors,
      });
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };
  return (
    <Container>
      <BackButton onClick={() => navigate("/admin/notes-summary")}>
        Regresar al Menú
      </BackButton>
      <NoteHeader>
        <h2>Nota de Lavandería</h2>
        <FolioDateContainer>
          <div className="folio">{folio}</div>
          <div>
            <strong>Fecha:</strong> {moment(date).format("YYYY-MM-DD / HH:mm")}
          </div>
        </FolioDateContainer>
      </NoteHeader>

      <Section>
        <Label htmlFor="name">Nombre del Cliente:</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={(e) =>
            dispatchState({
              type: "SET_FIELD",
              field: "name",
              value: e.target.value,
            })
          }
          autoComplete="off"
        />
        {errors.name && <ErrorMessage message={errors.name} />}
      </Section>

      <ServiceSection>
        {Object.keys(filteredServices).map((service) =>
          typeof services[service] === "object" ? (
            <ServiceWithSize
              key={service}
              service={service}
              sizes={Object.keys(prices[service])}
              selectedSize={selectedSize[service]}
              quantities={services[service]}
              onSelectSize={(size) =>
                dispatchState({
                  type: "SET_FIELD",
                  field: "selectedSize",
                  value: { ...selectedSize, [service]: size },
                })
              }
              onQuantityChange={(size, value) =>
                dispatchState({
                  type: "SET_SERVICES",
                  services: {
                    [service]: {
                      ...services[service],
                      [size]: value > 0 ? value : 0,
                    },
                  },
                })
              }
            />
          ) : (
            <ServiceButton
              key={service}
              service={service}
              quantity={services[service]}
              onIncrease={() =>
                dispatchState({
                  type: "SET_SERVICES",
                  services: { [service]: services[service] + 1 },
                })
              }
              onDecrease={() =>
                dispatchState({
                  type: "SET_SERVICES",
                  services: { [service]: Math.max(services[service] - 1, 0) },
                })
              }
            />
          )
        )}
      </ServiceSection>

      {errors.noService && <ErrorMessage message={errors.noService} />}

      <Section>
        <Label htmlFor="observations">Observaciones:</Label>
        <Textarea
          id="observations"
          name="observations"
          value={observations}
          onChange={(e) =>
            dispatchState({
              type: "SET_FIELD",
              field: "observations",
              value: e.target.value,
            })
          }
        />
      </Section>

      <Section>
        <Label htmlFor="abono">Abono:</Label>
        <AbonoInput
          type="number"
          id="abono"
          name="abono"
          value={abono}
          onChange={(e) =>
            dispatchState({
              type: "SET_FIELD",
              field: "abono",
              value: Number(e.target.value),
            })
          }
          min="0"
        />
        {errors.abono && <ErrorMessage message={errors.abono} />}
      </Section>

      <Section>
        <CheckboxLabel>
          <input
            type="checkbox"
            id="suavitelDesired"
            name="suavitelDesired"
            checked={suavitelDesired}
            onChange={() =>
              dispatchState({
                type: "SET_FIELD",
                field: "suavitelDesired",
                value: !suavitelDesired,
              })
            }
          />
          ¿Desea Suavitel?
        </CheckboxLabel>
      </Section>

      <Section>
        <CheckboxLabel>
          <input
            type="checkbox"
            id="isPaid"
            name="isPaid"
            checked={isPaid}
            onChange={() =>
              dispatchState({
                type: "SET_FIELD",
                field: "isPaid",
                value: !isPaid,
              })
            }
          />
          ¿Está pagado?
        </CheckboxLabel>
      </Section>

      <Total>Total: ${calculatedTotal.toFixed(2)}</Total>

      {errors.total && <ErrorMessage message={errors.total} />}

      <Button type="button" onClick={handleOpenModal}>
        Guardar Nota
      </Button>

      <ConfirmationModal
        showModal={showModal}
        handleClose={handleCloseModal}
        handleSubmit={handleSubmit}
        name={name}
        calculatedTotal={calculatedTotal}
        countryCodes={[
          { name: "México", code: "52" },
          { name: "Estados Unidos/Canada", code: "1" },
          { name: "España", code: "34" },
        ]}
        countryCode={countryCode}
        setCountryCode={(code) =>
          dispatchState({
            type: "SET_FIELD",
            field: "countryCode",
            value: code,
          })
        }
        phoneNumber={phoneNumber}
        setPhoneNumber={(number) =>
          dispatchState({
            type: "SET_FIELD",
            field: "phoneNumber",
            value: number,
          })
        }
        loading={loading}
        submitError={submitError}
        folio={folio}
        services={services}
        date={date}
        isPaid={isPaid}
        observations={observations}
        transformServices={() => transformServices(services, prices)} // Pasar la función transformServices
      />
    </Container>
  );
};

// Estilos y exportación...

const BackButton = styled.button`
  padding: 12px 20px;
  background-color: #6c757d;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #5a6268;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 20px auto;
  font-family: "Roboto", sans-serif;
  color: #333;

  @media (max-width: 768px) {
    padding: 15px;
    max-width: 90%;
  }
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 24px;
    color: #007bff;

    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
`;

const FolioDateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;

  .folio {
    font-weight: bold;
    font-size: 1.2em;
    color: #28a745;
  }

  @media (max-width: 768px) {
    align-items: flex-start;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    margin-bottom: 10px;
  }
`;

const Label = styled.label`
  font-size: 1.2em;
  margin-bottom: 5px;
  font-weight: bold;
  color: #444;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border 0.3s;

  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const Textarea = styled.textarea`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border 0.3s;

  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const ServiceSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 3fr));
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 1.2em;
  color: #555;

  input {
    margin-right: 8px;
  }
`;

const Total = styled.div`
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #222;
`;

const Button = styled.button`
  padding: 12px 20px;
  background-color: #007bff;
  margin-top: 15px;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1.2em;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px 15px;
  }
`;

const AbonoInput = styled(Input)`
  max-width: 200px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export default LaundryNote;
