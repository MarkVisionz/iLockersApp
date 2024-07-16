import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { notesCreate } from "../../../features/notesSlice";
import ServiceButton from "../ServiceButton";
import ServiceWithSize from "../ServiceWithSize";

// Funciones helper
const generateFolio = () => {
  // Genera un folio único
  return `FOLIO-${Math.floor(Math.random() * 1000000)}`;
};

const getCurrentDate = () => {
  // Obtiene la fecha actual en formato YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const LaundryNote = () => {
  const dispatch = useDispatch();
  const [name, setClientName] = useState("");
  const [folio, setFolio] = useState(() => generateFolio());
  const [date, setDate] = useState(() => getCurrentDate());
  const [services, setServices] = useState({
    ropaPorKilo: 0,
    secado: 0,
    lavadoExpress: 0,
    toallasSabanas: 0,
    cortinasManteles: 0,
    cubrecolchon: 0,
    hamaca: 0,
    tennis: 0,
    // desengrasante: 0,
    edredon: {},
    cobija: {},
    extras: {},
    almohada: {},
  });
  const [observations, setObservations] = useState("");
  const [abono, setAbono] = useState(0);
  const [suavitelDesired, setSuavitelDesired] = useState(false);
  const [total, setTotal] = useState(0);
  const [noteStatus, setNoteStatus] = useState("pendiente");
  const [errors, setErrors] = useState({});
  const [isPaid, setIsPaid] = useState(false);
  const [selectedSize, setSelectedSize] = useState({
    edredon: "individual",
    cobija: "individual",
    almohada: "chica",
    extras: "suavitel",
  });

  useEffect(() => {
    setTotal(calculateTotal());
  }, [services, abono, suavitelDesired]);

  const validate = () => {
    const errors = {};

    if (!name.trim()) errors.name = "El nombre del cliente es obligatorio";
    if (abono < 0) errors.abono = "El abono no puede ser negativo";

    let hasService = false;

    for (const service in services) {
      if (typeof services[service] === "object") {
        for (const size in services[service]) {
          if (services[service][size] < 0) {
            errors[service] = "La cantidad no puede ser negativa";
          } else if (services[service][size] > 0) {
            hasService = true;
          }
        }
      } else {
        if (services[service] < 0) {
          errors[service] = "El valor no puede ser negativo";
        } else if (services[service] > 0) {
          hasService = true;
        }
      }
    }

    if (!hasService) {
      errors.noService = "Debe seleccionar al menos un servicio.";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await dispatch(
        notesCreate({
          name,
          folio,
          date,
          services,
          observations,
          abono,
          suavitelDesired,
          total: calculatedTotal,
          note_status: isPaid ? "pagado" : "pendiente",
        })
      );
      setClientName("");
      setFolio(generateFolio());
      setDate(getCurrentDate());
      setServices({
        ropaPorKilo: 0,
        secado: 0,
        lavadoExpress: 0,
        toallasSabanas: 0,
        cortinasManteles: 0,
        cubrecolchon: 0,
        hamaca: 0,
        tennis: 0,
        vanishCloroSuavitel: 0,
        // desengrasante: 0,
        edredon: {},
        cobija: {},
        extras: {},
        almohada: {},
      });
      setObservations("");
      setAbono(0);
      setSuavitelDesired(false);
      setIsPaid(false);
      setTotal(0);
      setErrors({});
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const prices = {
    ropaPorKilo: 14,
    secado: 10,
    lavadoExpress: 18,
    toallasSabanas: 16,
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
      cloro:10,
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
    // desengrasante: 25,
  };

  const calculateTotal = () => {
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

    if (suavitelDesired) {
      const kgRopa = services.ropaPorKilo;
      const suavitelShots = Math.ceil(kgRopa / 6);
      const suavitelCost = suavitelShots * prices.vanishCloroSuavitel;
      subtotal += suavitelCost;
    }

    return subtotal - abono;
  };

  const calculatedTotal = useMemo(
    () => calculateTotal(),
    [services, abono, suavitelDesired]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("Type") || name.includes("Quantity")) {
      const serviceName = name.split(/(?=[A-Z])/)[0];
      const serviceKey = name.includes("Type") ? "type" : "quantity";
      setServices({
        ...services,
        [serviceName]: {
          ...services[serviceName],
          [serviceKey]: serviceKey === "type" ? value : Number(value),
        },
      });
    } else {
      if (name === "ropaPorKilo" && value !== "") {
        const kgRopa = Number(value);
        setServices({ ...services, [name]: kgRopa });
      } else {
        setServices({ ...services, [name]: Number(value) });
      }
    }
  };

  const capitalizeFirstLetter = (str) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  return (
    <Container>
      <NoteHeader>
        <h2>Nota de Lavandería</h2>
        <FolioDateContainer>
          <div className="folio">{folio}</div>
          <div>
            <strong>Fecha:</strong> {date}
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
        {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
      </Section>

      <ServiceSection>
        {Object.keys(services).map((service) =>
          service !== "edredon" &&
          service !== "cobija" &&
          service !== "extras" &&
          service !== "almohada" ? (
            <ServiceButton
              key={service}
              service={capitalizeFirstLetter(
                service.replace(/([A-Z])/g, " $1")
              )}
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
          ) : (
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
                setServices({
                  ...services,
                  [service]: {
                    ...services[service],
                    [size]: value,
                  },
                })
              }
            />
          )
        )}
      </ServiceSection>

      {errors.noService && <ErrorMessage>{errors.noService}</ErrorMessage>}
      {errors.total && <ErrorMessage>{errors.total}</ErrorMessage>}

      <Section>
        <Label htmlFor="abono">Abono:</Label>
        <Input
          className="abono"
          type="number"
          id="abono"
          name="abono"
          value={abono}
          onChange={(e) => setAbono(Number(e.target.value))}
          min="0"
        />
        {errors.abono && <ErrorMessage>{errors.abono}</ErrorMessage>}
      </Section>

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

      <Button type="submit" onClick={handleSubmit}>
        Guardar Nota
      </Button>
    </Container>
  );
};

// Styled components

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 20px auto;
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  h2 {
    margin: 0;
  }
`;

const FolioDateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  .folio {
    font-weight: bold;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Textarea = styled.textarea`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ServiceSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 5px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  input {
    margin-right: 5px;
  }
`;

const Total = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 18px;
  margin-top: 5px;
  margin-bottom: 5px;
`;

export default LaundryNote;
