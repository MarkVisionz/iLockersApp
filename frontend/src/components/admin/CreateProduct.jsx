import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  productsCreate,
  bulkCreateProducts,
} from "../../features/productsSlice";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FloatingInput, FloatingFileInput } from "./CommonStyled";

const DEFAULT_IMAGE_URL =
  "https://res.cloudinary.com/mkocloud/image/upload/v1743619497/lavadora_kkmvss.png";

const CreateProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { createStatus } = useSelector((state) => state.products);

  const [productImg, setProductImg] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [bulkProducts, setBulkProducts] = useState([]);
  const [fileKey, setFileKey] = useState(Date.now());
  const [excelUploaded, setExcelUploaded] = useState(false);

  const handleProductImageUpload = (e) => {
    const file = e.target.files[0];
    TransformFileData(file);
  };

  const TransformFileData = (file) => {
    const reader = new FileReader();
    if (file) {
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setProductImg(reader.result);
      };
    } else {
      setProductImg("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(
      productsCreate({
        name,
        price,
        weight,
        category,
        description,
        image: productImg || { url: DEFAULT_IMAGE_URL },
      })
    );
    setName("");
    setPrice("");
    setWeight("");
    setCategory("ropa común");
    setDescription("");
    setProductImg("");
  };

  const uploadBulkProducts = async () => {
    if (!bulkProducts.length) return;
    dispatch(bulkCreateProducts(bulkProducts))
      .unwrap()
      .then(() => {
        setBulkProducts([]);
        setFileKey(Date.now());
        setExcelUploaded(false);
      })
      .catch((err) => {
        console.error("Error en carga masiva:", err);
        toast.error("❌ Error al subir productos en masa");
      });
  };

  const handleCancelUpload = () => {
    setBulkProducts([]);
    setFileKey(Date.now());
    setExcelUploaded(false);
    toast.info("Carga de archivo cancelada.");
  };

  const handleBulkCSVUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const formatted = results.data.map((item) => ({
          name: item.name,
          price: parseFloat(item.price),
          weight: item.weight,
          category: item.category || "ropa común",
          description: item.description || "",
          image: { url: item.image || DEFAULT_IMAGE_URL },
        }));
        setBulkProducts(formatted);
        toast.info(
          "Archivo CSV cargado, presiona 'Subir productos' para continuar"
        );
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

      const formatted = data.map((item) => ({
        name: item.name,
        price: parseFloat(item.price),
        weight: item.weight,
        category: item.category || "ropa común",
        description: item.description || "",
        image: { url: item.image || DEFAULT_IMAGE_URL },
      }));

      setBulkProducts(formatted);
      toast.info(
        "Archivo Excel cargado, presiona 'Subir productos' para continuar"
      );
    };

    reader.readAsBinaryString(file);
  };

  return (
    <AnimatedContainer>
      <FormContainer>
        <h3>Create a Product</h3>
        <StyledForm onSubmit={handleSubmit}>
          <FloatingFileInput isFilled={!!productImg}>
            <input
              id="imgUpload"
              type="file"
              accept="image/*"
              onChange={handleProductImageUpload}
            />
            <label htmlFor="imgUpload">Upload Image</label>
          </FloatingFileInput>

          <FloatingInput>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <label className={name ? "filled" : ""}>Name</label>
          </FloatingInput>

          <FloatingInput>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <label className={price ? "filled" : ""}>Price</label>
          </FloatingInput>

          <FloatingInput>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
            <label className={weight ? "filled" : ""}>Weight (g)</label>
          </FloatingInput>

          <FloatingInput>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled hidden></option>
              <option value="ropa común">Ropa común</option>
              <option value="ropa de cama">Ropa de cama</option>
            </select>
            <label className={category ? "filled" : ""}>Category</label>
          </FloatingInput>

          <FloatingInput>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=""
              rows={3}
            />
            <label className={description ? "filled" : ""}>Descripción</label>
          </FloatingInput>

          <AnimatedButton type="submit">
            {createStatus === "pending" ? "Submitting..." : "Submit"}
          </AnimatedButton>
        </StyledForm>

        <Divider />

        <h4>Subida masiva (CSV o Excel)</h4>
        <BulkUploadGroup>
          <FloatingFileInput isFilled={excelUploaded}>
            <input
              key={fileKey + "-excel"}
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) =>
                e.target.files[0].name.endsWith(".csv")
                  ? handleBulkCSVUpload(e)
                  : handleExcelUpload(e)
              }
            />
            <label htmlFor="excelUpload">Subir Excel o CSV</label>
          </FloatingFileInput>

          <ButtonGroup>
            <AnimatedButton
              type="button"
              onClick={uploadBulkProducts}
              disabled={!bulkProducts.length}
            >
              Subir productos
            </AnimatedButton>

            <CancelButton
              type="button"
              onClick={handleCancelUpload}
              disabled={!bulkProducts.length}
            >
              Cancelar
            </CancelButton>
          </ButtonGroup>
        </BulkUploadGroup>

        <SmallText>
          Formato: name,price,weight,category,description,image
        </SmallText>

        {bulkProducts.length > 0 && (
          <PreviewBox>
            <h5>Vista previa:</h5>
            <ul>
              {bulkProducts.slice(0, 5).map((product, idx) => (
                <li key={idx}>
                  {product.name} - ${product.price} - {product.weight}g - {product.category}
                </li>
              ))}
              {bulkProducts.length > 5 && (
                <li>...y {bulkProducts.length - 5} más</li>
              )}
            </ul>
          </PreviewBox>
        )}

        <BackButton onClick={() => navigate("/admin/products")}>
          ← Volver a productos
        </BackButton>
      </FormContainer>

      <ImagePreview>
        {productImg ? (
          <img src={productImg} alt="Product Preview" />
        ) : (
          <PlaceholderText>Image preview will appear here</PlaceholderText>
        )}
      </ImagePreview>
    </AnimatedContainer>
  );
};

export default CreateProduct;


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
  margin-top: 1.5rem;
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

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const Divider = styled.hr`
  margin: 2rem 0;
`;

const SmallText = styled.p`
  font-size: 0.85rem;
  color: #666;
`;

const ImagePreview = styled(motion.div)`
  flex: 1;
  max-width: 500px;
  min-width: 300px;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  box-sizing: border-box;

  img {
    width: 100%;
    max-height: 160px;
    object-fit: contain;
    border-radius: 4px;
  }
`;

const PlaceholderText = styled.p`
  color: #777;
`;

const PreviewBox = styled.div`
  margin-top: 1rem;
  background: #f1f1f1;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.95rem;

  ul {
    list-style: none;
    padding-left: 0;
  }

  li {
    margin-bottom: 0.25rem;
  }
`;

const BackButton = styled.button`
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
  margin-bottom: 1rem;
  margin-top: 1rem;
`;


const CancelButton = styled(motion.button)`
  background-color: #6c757d;
  color: white;
  margin-top: 1.5rem;
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
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;