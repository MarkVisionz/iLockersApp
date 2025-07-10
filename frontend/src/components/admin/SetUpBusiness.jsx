import { useState, useEffect, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Button } from "@mui/material";
import { toast } from "react-toastify";
import { createBusiness } from "../../features/businessSlice";
import { fetchAuthUser } from "../../features/authUserSlice";
import { setAuthFromUserData } from "../../features/authSlice";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";

// Componente memoizado para inputs de horario
const TimeSlotInput = memo(({ day, dayData, onChange, onToggle }) => (
  <TimeSlotContainer>
    <DayHeader>
      <DayLabel>{day.charAt(0).toUpperCase() + day.slice(1)}</DayLabel>
      <ToggleDayButton
        type="button"
        onClick={() => onToggle(day)}
        $isClosed={dayData.isClosed}
        aria-label={dayData.isClosed ? "Abrir día" : "Cerrar día"}
      >
        {dayData.isClosed ? "✓" : "×"}
      </ToggleDayButton>
    </DayHeader>

    {dayData.isClosed ? (
      <ClosedBadge>Cerrado</ClosedBadge>
    ) : (
      <TimeInputs>
        <TimeInputCompact>
          <input
            type="time"
            value={dayData.open || ""}
            onChange={(e) => onChange(day, "open", e.target.value)}
          />
        </TimeInputCompact>
        <TimeSeparator>a</TimeSeparator>
        <TimeInputCompact>
          <input
            type="time"
            value={dayData.close || ""}
            onChange={(e) => onChange(day, "close", e.target.value)}
          />
        </TimeInputCompact>
      </TimeInputs>
    )}
  </TimeSlotContainer>
));

const SetUpBusiness = ({ isModal = false, onClose, userId, userEmail }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.business);
  const auth = useSelector((state) => state.auth || {});

  const [formData, setFormData] = useState({
    name: "",
    email: userEmail || "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "México",
    },
    businessHours: {
      monday: { isClosed: false, open: "09:00", close: "18:00" },
      tuesday: { isClosed: false, open: "09:00", close: "18:00" },
      wednesday: { isClosed: false, open: "09:00", close: "18:00" },
      thursday: { isClosed: false, open: "09:00", close: "18:00" },
      friday: { isClosed: false, open: "09:00", close: "18:00" },
      saturday: { isClosed: false, open: "09:00", close: "18:00" },
      sunday: { isClosed: false, open: "09:00", close: "18:00" },
    },
    description: "",
    logo: "",
    ownerId: userId || "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [newBusinessId, setNewBusinessId] = useState(null);
  const [showTimeInputs, setShowTimeInputs] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && (!userId || !userEmail)) {
      dispatch(
        setAuthFromUserData({
          token: storedToken,
          _id: userId,
          email: userEmail,
        })
      );
    } else if (auth.token && !storedToken) {
      localStorage.setItem("token", auth.token);
    }
    if (!userId) {
      setErrors({
        auth: "No se detectó un usuario autenticado. Por favor, inicia sesión nuevamente.",
      });
    }
  }, [userId, userEmail, auth.token, dispatch]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nombre del negocio requerido";
    else if (formData.name.length < 3 || formData.name.length > 100)
      newErrors.name = "El nombre debe tener entre 3 y 100 caracteres";

    if (!formData.email.trim()) newErrors.email = "Correo requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Correo inválido";

    if (!formData.phone.trim()) newErrors.phone = "Teléfono requerido";
    else if (!/^\+?\d{7,15}$/.test(formData.phone.replace(/[\s\-()]/g, "")))
      newErrors.phone = "Teléfono inválido";

    if (!formData.address.street.trim()) newErrors.street = "Calle requerida";
    if (!formData.address.city.trim()) newErrors.city = "Ciudad requerida";
    if (!formData.address.state.trim()) newErrors.state = "Estado requerido";
    if (!formData.address.postalCode.trim())
      newErrors.postalCode = "Código postal requerido";
    else if (!/^\d{5}$/.test(formData.address.postalCode))
      newErrors.postalCode = "Código postal debe tener 5 dígitos";

    const hourFormat = /^([0-1]\d|2[0-3]):[0-5]\d$/;
    Object.keys(formData.businessHours).forEach((day) => {
      const { open, close, isClosed } = formData.businessHours[day];
      if (!isClosed) {
        if (!open || !hourFormat.test(open))
          newErrors[`hours_${day}_open`] = `Hora de apertura inválida para ${day}`;
        if (!close || !hourFormat.test(close))
          newErrors[`hours_${day}_close`] = `Hora de cierre inválida para ${day}`;
      }
    });

    if (formData.logo && !/^https?:\/\/.+(\.(png|jpg|jpeg|svg|webp))(?:\?.*)?$/i.test(formData.logo))
      newErrors.logo = "La URL del logo debe ser válida (PNG, JPG, JPEG, SVG, WEBP)";

    if (formData.description && formData.description.length > 500)
      newErrors.description = "La descripción no puede exceder 500 caracteres";

    if (!formData.ownerId) newErrors.ownerId = "ID del propietario requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((e, field, subfield) => {
    const { name, value } = e.target;
    if (field === "address") {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }));
    } else if (field === "businessHours") {
      setFormData((prev) => ({
        ...prev,
        businessHours: {
          ...prev.businessHours,
          [subfield]: {
            ...prev.businessHours[subfield],
            [name]: value,
          },
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleTimeChange = useCallback((day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value,
        },
      },
    }));
  }, []);

  const toggleDayClosed = useCallback((day) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          isClosed: !prev.businessHours[day].isClosed,
          // Limpia horarios si se marca como cerrado
          ...(prev.businessHours[day].isClosed ? {} : { open: null, close: null })
        }
      }
    }));
  }, []);

  const handleCopyHours = useCallback(
    (day) => {
      const hours = formData.businessHours[day];
      setFormData((prev) => ({
        ...prev,
        businessHours: Object.keys(prev.businessHours).reduce((acc, d) => {
          acc[d] = { ...hours };
          return acc;
        }, {}),
      }));
      toast.success(`Horarios de ${day} copiados a todos los días`, {
        position: "top-right",
        autoClose: 3000,
      });
    },
    [formData.businessHours]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      if (!userId) {
        setErrors({
          submit: "No se detectó un usuario autenticado. Por favor, inicia sesión nuevamente.",
        });
        return;
      }

      setIsLoading(true);
      try {
        // Limpia los horarios para días cerrados
        const cleanedBusinessHours = Object.entries(formData.businessHours).reduce(
          (acc, [day, dayData]) => {
            acc[day] = dayData.isClosed 
              ? { isClosed: true }  // Solo envía isClosed si está cerrado
              : {                  // Mantiene todo si está abierto
                  isClosed: false,
                  open: dayData.open,
                  close: dayData.close
                };
            return acc;
          }, {}
        );

        const result = await dispatch(
          createBusiness({ 
            ...formData, 
            businessHours: cleanedBusinessHours,
            ownerId: userId 
          })
        ).unwrap();

        if (result?._id) {
          setNewBusinessId(result._id);
          const updatedUser = await dispatch(fetchAuthUser(userId)).unwrap();
          if (updatedUser._id) {
            localStorage.setItem(
              "businesses",
              JSON.stringify(updatedUser.businesses || [])
            );
            dispatch(setAuthFromUserData(updatedUser));
            if (isModal) {
              onClose();
              toast.success("Negocio creado exitosamente");
              navigate(`/owner/local-summary/${result._id}`, { replace: true });
            }
          }
        }
      } catch (err) {
        setErrors({
          submit: err.message || "Error al crear el negocio. Por favor, intenta de nuevo.",
        });
        toast.error(err.message || "Error al crear el negocio");
      } finally {
        setIsLoading(false);
      }
    },
    [formData, userId, validateForm, dispatch, isModal, navigate, onClose]
  );

  useEffect(() => {
    if (newBusinessId && !isModal) {
      navigate(`/owner/local-summary/${newBusinessId}`, { replace: true });
    }
  }, [newBusinessId, isModal, navigate]);

  const content = (
    <StyledForm
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Title>Configura tu Negocio</Title>
      <Subtitle>Llena los datos para comenzar</Subtitle>

      {errors.auth && <StyledErrorMessage message={errors.auth} />}
      {errors.submit && <StyledErrorMessage message={errors.submit} />}
      {error && (
        <StyledErrorMessage message={error?.message || "Ocurrió un error"} />
      )}

      <InputGroup>
        <StyledFloatingInput>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => handleInputChange(e)}
          />
          <label className={formData.name ? "filled" : ""}>
            Nombre del Negocio
          </label>
        </StyledFloatingInput>
        {errors.name && <StyledErrorMessage message={errors.name} />}

        <StyledFloatingInput className={formData.email ? "default-filled" : ""}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleInputChange(e)}
          />
          <label className={formData.email ? "default-filled" : ""}>
            Correo Electrónico
          </label>
        </StyledFloatingInput>
        {errors.email && <StyledErrorMessage message={errors.email} />}

        <StyledFloatingInput>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange(e)}
          />
          <label className={formData.phone ? "filled" : ""}>Teléfono</label>
        </StyledFloatingInput>
        {errors.phone && <StyledErrorMessage message={errors.phone} />}
      </InputGroup>

      <InputGroup>
        <h4>Dirección</h4>
        <StyledFloatingInput>
          <input
            type="text"
            name="street"
            value={formData.address.street}
            onChange={(e) => handleInputChange(e, "address")}
          />
          <label className={formData.address.street ? "filled" : ""}>
            Calle
          </label>
        </StyledFloatingInput>
        {errors.street && <StyledErrorMessage message={errors.street} />}
        <StyledFloatingInput>
          <input
            type="text"
            name="city"
            value={formData.address.city}
            onChange={(e) => handleInputChange(e, "address")}
          />
          <label className={formData.address.city ? "filled" : ""}>
            Ciudad
          </label>
        </StyledFloatingInput>
        {errors.city && <StyledErrorMessage message={errors.city} />}
        <StyledFloatingInput>
          <input
            type="text"
            name="state"
            value={formData.address.state}
            onChange={(e) => handleInputChange(e, "address")}
          />
          <label className={formData.address.state ? "filled" : ""}>
            Estado
          </label>
        </StyledFloatingInput>
        {errors.state && <StyledErrorMessage message={errors.state} />}
        <StyledFloatingInput>
          <input
            type="text"
            name="postalCode"
            value={formData.address.postalCode}
            onChange={(e) => handleInputChange(e, "address")}
          />
          <label className={formData.address.postalCode ? "filled" : ""}>
            Código postal
          </label>
        </StyledFloatingInput>
        {errors.postalCode && (
          <StyledErrorMessage message={errors.postalCode} />
        )}
        <StyledFloatingInput
          className={formData.address.country ? "default-filled" : ""}
        >
          <input
            type="text"
            name="country"
            value={formData.address.country}
            onChange={(e) => handleInputChange(e, "address")}
            disabled
          />
          <label className={formData.address.country ? "default-filled" : ""}>
            País
          </label>
        </StyledFloatingInput>
      </InputGroup>

      <InputGroup>
        <ScheduleHeader>
          <h4>Horarios</h4>
          <ToggleInputsButton
            type="button"
            onClick={() => setShowTimeInputs(!showTimeInputs)}
          >
            {showTimeInputs ? "Ocultar edición" : "Editar horarios"}
          </ToggleInputsButton>
        </ScheduleHeader>

        {showTimeInputs && (
          <TimeSlotsGrid>
            {Object.entries(formData.businessHours).map(([day, dayData]) => (
              <TimeSlotInput
                key={day}
                day={day}
                dayData={dayData}
                onChange={handleTimeChange}
                onToggle={toggleDayClosed}
              />
            ))}
          </TimeSlotsGrid>
        )}

        <ScheduleSummary>
          {Object.entries(formData.businessHours).map(
            ([day, { open, close, isClosed }]) => (
              <ScheduleItem key={day} $isClosed={isClosed}>
                <span>{day.charAt(0).toUpperCase() + day.slice(1)}:</span>
                {isClosed ? (
                  <span className="closed">Cerrado</span>
                ) : (
                  <span>
                    {open} - {close}
                  </span>
                )}
              </ScheduleItem>
            )
          )}
        </ScheduleSummary>
        <CopyAllButton type="button" onClick={() => handleCopyHours("monday")}>
          Copiar Todos los horarios
        </CopyAllButton>
      </InputGroup>

      <InputGroup>
        <StyledFloatingInput>
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => handleInputChange(e)}
            rows="3"
          />
          <label className={formData.description ? "filled" : ""}>
            Descripción Opcional
          </label>
        </StyledFloatingInput>
        {errors.description && (
          <StyledErrorMessage message={errors.description} />
        )}
      </InputGroup>

      <InputGroup>
        <StyledFloatingInput>
          <input
            type="url"
            name="logo"
            value={formData.logo}
            onChange={(e) => handleInputChange(e)}
          />
          <label className={formData.logo ? "filled" : ""}>
            URL del Logo (opcional)
          </label>
        </StyledFloatingInput>
        {errors.logo && <StyledErrorMessage message={errors.logo} />}
      </InputGroup>

      <ButtonsContainer>
        {isModal && (
          <CancelButton onClick={onClose} disabled={isLoading}>
            Cancelar
          </CancelButton>
        )}
        <SubmitButton
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? (
            <div className="spinner-container">
              <LoadingSpinner size="small" />
            </div>
          ) : (
            "Crear negocio"
          )}
        </SubmitButton>
      </ButtonsContainer>
    </StyledForm>
  );

  return isModal ? (
    <ModalWrapper
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </ModalWrapper>
  ) : (
    <Container>{content}</Container>
  );
};

// Estilos mejorados
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8fafc;
`;

const ModalWrapper = styled(motion.div)`
  width: 100%;
`;

const StyledForm = styled(motion.form)`
  background: white;
  padding: ${(props) => (props.isModal ? "0" : "2.5rem")};
  border-radius: 12px;
  box-shadow: ${(props) =>
    props.isModal ? "none" : "0 4px 12px rgba(0, 0, 0, 0.15)"};
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #1f2937;
  text-align: center;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #6b7280;
  text-align: center;
`;

const InputGroup = styled.div`
  h4 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: #333;
    font-weight: 600;
  }
`;

const StyledFloatingInput = styled.label`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
  width: 100%;

  input,
  select,
  textarea {
    padding: 1rem 1rem 0.6rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 10px;
    background: #fefefe;
    transition: border 0.3s;

    &:focus {
      border-color: #007bff;
      outline: none;
      background: #fefefe;
    }
  }

  label {
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 1rem;
    color: #999;
    background: #fefefee6;
    padding: 0 4px;
    transition: all 0.2s ease;
    pointer-events: none;
  }

  input:focus + label,
  select:focus + label,
  textarea:focus + label {
    top: -0.6rem;
    left: 0.8rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #6b7280;
  }

  &.default-filled label,
  label.default-filled {
    top: -0.6rem;
    left: 0.8rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #6b7280;
  }

  .filled:not(.default-filled) {
    top: -0.6rem;
    left: 0.8rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #6b7280;
  }
`;

const StyledErrorMessage = styled(ErrorMessage)`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

const TimeSlotContainer = styled.div`
  padding: 1rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
`;

const TimeSlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const DayLabel = styled.span`
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
`;

const ToggleDayButton = styled.button`
  background: ${({ $isClosed }) => ($isClosed ? "#10b981" : "#ef4444")};
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
`;

const TimeInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const TimeInputCompact = styled.div`
  flex: 1;

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.9rem;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }
`;

const TimeSeparator = styled.span`
  color: #6b7280;
  font-size: 0.9rem;
`;

const ClosedBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  font-weight: 500;
`;

const ScheduleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ToggleInputsButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  border: none;
  border-radius: 6px;
  color: #ffff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

const CopyAllButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #374151;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    background: #e5e7eb;
  }
`;

const ScheduleSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
`;

const ScheduleItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: ${({ $isClosed }) => ($isClosed ? "#94a3b8" : "#334155")};

  .closed {
    color: #ef4444;
    font-weight: 500;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const CancelButton = styled(Button)`
  && {
    background-color: #6c757d;
    color: white;
    text-transform: none;
    font-weight: 500;
    border-radius: 8px;
    padding: 0.6rem 1.2rem;
    font-size: 0.95rem;
    transition: all 0.3s ease;

    &:hover {
      background-color: #5a6268;
    }
  }
`;

const SubmitButton = styled(motion.button)`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  position: relative;

  &:hover {
    background-color: #0056b3;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background-color: #cbd5e1;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .spinner-container {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: inherit;
    border-radius: inherit;
  }
`;

export default SetUpBusiness;