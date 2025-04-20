import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from "@mui/material";
import styled from "styled-components";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { serviceAPI } from "../../services/serviceApi";
import { FloatingInput } from "./CommonStyled";

const EditService = ({ service, onClose }) => {
  const [formData, setFormData] = useState({
    name: service.name || "",
    type: service.type || "simple",
    price: service.price ? String(service.price) : "",
    sizes: service.sizes || [],
    availableDays: service.availableDays || [],
  });

  const [newSize, setNewSize] = useState({ name: "", price: "" });
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day) => {
    if (day < 0 || day > 6) return;
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const addSize = () => {
    if (!newSize.name || !newSize.price) {
      setFormError("Por favor, completa el nombre y precio de la talla.");
      return;
    }

    if (newSize.name.length > 30) {
      setFormError("El nombre de la talla no puede exceder los 30 caracteres.");
      return;
    }

    if (isNaN(newSize.price) || Number(newSize.price) < 0) {
      setFormError("El precio debe ser un número positivo.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        {
          id: uuidv4(),
          name: newSize.name.trim(),
          price: parseFloat(newSize.price),
        },
      ],
    }));

    setNewSize({ name: "", price: "" });
    setFormError(null);
  };

  const removeSize = (id) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((size) => size.id !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (!formData.name.trim()) throw new Error("El nombre es obligatorio");
      if (formData.name.length > 50)
        throw new Error("El nombre no puede exceder 50 caracteres");

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        availableDays: formData.availableDays,
      };

      if (formData.type === "simple") {
        if (!formData.price || isNaN(formData.price) || formData.price < 0) {
          throw new Error("Precio inválido para servicio simple");
        }
        payload.price = Number(formData.price);
      } else {
        if (!formData.sizes || formData.sizes.length === 0) {
          throw new Error("Debe agregar al menos una talla");
        }

        payload.sizes = formData.sizes.map((size) => ({
          id: size.id || uuidv4(),
          name: size.name.trim(),
          price: Number(size.price),
        }));
      }

      await serviceAPI.updateService(service._id, payload);
      toast.success("Servicio actualizado exitosamente");
      onClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors)
              .map((e) => e.message || e)
              .join(", ")
          : err.message);

      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Servicio</DialogTitle>
      <DialogContent>
        <StyledEditService
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {formError && <ErrorMessage>{formError}</ErrorMessage>}
          <StyledForm
            onSubmit={handleSubmit}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <FloatingInput>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength="50"
              />
              <label className={formData.name ? "filled" : ""}>Nombre</label>
            </FloatingInput>

            <FloatingInput>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="simple">Simple</option>
                <option value="sized">Con Tallas</option>
              </select>
              <label className={formData.type ? "filled" : ""}>Tipo</label>
            </FloatingInput>

            {formData.type === "simple" && (
              <FloatingInput>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
                <label className={formData.price ? "filled" : ""}>Precio</label>
              </FloatingInput>
            )}

            {formData.type === "sized" && (
              <SizeInputGroup>
                <h4>Agregar Talla:</h4>
                <div className="size-inputs">
                  <FloatingInput>
                    <input
                      type="text"
                      value={newSize.name}
                      onChange={(e) =>
                        setNewSize({ ...newSize, name: e.target.value })
                      }
                      maxLength="30"
                    />
                    <label className={newSize.name ? "filled" : ""}>
                      Nombre Talla
                    </label>
                  </FloatingInput>
                  <FloatingInput>
                    <input
                      type="number"
                      value={newSize.price}
                      onChange={(e) =>
                        setNewSize({ ...newSize, price: e.target.value })
                      }
                      min="0"
                      step="0.01"
                    />
                    <label className={newSize.price ? "filled" : ""}>
                      Precio Talla
                    </label>
                  </FloatingInput>
                </div>
                <AddButton
                  type="button"
                  onClick={addSize}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  + Agregar Talla
                </AddButton>
                
                {formData.sizes.length > 0 && (
                  <>
                    <h4>Tallas Actuales:</h4>
                    <SizeList>
                      {formData.sizes.map((size) => (
                        <SizeItem key={size.id}>
                          <span>
                            {size.name} (${size.price})
                          </span>
                          <RemoveButton
                            type="button"
                            onClick={() => removeSize(size.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ×
                          </RemoveButton>
                        </SizeItem>
                      ))}
                    </SizeList>
                  </>
                )}
              </SizeInputGroup>
            )}

            <DaySelector>
              <h4>Días Disponibles:</h4>
              <DayGrid>
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                  (day, index) => (
                    <DayLabel key={index}>
                      <input
                        type="checkbox"
                        checked={formData.availableDays.includes(index)}
                        onChange={() => toggleDay(index)}
                      />
                      {day}
                    </DayLabel>
                  )
                )}
              </DayGrid>
            </DaySelector>

            <ButtonsContainer>
              <CloseButton onClick={onClose}>
                Cancelar
              </CloseButton>
              <SubmitButton type="submit">
                {loading ? "Guardando..." : "Guardar Cambios"}
              </SubmitButton>
            </ButtonsContainer>
          </StyledForm>
        </StyledEditService>
      </DialogContent>
    </Dialog>
  );
};

// Styled Components
const StyledEditService = styled(motion.div)`
  padding: 1rem 0;
`;

const StyledForm = styled(motion.form)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const SizeInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid #eee;

  h4 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    color: #333;
    font-weight: 600;
  }

  .size-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
`;

const SizeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SizeItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  font-size: 0.95rem;
`;

const AddButton = styled(motion.button)`
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
  align-self: flex-start;
  margin-top: 0.5rem;

  &:hover {
    background-color: #218838;
  }
`;

const RemoveButton = styled(motion.button)`
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  transition: background-color 0.3s ease;

  &:hover {
    background: #c82333;
  }
`;

const DaySelector = styled.div`
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid #eee;

  h4 {
    margin: 0 0 1rem;
    font-size: 1rem;
    color: #333;
    font-weight: 600;
  }
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.75rem;
`;

const DayLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #ced4da;
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: #007bff;
  }

  input {
    margin: 0;
    accent-color: #007bff;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const CloseButton = styled(Button)`
  && {
    background-color: #6c757d;
    color: white;
    text-transform: none;
    font-weight: 500;
    border-radius: 8px;
    padding: 0.6rem 1.2rem;
    font-size: 0.95rem;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #5a6268;
    }
  }
`;

const SubmitButton = styled(Button)`
  && {
    background-color: #007bff;
    color: white;
    text-transform: none;
    font-weight: 500;
    border-radius: 8px;
    padding: 0.6rem 1.2rem;
    font-size: 0.95rem;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #0056b3;
    }
  }
`;

export default EditService;