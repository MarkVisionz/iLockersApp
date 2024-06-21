import React, { useState } from "react";
import styled from "styled-components";

const LaundryNote = () => {
  const [clientName, setClientName] = useState("");
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
      const suavitelShots = Math.ceil(kgRopa / 3);
      const suavitelCost = suavitelShots * prices.vanishCloroSuavitel;
      subtotal += suavitelCost;
    }

    return subtotal - abono;
  };

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

  const toggleSuavitelDesired = () => {
    setSuavitelDesired(!suavitelDesired);
  };

  const capitalizeFirstLetter = (str) => {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  return (
    <NoteContainer>
      <NoteHeader>
        <h2>Nota de Lavandería</h2>
      </NoteHeader>
      <NoteContent>
        <Label>Cliente:</Label>
        <Input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
        <Label>Folio:</Label>
        <Input value={folio} disabled />
        <Label>Fecha:</Label>
        <Input type="date" value={date} disabled />

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
            </ServiceContainer>
          )
        )}

        <CheckboxLabel>
          <input
            type="checkbox"
            checked={suavitelDesired}
            onChange={toggleSuavitelDesired}
          />
          Agregar Suavitel
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

        <Total>Total: ${calculateTotal().toFixed(2)}</Total>
      </NoteContent>

      <NoteFooter>
        <h3>Políticas</h3>
        <p>
          Después de la fecha de entrega solo tendrá 24 horas para hacer
          cualquier reclamación.
        </p>
        <p>
          No se separa ropa, en caso de que el cliente lo requiera se le cobrará
          lo que pese cada color.
        </p>
        <h3>Promociones</h3>
        <p>$11 pesos/kg los martes y jueves (mínimo 4 kg).</p>
      </NoteFooter>
    </NoteContainer>
  );
};

const generateFolio = () => {
  return `FOLIO-${Math.floor(Math.random() * 100000)}`;
};

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export default LaundryNote;

const NoteContainer = styled.div`
  background-color: #fff;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 800px;
  margin: auto;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const NoteHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
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

const Total = styled.p`
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 10px;
`;
