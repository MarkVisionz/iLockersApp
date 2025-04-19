import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { notesCreate } from "../../features/notesSlice";
import { fetchServices } from "../../features/servicesSlice";
import ServiceButton from "../admin/ServiceButton";
import ServiceWithSize from "../admin/ServiceWithSize";
import ConfirmationModal from "../ConfirmationModal";
import { ErrorMessage } from "../LoadingAndError";
import { validate } from "../admin/list/validateNote";
import moment from "moment";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { FloatingInput } from "../admin/CommonStyled";
import { toast } from "react-toastify";

// Estado inicial simplificado
const initialState = {
  name: "",
  folio: `FOLIO-${Math.floor(Math.random() * 1000000)}`,
  services: {},
  observations: "",
  abono: 0,
  suavitelDesired: false,
  isPaid: false,
  phoneNumber: "",
  countryCode: "52",
  errors: {},
  prices: {}
};

const LaundryNote = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Estado del formulario
  const [formState, setFormState] = useState(initialState);
  const [showModal, setShowModal] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Obtener servicios de Redux
  const { items: services, status: servicesStatus } = useSelector(state => state.services);
  const loading = servicesStatus === 'loading';

  // Cargar servicios al montar el componente
  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Procesar servicios cuando se cargan
  useEffect(() => {
    if (services.length > 0) {
      const { prices, servicesState } = services.reduce(
        (acc, service) => {
          const key = service.name.toLowerCase().replace(/\s+/g, "");

          if (service.type === "simple") {
            acc.prices[key] = service.price;
            acc.servicesState[key] = 0;
          } else if (service.type === "sized") {
            acc.prices[key] = {};
            acc.servicesState[key] = {};

            service.sizes.forEach((size) => {
              acc.prices[key][size.name] = size.price;
              acc.servicesState[key][size.name] = 0;
            });
          }

          return acc;
        },
        { prices: {}, servicesState: {} }
      );

      setFormState(prev => ({
        ...prev,
        services: servicesState,
        prices
      }));
    }
  }, [services]);

  // Filtrado y cálculo de totales
  const { filteredServices, calculatedTotal } = useMemo(() => {
    const today = new Date().getDay();
    const isPromoDay = today === 2 || today === 4;
    
    // Filtrar servicios
    const filtered = { ...formState.services };
    if (isPromoDay) delete filtered.ropaporkilo;
    else delete filtered.promomartes;
    
    // Calcular total
    const subtotal = Object.entries(formState.services).reduce((acc, [key, value]) => {
      if (typeof value === "object") {
        return acc + Object.entries(value).reduce((sizeAcc, [size, quantity]) => {
          return sizeAcc + quantity * (formState.prices[key]?.[size] || 0);
        }, 0);
      }
      return acc + value * (formState.prices[key] || 0);
    }, 0);

    const suavitelCost = formState.suavitelDesired && formState.services.ropaporkilo
      ? Math.ceil(formState.services.ropaporkilo / 6) * 10 // Precio fijo de Suavitel
      : 0;

    return {
      filteredServices: filtered,
      calculatedTotal: subtotal - formState.abono + suavitelCost
    };
  }, [formState]);

  // Handlers del formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      errors: {
        ...prev.errors,
        [name]: undefined
      }
    }));
  };

  const handleServiceChange = (serviceKey, value) => {
    setFormState(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceKey]: value
      },
      errors: {
        ...prev.errors,
        noService: undefined
      }
    }));
  };

  // Preparar servicios para la API
  const prepareServicesForAPI = useCallback(() => {
    return Object.entries(formState.services).reduce((acc, [service, value]) => {
      if (typeof value === "object") {
        const sizes = Object.entries(value)
          .filter(([_, quantity]) => quantity > 0)
          .reduce((sizeAcc, [size, quantity]) => ({
            ...sizeAcc,
            [size]: { quantity, unitPrice: formState.prices[service][size] }
          }), {});

        if (Object.keys(sizes).length > 0) {
          acc[service] = sizes;
        }
      } else if (value > 0) {
        acc[service] = { quantity: value, unitPrice: formState.prices[service] };
      }
      return acc;
    }, {});
  }, [formState]);

  // Enviar nota a la API
  const handleSubmit = async () => {
    const validationErrors = validate(formState.name, formState.abono, formState.services);
    if (Object.keys(validationErrors).length > 0) {
      setFormState(prev => ({ ...prev, errors: validationErrors }));
      return;
    }

    try {
      await dispatch(notesCreate({
        name: formState.name,
        folio: formState.folio,
        date: moment().format("YYYY-MM-DD HH:mm"),
        services: prepareServicesForAPI(),
        observations: formState.observations,
        abono: formState.abono,
        suavitelDesired: formState.suavitelDesired,
        total: calculatedTotal,
        note_status: formState.isPaid ? "pagado" : "pendiente",
        phoneNumber: `${formState.countryCode}${formState.phoneNumber}`,
      }));

      // Enviar mensaje de WhatsApp
      sendWhatsAppMessage();
      
      // Resetear formulario
      setFormState({
        ...initialState,
        folio: `FOLIO-${Math.floor(Math.random() * 1000000)}`
      });
      setShowModal(false);
      toast.success("Nota creada exitosamente");
      
    } catch (error) {
      setSubmitError("Error al crear la nota");
      console.error("Error:", error);
      toast.error("Error al crear la nota");
    }
  };

  // Enviar mensaje por WhatsApp
  const sendWhatsAppMessage = () => {
    const formatServiceName = (name) => {
      return name
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^\w/, c => c.toUpperCase());
    };

    const servicesText = Object.entries(prepareServicesForAPI())
      .flatMap(([service, details]) => {
        if (details.quantity > 0) {
          return [
            `• ${formatServiceName(service)}: ${details.quantity} x $${details.unitPrice} = $${details.quantity * details.unitPrice}`
          ];
        } else if (typeof details === "object") {
          return Object.entries(details)
            .filter(([_, subDetails]) => subDetails.quantity > 0)
            .map(([size, subDetails]) => 
              `• ${formatServiceName(service)} (${size}): ${subDetails.quantity} x $${subDetails.unitPrice} = $${subDetails.quantity * subDetails.unitPrice}`
            );
        }
        return [];
      })
      .join("\n");

    const message = `😀 Hola, ${formState.name}!\n\n📝 Folio: ${formState.folio}\n🛍️ Servicios:\n${servicesText}\n💰 Total: $${calculatedTotal.toFixed(2)}\n📱 Teléfono: +${formState.countryCode}${formState.phoneNumber}`;

    const url = `https://wa.me/${formState.countryCode}${formState.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Renderizado de servicios
  const renderServices = () => {
    if (!services.length) return null;

    const simpleServices = services.filter(s => 
      filteredServices.hasOwnProperty(s.name.toLowerCase().replace(/\s+/g, "")) && 
      s.type === "simple"
    );

    const sizedServices = services.filter(s => 
      filteredServices.hasOwnProperty(s.name.toLowerCase().replace(/\s+/g, "")) && 
      s.type === "sized"
    );

    return (
      <>
        <SimpleServicesContainer>
          {simpleServices.map(service => {
            const key = service.name.toLowerCase().replace(/\s+/g, "");
            return (
              <ServiceButton
                key={key}
                displayName={service.name}
                price={service.price}
                quantity={formState.services[key] || 0}
                onIncrease={() => handleServiceChange(key, (formState.services[key] || 0) + 1)}
                onDecrease={() => handleServiceChange(key, Math.max((formState.services[key] || 0) - 1, 0))}
                onQuantityChange={value => handleServiceChange(key, value)}
              />
            );
          })}
        </SimpleServicesContainer>

        <SizedServicesContainer>
          {sizedServices.map(service => {
            const key = service.name.toLowerCase().replace(/\s+/g, "");
            return (
              <ServiceWithSize
                key={key}
                displayName={service.name}
                sizes={service.sizes.map(s => s.name)}
                prices={Object.fromEntries(service.sizes.map(s => [s.name, s.price]))}
                quantities={formState.services[key] || {}}
                onQuantityChange={(size, value) => 
                  handleServiceChange(key, {
                    ...formState.services[key],
                    [size]: Math.max(value, 0)
                  })
                }
              />
            );
          })}
        </SizedServicesContainer>
      </>
    );
  };

  if (servicesStatus === 'loading') return <Container>Cargando servicios...</Container>;
  if (servicesStatus === 'failed') return <Container><ErrorMessage message="Error cargando servicios" /></Container>;

  return (
    <Container>
      <BackButton onClick={() => navigate("/admin/notes-summary")}>
        Regresar al Menú
      </BackButton>

      <NoteHeader>
        <h2>Nota de Lavandería</h2>
        <FolioDateContainer>
          <div className="folio">{formState.folio}</div>
          <div>
            <strong>Fecha:</strong> {moment().format("YYYY-MM-DD / HH:mm")}
          </div>
        </FolioDateContainer>
      </NoteHeader>

      <FloatingInput>
        <input
          type="text"
          id="name"
          name="name"
          value={formState.name}
          onChange={handleInputChange}
          autoComplete="off"
        />
        <label className={formState.name ? "filled" : ""} htmlFor="name">
          Nombre del Cliente
        </label>
        {formState.errors.name && <ErrorMessage message={formState.errors.name} />}
      </FloatingInput>

      <ServiceSection>
        {renderServices()}
        {formState.errors.noService && <ErrorMessage message={formState.errors.noService} />}
      </ServiceSection>

      <FloatingInput>
        <textarea
          id="observations"
          name="observations"
          value={formState.observations}
          onChange={handleInputChange}
        />
        <label className={formState.observations ? "filled" : ""} htmlFor="observations">
          Observaciones
        </label>
      </FloatingInput>

      <FloatingInput>
        <input
          type="number"
          id="abono"
          name="abono"
          value={formState.abono}
          onChange={handleInputChange}
          min="0"
        />
        <label className={formState.abono ? "filled" : ""} htmlFor="abono">
          Abono
        </label>
        {formState.errors.abono && <ErrorMessage message={formState.errors.abono} />}
      </FloatingInput>

      <Section>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={formState.suavitelDesired}
            onChange={() => setFormState(prev => ({
              ...prev,
              suavitelDesired: !prev.suavitelDesired
            }))}
          />
          ¿Desea Suavitel?
        </CheckboxLabel>
      </Section>

      <Section>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={formState.isPaid}
            onChange={() => setFormState(prev => ({
              ...prev,
              isPaid: !prev.isPaid
            }))}
          />
          ¿Está pagado?
        </CheckboxLabel>
      </Section>

      <Total>Total: ${calculatedTotal.toFixed(2)}</Total>

      <Button
        onClick={() => {
          const errors = validate(formState.name, formState.abono, formState.services);
          if (Object.keys(errors).length > 0) {
            setFormState(prev => ({ ...prev, errors }));
          } else {
            setShowModal(true);
          }
        }}
        disabled={loading}
      >
        Guardar Nota
      </Button>

      <ConfirmationModal
        showModal={showModal}
        handleClose={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        name={formState.name}
        total={calculatedTotal}
        phoneNumber={formState.phoneNumber}
        countryCode={formState.countryCode}
        onPhoneChange={(number) => setFormState(prev => ({
          ...prev,
          phoneNumber: number
        }))}
        onCountryCodeChange={(code) => setFormState(prev => ({
          ...prev,
          countryCode: code
        }))}
        loading={loading}
        error={submitError}
        folio={formState.folio}
      />
    </Container>
  );
};

// Estilos (usando la opción 2 - Rappi)
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  margin: 2rem auto;
  font-family: "Poppins", sans-serif;
  color: #333;

  @media (max-width: 768px) {
    padding: 1rem;
    margin: 1rem;
    max-width: 95%;
  }
`;

const BackButton = styled.button`
  align-self: flex-start;
  padding: 0.75rem 1.5rem;
  background-color: #6c757d;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background-color: #5a6268;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;

  h2 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: #007bff;

    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }
`;

const FolioDateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  font-size: 1rem;

  .folio {
    padding: 0.5rem 1rem;
    background-color: #28a745;
    color: #fff;
    border-radius: 6px;
    font-weight: 600;
  }

  strong {
    color: #333;
  }

  @media (max-width: 768px) {
    align-items: flex-start;
    font-size: 0.875rem;
  }
`;

const SimpleServicesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;

  & > * {
    background-color: #fff;
    border: 2px solid #007bff;
    border-radius: 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  & > *:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }
`;

const SizedServicesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;

  & > * {
    background-color: #fff;
    border: 2px solid #28a745;
    border-radius: 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  & > *:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }
`;

const ServiceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e9ecef;
  }

  input {
    width: 1.5rem;
    height: 1.5rem;
    cursor: pointer;
  }
`;

const Total = styled.div`
  padding: 1rem;
  background-color: #e9ecef;
  color: #333;
  border-radius: 8px;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: left;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Button = styled.button`
  align-self: center;
  padding: 1rem 2.5rem;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }

  &[disabled] {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 2rem;
    font-size: 1rem;
  }
`;

export default LaundryNote;