import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  deleteObject,
} from "firebase/storage";
import { storage, auth as firebaseAuth } from "../../../features/firebase-config";
import { updateUser } from "../../../features/usersSlice";
import { LoadingSpinner, ErrorMessage } from "../../LoadingAndError";

const ProfileEditModal = ({ user, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: "",
    email: "",
    photoURL: "",
    currentPassword: "",
    newPassword: "",
    showCurrentPassword: false,
    showNewPassword: false,
    image: null,
    preview: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    form: "",
  });
  const [loading, setLoading] = useState(false);
  const [authProvider, setAuthProvider] = useState("password");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        currentPassword: "",
        newPassword: "",
        showCurrentPassword: false,
        showNewPassword: false,
        image: null,
        preview: user.photoURL || "",
      });
      setAuthProvider(user.authProvider || "password");
    }
  }, [user]);

  const hasChanges =
    form.name !== (user?.name || "") ||
    form.email !== (user?.email || "") ||
    form.newPassword !== "" ||
    form.image !== null;

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      form: "",
    };

    if (!form.name.trim() || form.name.length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Correo inválido";
    }

    if (authProvider === "password" && form.newPassword) {
      if (!form.currentPassword) {
        newErrors.currentPassword = "Se requiere la contraseña actual";
      }
      if (form.newPassword.length < 6) {
        newErrors.newPassword = "Mínimo 6 caracteres";
      } else if (form.newPassword.length > 50) {
        newErrors.newPassword = "Máximo 50 caracteres";
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        image: file,
        preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.photoURL) return;
    try {
      setLoading(true);
      const fileRef = ref(storage, user.photoURL);
      await deleteObject(fileRef);
      await dispatch(
        updateUser({
          userId: user._id,
          updates: { photoURL: "" },
        })
      ).unwrap();
      setForm((prev) => ({ ...prev, photoURL: "", preview: "", image: null }));
      toast.success("Foto eliminada");
    } catch (error) {
      toast.error("Error al eliminar foto");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetEmail = async () => {
    try {
      if (!user?.email) throw new Error("No se encontró un correo registrado");
      await sendPasswordResetEmail(firebaseAuth, user.email, {
        url: `${window.location.origin}/login`,
      });
      toast.success("Enlace de restablecimiento enviado");
      onClose();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: `Error al enviar correo: ${error.message}`,
      }));
      toast.error(`Error al enviar correo: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      form: "",
    });

    if (!hasChanges) return;
    if (!validateForm()) return;

    setLoading(true);

    try {
      let photoURL = form.photoURL;
      if (form.image) {
        const storageRef = ref(storage, `users/${user._id}/${form.image.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, form.image);
        photoURL = await getDownloadURL(uploadTask.ref);
      }

      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error(
          "No hay sesión activa. Por favor, inicia sesión nuevamente."
        );
      }

      const updates = {
        name: form.name,
        email: form.email,
        photoURL,
      };

      if (authProvider === "password") {
        if (form.newPassword || form.email !== user.email) {
          const credential = EmailAuthProvider.credential(
            user.email,
            form.currentPassword
          );
          await reauthenticateWithCredential(currentUser, credential);

          if (form.newPassword) {
            await updatePassword(currentUser, form.newPassword);
            updates.password = form.newPassword;
          }

          if (form.email !== user.email) {
            await updateEmail(currentUser, form.email);
          }
        }
      } else if (form.newPassword) {
        await updatePassword(currentUser, form.newPassword);
        updates.password = form.newPassword;
        updates.authProvider = "password";
      }

      await dispatch(updateUser({ userId: user._id, updates })).unwrap();

      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        image: null,
        preview: photoURL || prev.preview,
      }));

      onSuccess && onSuccess();
      onClose();

      if (form.newPassword || form.email !== user.email) {
        toast.info("Por seguridad, por favor inicia sesión nuevamente.");
      }
    } catch (error) {
      let msg = "Error al actualizar perfil";
      if (error.code) {
        switch (error.code) {
          case "auth/wrong-password":
            msg = "Contraseña actual incorrecta";
            break;
          case "auth/invalid-credential":
            msg = "Error de autenticación. Por favor, inicia sesión nuevamente.";
            break;
          case "auth/too-many-requests":
            msg = "Demasiados intentos fallidos. Intenta de nuevo más tarde.";
            break;
          case "auth/invalid-email":
            msg = "Formato de correo inválido";
            break;
          case "auth/requires-recent-login":
            msg = "Por seguridad, por favor inicia sesión nuevamente.";
            break;
        }
      }
      setErrors((prev) => ({ ...prev, form: msg }));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <StyledCard
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading && <LoadingSpinner />}
        {errors.form && <ErrorMessage message={errors.form} />}
        <FormHeader>
          <CardTitle>Editar Perfil</CardTitle>
          <CloseButton onClick={onClose} aria-label="Cerrar formulario">
            <FaTimes />
          </CloseButton>
        </FormHeader>
        <StyledEditForm onSubmit={handleSubmit}>
          <SectionTitle>Información Personal</SectionTitle>
          <FormField>
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name}
              placeholder="Ingresa tu nombre"
            />
            {errors.name && <ErrorMessage message={errors.name} />}
          </FormField>
          <FormField>
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              aria-invalid={!!errors.email}
              disabled
              placeholder="Ingresa tu correo"
            />
            <small>El correo no se puede editar desde este formulario.</small>
            {errors.email && <ErrorMessage message={errors.email} />}
          </FormField>
          <FormField>
            <label htmlFor="photo">Foto de Perfil</label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {form.preview && (
              <ImagePreviewContainer>
                <PreviewImg src={form.preview} alt="Vista previa de la foto de perfil" />
                <ActionButton
                  type="button"
                  onClick={handleDeletePhoto}
                  $variant="danger"
                >
                  Eliminar Foto
                </ActionButton>
              </ImagePreviewContainer>
            )}
          </FormField>

          <SectionTitle>Seguridad</SectionTitle>
          {authProvider === "password" ? (
            <>
              <FormField>
                <label htmlFor="currentPassword">Contraseña Actual</label>
                <PasswordContainer>
                  <input
                    id="currentPassword"
                    type={form.showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={(e) =>
                      setForm({ ...form, currentPassword: e.target.value })
                    }
                    aria-invalid={!!errors.currentPassword}
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <TogglePassword
                    onClick={() =>
                      setForm({
                        ...form,
                        showCurrentPassword: !form.showCurrentPassword,
                      })
                    }
                    aria-label={
                      form.showCurrentPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {form.showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </TogglePassword>
                </PasswordContainer>
                {errors.currentPassword && (
                  <ErrorMessage message={errors.currentPassword} />
                )}
              </FormField>
              <FormField>
                <label htmlFor="newPassword">Nueva Contraseña</label>
                <PasswordContainer>
                  <input
                    id="newPassword"
                    type={form.showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={(e) =>
                      setForm({ ...form, newPassword: e.target.value })
                    }
                    placeholder="Mínimo 6 caracteres"
                    aria-invalid={!!errors.newPassword}
                  />
                  <TogglePassword
                    onClick={() =>
                      setForm({
                        ...form,
                        showNewPassword: !form.showNewPassword,
                      })
                    }
                    aria-label={
                      form.showNewPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {form.showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </TogglePassword>
                </PasswordContainer>
                {errors.newPassword && (
                  <ErrorMessage message={errors.newPassword} />
                )}
              </FormField>
            </>
          ) : (
            <PasswordResetBox>
              <p>
                Estás usando{" "}
                {authProvider === "google.com" ? "Google" : "Facebook"}. Establece
                una contraseña para tu cuenta.
              </p>
              <ActionButton
                type="button"
                onClick={handlePasswordResetEmail}
                disabled={loading}
              >
                Establecer Contraseña
              </ActionButton>
              <small>
                Se enviará un enlace a {user?.email || "tu correo registrado"}.
              </small>
            </PasswordResetBox>
          )}

          <ButtonGroup>
            <ActionButton type="submit" disabled={loading || !hasChanges}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </ActionButton>
            <ActionButton
              type="button"
              onClick={onClose}
              $variant="danger"
            >
              Cancelar
            </ActionButton>
          </ButtonGroup>
        </StyledEditForm>
      </StyledCard>
    </ModalBackdrop>
  );
};

// Styles
const ModalBackdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const StyledCard = styled(motion.div)`
  background: #fff;
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

    &:disabled {
      background: #f5f5f7;
      color: #86868b;
    }
  }

  small {
    color: #86868b;
    font-size: 0.85rem;
  }
`;

const PasswordContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const TogglePassword = styled.span`
  position: absolute;
  right: 0.75rem;
  color: #86868b;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;

  &:hover {
    color: #007aff;
  }
`;

const PasswordResetBox = styled.div`
  padding: 1rem;
  background: #f5f5f7;
  border-radius: 12px;
  text-align: center;
  font-size: 0.95rem;
  color: #1d1d1f;

  p {
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  small {
    display: block;
    margin-top: 0.5rem;
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
  background: ${({ $variant }) => ($variant === "danger" ? "#ff3b30" : "#007aff")};
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: ${({ $variant }) => ($variant === "danger" ? "#cc2f28" : "#005bb5")};
    transform: translateY(-1px);
  }

  &:disabled {
    background: #d1d1d6;
    cursor: not-allowed;
  }
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const PreviewImg = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #e5e5ea;
`;

export default ProfileEditModal;