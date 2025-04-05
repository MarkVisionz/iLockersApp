import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { PrimaryButton } from "./CommonStyled";
import {
  productsCreate,
  bulkCreateProducts,
} from "../../features/productsSlice";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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
  const [bulkProducts, setBulkProducts] = useState([]);
  const [fileKey, setFileKey] = useState(Date.now());

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
        image: productImg || { url: DEFAULT_IMAGE_URL },
      })
    );
    setName("");
    setPrice("");
    setWeight("");
    setProductImg("");
  };

  const uploadBulkProducts = async () => {
    if (!bulkProducts.length) return;
    dispatch(bulkCreateProducts(bulkProducts))
      .unwrap()
      .then(() => {
        setBulkProducts([]);
        setFileKey(Date.now());
      })
      .catch((err) => {
        console.error("Error en carga masiva:", err);
        toast.error("❌ Error al subir productos en masa");
      });
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
    <StyledCreateProduct>
      <FormContainer>
        <h3>Create a Product</h3>
        <StyledForm onSubmit={handleSubmit}>
          <InputLabel htmlFor="imgUpload">Upload Image</InputLabel>
          <FileInput
            id="imgUpload"
            accept="image/*"
            type="file"
            onChange={handleProductImageUpload}
            required
          />
          <InputLabel htmlFor="name">Name</InputLabel>
          <TextInput
            id="name"
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <InputLabel htmlFor="price">Price</InputLabel>
          <TextInput
            id="price"
            type="number"
            placeholder="Product Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <InputLabel htmlFor="weight">Weight (g)</InputLabel>
          <TextInput
            id="weight"
            type="number"
            placeholder="Product Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
          <SubmitButton>
            {createStatus === "pending" ? "Submitting..." : "Submit"}
          </SubmitButton>
        </StyledForm>

        <Divider />

        <h4>Subida masiva (CSV o Excel)</h4>
        <BulkUploadGroup>
          <FileInput
            key={fileKey + "-csv"}
            type="file"
            accept=".csv"
            onChange={handleBulkCSVUpload}
          />
          <FileInput
            key={fileKey + "-excel"}
            type="file"
            accept=".xlsx"
            onChange={handleExcelUpload}
          />
          <SubmitButton
            type="button"
            onClick={uploadBulkProducts}
            disabled={!bulkProducts.length}
          >
            Subir productos
          </SubmitButton>
        </BulkUploadGroup>
        <SmallText>Formato: name,price,weight,image</SmallText>

        {bulkProducts.length > 0 && (
          <PreviewBox>
            <h5>Vista previa:</h5>
            <ul>
              {bulkProducts.slice(0, 5).map((product, idx) => (
                <li key={idx}>
                  {product.name} - ${product.price} - {product.weight}g
                </li>
              ))}
              {bulkProducts.length > 5 && (
                <li>...y {bulkProducts.length - 5} más</li>
              )}
            </ul>
          </PreviewBox>
        )}

        <BackButton onClick={() => navigate("/admin/products")}>
          {" "}
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
    </StyledCreateProduct>
  );
};

export default CreateProduct;

// Styled Components debajo... (sin cambios)

const StyledCreateProduct = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2rem;
  gap: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const FormContainer = styled.div`
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

const InputLabel = styled.label`
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: bold;
`;

const FileInput = styled.input`
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const TextInput = styled.input`
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const SubmitButton = styled(PrimaryButton)`
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 4px;
`;

const Divider = styled.hr`
  margin: 2rem 0;
`;

const SmallText = styled.p`
  font-size: 0.85rem;
  color: #666;
`;

const ImagePreview = styled.div`
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

