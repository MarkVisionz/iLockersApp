import * as React from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { productsEdit } from "../../features/productsSlice";
import { motion } from "framer-motion";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

export default function EditProduct({ prodId, onClose }) {
  const [open, setOpen] = React.useState(true); // abierto por defecto
  const { items, editStatus } = useSelector((state) => state.products);
  const dispatch = useDispatch();

  const [previewImg, setPreviewImg] = useState("");
  const [currentProd, setCurrentProd] = useState({});
  const [productImg, setProductImg] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [category, setCategory] = useState("ropa común");
  const [description, setDescription] = useState("");

  const handleProductImageUpload = (e) => {
    const file = e.target.files[0];
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
          name,
          price,
          weight,
          category,
          description,
        },
      })
    );

    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  React.useEffect(() => {
    let selectedProd = items.find((item) => item._id === prodId);

    if (selectedProd) {
      setCurrentProd(selectedProd);
      setPreviewImg(selectedProd.image?.url || "");
      setProductImg("");
      setWeight(selectedProd.weight);
      setName(selectedProd.name);
      setPrice(selectedProd.price);
      setCategory(selectedProd.category || "ropa común");
      setDescription(selectedProd.description || "");
    } else {
      console.error("Producto no encontrado:", prodId);
    }
  }, [prodId, items]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Editar Producto</DialogTitle>
      <DialogContent>
        <StyledEditProduct
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <StyledForm
            onSubmit={handleSubmit}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <h3>Editar Producto</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleProductImageUpload}
            />
            <input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Precio (MXN)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Peso (g)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="ropa común">Ropa común</option>
              <option value="ropa de cama">Ropa de cama</option>
            </select>
            <textarea
              placeholder="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <SubmitButton type="submit">
              {editStatus === "pending" ? "Actualizando..." : "Actualizar"}
            </SubmitButton>
          </StyledForm>

          <ImagePreview
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {previewImg ? (
              <img src={previewImg} alt="preview" />
            ) : (
              <p>Vista previa</p>
            )}
          </ImagePreview>
        </StyledEditProduct>
      </DialogContent>
      <DialogActions>
        <CloseButton onClick={handleClose}>Cancelar</CloseButton>
      </DialogActions>
    </Dialog>
  );
}

const StyledForm = styled(motion.form)`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 260px;

  label {
    margin-top: 1rem;
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;
  }

  input,
  select,
  textarea {
    padding: 0.65rem;
    margin-top: 0.3rem;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 0.95rem;
    background-color: #fefefe;
    transition: border 0.3s ease;
  }

  input:focus,
  select:focus,
  textarea:focus {
    border: 2px solid #007bff;
    outline: none;
  }

  textarea {
    resize: none;
  }
`;

const StyledEditProduct = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 2rem;
`;

const ImagePreview = styled(motion.div)`
  flex: 1;
  max-width: 320px;
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background-color: #f9f9f9;
  color: #777;

  img {
    width: 100%;
    object-fit: contain;
    border-radius: 6px;
  }
`;

const CloseButton = styled(Button)`
  && {
    background-color: #6c757d;
    color: white;
    text-transform: none;
    font-weight: 500;
    border-radius: 8px;
    padding: 0.3rem 1rem;
    font-size: 0.95rem;
    transition: background-color 0.3s ease;
    margin-right:1rem;
    margin-bottom: 1rem;

    &:hover {
      background-color: #5a6268;
    }
  }
`;

export const SubmitButton = styled(Button)`
  && {
    margin-top: 1.5rem;
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
