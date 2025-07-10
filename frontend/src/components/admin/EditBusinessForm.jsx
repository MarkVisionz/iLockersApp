import { useState } from "react";
import styled from "styled-components";
import { FaEdit, FaTimes } from "react-icons/fa";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";

// Componente para inputs de horario
const TimeSlotInput = ({ day, dayData, onChange, onToggle }) => (
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
);

const EditBusinessForm = ({
  business,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    name: business?.name || "",
    email: business?.email || "",
    phone: business?.phone || "",
    address: {
      street: business?.address?.street || "",
      city: business?.address?.city || "",
      state: business?.address?.state || "",
      postalCode: business?.address?.postalCode || "",
      country: business?.address?.country || "México",
    },
    businessHours: {
      monday: business?.businessHours?.monday || {
        isClosed: true,
        open: null,
        close: null,
      },
      tuesday: business?.businessHours?.tuesday || {
        isClosed: true,
        open: null,
        close: null,
      },
      wednesday: business?.businessHours?.wednesday || {
        isClosed: true,
        open: null,
        close: null,
      },
      thursday: business?.businessHours?.thursday || {
        isClosed: true,
        open: null,
        close: null,
      },
      friday: business?.businessHours?.friday || {
        isClosed: true,
        open: null,
        close: null,
      },
      saturday: business?.businessHours?.saturday || {
        isClosed: true,
        open: null,
        close: null,
      },
      sunday: business?.businessHours?.sunday || {
        isClosed: true,
        open: null,
        close: null,
      },
    },
    description: business?.description || "",
    logo: business?.logo || "",
    settings: {
      notifications: {
        email: business?.settings?.notifications?.email ?? true,
        sms: business?.settings?.notifications?.sms ?? false,
      },
      laundrySettings: {
        defaultReadyTime:
          business?.settings?.laundrySettings?.defaultReadyTime ?? 48,
        suavitelEnabled:
          business?.settings?.laundrySettings?.suavitelEnabled ?? true,
        currency: business?.settings?.laundrySettings?.currency ?? "MXN",
        timezone:
          business?.settings?.laundrySettings?.timezone ??
          "America/Mexico_City",
      },
      isActive: business?.isActive ?? true,
    },
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    businessHours: "",
    description: "",
    logo: "",
    settings: "",
  });

  const [showTimeInputs, setShowTimeInputs] = useState(false);

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      address: "",
      businessHours: "",
      description: "",
      logo: "",
      settings: "",
    };

    if (!formData.name.trim() || formData.name.length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Correo inválido";
    }
    if (
      formData.phone &&
      !/^\+?\d{7,15}$/.test(formData.phone.replace(/[\s\-()]/g, ""))
    ) {
      newErrors.phone = "Teléfono inválido";
    }
    if (
      !formData.address.street ||
      !formData.address.city ||
      !formData.address.state ||
      !formData.address.postalCode
    ) {
      newErrors.address = "Dirección incompleta";
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Descripción demasiado larga";
    }
    if (
      formData.logo &&
      !/^https?:\/\/.+(\.(png|jpg|jpeg|svg|webp))(?:\?.*)?$/i.test(
        formData.logo
      )
    ) {
      newErrors.logo = "URL de logo inválida";
    }
    const hourFormat = /^([0-1]\d|2[0-3]):[0-5]\d$/;
    Object.keys(formData.businessHours).forEach((day) => {
      const { open, close, isClosed } = formData.businessHours[day];
      if (!isClosed) {
        if (!open || !hourFormat.test(open)) {
          newErrors.businessHours = `Hora de apertura inválida para ${day}`;
        } else if (!close || !hourFormat.test(close)) {
          newErrors.businessHours = `Hora de cierre inválida para ${day}`;
        } else if (open >= close) {
          newErrors.businessHours = `La hora de cierre debe ser posterior a la de apertura para ${day}`;
        }
      }
    });
    if (
      typeof formData.settings.notifications.email !== "boolean" ||
      typeof formData.settings.notifications.sms !== "boolean"
    ) {
      newErrors.settings = "Configuración de notificaciones inválida";
    }
    if (
      typeof formData.settings.laundrySettings.defaultReadyTime !== "number" ||
      formData.settings.laundrySettings.defaultReadyTime < 0
    ) {
      newErrors.settings = "Tiempo de preparación inválido";
    }
    if (
      typeof formData.settings.laundrySettings.suavitelEnabled !== "boolean"
    ) {
      newErrors.settings = "Configuración de suavitel inválida";
    }
    if (
      !formData.settings.laundrySettings.currency ||
      !["MXN", "USD"].includes(formData.settings.laundrySettings.currency)
    ) {
      newErrors.settings = "Moneda inválida";
    }
    if (!formData.settings.laundrySettings.timezone) {
      newErrors.settings = "Zona horaria inválida";
    }
    if (typeof formData.settings.isActive !== "boolean") {
      newErrors.settings = "Estado activo inválido";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else if (name.includes("settings.notifications.")) {
      const field = name.split(".")[2];
      setFormData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          notifications: {
            ...prev.settings.notifications,
            [field]: value === "true",
          },
        },
      }));
    } else if (name.includes("settings.laundrySettings.")) {
      const field = name.split(".")[2];
      setFormData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          laundrySettings: {
            ...prev.settings.laundrySettings,
            [field]: field === "defaultReadyTime" ? Number(value) : value,
          },
        },
      }));
    } else if (name === "isActive") {
      setFormData((prev) => ({
        ...prev,
        settings: { ...prev.settings, isActive: value === "true" },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTimeChange = (day, field, value) => {
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
  };

  const toggleDayClosed = (day) => {
    setFormData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          isClosed: !prev.businessHours[day].isClosed,
          open: prev.businessHours[day].isClosed ? prev.businessHours[day].open || "09:00" : null,
          close: prev.businessHours[day].isClosed ? prev.businessHours[day].close || "17:00" : null,
        },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Send full businessHours object
      const cleanedData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          postalCode: formData.address.postalCode.trim(),
          country: formData.address.country.trim(),
        },
        businessHours: formData.businessHours,
        description: formData.description?.trim() || null,
        logo: formData.logo?.trim() || null,
        settings: formData.settings,
      };

      console.log("Datos enviados al backend:", cleanedData);
      onSubmit(cleanedData);
    }
  };

  return (
    <StyledCard>
      {isSubmitting && <LoadingSpinner />}
      {Object.values(errors).some((e) => e) && (
        <ErrorMessage message="Por favor, corrige los errores en el formulario" />
      )}
      <FormHeader>
        <CardTitle>Editar Negocio</CardTitle>
        <CloseButton onClick={onClose} aria-label="Cerrar formulario">
          <FaTimes />
        </CloseButton>
      </FormHeader>
      <StyledEditForm onSubmit={handleSubmit}>
        <SectionTitle>Información General</SectionTitle>
        <FormField>
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            aria-invalid={!!errors.name}
            placeholder="Nombre del negocio"
          />
          {errors.name && <ErrorMessage message={errors.name} />}
        </FormField>
        <FormField>
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            aria-invalid={!!errors.email}
            placeholder="Correo del negocio"
          />
          {errors.email && <ErrorMessage message={errors.email} />}
        </FormField>
        <FormField>
          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            name="phone"
            type="text"
            value={formData.phone}
            onChange={handleChange}
            aria-invalid={!!errors.phone}
            placeholder="Teléfono del negocio"
          />
          {errors.phone && <ErrorMessage message={errors.phone} />}
        </FormField>
        <FormField>
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            aria-invalid={!!errors.description}
            placeholder="Descripción del negocio"
          />
          {errors.description && <ErrorMessage message={errors.description} />}
        </FormField>
        <FormField>
          <label htmlFor="logo">URL del Logo</label>
          <input
            id="logo"
            name="logo"
            type="text"
            value={formData.logo}
            onChange={handleChange}
            aria-invalid={!!errors.logo}
            placeholder="URL del logo"
          />
          {errors.logo && <ErrorMessage message={errors.logo} />}
        </FormField>

        <SectionTitle>Dirección</SectionTitle>
        <FormField>
          <label htmlFor="street">Calle</label>
          <input
            id="street"
            name="address.street"
            type="text"
            value={formData.address.street}
            onChange={handleChange}
            aria-invalid={!!errors.address}
            placeholder="Calle"
          />
        </FormField>
        <FormField>
          <label htmlFor="city">Ciudad</label>
          <input
            id="city"
            name="address.city"
            type="text"
            value={formData.address.city}
            onChange={handleChange}
            aria-invalid={!!errors.address}
            placeholder="Ciudad"
          />
        </FormField>
        <FormField>
          <label htmlFor="state">Estado</label>
          <input
            id="state"
            name="address.state"
            type="text"
            value={formData.address.state}
            onChange={handleChange}
            aria-invalid={!!errors.address}
            placeholder="Estado"
          />
        </FormField>
        <FormField>
          <label htmlFor="postalCode">Código Postal</label>
          <input
            id="postalCode"
            name="address.postalCode"
            type="text"
            value={formData.address.postalCode}
            onChange={handleChange}
            aria-invalid={!!errors.address}
            placeholder="Código Postal"
          />
        </FormField>
        <FormField>
          <label htmlFor="country">País</label>
          <input
            id="country"
            name="address.country"
            type="text"
            value={formData.address.country}
            onChange={handleChange}
            aria-invalid={!!errors.address}
            placeholder="País"
          />
          {errors.address && <ErrorMessage message={errors.address} />}
        </FormField>

        <SectionTitle>Horarios</SectionTitle>
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
                    {open || "N/A"} - {close || "N/A"}
                  </span>
                )}
              </ScheduleItem>
            )
          )}
        </ScheduleSummary>
        {errors.businessHours && (
          <ErrorMessage message={errors.businessHours} />
        )}

        <SectionTitle>Configuraciones</SectionTitle>
        <FormField>
          <label htmlFor="notificationsEmail">Notificaciones por Correo</label>
          <select
            id="notificationsEmail"
            name="settings.notifications.email"
            value={formData.settings.notifications.email}
            onChange={handleChange}
          >
            <option value={true}>Habilitado</option>
            <option value={false}>Deshabilitado</option>
          </select>
        </FormField>
        <FormField>
          <label htmlFor="notificationsSms">Notificaciones por SMS</label>
          <select
            id="notificationsSms"
            name="settings.notifications.sms"
            value={formData.settings.notifications.sms}
            onChange={handleChange}
          >
            <option value={true}>Habilitado</option>
            <option value={false}>Deshabilitado</option>
          </select>
        </FormField>
        <FormField>
          <label htmlFor="defaultReadyTime">
            Tiempo de Preparación Predeterminado (horas)
          </label>
          <input
            id="defaultReadyTime"
            name="settings.laundrySettings.defaultReadyTime"
            type="number"
            value={formData.settings.laundrySettings.defaultReadyTime}
            onChange={handleChange}
            placeholder="Tiempo en horas"
          />
        </FormField>
        <FormField>
          <label htmlFor="suavitelEnabled">Suavitel Habilitado</label>
          <select
            id="suavitelEnabled"
            name="settings.laundrySettings.suavitelEnabled"
            value={formData.settings.laundrySettings.suavitelEnabled}
            onChange={handleChange}
          >
            <option value={true}>Habilitado</option>
            <option value={false}>Deshabilitado</option>
          </select>
        </FormField>
        <FormField>
          <label htmlFor="currency">Moneda</label>
          <input
            id="currency"
            name="settings.laundrySettings.currency"
            type="text"
            value={formData.settings.laundrySettings.currency}
            onChange={handleChange}
            placeholder="Moneda (ej. MXN)"
          />
        </FormField>
        <FormField>
          <label htmlFor="timezone">Zona Horaria</label>
          <input
            id="timezone"
            name="settings.laundrySettings.timezone"
            type="text"
            value={formData.settings.laundrySettings.timezone}
            onChange={handleChange}
            placeholder="Zona horaria (ej. America/Mexico_City)"
          />
        </FormField>
        <FormField>
          <label htmlFor="isActive">Negocio Activo</label>
          <select
            id="isActive"
            name="isActive"
            value={formData.settings.isActive}
            onChange={handleChange}
          >
            <option value={true}>Activo</option>
            <option value={false}>Inactivo</option>
          </select>
        </FormField>
        <FormField>
          <label>Suscripción</label>
          <p>
            Plan: {business?.subscription?.plan || "N/A"} (Estado:{" "}
            {business?.subscription?.status || "N/A"})
          </p>
          <small>
            La suscripción no se puede editar desde este formulario.
          </small>
        </FormField>
        {errors.settings && <ErrorMessage message={errors.settings} />}
        <ButtonGroup>
          <ActionButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </ActionButton>
          <ActionButton
            type="button"
            onClick={onClose}
            style={{ background: "#ff3b30" }}
          >
            Cancelar
          </ActionButton>
        </ButtonGroup>
      </StyledEditForm>
    </StyledCard>
  );
};

export default EditBusinessForm;

// Styles
const StyledCard = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #86868b;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #ff3b30;
  }
`;

const StyledEditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 500;
  color: #1d1d1f;
  margin-top: 1rem;
  border-bottom: 1px solid #e5e5ea;
  padding-bottom: 0.5rem;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.95rem;
    font-weight: 500;
    color: #1d1d1f;
  }

  input,
  select,
  textarea {
    padding: 0.75rem;
    border: 1px solid #d1d1d6;
    border-radius: 12px;
    font-size: 0.95rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      border-color: #007aff;
      outline: none;
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  small {
    color: #86868b;
    font-size: 0.85rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: #005bb5;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #d1d1d6;
    cursor: not-allowed;
  }
`;

const TimeSlotContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f5f5f7;
  padding: 0.75rem;
  border-radius: 12px;
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DayLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: #1d1d1f;
`;

const ToggleDayButton = styled.button`
  background: ${({ $isClosed }) => ($isClosed ? "#34c759" : "#ff3b30")};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ $isClosed }) => ($isClosed ? "#2ba84a" : "#cc2f28")};
  }
`;

const ClosedBadge = styled.span`
  background: #e5e5ea;
  color: #666;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-size: 0.8rem;
  align-self: flex-start;
`;

const TimeInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TimeInputCompact = styled.div`
  flex: 1;

  input {
    width: 100%;
  }
`;

const TimeSeparator = styled.span`
  font-size: 0.9rem;
  color: #666;
`;

const ScheduleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ToggleInputsButton = styled.button`
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #0051a8;
  }
`;

const TimeSlotsGrid = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const ScheduleSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ScheduleItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: ${({ $isClosed }) => ($isClosed ? "#666" : "#1d1d1f")};

  .closed {
    color: #666;
  }
`;
