import { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { FloatingInput, FloatingFileInput } from "./CommonStyled";
import { useDispatch } from "react-redux";
import { bulkCreateServices } from "../../features/servicesSlice";

const CreateService = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [newService, setNewService] = useState({
    name: "",
    type: "simple",
    price: "",
    sizes: [],
    availableDays: [],
  });
  const [newSize, setNewSize] = useState({ name: "", price: "" });
  const [bulkServices, setBulkServices] = useState([]);
  const [fileKey, setFileKey] = useState(Date.now());
  const [excelUploaded, setExcelUploaded] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewService((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day) => {
    if (day < 0 || day > 6) return;
    setNewService((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

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

    setNewService((prev) => ({
      ...prev,
      sizes: [...prev.sizes, size],
    }));
    setNewSize({ name: "", price: "" });
    setError(null);
  };

  const removeSize = (id) => {
    setNewService((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((size) => size.id !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (!newService.name.trim()) throw new Error("El nombre es obligatorio.");
      if (newService.name.length > 50)
        throw new Error("El nombre no puede exceder los 50 caracteres.");
      if (newService.type === "simple" && !newService.price)
        throw new Error("El precio es obligatorio para servicios simples.");
      if (newService.type === "sized" && newService.sizes.length === 0)
        throw new Error("Debe agregar al menos una talla para servicios con tallas.");

      const payload = {
        name: newService.name.trim(),
        type: newService.type,
        availableDays: newService.availableDays,
        price: newService.type === "simple" ? Number(newService.price) : undefined,
        sizes: newService.type === "sized" ? newService.sizes : undefined,
      };

      await dispatch(bulkCreateServices([payload])).unwrap();
      toast.success("Servicio creado exitosamente.");
      setNewService({
        name: "",
        type: "simple",
        price: "",
        sizes: [],
        availableDays: [],
      });
    } catch (err) {
      setError(err.message || "Error al crear el servicio.");
      toast.error(err.message || "Error al crear el servicio.");
    }
  };

  const handleBulkCSVUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const formatted = results.data
          .filter((row) => row.name && row.type)
          .map((row) => ({
            name: row.name.trim(),
            type: row.type === "simple" || row.type === "sized" ? row.type : "simple",
            sizes:
              row.type === "sized" && row.sizes
                ? row.sizes
                    .split(";")
                    .map((s) => {
                      const [name, price] = s.split(":");
                      return name && price && name.length <= 30 && Number(price) >= 0
                        ? { id: uuidv4(), name: name.trim(), price: Number(price) }
                        : null;
                    })
                    .filter(Boolean)
                : [],
            availableDays: row.availableDays
              ? row.availableDays.split(",").map(Number).filter((d) => d >= 0 && d <= 6)
              : [],
            price: row.type === "simple" && row.price ? Number(row.price) : undefined,
          }));
        setBulkServices(formatted);
        toast.info("Archivo CSV cargado, presiona 'Subir servicios' para continuar.");
      },
    });
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    setExcelUploaded(!!file);
    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const formatted = data
        .filter((row) => row.name && row.type)
        .map((row) => ({
          name: row.name.toString().trim(),
          type: row.type === "simple" || row.type === "sized" ? row.type : "simple",
          sizes:
            row.type === "sized" && row.sizes
              ? row.sizes
                  .toString()
                  .split(";")
                  .map((s) => {
                    const [name, price] = s.split(":");
                    return name && price && name.length <= 30 && Number(price) >= 0
                      ? { id: uuidv4(), name: name.trim(), price: Number(price) }
                      : null;
                  })
                  .filter(Boolean)
              : [],
          availableDays: row.availableDays
            ? row.availableDays
                .toString()
                .split(",")
                .map(Number)
                .filter((d) => d >= 0 && d <= 6)
            : [],
          price: row.type === "simple" && row.price ? Number(row.price) : undefined,
        }));

      setBulkServices(formatted);
      toast.info("Archivo Excel cargado, presiona 'Subir servicios' para continuar.");
    };

    reader.readAsBinaryString(file);
  };

  const uploadBulkServices = async () => {
    if (!bulkServices.length) return;
    try {
      await dispatch(bulkCreateServices(bulkServices)).unwrap();
      setBulkServices([]);
      setFileKey(Date.now());
      setExcelUploaded(false);
    } catch (err) {
      toast.error("Error al subir servicios en masa.");
    }
  };

  const handleCancelUpload = () => {
    setBulkServices([]);
    setFileKey(Date.now());
    setExcelUploaded(false);
    toast.info("Carga de archivo cancelada.");
  };

  return (
    <AnimatedContainer
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <FormContainer>
        <h3>Crear un Servicio</h3>
        {error && <ErrorMessage message={error} />}
        <StyledForm onSubmit={handleSubmit}>
          <FloatingInput>
            <input
              type="text"
              name="name"
              value={newService.name}
              onChange={handleInputChange}
              required
              maxLength="50"
            />
            <label className={newService.name ? "filled" : ""}>Nombre</label>
          </FloatingInput>

          <FloatingInput>
            <select
              name="type"
              value={newService.type}
              onChange={handleInputChange}
              required
            >
              <option value="simple">Simple</option>
              <option value="sized">Con Tallas</option>
            </select>
            <label className={newService.type ? "filled" : ""}>Tipo</label>
          </FloatingInput>

          {newService.type === "simple" && (
            <FloatingInput>
              <input
                type="number"
                name="price"
                value={newService.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
              <label className={newService.price ? "filled" : ""}>Precio</label>
            </FloatingInput>
          )}

          {newService.type === "sized" && (
            <SizeInputGroup>
              <FloatingInput>
                <input
                  type="text"
                  placeholder=""
                  value={newSize.name}
                  onChange={(e) => setNewSize({ ...newSize, name: e.target.value })}
                  maxLength="30"
                />
                <label className={newSize.name ? "filled" : ""}>Nombre Talla</label>
              </FloatingInput>
              <FloatingInput>
                <input
                  type="number"
                  placeholder=""
                  value={newSize.price}
                  onChange={(e) => setNewSize({ ...newSize, price: e.target.value })}
                  min="0"
                  step="0.01"
                />
                <label className={newSize.price ? "filled" : ""}>Precio Talla</label>
              </FloatingInput>
              <AddButton
                type="button"
                onClick={addSize}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                + Agregar
              </AddButton>
              <SizeList>
                {newService.sizes.map((size) => (
                  <SizeItem key={size.id}>
                    <span>{size.name} (${size.price})</span>
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
            </SizeInputGroup>
          )}

          <DaySelector>
            <h4>Días Disponibles:</h4>
            <DayGrid>
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day, index) => (
                <DayLabel key={index}>
                  <input
                    type="checkbox"
                    checked={newService.availableDays.includes(index)}
                    onChange={() => toggleDay(index)}
                  />
                  {day}
                </DayLabel>
              ))}
            </DayGrid>
          </DaySelector>

          <AnimatedButton
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            Crear
          </AnimatedButton>
        </StyledForm>

        <Divider />
        <BackButton
          onClick={() => navigate("/admin/services")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Volver a servicios
        </BackButton>
      </FormContainer>

      <BulkUploadContainer
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h4>Subida masiva (CSV o Excel)</h4>
        <BulkUploadGroup>
          <FloatingFileInput isFilled={excelUploaded}>
            <input
              key={fileKey + "-excel"}
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) =>
                e.target.files[0].name.endsWith(".csv")
                  ? handleBulkCSVUpload(e)
                  : handleExcelUpload(e)
              }
            />
            <label>Subir CSV/Excel</label>
          </FloatingFileInput>
          <ButtonGroup>
            <AnimatedButton
              type="button"
              onClick={uploadBulkServices}
              disabled={!bulkServices.length}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              Subir servicios
            </AnimatedButton>
            <CancelButton
              type="button"
              onClick={handleCancelUpload}
              disabled={!bulkServices.length}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              Cancelar
            </CancelButton>
          </ButtonGroup>
        </BulkUploadGroup>
        <SmallText>
          Formato: name,type,price,sizes (Nombre:Precio;Nombre:Precio),availableDays (0,1,3)
        </SmallText>

        {bulkServices.length > 0 && (
          <PreviewBox>
            <h5>Vista previa:</h5>
            <ul>
              {bulkServices.slice(0, 5).map((service, idx) => (
                <li key={idx}>
                  {service.name} - {service.type}
                  {service.type === "simple" && ` - $${service.price}`}
                  {service.type === "sized" &&
                    ` - ${service.sizes.map((s) => `${s.name}:$${s.price}`).join(", ")}`}
                </li>
              ))}
              {bulkServices.length > 5 && (
                <li>...y {bulkServices.length - 5} más</li>
              )}
            </ul>
          </PreviewBox>
        )}
      </BulkUploadContainer>
    </AnimatedContainer>
  );
};

const AnimatedContainer = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2rem;
  gap: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const AnimatedButton = styled(motion.button)`
  background-color: #007bff;
  color: white;
  font-weight: 500;
  border-radius: 8px;
  padding: 0.75rem 1.2rem;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(motion.button)`
  background-color: #6c757d;
  color: white;
  font-weight: 500;
  border-radius: 8px;
  padding: 0.75rem 1.2rem;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #5a6268;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const AddButton = styled(motion.button)`
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

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

  &:hover {
    background: #c82333;
  }
`;

const FormContainer = styled(motion.div)`
  flex: 1;
  max-width: 500px;
  min-width: 300px;

  h3 {
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #333;
  }

  h4 {
    margin-top: 2rem;
    margin-bottom: 0.5rem;
  }
`;

const BulkUploadContainer = styled(motion.div)`
  flex: 1;
  max-width: 500px;
  min-width: 300px;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  box-sizing: border-box;

  h4 {
    margin-bottom: 1rem;
    font-size: 1.25rem;
    color: #333;
  }
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const SizeInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SizeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
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

const DaySelector = styled.div`
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }
`;

const DayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 0.5rem;
`;

const DayLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ced4da;
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;

  input {
    margin: 0;
  }
`;

const Divider = styled.hr`
  margin: 2rem 0;
`;

const SmallText = styled.p`
  font-size: 0.85rem;
  color: #666;
  margin-top: 1rem;
`;

const PreviewBox = styled.div`
  margin-top: 1rem;
  background: #f1f1f1;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.95rem;
  width: 100%;
  text-align: left;

  ul {
    list-style: none;
    padding-left: 0;
  }

  li {
    margin-bottom: 0.25rem;
  }
`;

const BackButton = styled(motion.button)`
  margin-top: 2rem;
  background: transparent;
  color: #007bff;
  border: none;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    text-decoration: underline;
  }
`;

const BulkUploadGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

export default CreateService;