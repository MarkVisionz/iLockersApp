import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { PrimaryButton } from "./CommonStyled";
import { productsCreate } from "../../features/productsSlice";

const CreateProduct = () => {
  const dispatch = useDispatch();
  const { createStatus } = useSelector((state) => state.products);

  const [productImg, setProductImg] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");

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
    dispatch(productsCreate({
      name,
      price,
      weight,
      image: productImg
    }));
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
          <SubmitButton>{createStatus === "pending" ? "Submitting..." : "Submit"}</SubmitButton>
        </StyledForm>
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

const ImagePreview = styled.div`
  flex: 1;
  max-width: 300px;
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 4px;
  }
`;

const PlaceholderText = styled.p`
  color: #777;
`;
