import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { notesCreate } from "../../features/notesSlice";
import { fetchServices } from "../../features/servicesSlice";
import ServiceButton from "../admin/ServiceButton";
import ServiceWithSize from "../admin/ServiceWithSize";
import ConfirmationModal from "../ConfirmationModal";
import PaymentMethodModal from "../PaymentMethodModal";
import { validate } from "../admin/list/validateNote";
import moment from "moment";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { FloatingInput } from "../admin/CommonStyled";
import { toast } from "react-toastify";
import { FiArrowLeft, FiCheck, FiDollarSign, FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

// Animaciones
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

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
  paymentMethod: null,
  abonoPaymentMethod: null,
  errors: {},
  prices: {},
};

const LaundryNote = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formState, setFormState] = useState(initialState);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [tempAbono, setTempAbono] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { items: services, status: servicesStatus } = useSelector(
    (state) => state.services
  );
  const loading = servicesStatus === "loading";

  // Inicializar servicios
  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Configurar precios y servicios
  const initializeServices = useCallback(() => {
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
    return { prices, services: servicesState };
  }, [services]);

  useEffect(() => {
    if (services.length > 0) {
      const { prices, services: servicesState } = initializeServices();
      setFormState((prev) => ({
        ...prev,
        services: servicesState,
        prices,
      }));
    }
  }, [services, initializeServices]);

  // Calcular totales con filtrado por día
  const { filteredServices, orderTotal, remainingAmount } = useMemo(() => {
    const today = new Date().getDay();
    const filtered = {};

    Object.entries(formState.services).forEach(([key, value]) => {
      const service = services.find(
        (s) => s.name.toLowerCase().replace(/\s+/g, "") === key
      );
      if (
        !service.availableDays ||
        (Array.isArray(service.availableDays) &&
          service.availableDays.length === 0) ||
        (Array.isArray(service.availableDays) &&
          service.availableDays.includes(today))
      ) {
        filtered[key] = value;
      }
    });

    const subtotal = Object.entries(filtered).reduce((acc, [key, value]) => {
      if (typeof value === "object") {
        return (
          acc +
          Object.entries(value).reduce((sizeAcc, [size, qty]) => {
            return sizeAcc + qty * (formState.prices[key]?.[size] || 0);
          }, 0)
        );
      }
      return acc + value * (formState.prices[key] || 0);
    }, 0);

    const suavitelPrice =
      services
        .find((s) => s.name.toLowerCase() === "extras")
        ?.sizes?.find((s) => s.name === "Suavitel")?.price || 15;
    const kilos = filtered.lavado || filtered.promomartes || 0;
    const suavitelShots = formState.suavitelDesired ? Math.ceil(kilos / 6) : 0;
    const suavitelCost = suavitelShots * suavitelPrice;

    const total = subtotal + suavitelCost;
    return {
      filteredServices: filtered,
      orderTotal: total,
      remainingAmount: total - formState.abono,
    };
  }, [formState, services]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      errors: { ...prev.errors, [name]: undefined },
    }));
  };

  const handleServiceChange = (serviceKey, value) => {
    setFormState((prev) => ({
      ...prev,
      services: { ...prev.services, [serviceKey]: value },
      errors: { ...prev.errors, noService: undefined },
    }));
  };

  const handleMarkAsPaid = () => {
    if (orderTotal <= 0) {
      toast.error("No se puede marcar como pagado cuando el total es $0");
      return;
    }
    setModalType("payment");
    setShowPaymentModal(true);
  };

  const handleAddAbono = () => {
    if (tempAbono <= 0) {
      toast.error("Por favor, ingresa una cantidad válida para el abono.");
      return;
    }
    if (tempAbono > orderTotal) {
      toast.error("El abono no puede ser mayor al total de la orden.");
      return;
    }
    setModalType("abono");
    setShowPaymentModal(true);
  };

  const handleRemoveAbono = () => {
    setFormState((prev) => ({
      ...prev,
      abono: 0,
      abonoPaymentMethod: null,
    }));
    setTempAbono(0);
  };

  const handlePaymentMethodSelect = (method) => {
    setFormState((prev) => ({
      ...prev,
      ...(modalType === "payment"
        ? {
            isPaid: true,
            paymentMethod: method,
            abono: 0,
            abonoPaymentMethod: null,
          }
        : {
            abono: tempAbono,
            abonoPaymentMethod: method,
            isPaid: false,
            paymentMethod: null,
          }),
    }));
    setShowPaymentModal(false);
    setModalType(null);
  };

  const prepareServicesForAPI = useCallback(() => {
    return Object.entries(formState.services).reduce(
      (acc, [service, value]) => {
        if (typeof value === "object") {
          const sizes = Object.entries(value)
            .filter(([_, qty]) => qty > 0)
            .reduce(
              (sizeAcc, [size, qty]) => ({
                ...sizeAcc,
                [size]: {
                  quantity: qty,
                  unitPrice: formState.prices[service][size],
                },
              }),
              {}
            );
          if (Object.keys(sizes).length > 0) acc[service] = sizes;
        } else if (value > 0) {
          acc[service] = {
            quantity: value,
            unitPrice: formState.prices[service],
          };
        }
        return acc;
      },
      {}
    );
  }, [formState]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (orderTotal <= 0) {
      toast.error("No se puede crear una nota con total $0");
      setIsSubmitting(false);
      return;
    }

    if (formState.isPaid && !formState.paymentMethod) {
      toast.error("Selecciona un método de pago para el pago total.");
      setIsSubmitting(false);
      return;
    }

    if (formState.abono > 0 && !formState.abonoPaymentMethod) {
      toast.error("Selecciona un método de pago para el abono.");
      setIsSubmitting(false);
      return;
    }

    if (formState.abono > orderTotal) {
      toast.error("El abono no puede ser mayor al total de la orden.");
      setIsSubmitting(false);
      return;
    }

    if (formState.isPaid && formState.abono > 0) {
      toast.error("No puedes marcar la nota como pagada y agregar un abono.");
      setIsSubmitting(false);
      return;
    }

    const validationErrors = validate(
      formState.name,
      formState.abono,
      formState.services
    );
    if (Object.keys(validationErrors).length > 0) {
      setFormState((prev) => ({ ...prev, errors: validationErrors }));
      setIsSubmitting(false);
      return;
    }

    try {
      await dispatch(
        notesCreate({
          name: formState.name,
          folio: formState.folio,
          date: moment().toISOString(),
          services: prepareServicesForAPI(),
          observations: formState.observations,
          abonos:
            formState.abono > 0
              ? [
                  {
                    amount: formState.abono,
                    date: moment().toISOString(),
                    method: formState.abonoPaymentMethod || "efectivo",
                  },
                ]
              : [],
          suavitelDesired: formState.suavitelDesired,
          total: orderTotal,
          note_status: formState.isPaid ? "pagado" : "pendiente",
          paidAt: formState.isPaid ? moment().toISOString() : null,
          phoneNumber: `${formState.countryCode}${formState.phoneNumber}`,
          paymentMethod: formState.paymentMethod || null,
        })
      ).unwrap();

      const { prices, services } = initializeServices();
      setFormState({
        ...initialState,
        folio: `FOLIO-${Math.floor(Math.random() * 1000000)}`,
        services,
        prices,
      });
      setTempAbono(0); 
      setShowModal(false);
    } catch (error) {
      setSubmitError("Error al crear la nota");
      toast.error("Error al crear la nota");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServices = () => {
    if (!services.length) return null;

    const simpleServices = services.filter(
      (s) =>
        filteredServices.hasOwnProperty(
          s.name.toLowerCase().replace(/\s+/g, "")
        ) && s.type === "simple"
    );

    const sizedServices = services.filter(
      (s) =>
        filteredServices.hasOwnProperty(
          s.name.toLowerCase().replace(/\s+/g, "")
        ) && s.type === "sized"
    );

    return (
      <ServicesGrid>
        {simpleServices.length > 0 && (
          <ServiceCategory>
            <CategoryTitle>Servicios Simples</CategoryTitle>
            <SimpleServicesContainer>
              {simpleServices.map((service) => {
                const key = service.name.toLowerCase().replace(/\s+/g, "");
                return (
                  <ServiceButton
                    key={key}
                    displayName={service.name}
                    price={service.price}
                    quantity={filteredServices[key] || 0}
                    onIncrease={() =>
                      handleServiceChange(
                        key,
                        (formState.services[key] || 0) + 1
                      )
                    }
                    onDecrease={() =>
                      handleServiceChange(
                        key,
                        Math.max((formState.services[key] || 0) - 1, 0)
                      )
                    }
                    onQuantityChange={(value) =>
                      handleServiceChange(key, value)
                    }
                  />
                );
              })}
            </SimpleServicesContainer>
          </ServiceCategory>
        )}

        {sizedServices.length > 0 && (
          <ServiceCategory>
            <CategoryTitle>Servicios por Tamaño</CategoryTitle>
            <SizedServicesContainer>
              {sizedServices.map((service) => {
                const key = service.name.toLowerCase().replace(/\s+/g, "");
                return (
                  <ServiceWithSize
                    key={key}
                    displayName={service.name}
                    sizes={service.sizes.map((s) => s.name)}
                    prices={Object.fromEntries(
                      service.sizes.map((s) => [s.name, s.price])
                    )}
                    quantities={filteredServices[key] || {}}
                    onQuantityChange={(size, value) =>
                      handleServiceChange(key, {
                        ...formState.services[key],
                        [size]: Math.max(value, 0),
                      })
                    }
                  />
                );
              })}
            </SizedServicesContainer>
          </ServiceCategory>
        )}
      </ServicesGrid>
    );
  };

  if (servicesStatus === "loading")
    return <LoadingContainer>Cargando servicios...</LoadingContainer>;
  if (servicesStatus === "failed")
    return <ErrorContainer>Error cargando servicios</ErrorContainer>;

  return (
    <MainContainer>
      <CardContainer>
        <HeaderSection>
          <BackButton onClick={() => navigate("/admin/notes-summary")}>
            <FiArrowLeft size={20} />
            <span>Regresar al Menú</span>
          </BackButton>

          <NoteHeader>
            <Title>Nota de Lavandería</Title>
            <FolioDateContainer>
              <FolioBadge>{formState.folio}</FolioBadge>
              <DateBadge>
                <strong>Fecha:</strong> {moment().format("YYYY-MM-DD / HH:mm")}
              </DateBadge>
            </FolioDateContainer>
          </NoteHeader>
        </HeaderSection>

        <FormSection>
          <InputGroup>
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
              {formState.errors.name && (
                <ErrorText>{formState.errors.name}</ErrorText>
              )}
            </FloatingInput>
          </InputGroup>

          <ServicesSection>
            {renderServices()}
            {formState.errors.noService && (
              <ErrorBanner>{formState.errors.noService}</ErrorBanner>
            )}
          </ServicesSection>

          <InputGroup>
            <FloatingInput>
              <textarea
                id="observations"
                name="observations"
                value={formState.observations}
                onChange={handleInputChange}
                rows="3"
              />
              <label
                className={formState.observations ? "filled" : ""}
                htmlFor="observations"
              >
                Observaciones
              </label>
            </FloatingInput>
          </InputGroup>

          <PaymentSection>
            <AbonoGroup>
              <AbonoInput>
                <FloatingInput>
                  <input
                    type="number"
                    id="tempAbono"
                    name="tempAbono"
                    value={tempAbono || ""} // Esto hace que el input esté vacío inicialmente
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setTempAbono(isNaN(value) ? 0 : Math.max(0, value));
                    }}
                    min="0"
                    step="1"
                    placeholder=""
                  />
                  <label
                    className={tempAbono ? "filled" : ""}
                    htmlFor="tempAbono"
                  >
                    Cantidad de Abono
                  </label>
                </FloatingInput>
              </AbonoInput>
              <ActionButton
                onClick={handleAddAbono}
                disabled={tempAbono <= 0}
                variant="secondary"
              >
                <FiDollarSign size={18} />
                Agregar Abono
              </ActionButton>
            </AbonoGroup>

            {formState.abono > 0 && (
              <PaymentInfo>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>Abono:</strong> ${formState.abono.toFixed(2)} (
                    {formState.abonoPaymentMethod})
                  </div>
                  <RemoveAbonoButton onClick={handleRemoveAbono}>
                    <FiX size={18} />
                  </RemoveAbonoButton>
                </div>
              </PaymentInfo>
            )}
          </PaymentSection>

          <PaymentSection>
            <ActionButton
              onClick={handleMarkAsPaid}
              disabled={formState.isPaid || orderTotal <= 0}
              variant={formState.isPaid ? "disabled" : "primary"}
            >
              {formState.isPaid ? (
                <>
                  <FiCheck size={18} />
                  Pagado
                </>
              ) : (
                "Marcar como Pagado"
              )}
            </ActionButton>
            {formState.isPaid && (
              <PaymentInfo>
                <strong>Pagado:</strong> Método {formState.paymentMethod}
              </PaymentInfo>
            )}
          </PaymentSection>

          <CheckboxGroup>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formState.suavitelDesired}
                onChange={() =>
                  setFormState((prev) => ({
                    ...prev,
                    suavitelDesired: !prev.suavitelDesired,
                  }))
                }
              />
              <CheckboxCustom />
              <span>¿Desea Suavitel?</span>
            </CheckboxLabel>
          </CheckboxGroup>

          <SummarySection>
            <TotalAmount>
              <span>Total:</span>
              <strong>${orderTotal.toFixed(2)}</strong>
            </TotalAmount>
            {formState.abono > 0 && (
              <RemainingAmount>
                <span>Monto Pendiente:</span>
                <strong>${remainingAmount.toFixed(2)}</strong>
              </RemainingAmount>
            )}
          </SummarySection>

          <SubmitButton
            onClick={() => {
              if (orderTotal <= 0) {
                toast.error("No se puede crear una nota con total $0");
                return;
              }
              const errors = validate(
                formState.name,
                formState.abono,
                formState.services
              );
              if (Object.keys(errors).length > 0) {
                setFormState((prev) => ({ ...prev, errors }));
              } else {
                setShowModal(true);
              }
            }}
            disabled={loading || isSubmitting || orderTotal <= 0}
          >
            {isSubmitting ? (
              "Guardando..."
            ) : (
              <>
                <FaWhatsapp size={18} />
                Guardar y Enviar WhatsApp
              </>
            )}
          </SubmitButton>
        </FormSection>
      </CardContainer>

      <ConfirmationModal
        showModal={showModal}
        handleClose={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        name={formState.name}
        total={orderTotal}
        phoneNumber={formState.phoneNumber}
        countryCode={formState.countryCode}
        onPhoneChange={(number) =>
          setFormState((prev) => ({ ...prev, phoneNumber: number }))
        }
        onCountryCodeChange={(code) =>
          setFormState((prev) => ({ ...prev, countryCode: code }))
        }
        loading={loading || isSubmitting}
        error={submitError}
        folio={formState.folio}
      />

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setModalType(null);
        }}
        onSelect={handlePaymentMethodSelect}
        onCancel={() => {
          setShowPaymentModal(false);
          setModalType(null);
        }}
        title={
          modalType === "payment"
            ? "Selecciona el Método de Pago"
            : "Selecciona el Método de Pago para el Abono"
        }
      />
    </MainContainer>
  );
};

// Estilos
const MainContainer = styled.div`
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f5f7fa;
  font-family: "Inter", sans-serif;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const CardContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: ${fadeIn} 0.5s ease-out;
`;

const HeaderSection = styled.div`
  padding: 1.5rem 2rem;
  background: linear-gradient(45deg, #4b70e2, #3a5bb8);
  color: white;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateX(-3px);
  }
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const FolioDateContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const FolioBadge = styled.div`
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
`;

const DateBadge = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;

  strong {
    font-weight: 600;
  }
`;

const FormSection = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
    gap: 1rem;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.25rem;
`;

const ServicesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const ServicesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ServiceCategory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CategoryTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
`;

const SimpleServicesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
`;

const SizedServicesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
`;

const ErrorBanner = styled.div`
  padding: 0.75rem;
  background-color: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  font-weight: 500;
  text-align: center;
  margin-top: 0.5rem;
`;

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

// Reemplaza el AbonoInput existente con este código
const AbonoGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-end;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const AbonoInput = styled.div`
  flex: 1;
  position: relative;
`;

const RemoveAbonoButton = styled.button`
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #fee2e2;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  ${({ variant }) =>
    variant === "primary"
      ? `
      background-color: #4b70e2;
      color: white;
      &:hover {
        background-color: #3a5bb8;
      }
    `
      : variant === "secondary"
      ? `
      background-color: #4caf50;
      color: white;
      &:hover {
        background-color: #3d8b40;
      }
    `
      : `
      background-color: #94a3b8;
      color: white;
      cursor: not-allowed;
    `}
`;

const PaymentInfo = styled.div`
  padding: 0.75rem;
  background-color: #f0fdf4;
  border-radius: 8px;
  color: #166534;
  font-size: 0.95rem;
  border: 1px solid #bbf7d0;
`;

const CheckboxGroup = styled.div`
  display: flex;
  justify-content: center;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f1f5f9;
  }

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  span {
    font-size: 1rem;
    font-weight: 500;
    color: #334155;
  }
`;

const CheckboxCustom = styled.span`
  position: relative;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  transition: all 0.3s ease;

  ${CheckboxLabel} input:checked ~ & {
    background-color: #4b70e2;
    border-color: #4b70e2;
  }

  &::after {
    content: "";
    position: absolute;
    display: none;
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  ${CheckboxLabel} input:checked ~ &::after {
    display: block;
  }
`;

const SummarySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const TotalAmount = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.5rem;
  color: #1e293b;

  strong {
    font-weight: 700;
    color: #4b70e2;
  }
`;

const RemainingAmount = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  color: #1e293b;

  strong {
    font-weight: 700;
    color: #dc2626;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);

  &:hover {
    background-color: #3d8b40;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(76, 175, 80, 0.3);
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  animation: ${pulse} 2s infinite;

  @media (max-width: 768px) {
    padding: 0.75rem;
    font-size: 1rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #64748b;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #dc2626;
`;

export default LaundryNote;
