import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { serviceAPI } from "../../services/serviceApi";
import { ErrorMessage, LoadingSpinner } from "../LoadingAndError";

const ServiceManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState({ main: false, action: false });
  const [error, setError] = useState(null);
  const [newService, setNewService] = useState({
    name: "",
    type: "simple",
    price: "",
    sizes: [],
    availableDays: [],
  });
  const [editingService, setEditingService] = useState(null);
  const [newSize, setNewSize] = useState({ name: "", price: "" });
  const [excelFile, setExcelFile] = useState(null);

  // Cargar servicios con manejo de errores mejorado
  useEffect(() => {
    const loadServices = async () => {
      setLoading(prev => ({ ...prev, main: true }));
      try {
        const response = await serviceAPI.fetchServices();
        // Ahora response.data es directamente el array de servicios
        const sortedServices = [...response.data].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setServices(sortedServices);
      } catch (err) {
        setError(err.message || "Error al cargar los servicios.");
      } finally {
        setLoading(prev => ({ ...prev, main: false }));
      }
    };
    loadServices();
  }, []);

  // Manejo de cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const target = editingService || newService;
    const update = { ...target, [name]: value };

    editingService ? setEditingService(update) : setNewService(update);
  };

  // Toggle para días disponibles
  const toggleDay = (day) => {
    if (day < 0 || day > 6) return;
    const target = editingService || newService;
    const updatedDays = target.availableDays.includes(day)
      ? target.availableDays.filter((d) => d !== day)
      : [...target.availableDays, day];

    const update = { ...target, availableDays: updatedDays };
    editingService ? setEditingService(update) : setNewService(update);
  };

  // Agregar nueva talla
  const addSize = () => {
    if (!newSize.name || !newSize.price) {
      setError("Por favor, completa el nombre y precio de la talla.");
      return;
    }
    if (newSize.name.length > 30) {
      setError("El nombre de la talla no puede exceder los 30 caracteres.");
      return;
    }
    if (Number(newSize.price) < 0) {
      setError("El precio no puede ser negativo.");
      return;
    }

    const size = {
      id: uuidv4(),
      name: newSize.name.trim(),
      price: Number(newSize.price),
    };

    const target = editingService || newService;
    const update = { ...target, sizes: [...target.sizes, size] };

    editingService ? setEditingService(update) : setNewService(update);
    setNewSize({ name: "", price: "" });
  };

  // Eliminar talla
  const removeSize = (index) => {
    const target = editingService || newService;
    const update = {
      ...target,
      sizes: target.sizes.filter((_, i) => i !== index),
    };

    editingService ? setEditingService(update) : setNewService(update);
  };

  // Guardar servicio (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading((prev) => ({ ...prev, action: true }));

    try {
      const serviceData = editingService || newService;

      // Validaciones
      if (!serviceData.name.trim())
        throw new Error("El nombre es obligatorio.");
      if (serviceData.name.length > 50)
        throw new Error("El nombre no puede exceder los 50 caracteres.");
      if (serviceData.type === "simple" && !serviceData.price) {
        throw new Error("El precio es obligatorio para servicios simples.");
      }

      const payload = {
        name: serviceData.name.trim(),
        type: serviceData.type,
        availableDays: serviceData.availableDays,
        price:
          serviceData.type === "simple" ? Number(serviceData.price) : undefined,
        sizes: serviceData.type === "sized" ? serviceData.sizes : undefined,
      };

      let response;
      if (editingService) {
        response = await serviceAPI.updateService(editingService._id, payload);
        setServices(
          services.map((s) =>
            s._id === editingService._id ? response.data : s
          )
        );
        setEditingService(null);
      } else {
        response = await serviceAPI.createService(payload);
        setServices((prev) => [...prev, response.data]);
      }

      setNewService({
        name: "",
        type: "simple",
        price: "",
        sizes: [],
        availableDays: [],
      });
    } catch (err) {
      setError(err.message || "Error al guardar el servicio");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Eliminar servicio
  const handleDelete = async (_id) => {
    if (!window.confirm("¿Estás seguro de eliminar este servicio?")) return;

    setLoading((prev) => ({ ...prev, action: true }));
    try {
      await serviceAPI.deleteService(_id);
      setServices((prev) => prev.filter((s) => s._id !== _id));
    } catch (err) {
      setError(err.message || "Error al eliminar el servicio.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Eliminar todos los servicios
  const handleDeleteAll = async () => {
    if (!window.confirm("¿Estás seguro de eliminar TODOS los servicios?"))
      return;

    setLoading((prev) => ({ ...prev, action: true }));
    try {
      await serviceAPI.deleteAllServices();
      setServices([]);
    } catch (err) {
      setError(err.message || "Error al eliminar todos los servicios.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Importar desde Excel
  const handleExcelImport = async () => {
    if (!excelFile) {
      setError("Por favor, selecciona un archivo.");
      return;
    }

    setLoading((prev) => ({ ...prev, action: true }));
    setError(null);

    try {
      const result = await new Promise((resolve, reject) => {
        Papa.parse(excelFile, {
          complete: resolve,
          error: reject,
          header: true,
          skipEmptyLines: true,
        });
      });

      const importedServices = result.data
        .filter((row) => row.name && row.type)
        .map((row) => ({
          name: row.name.trim(),
          type:
            row.type === "simple" || row.type === "sized" ? row.type : "simple",
          sizes:
            row.type === "sized" && row.sizes
              ? row.sizes
                  .split(";")
                  .map((s) => {
                    const [name, price] = s.split(":");
                    return name &&
                      price &&
                      name.length <= 30 &&
                      Number(price) >= 0
                      ? {
                          id: uuidv4(),
                          name: name.trim(),
                          price: Number(price),
                        }
                      : null;
                  })
                  .filter(Boolean)
              : [],
          availableDays: row.availableDays
            ? row.availableDays
                .split(",")
                .map(Number)
                .filter((d) => d >= 0 && d <= 6)
            : [],
          price:
            row.type === "simple" && row.price ? Number(row.price) : undefined,
        }));

      const createdServices = [];
      for (const service of importedServices) {
        try {
          const response = await serviceAPI.createService(service);
          createdServices.push(response.data);
        } catch (err) {
          console.error(`Error creando servicio ${service.name}:`, err);
        }
      }

      setServices((prev) => [...prev, ...createdServices]);
      setExcelFile(null);
    } catch (err) {
      setError("Error al procesar el archivo.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  if (loading.main && services.length === 0) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <h2>Administrar Servicios</h2>
        {error && <ErrorMessage message={error} />}
      </Header>

      <FormContainer>
        <Form onSubmit={handleSubmit}>
          <FormSection>
            <h3>
              {editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}
            </h3>

            <InputGroup>
              <Label>Nombre:</Label>
              <Input
                type="text"
                name="name"
                value={editingService?.name || newService.name}
                onChange={handleInputChange}
                disabled={loading.action}
                required
                maxLength="50"
              />
            </InputGroup>

            <InputGroup>
              <Label>Tipo:</Label>
              <Select
                name="type"
                value={editingService?.type || newService.type}
                onChange={handleInputChange}
                disabled={loading.action}
              >
                <option value="simple">Simple</option>
                <option value="sized">Con Tallas</option>
              </Select>
            </InputGroup>

            {(editingService?.type === "simple" ||
              newService.type === "simple") && (
              <InputGroup>
                <Label>Precio:</Label>
                <Input
                  type="number"
                  name="price"
                  value={editingService?.price || newService.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={loading.action}
                  required
                />
              </InputGroup>
            )}

            {(editingService?.type === "sized" ||
              newService.type === "sized") && (
              <InputGroup>
                <Label>Tallas:</Label>
                <SizeInputGroup>
                  <Input
                    type="text"
                    placeholder="Nombre (ej. Individual)"
                    value={newSize.name}
                    onChange={(e) =>
                      setNewSize({ ...newSize, name: e.target.value })
                    }
                    disabled={loading.action}
                    maxLength="30"
                  />
                  <Input
                    type="number"
                    placeholder="Precio"
                    value={newSize.price}
                    onChange={(e) =>
                      setNewSize({ ...newSize, price: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    disabled={loading.action}
                  />
                  <AddButton
                    type="button"
                    onClick={addSize}
                    disabled={loading.action}
                  >
                    + Agregar
                  </AddButton>
                </SizeInputGroup>

                <SizeList>
                  {(editingService?.sizes || newService.sizes).map(
                    (size, index) => (
                      <SizeItem key={size.id}>
                        <span>
                          {size.name} (${size.price})
                        </span>
                        <RemoveButton
                          type="button"
                          onClick={() => removeSize(index)}
                          disabled={loading.action}
                        >
                          ×
                        </RemoveButton>
                      </SizeItem>
                    )
                  )}
                </SizeList>
              </InputGroup>
            )}

            <InputGroup>
              <Label>Días Disponibles:</Label>
              <DaySelector>
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                  (day, index) => (
                    <DayLabel key={index}>
                      <input
                        type="checkbox"
                        checked={(
                          editingService?.availableDays ||
                          newService.availableDays
                        ).includes(index)}
                        onChange={() => toggleDay(index)}
                        disabled={loading.action}
                      />
                      {day}
                    </DayLabel>
                  )
                )}
              </DaySelector>
            </InputGroup>

            <ButtonGroup>
              <PrimaryButton type="submit" disabled={loading.action}>
                {loading.action ? (
                  <Spinner />
                ) : editingService ? (
                  "Actualizar Servicio"
                ) : (
                  "Crear Servicio"
                )}
              </PrimaryButton>

              {editingService && (
                <SecondaryButton
                  type="button"
                  onClick={() => setEditingService(null)}
                  disabled={loading.action}
                >
                  Cancelar
                </SecondaryButton>
              )}
            </ButtonGroup>
          </FormSection>
        </Form>

        <ImportSection>
          <h3>Importar desde Excel/CSV</h3>
          <p>
            Sube un archivo CSV con columnas: name, type, price, sizes
            (Nombre:Precio;Nombre:Precio), availableDays (0,1,3).
          </p>

          <FileInputGroup>
            <FileInput
              type="file"
              accept=".csv"
              onChange={(e) => setExcelFile(e.target.files[0])}
              disabled={loading.action}
            />
            <ImportButton
              onClick={handleExcelImport}
              disabled={loading.action || !excelFile}
            >
              {loading.action ? <Spinner /> : "Importar Servicios"}
            </ImportButton>
          </FileInputGroup>

          <DangerButton
            onClick={handleDeleteAll}
            disabled={loading.action || services.length === 0}
          >
            {loading.action ? <Spinner /> : "Eliminar Todos los Servicios"}
          </DangerButton>
        </ImportSection>
      </FormContainer>

      <ServicesContainer>
        <h3>Servicios Existentes ({services.length})</h3>

        {services.length === 0 ? (
          <EmptyState>No hay servicios registrados</EmptyState>
        ) : (
          <ServicesGrid>
            {services.map(
              (service) =>
                service && ( // Verificación adicional por si acaso
                  <ServiceCard key={service._id}>
                    <ServiceHeader>
                      <ServiceName>{service.name}</ServiceName>
                      <ServiceType>{service.type}</ServiceType>
                    </ServiceHeader>

                    {service.type === "simple" && (
                      <ServiceDetail>
                        <span>Precio:</span> ${service.price}
                      </ServiceDetail>
                    )}

                    {service.type === "sized" && service.sizes.length > 0 && (
                      <ServiceDetail>
                        <span>Tallas:</span>
                        <SizesList>
                          {service.sizes.map((size) => (
                            <li key={size.id}>
                              {size.name} (${size.price})
                            </li>
                          ))}
                        </SizesList>
                      </ServiceDetail>
                    )}

                    <ServiceDetail>
                      <span>Días:</span>{" "}
                      {service.availableDays.length > 0
                        ? service.availableDays
                            .map(
                              (d) =>
                                [
                                  "Dom",
                                  "Lun",
                                  "Mar",
                                  "Mié",
                                  "Jue",
                                  "Vie",
                                  "Sáb",
                                ][d]
                            )
                            .join(", ")
                        : "Todos"}
                    </ServiceDetail>

                    <CardActions>
                      <EditButton
                        onClick={() => setEditingService(service)}
                        disabled={loading.action}
                      >
                        Editar
                      </EditButton>
                      <DeleteButton
                        onClick={() => handleDelete(service._id)}
                        disabled={loading.action}
                      >
                        Eliminar
                      </DeleteButton>
                    </CardActions>
                  </ServiceCard>
                )
            )}
          </ServicesGrid>
        )}
      </ServicesContainer>
    </Container>
  );
};

// Estilos mejorados
const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  h2 {
    color: #2c3e50;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
`;

const FormContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.div`
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h3 {
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
  }
`;

const ImportSection = styled(FormSection)`
  background: #f0f7ff;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.15s;

  &:focus {
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
`;

const SizeInputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  input {
    flex: 1;
  }
`;

const SizeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 0.5rem;
`;

const SizeItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  margin-bottom: 0.25rem;
  border-radius: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const RemoveButton = styled.button`
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

  &:hover {
    background: #c82333;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const DaySelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const DayLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid #ced4da;
  cursor: pointer;
  user-select: none;

  input {
    margin: 0;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const BaseButton = styled.button`
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(BaseButton)`
  background-color: #007bff;
  color: white;

  &:hover:not(:disabled) {
    background-color: #0069d9;
  }
`;

const SecondaryButton = styled(BaseButton)`
  background-color: #6c757d;
  color: white;

  &:hover:not(:disabled) {
    background-color: #5a6268;
  }
`;

const DangerButton = styled(BaseButton)`
  background-color: #dc3545;
  color: white;
  width: 100%;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    background-color: #c82333;
  }
`;

const AddButton = styled(BaseButton)`
  background-color: #28a745;
  color: white;
  padding: 0.5rem;
  font-size: 0.9rem;

  &:hover:not(:disabled) {
    background-color: #218838;
  }
`;

const FileInputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const FileInput = styled.input`
  flex: 1;
`;

const ImportButton = styled(BaseButton)`
  background-color: #17a2b8;
  color: white;

  &:hover:not(:disabled) {
    background-color: #138496;
  }
`;

const Spinner = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid white;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ServicesContainer = styled.div`
  h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const ServiceCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ServiceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
`;

const ServiceName = styled.h4`
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
`;

const ServiceType = styled.span`
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const ServiceDetail = styled.div`
  margin-bottom: 0.75rem;
  font-size: 0.9rem;

  span {
    font-weight: 600;
    color: #495057;
  }
`;

const SizesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;

  li {
    padding: 0.25rem 0;
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const EditButton = styled(BaseButton)`
  background-color: #ffc107;
  color: #212529;
  flex: 1;
  padding: 0.5rem;

  &:hover:not(:disabled) {
    background-color: #e0a800;
  }
`;

const DeleteButton = styled(BaseButton)`
  background-color: #dc3545;
  color: white;
  flex: 1;
  padding: 0.5rem;

  &:hover:not(:disabled) {
    background-color: #c82333;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export default ServiceManager;
