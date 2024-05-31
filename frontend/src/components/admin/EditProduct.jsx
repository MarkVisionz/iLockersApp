import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { PrimaryButton } from "./CommonStyled";
import { productsEdit } from "../../features/productsSlice";

export default function EditProduct({ prodId }) {
  const [open, setOpen] = React.useState(false);
  const { items, editStatus } = useSelector((state) => state.products);

  const dispatch = useDispatch();

  const [previewImg, setPreviewImg] = useState("");
  const [currentProd, setCurrentProd] = useState({});

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
        setPreviewImg(reader.result);
      };
    } else {
      setProductImg("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    dispatch(
      productsEdit({
        productImg,
        product: {
          ...currentProd,
          name: name,
          weight: weight,
          price: price,
        },
      })
    );
    console.log("current",currentProd);
  };

  


  const handleClickOpen = () => {
    setOpen(true);

    // if (items && items.length > 0) {
    //   const selectedProd = items.find((item) => item._id === prodId);

    //   if (selectedProd) {
    //     setCurrentProd(selectedProd);
    //     setPreviewImg(selectedProd.image.url);
    //     setProductImg("");
    //     setWeight(selectedProd.weight);
    //     setName(selectedProd.name);
    //     setPrice(selectedProd.price);
    //   } else {
    //     // Manejar el caso en que no se encuentra el producto con el ID proporcionado
    //     console.error("Product not found with ID:", prodId);
    //   }
    // } else {
    //   // Manejar el caso en que no se hayan cargado los datos de los productos
    //   console.error("No products loaded.");
    // }

    let selectedProd = items.filter((item) => item._id === prodId);

    selectedProd = selectedProd[0];

    console.log(selectedProd);

    if (selectedProd) {
      setCurrentProd(selectedProd);
      setPreviewImg(selectedProd.image.url);
      setProductImg("");
      setWeight(selectedProd.weight);
      setName(selectedProd.name);
      setPrice(selectedProd.price);
    } else {
      // Manejar el caso en que no se encuentra el producto con el ID proporcionado
      console.error("Product not found with ID:", prodId);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Edit onClick={handleClickOpen}>Edit</Edit>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth={true}
        maxWidth={"md"}
      >
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <StyledEditProduct>
            <StyledForm onSubmit={handleSubmit}>
              <h3>Create a Product</h3>
              <input
                type="file"
                accept="image/*"
                onChange={handleProductImageUpload}
              />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Weight of the product in (g)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
              <PrimaryButton type="submit">
                {editStatus === "pending" ? "Submitting" : "Submit"}
              </PrimaryButton>
            </StyledForm>
            <ImagePreview>
              {previewImg ? (
                <>
                  <img src={previewImg} alt="error!" />
                </>
              ) : (
                <p>Image preview will appear here</p>
              )}
            </ImagePreview>
          </StyledEditProduct>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const Edit = styled.button`
  border: none;
  outline: none;
  padding: 5px 10px;
  color: white;
  border-radius: 3px;
  cursor: pointer;
  background-color: #4b70e2;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 300px;
  margin-top: 2rem;

  select,
  input {
    padding: 7px;
    min-height: 30px;
    outline: none;
    border-radius: 5px;
    border: 1px solid rgb(182, 182, 182);
    margin: 0.3rem 0;

    &:focus {
      border: 2px solid rgb(0, 208, 255);
    }
  }

  select {
    color: rgb(95, 95, 95);
  }
`;

const StyledEditProduct = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ImagePreview = styled.div`
  margin: 2rem 0 2rem 2rem;
  padding: 2rem;
  border: 1px solid rgb(183, 183, 183);
  max-width: 300px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: rgb(78, 78, 78);

  img {
    max-width: 100%;
  }
`;
