import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { notesCreate } from "../../../features/notesSlice";
import ServiceButton from "../ServiceButton";
import ServiceWithSize from "../ServiceWithSize";
import ConfirmationModal from "../../ConfirmationModal";
import { ErrorMessage } from "../../LoadingAndError";
import { validate } from "./validateNote";
import moment from "moment";
import styled from "styled-components";

const generateFolio = () => `FOLIO-${Math.floor(Math.random() * 1000000)}`;

const LaundryNote = () => {
  const dispatch = useDispatch();
  const [name, setClientName] = useState("");
  const [folio, setFolio] = useState(() => generateFolio());
  const [date, setDate] = useState(() => moment().format("YYYY-MM-DD HH:mm")); // Guarda la fecha en formato local

  const initialServicesState = {
    ropaPorKilo: 0,
    secado: 0,
    lavadoExpress: 0,
    toallasSabanas: 0,
    cortinasManteles: 0,
    cubrecolchon: 0,
    hamaca: 0,
    tennis: 0,
    edredon: {},
    cobija: {},
    extras: {},
    almohada: {},
  };

  const [services, setServices] = useState(initialServicesState);
  const [observations, setObservations] = useState("");
  const [abono, setAbono] = useState(0);
  const [suavitelDesired, setSuavitelDesired] = useState(false);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState({});
  const [isPaid, setIsPaid] = useState(false);
  const [paidAt, setPaidAt] = useState("");
  const [selectedSize, setSelectedSize] = useState({
    edredon: "individual",
    cobija: "individual",
    almohada: "chica",
    extras: "suavitel",
  });

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+52");
  const countryCodes = [
    { name: "México", code: "+52" },
    { name: "Estados Unidos/Canada", code: "+1" },
    { name: "España", code: "+34" },
  ];
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const prefixNumber = `${countryCode}${phoneNumber}`;

  const handleOpenModal = () => {
    const validationErrors = validate(name, abono, services);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setShowModal(false);
      return;
    }
    setShowModal(true);
  };

  const prices = {
    ropaPorKilo: 14,
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
  };

  const calculateSubtotal = (services, prices) => {
    let subtotal = 0;
    for (const service in services) {
      if (typeof services[service] === "object") {
        for (const size in services[service]) {
          if (prices[service][size]) {
            subtotal += services[service][size] * prices[service][size];
          }
        }
      } else {
        subtotal += services[service] * prices[service];
      }
    }
    return subtotal;
  };

  const calculateTotal = (subtotal, abono, suavitelDesired) => {
    if (suavitelDesired) {
      const kgRopa = services.ropaPorKilo;
      const suavitelShots = Math.ceil(kgRopa / 6);
      subtotal += suavitelShots * prices.vanishCloroSuavitel;
    }
    return subtotal - abono;
  };

  const calculatedTotal = useMemo(() => {
    const subtotal = calculateSubtotal(services, prices);
    return calculateTotal(subtotal, abono, suavitelDesired);
  }, [services, abono, suavitelDesired]);

  const transformServices = () => {
    const transformedServices = {};

    for (const service in services) {
      if (typeof services[service] === "object") {
        transformedServices[service] = {};
        for (const size in services[service]) {
          if (services[service][size] > 0) {
            transformedServices[service][size] = {
              quantity: services[service][size],
              unitPrice: prices[service][size],
            };
          }
        }
      } else if (services[service] > 0) {
        transformedServices[service] = {
          quantity: services[service],
          unitPrice: prices[service],
        };
      }
    }

    return transformedServices;
  };

  const handleSubmit = async () => {
    const validationErrors = validate(name, abono, services);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const transformedServices = transformServices();
      await dispatch(
        notesCreate({
          name,
          folio,
          date: moment().format("YYYY-MM-DD HH:mm"), // Guarda la fecha en formato local
          services: transformedServices,
          observations,
          abono,
          suavitelDesired,
          total: calculatedTotal,
          note_status: isPaid ? "pagado" : "pendiente",
          paidAt: isPaid ? moment().format("YYYY-MM-DD HH:mm") : null, // Guarda la fecha de pago en formato local
          phoneNumber: prefixNumber,
        })
      );
      resetForm();
    } catch (error) {
      console.error("Error creating note:", error);
      setSubmitError("Error al crear la nota. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientName("");
    setFolio(generateFolio());
    setDate(moment().format("YYYY-MM-DD HH:mm")); // Reinicia la fecha en formato local
    setServices(initialServicesState);
    setObservations("");
    setAbono(0);
    setSuavitelDesired(false);
    setIsPaid(false);
    setPaidAt("");
    setTotal(0);
    setErrors({});
    setShowModal(false);
  };

  useEffect(() => {
    if (isPaid) {
      setPaidAt(moment().format("YYYY-MM-DD HH:mm")); // Actualiza la fecha de pago en formato local
    } else {
      setPaidAt("");
    }
  }, [isPaid]);

  const capitalizeFirstLetter = (str) =>
    str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

  const renderServiceButton = (service) => (
    <ServiceButton
      key={service}
      service={capitalizeFirstLetter(service.replace(/([A-Z])/g, " $1"))}
      quantity={services[service]}
      onIncrease={() =>
        setServices((prevServices) => ({
          ...prevServices,
          [service]: prevServices[service] + 1,
        }))
      }
      onDecrease={() =>
        setServices((prevServices) => ({
          ...prevServices,
          [service]: Math.max(prevServices[service] - 1, 0),
        }))
      }
    />
  );

  const renderServiceWithSize = (service) => (
    <ServiceWithSize
      key={service}
      service={service}
      sizes={Object.keys(prices[service])}
      selectedSize={selectedSize[service]}
      quantities={services[service]}
      onSelectSize={(size) =>
        setSelectedSize({
          ...selectedSize,
          [service]: size,
        })
      }
      onQuantityChange={(size, value) =>
        setServices((prevServices) => ({
          ...prevServices,
          [service]: {
            ...prevServices[service],
            [size]: value,
          },
        }))
      }
    />
  );

  const formattedDate = moment(date).format("YYYY-MM-DD / HH:mm");

  return (
    <Container>
      <NoteHeader>
        <h2>Nota de Lavandería</h2>
        <FolioDateContainer>
          <div className="folio">{folio}</div>
          <div>
            <strong>Fecha:</strong> {formattedDate}
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
          onChange={(e) => setClientName(e.target.value)}
          autoComplete="off"
        />
        {errors.name && <ErrorMessage message={errors.name}></ErrorMessage>}
      </Section>

      <ServiceSection>
        {Object.keys(services).map((service) => {
          const isSizeService = [
            "edredon",
            "cobija",
            "extras",
            "almohada",
          ].includes(service);

          return isSizeService
            ? renderServiceWithSize(service)
            : renderServiceButton(service);
        })}
      </ServiceSection>

      {errors.noService && (
        <ErrorMessage message={errors.noService}></ErrorMessage>
      )}

      <Section>
        <Label htmlFor="observations">Observaciones:</Label>
        <Textarea
          id="observations"
          name="observations"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
        ></Textarea>
      </Section>

      <Section>
        <Label htmlFor="abono">Abono:</Label>
        <AbonoInput
          className="abono"
          type="number"
          id="abono"
          name="abono"
          value={abono}
          onChange={(e) => setAbono(Number(e.target.value))}
          min="0"
        />
        {errors.abono && <ErrorMessage message={errors.abono}></ErrorMessage>}
      </Section>

      <Section>
        <CheckboxLabel>
          <input
            type="checkbox"
            id="suavitelDesired"
            name="suavitelDesired"
            checked={suavitelDesired}
            onChange={() => setSuavitelDesired(!suavitelDesired)}
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
            onChange={() => setIsPaid(!isPaid)}
          />
          ¿Está pagado?
        </CheckboxLabel>
      </Section>

      <Total>Total: ${calculatedTotal.toFixed(2)}</Total>

      {errors.total && <ErrorMessage message={errors.total}></ErrorMessage>}

      <Button type="button" onClick={handleOpenModal} disabled={loading}>
        Guardar Nota
      </Button>

      <ConfirmationModal
        showModal={showModal}
        handleClose={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        name={name}
        calculatedTotal={calculatedTotal}
        countryCodes={countryCodes}
        countryCode={countryCode}
        setCountryCode={setCountryCode}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        loading={loading}
        submitError={submitError}
      ></ConfirmationModal>
    </Container>
  );
};


const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f7f7f7;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 20px auto;
  font-family: "Arial", sans-serif;
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
    color: #222;

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
    color: #007bff;
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
  margin-bottom: 5px;
  font-weight: bold;
  color: #444;
`;

const Input = styled.input`
  padding: 10px;
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
  padding: 10px;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 16px;
  color: #555;

  input {
    margin-right: 8px;
  }
`;

const Total = styled.div`
  font-size: 20px;
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
  font-size: 16px;
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
