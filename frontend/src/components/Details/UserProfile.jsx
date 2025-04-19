import { useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setHeaders, url } from "../../features/api";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import { toast } from "react-toastify";
import socket from "../../features/socket";
import {
  AiOutlineEdit,
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import { MdOutlineAdminPanelSettings, MdOutlinePerson } from "react-icons/md";
import UserPagination from "./UserAux/UserPagination";
import UserOrdersCard from "./UserAux/UserOrdersCard";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  deleteObject,
} from "firebase/storage";
import { storage, auth as firebaseAuth } from "../../features/firebase-config";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import NotificationModal from "../NotificacionModal";
import { logoutUser } from "../../features/authSlice";
import { ordersFetch } from "../../features/ordersSlice";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { _id: authId, isAdmin, email: authEmail } = useSelector(
    (state) => state.auth
  );
  const { list: orders, status } = useSelector((state) => state.orders);
  const userId = isAdmin ? id : authId;

  const [user, setUser] = useState({
    name: "",
    email: "",
    isAdmin: false,
    photoURL: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    form: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [sortOrder, setSortOrder] = useState("desc");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [authProvider, setAuthProvider] = useState("password");
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] =
    useState(false);
  const [showPasswordEmailInfo, setShowPasswordEmailInfo] = useState(false);
  const [isCheckingPasswordUpdate, setIsCheckingPasswordUpdate] =
    useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const headers = setHeaders();
      const res = await axios.get(`${url}/users/find/${userId}`, headers);
      const firebaseUser = firebaseAuth.currentUser;
      const provider =
        firebaseUser?.providerData[0]?.providerId ||
        res.data.authProvider ||
        "password";
      if (!["google.com", "facebook.com", "password"].includes(provider)) {
        setErrors((prev) => ({
          ...prev,
          form: "Proveedor de autenticación no soportado",
        }));
        toast.error("Proveedor de autenticación no soportado");
        return;
      }
      setUser({
        name: res.data.name,
        email: res.data.email,
        isAdmin: res.data.isAdmin,
        photoURL: res.data.photoURL,
      });
      setAuthProvider(provider);
    } catch (error) {
      if (error.response?.status !== 401) {
        setErrors((prev) => ({
          ...prev,
          form: "Error al obtener datos del usuario",
        }));
        toast.error("Error al obtener datos del usuario");
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authId) return;

    fetchUser();
    dispatch(ordersFetch());

    const handleUserUpdated = (updatedUser) => {
      if (updatedUser._id === userId) {
        setUser((prev) => ({
          ...prev,
          name: updatedUser.name || prev.name,
          email: updatedUser.email || prev.email,
          isAdmin:
            updatedUser.isAdmin !== undefined
              ? updatedUser.isAdmin
              : prev.isAdmin,
          photoURL: updatedUser.photoURL || prev.photoURL,
          authProvider: updatedUser.authProvider || prev.authProvider,
        }));
      }
    };

    socket.on("userUpdated", handleUserUpdated);
    return () => socket.off("userUpdated", handleUserUpdated);
  }, [authId, userId, fetchUser, dispatch]);

  useEffect(() => {
    if (!isCheckingPasswordUpdate || authProvider === "password") return;

    const maxAttempts = 60;
    let attempts = 0;

    const checkPasswordUpdate = async () => {
      try {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error("No hay sesión activa");

        await currentUser.reload();
        const providerId = currentUser.providerData[0]?.providerId;

        if (providerId === "password") {
          const newToken = await currentUser.getIdToken(true);
          await axios.put(
            `${url}/users/${userId}`,
            { authProvider: "password", fromResetFlow: true },
            { headers: { "x-auth-token": newToken } }
          );

          setAuthProvider("password");
          setShowPasswordSuccessModal(true);
          setIsCheckingPasswordUpdate(false);
        }
      } catch (error) {
        toast.error("Error al verificar el cambio de contraseña");
        setIsCheckingPasswordUpdate(false);
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setIsCheckingPasswordUpdate(false);
        toast.info("El tiempo para establecer la contraseña ha expirado.");
        await signOut(firebaseAuth);
        dispatch(logoutUser());
        navigate("/login");
      }
    };

    const intervalId = setInterval(checkPasswordUpdate, 3000);
    return () => clearInterval(intervalId);
  }, [isCheckingPasswordUpdate, authProvider, userId, dispatch, navigate]);

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      form: "",
    };

    if (editing) {
      if (!user.name.trim() || user.name.length < 2) {
        newErrors.name = "El nombre debe tener al menos 2 caracteres";
      }

      if (
        !user.email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
      ) {
        newErrors.email = "Correo inválido";
      }

      if (authProvider === "password" && newPassword) {
        if (!currentPassword) {
          newErrors.currentPassword = "La contraseña actual es requerida";
        }
        if (newPassword.length < 6) {
          newErrors.newPassword = "Mínimo 6 caracteres";
        } else if (newPassword.length > 50) {
          newErrors.newPassword = "Máximo 50 caracteres";
        }
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDeletePhoto = async () => {
    if (!user.photoURL) return;
    try {
      const fileRef = ref(storage, user.photoURL);
      await deleteObject(fileRef);
      setUser({ ...user, photoURL: "" });
      toast.success("Foto eliminada");
    } catch (error) {
      toast.error("No se pudo eliminar la foto");
    }
  };

  const handlePasswordResetEmail = async () => {
    try {
      if (!user.email) throw new Error("No se encontró un correo registrado");
      await sendPasswordResetEmail(firebaseAuth, user.email, {
        url: `${window.location.origin}/login`,
      });
      setShowPasswordEmailInfo(true);
      setIsCheckingPasswordUpdate(true);
      toast.success("Enlace de restablecimiento enviado");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: `Error al enviar el correo: ${error.message}`,
      }));
      toast.error(`Error al enviar el correo: ${error.message}`);
    }
  };

  const handleCancelPasswordReset = () => {
    setShowPasswordEmailInfo(false);
    setIsCheckingPasswordUpdate(false);
    toast.info("Proceso de restablecimiento de contraseña cancelado.");
  };

  const handlePasswordSuccessClose = () => {
    setShowPasswordSuccessModal(false);
    signOut(firebaseAuth);
    dispatch(logoutUser());
    navigate("/login", {
      state: {
        message:
          "¡Contraseña establecida! Por favor inicia sesión con tu nueva contraseña.",
      },
    });
  };

  const handleCloseInfoModal = () => {
    setShowPasswordEmailInfo(false);
    signOut(firebaseAuth);
    dispatch(logoutUser());
    toast.info(
      "Tu sesión ha sido cerrada por seguridad. Inicia sesión con tus nuevos datos."
    );
    navigate("/login", {
      state: {
        message:
          "Se envió el enlace para establecer contraseña. Por favor revisa tu correo e inicia sesión.",
        email: user.email,
      },
    });
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setErrors({
        name: "",
        email: "",
        currentPassword: "",
        newPassword: "",
        form: "",
      });
      if (!validateForm()) return;

      setLoading(true);
      try {
        let photoURL = user.photoURL;
        if (image) {
          const storageRef = ref(storage, `users/${userId}/${image.name}`);
          const uploadTask = await uploadBytesResumable(storageRef, image);
          photoURL = await getDownloadURL(uploadTask.ref);
        }

        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) {
          throw new Error(
            "No hay sesión activa. Por favor, inicia sesión de nuevo"
          );
        }

        const updates = { name: user.name, email: user.email, photoURL };

        if (authProvider === "password") {
          if (newPassword || user.email !== authEmail) {
            const credential = EmailAuthProvider.credential(
              authEmail,
              currentPassword
            );
            await reauthenticateWithCredential(currentUser, credential);

            if (newPassword) {
              await updatePassword(currentUser, newPassword);
              updates.password = newPassword;
            }

            if (user.email !== authEmail) {
              await updateEmail(currentUser, user.email);
            }
          }
        } else if (newPassword) {
          await updatePassword(currentUser, newPassword);
          updates.password = newPassword;
          updates.authProvider = "password";
        }

        await axios.put(`${url}/users/${authId}`, updates, setHeaders());

        setCurrentPassword("");
        setNewPassword("");
        setImage(null);
        setPreview("");
        setEditing(false);

        setSuccessMessage(
          newPassword
            ? "Actualizaste tu contraseña exitosamente"
            : "Actualizaste tu información exitosamente"
        );
        setShowSuccessModal(true);

        if (newPassword || user.email !== authEmail) {
          toast.info("Por seguridad, vuelve a iniciar sesión");
          setTimeout(() => {
            dispatch(logoutUser());
            navigate("/login");
          }, 3000);
        }
      } catch (error) {
        let msg = "Error al actualizar el perfil";
        if (error.code) {
          switch (error.code) {
            case "auth/wrong-password":
              msg = "Contraseña actual incorrecta";
              break;
            case "auth/invalid-credential":
              msg = "Error de autenticación. Por favor, inicia sesión de nuevo";
              break;
            case "auth/too-many-requests":
              msg = "Demasiados intentos fallidos. Intenta de nuevo más tarde";
              break;
            case "auth/invalid-email":
              msg = "El formato del correo es incorrecto";
              break;
            case "auth/requires-recent-login":
              msg = "Por seguridad, vuelve a iniciar sesión";
              break;
          }
        } else if (error.response?.data?.message) {
          msg = error.response.data.message;
        }

        setErrors((prev) => ({ ...prev, form: msg }));
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      image,
      authId,
      userId,
      currentPassword,
      newPassword,
      authEmail,
      authProvider,
      dispatch,
      navigate,
    ]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => order.userId === userId);
  }, [orders, userId]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [filteredOrders, sortOrder]);

  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage, itemsPerPage]);

  return (
    <StyledProfile>
      <ProfileContainer>
        <Header>
          {user.photoURL || preview ? (
            <>
              <Avatar src={preview || user.photoURL} alt={user.name} />
              <Button onClick={handleDeletePhoto}>Eliminar foto</Button>
            </>
          ) : (
            <AvatarPlaceholder>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarPlaceholder>
          )}
          <h3>{user.name}</h3>
          <RoleTag isAdmin={user.isAdmin}>
            {user.isAdmin ? (
              <MdOutlineAdminPanelSettings />
            ) : (
              <MdOutlinePerson />
            )}
            {user.isAdmin ? " Admin" : " Customer"}
          </RoleTag>
          <p>{user.email}</p>
          <Button onClick={() => setEditing((prev) => !prev)}>
            <AiOutlineEdit /> {editing ? "Cancelar" : "Editar Perfil"}
          </Button>
        </Header>

        {(loading || status === "loading") && <LoadingSpinner />}
        {errors.form && <ErrorMessage message={errors.form} />}

        {editing && (
          <EditForm onSubmit={handleSubmit}>
            <label>
              Nombre
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                aria-invalid={!!errors.name}
              />
              {errors.name && <ErrorMessage message={errors.name} />}
            </label>
            <label>
              Email
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                aria-invalid={!!errors.email}
                disabled={true}
              />
              {errors.email && <ErrorMessage message={errors.email} />}
            </label>

            {authProvider === "password" ? (
              <>
                <label>
                  Contraseña actual
                  <PasswordContainer>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      aria-invalid={!!errors.currentPassword}
                    />
                    <TogglePassword
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      aria-label={
                        showCurrentPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showCurrentPassword ? (
                        <AiOutlineEyeInvisible />
                      ) : (
                        <AiOutlineEye />
                      )}
                    </TogglePassword>
                  </PasswordContainer>
                  {errors.currentPassword && (
                    <ErrorMessage message={errors.currentPassword} />
                  )}
                </label>
                <label>
                  Nueva contraseña
                  <PasswordContainer>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      aria-invalid={!!errors.newPassword}
                    />
                    <TogglePassword
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={
                        showNewPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showNewPassword ? (
                        <AiOutlineEyeInvisible />
                      ) : (
                        <AiOutlineEye />
                      )}
                    </TogglePassword>
                  </PasswordContainer>
                  {errors.newPassword && (
                    <ErrorMessage message={errors.newPassword} />
                  )}
                </label>
              </>
            ) : (
              <PasswordResetBox>
                <p>
                  Estás usando{" "}
                  {authProvider === "google.com" ? "Google" : "Facebook"}.
                  Establece una contraseña para tu cuenta.
                </p>
                <Button
                  type="button"
                  onClick={handlePasswordResetEmail}
                  disabled={isCheckingPasswordUpdate}
                >
                  {isCheckingPasswordUpdate
                    ? "Procesando..."
                    : "Establecer contraseña"}
                </Button>
                <small>
                  Se enviará un enlace a tu email {user.email || "registrado"}
                </small>
              </PasswordResetBox>
            )}

            <label>
              Foto de perfil
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
            {preview && <PreviewImg src={preview} alt="Preview" />}
            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Guardar cambios"}
            </Button>
          </EditForm>
        )}

        <Orders>
          <OrderControls>
            <h4>Tus órdenes</h4>
            <Button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              {sortOrder === "asc" ? (
                <AiOutlineArrowDown />
              ) : (
                <AiOutlineArrowUp />
              )}
              {sortOrder === "asc" ? " Más antiguas" : " Más recientes"}
            </Button>
          </OrderControls>

          {filteredOrders.length === 0 ? (
            <NoOrdersMessage>No se encontraron órdenes.</NoOrdersMessage>
          ) : (
            currentOrders.map((order) => (
              <UserOrdersCard
                key={`${order._id}-${order.delivery_status}`}
                order={order}
              />
            ))
          )}

          <UserPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalNotes={filteredOrders.length}
            itemsPerPage={itemsPerPage}
          />
        </Orders>
      </ProfileContainer>

      <NotificationModal
        isOpen={showSuccessModal}
        message={successMessage}
        onClose={handleSuccessClose}
        autoClose={3000}
        variant="success"
      />

      <NotificationModal
        isOpen={showPasswordSuccessModal}
        message="¡Contraseña establecida con éxito! Serás redirigido para iniciar sesión."
        onClose={handlePasswordSuccessClose}
        autoClose={3000}
      />

      <NotificationModal
        isOpen={showPasswordEmailInfo}
        message={`Se ha enviado un enlace de restablecimiento de contraseña a ${user.email}. Una vez establecida, vuelve a iniciar sesión.`}
        onClose={handleCloseInfoModal}
        onCancel={handleCancelPasswordReset}
        autoClose={10000}
        showCloseButton={true}
      />
    </StyledProfile>
  );
};

export default UserProfile;

// Estilos
const StyledProfile = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  min-height: 100vh;
`;

const ProfileContainer = styled.div`
  max-width: 600px;
  width: 100%;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 2rem;
  text-align: center;
  background: linear-gradient(45deg, #007bff, #0056b3);
  color: white;

  h3 {
    margin: 0.5rem 0;
  }

  p {
    font-size: 14px;
    opacity: 0.9;
  }
`;

const Avatar = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin: 0 auto;
  display: block;
  border: 3px solid #fff;
`;

const AvatarPlaceholder = styled.div`
  width: 80px;
  height: 80px;
  background: white;
  color: #007bff;
  border: 3px solid #007bff;
  border-radius: 50%;
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;

const PreviewImg = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 1rem;
`;

const RoleTag = styled.div`
  background: ${({ isAdmin }) => (isAdmin ? "gold" : "lightblue")};
  color: ${({ isAdmin }) => (isAdmin ? "black" : "blue")};
  padding: 0.2rem 0.5rem;
  margin: 0.5rem auto;
  display: inline-block;
  border-radius: 5px;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  margin: 0.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #0056b3;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const EditForm = styled.form`
  padding: 2rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
`;

const PasswordContainer = styled.div`
  position: relative;
  input {
    width: 100%;
    padding-right: 2.5rem;
    display: flex;
    align-items: center;
  }
`;

const TogglePassword = styled.span`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #007bff;
  }
`;

const PasswordResetBox = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;

  p {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  small {
    display: block;
    margin-top: 0.5rem;
    color: #666;
    font-size: 0.8rem;
  }
`;

const Orders = styled.div`
  padding: 2rem;
`;

const OrderControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const NoOrdersMessage = styled.p`
  text-align: center;
  font-size: 16px;
  color: #888;
  margin-top: 1rem;
  font-style: italic;
`;