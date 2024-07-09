import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { notesCreate } from "../../../features/notesSlice";

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
    edredon: { type: "", quantity: 0 },
    cobija: { type: "", quantity: 0 },
    almohada: { type: "", quantity: 0 },
    cortinasManteles: 0,
    cubrecolchon: 0,
    hamaca: 0,
    tennis: 0,
    vanishCloroSuavitel: 0,
  });
  const [observations, setObservations] = useState("");
  const [abono, setAbono] = useState(0);
  const [suavitelDesired, setSuavitelDesired] = useState(false);
  const [total, setTotal] = useState(0);
  const [noteStatus, setNoteStatus] = useState("pendiente");
  const [errors, setErrors] = useState({});
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    setTotal(calculateTotal());
  }, [services, abono, suavitelDesired]);

  // Validate form data
  const validate = () => {
    const errors = {};

    if (!name.trim()) errors.name = "El nombre del cliente es obligatorio";
    if (abono < 0) errors.abono = "El abono no puede ser negativo";

    let hasService = false;

    for (const service in services) {
      if (
        (service === "edredon" ||
          service === "cobija" ||
          service === "almohada") &&
        services[service].quantity < 0
      ) {
        errors[service] = "La cantidad no puede ser negativa";
      } else if (
        services[service] < 0 ||
        (typeof services[service] === "object" &&
          services[service].quantity < 0)
      ) {
        errors[service] = "El valor no puede ser negativo";
      } else if (
        services[service] > 0 ||
        (typeof services[service] === "object" &&
          services[service].quantity > 0)
      ) {
        hasService = true;
      }
    }

    if (!hasService) {
      errors.noService = "Debe seleccionar al menos un servicio.";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
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
      // Clear form after successful submission
      setClientName("");
      setFolio(generateFolio());
      setDate(getCurrentDate());
      setServices({
        ropaPorKilo: 0,
        secado: 0,
        lavadoExpress: 0,
        toallasSabanas: 0,
        edredon: { type: "", quantity: 0 },
        cobija: { type: "", quantity: 0 },
        almohada: { type: "", quantity: 0 },
        cortinasManteles: 0,
        cubrecolchon: 0,
        hamaca: 0,
        tennis: 0,
        vanishCloroSuavitel: 0,
      });
      setObservations("");
      setAbono(0);
      setSuavitelDesired(false);
      setIsPaid(false);
      setTotal(0);
      setErrors({});
    } catch (error) {
      console.error("Error creating note:", error);
      // Handle error state or notification here
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
    almohada: {
      chica: 30,
      grande: 60,
    },
    cubrecolchon: 60,
    hamaca: 70,
    tennis: 120,
    vanishCloroSuavitel: 15,
    cortinasManteles: 16,
  };

  // Calculate total cost
  const calculateTotal = () => {
    let subtotal = 0;
    for (const service in services) {
      if (
        service === "edredon" ||
        service === "cobija" ||
        service === "almohada"
      ) {
        if (services[service].type) {
          subtotal +=
            services[service].quantity *
            prices[service][services[service].type];
        }
      } else {
        subtotal += services[service] * prices[service];
      }
    }

    // Calculate additional Suavitel cost based on 3 kg increments
    if (suavitelDesired) {
      const kgRopa = services.ropaPorKilo;
      const suavitelShots = Math.ceil(kgRopa / 6);
      const suavitelCost = suavitelShots * prices.vanishCloroSuavitel;
      subtotal += suavitelCost;
    }

    return subtotal - abono;
  };

  // Use useMemo to optimize the calculation of total
  const calculatedTotal = useMemo(
    () => calculateTotal(),
    [services, abono, suavitelDesired]
  );

  // Handle input changes for service fields
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

  // // Toggle suavitel desired state
  // const toggleSuavitelDesired = () => {
  //   setSuavitelDesired(!suavitelDesired);
  // };

  // Capitalize the first letter of a string
  const capitalizeFirstLetter = (str) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  return (
    <NoteContainer>
      <form onSubmit={handleSubmit}>
        <NoteHeader>
          <h2>Nota de Lavandería</h2>
          <FolioDateContainer>
            <div>
              <strong>Folio:</strong> {folio}
            </div>
            <div>
              <strong>Fecha:</strong> {date}
            </div>
          </FolioDateContainer>
        </NoteHeader>
        <NoteContent>
          <Label>Cliente:</Label>
          <Input value={name} onChange={(e) => setClientName(e.target.value)} />
          {errors.name && <Error>{errors.name}</Error>}
          {Object.keys(services).map((service) =>
            service !== "edredon" &&
            service !== "cobija" &&
            service !== "almohada" ? (
              <div key={service}>
                <Label>
                  {capitalizeFirstLetter(service.replace(/([A-Z])/g, " $1"))}
                </Label>
                <Input
                  type="number"
                  name={service}
                  value={services[service]}
                  onChange={handleInputChange}
                  min="0"
                />
                {errors[service] && <Error>{errors[service]}</Error>}
              </div>
            ) : (
              <ServiceContainer key={service}>
                <Label>
                  {service.charAt(0).toUpperCase() + service.slice(1)}:
                </Label>
                <Select
                  name={`${service}Type`}
                  value={services[service].type}
                  onChange={handleInputChange}
                >
                  <option value="">Seleccionar tipo</option>
                  {Object.keys(prices[service]).map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </Select>
                <Label>Cantidad:</Label>
                <Input
                  type="number"
                  name={`${service}Quantity`}
                  value={services[service].quantity}
                  onChange={handleInputChange}
                  min="0"
                />
                {errors[service] && <Error>{errors[service]}</Error>}
              </ServiceContainer>
            )
          )}
          {errors.noService && <Error>{errors.noService}</Error>}
          <CheckboxLabel>
             <input
            type="checkbox"
            name="suavitelDesired"
            checked={suavitelDesired}
            onChange={(e) => setSuavitelDesired(e.target.checked)}
          />
          Agregar Suavitel?
          </CheckboxLabel>
          <CheckboxLabel>
            <input
              type="checkbox"
              name="isPaid"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
            />
            Pagado
          </CheckboxLabel>
          <Label>Observaciones:</Label>
          <TextArea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
          <Label>Abono:</Label>
          <Input
            type="number"
            value={abono}
            onChange={(e) => setAbono(Number(e.target.value))}
            min="0"
          />
          {errors.abono && <Error>{errors.abono}</Error>}
          <Total>Total: ${calculatedTotal.toFixed(2)}</Total>
        </NoteContent>

        <NoteFooter>
          <h3>Políticas</h3>
          <p>
            Después de la fecha de entrega solo tendrá 24 horas para hacer
            cualquier reclamación.
          </p>
          <p>
            No se separa ropa, en caso de que el cliente lo requiera se le
            cobrará lo que pese cada
          </p>
        </NoteFooter>

        <SubmitButton type="submit">Guardar Nota</SubmitButton>
      </form>
    </NoteContainer>
  );
};


// Styled components
const NoteContainer = styled.div`
  background-color: #fff;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 20px;
  width: 80%;
  max-width: 800px;
  margin: auto;
  margin-top: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const FolioDateContainer = styled.div`
  text-align: right;
`;

const NoteContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 768px) {
    gap: 5px;
  }
`;

const NoteFooter = styled.div`
  margin-top: 20px;

  h3 {
    margin-bottom: 5px;
  }

  p {
    margin: 0;
  }
`;

const Label = styled.label`
  font-weight: bold;
  display: block;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 6px;
  }
`;

const TextArea = styled.textarea`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 6px;
  }
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 6px;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
`;

const ServiceContainer = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 5px;
    align-items: flex-start;
  }
`;

const Error = styled.div`
  color: red;
  font-size: 0.8em;
  margin-top: 2px;
`;

const Total = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 10px;
`;

const SubmitButton = styled.button`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

// Helper functions

// Generate a unique folio
const generateFolio = () => {
  const date = new Date();
  const folio = `L${date.getTime()}`;
  return folio;
};

// Get current date in format dd/mm/yyyy
const getCurrentDate = () => {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default LaundryNote;
