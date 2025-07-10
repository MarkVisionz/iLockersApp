import { useEffect, useReducer, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth as firebaseAuth } from "../../features/firebase-config";
import socket from "../../features/socket";

// Componentes
import UserProfileHeader from "./UserAux/UserProfileHeader";
import UserBusinessSection from "./UserAux/UserBusinessSection";
import UserOrdersSection from "./UserAux/UserOrdersSection";
import UserQuickActions from "./UserAux/UserQuickActions";
import UserBusinessStats from "./UserAux/UserBusinessStats";
import UserFavorites from "./UserAux/UserFavorites";
import UserAddresses from "./UserAux/UserAddresses";
import ProfileEditModal from "./UserAux/ProfileEditModal";
import EditBusinessForm from "../admin/EditBusinessForm";
import SetUpBusiness from "../admin/SetUpBusiness";
import SimpleConfirmationModal from "../SimpleModal";
import NotificationModal from "../NotificacionModal";

// Redux actions
import { logoutUser, updateAuthBusiness, businessDeleted as authBusinessDeleted } from "../../features/authSlice";
import { ordersFetch } from "../../features/ordersSlice";
import {
  fetchBusinessStats,
  deleteBusiness,
  updateBusiness,
  businessUpdated,
  businessDeleted,
  updateBusinessStatsFromSocket,
} from "../../features/businessSlice";
import { fetchUser, userUpdated } from "../../features/usersSlice";
import { LoadingSpinner } from "../LoadingAndError";

const initialState = {
  loading: true,
  authChecked: false,
  currentPage: 1,
  pendingPage: 1,
  sortOrder: "desc",
  showSettings: false,
  showDeleteConfirmModal: false,
  deleteBusinessId: null,
  editBusinessModal: null,
  showCreateBusinessModal: false,
  showPasswordSuccessModal: false,
  showPasswordEmailInfo: false,
  isCheckingPasswordUpdate: false,
  currentAddressIndex: 0,
  selectedAddress: null,
  notification: {
    show: false,
    message: "",
    variant: "success",
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_AUTH_CHECKED":
      return { ...state, authChecked: action.payload };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_PENDING_PAGE":
      return { ...state, pendingPage: action.payload };
    case "TOGGLE_SORT_ORDER":
      return {
        ...state,
        sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
      };
    case "TOGGLE_SETTINGS":
      return { ...state, showSettings: !state.showSettings };
    case "SHOW_DELETE_CONFIRM":
      return {
        ...state,
        showDeleteConfirmModal: true,
        deleteBusinessId: action.payload,
      };
    case "HIDE_DELETE_CONFIRM":
      return {
        ...state,
        showDeleteConfirmModal: false,
        deleteBusinessId: null,
      };
    case "SHOW_EDIT_BUSINESS":
      return { ...state, editBusinessModal: action.payload };
    case "HIDE_EDIT_BUSINESS":
      return { ...state, editBusinessModal: null };
    case "SHOW_CREATE_BUSINESS":
      return { ...state, showCreateBusinessModal: true };
    case "HIDE_CREATE_BUSINESS":
      return { ...state, showCreateBusinessModal: false };
    case "SET_ADDRESS_INDEX":
      return { ...state, currentAddressIndex: action.payload };
    case "SET_SELECTED_ADDRESS":
      return { ...state, selectedAddress: action.payload };
    case "SHOW_NOTIFICATION":
      return {
        ...state,
        notification: {
          show: true,
          message: action.payload.message,
          variant: action.payload.variant || "success",
        },
      };
    case "HIDE_NOTIFICATION":
      return {
        ...state,
        notification: {
          ...state.notification,
          show: false,
        },
      };
    default:
      return state;
  }
}

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [state, localDispatch] = useReducer(reducer, initialState);

  const auth = useSelector((state) => state.auth || {});
  const { _id: authId, isAdmin, email: authEmail, role, businesses = [] } = auth;
  const ordersState = useSelector((state) => state.orders || {});
  const usersState = useSelector((state) => state.users || {});
  const businessState = useSelector((state) => state.business || {});
  const { list: orders } = ordersState;
  const { currentUser: user } = usersState;
  const { stats: businessStats } = businessState;

  const userId = isAdmin && id ? id : authId;
  const profileUserId = id || authId;
  const isViewingOtherProfile = id && id !== authId;

  // Effect for authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      if (!currentUser) {
        dispatch(logoutUser());
        navigate("/login", { replace: true });
      } else {
        localDispatch({ type: "SET_AUTH_CHECKED", payload: true });
      }
    });
    return () => unsubscribe();
  }, [dispatch, navigate]);

  // Effect for socket events
  useEffect(() => {
    if (!state.authChecked || !authId) return;

    const handleBusinessEvent = ({ businessId, event, data }) => {
      console.log("Socket event received:", { businessId, event, data });
      if (event === "businessUpdated") {
        dispatch(businessUpdated(data));
        dispatch(updateAuthBusiness(data));
      } else if (event === "businessDeleted") {
        dispatch(businessDeleted(businessId));
        dispatch(authBusinessDeleted(businessId));
      } else if (event === "businessCreated") {
        dispatch(fetchBusinessStats());
        dispatch(fetchUser(userId));
      } else if (event === "noteCreated" || event === "noteDeleted" || event === "noteUpdated") {
        dispatch(updateBusinessStatsFromSocket({ businessId, event, data }));
        dispatch(fetchBusinessStats()); // Refresh stats from server
      } else if (event === "statsUpdated") {
        dispatch(updateBusinessStatsFromSocket({ businessId, event, data }));
      }
    };

    const handleUserUpdated = (updatedUser) => {
      console.log("User updated event received:", updatedUser);
      if (updatedUser?._id === userId) {
        dispatch(userUpdated(updatedUser));
      }
    };

    socket.on("userUpdated", handleUserUpdated);
    socket.on("businessUpdated", handleBusinessEvent);
    socket.on("businessCreated", handleBusinessEvent);
    socket.on("businessDeleted", handleBusinessEvent);
    socket.on("noteCreated", handleBusinessEvent);
    socket.on("noteDeleted", handleBusinessEvent);
    socket.on("noteUpdated", handleBusinessEvent);
    socket.on("statsUpdated", handleBusinessEvent);

    return () => {
      socket.off("userUpdated", handleUserUpdated);
      socket.off("businessUpdated", handleBusinessEvent);
      socket.off("businessCreated", handleBusinessEvent);
      socket.off("businessDeleted", handleBusinessEvent);
      socket.off("noteCreated", handleBusinessEvent);
      socket.off("noteDeleted", handleBusinessEvent);
      socket.off("noteUpdated", handleBusinessEvent);
      socket.off("statsUpdated", handleBusinessEvent);
    };
  }, [state.authChecked, authId, dispatch, userId]);

  // Effect for loading data
  useEffect(() => {
    if (!state.authChecked || !authId) return;

    const loadData = async () => {
      localDispatch({ type: "SET_LOADING", payload: true });
      try {
        await Promise.all([
          !isViewingOtherProfile && dispatch(fetchUser(userId)),
          dispatch(ordersFetch({ userId })),
          role === "owner" && dispatch(fetchBusinessStats()),
        ].filter(Boolean));
      } catch (error) {
        showNotification(
          `Error al cargar datos: ${error.message || "Error desconocido"}`,
          "error"
        );
      } finally {
        localDispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadData();
  }, [state.authChecked, authId, userId, dispatch, role, isViewingOtherProfile]);

  const showNotification = (message, variant = "success") => {
    localDispatch({
      type: "SHOW_NOTIFICATION",
      payload: { message, variant },
    });
  };

  const hideNotification = () => {
    localDispatch({ type: "HIDE_NOTIFICATION" });
  };

  const handleLogout = useCallback(async () => {
    await signOut(firebaseAuth);
    dispatch(logoutUser());
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      localDispatch({ type: "SET_LOADING", payload: true });
      await dispatch(
        deleteBusiness({ businessId: state.deleteBusinessId })
      ).unwrap();
      showNotification("¡Negocio eliminado correctamente!", "success");
      localDispatch({ type: "HIDE_DELETE_CONFIRM" });
    } catch (error) {
      showNotification(error.message || "Error al eliminar negocio", "error");
    } finally {
      localDispatch({ type: "SET_LOADING", payload: false });
    }
  }, [dispatch, state.deleteBusinessId]);

  const handlePasswordSuccessClose = useCallback(() => {
    localDispatch({ type: "HIDE_NOTIFICATION" });
    signOut(firebaseAuth);
    dispatch(logoutUser());
    navigate("/login", {
      state: {
        message: "¡Contraseña establecida! Inicia sesión con tu nueva contraseña.",
      },
      replace: true,
    });
  }, [dispatch, navigate]);

  const handleCloseInfoModal = useCallback(() => {
    localDispatch({ type: "HIDE_NOTIFICATION" });
    signOut(firebaseAuth);
    dispatch(logoutUser());
    navigate("/login", {
      state: {
        message: "Enlace de restablecimiento enviado. Revisa tu correo e inicia sesión.",
        email: user?.email,
      },
      replace: true,
    });
  }, [dispatch, navigate, user?.email]);

  const handleCancelPasswordReset = useCallback(() => {
    localDispatch({ type: "HIDE_NOTIFICATION" });
    toast.info("Proceso de restablecimiento de contraseña cancelado.");
  }, []);

  if (!state.authChecked) {
    return <LoadingSpinner message="Verificando autenticación..." />;
  }

  if (!authId) {
    return null;
  }

  return (
    <StyledProfile>
      {state.loading && (
        <LoadingSpinner message="Cargando datos del perfil..." />
      )}

      <DashboardGrid>
        <MainColumn>
          <UserProfileHeader
            user={user}
            auth={auth}
            orders={orders}
            onEditProfile={() => localDispatch({ type: "TOGGLE_SETTINGS" })}
            onLogout={handleLogout}
          />

          <UserBusinessSection
            businesses={businesses}
            businessStats={businessStats}
            onEditBusiness={(business) =>
              localDispatch({ type: "SHOW_EDIT_BUSINESS", payload: business })
            }
            onDeleteBusiness={(id) =>
              localDispatch({ type: "SHOW_DELETE_CONFIRM", payload: id })
            }
            onCreateBusiness={() =>
              localDispatch({ type: "SHOW_CREATE_BUSINESS" })
            }
          />

          <UserOrdersSection
            orders={orders}
            userId={profileUserId}
            authEmail={authEmail}
            type="pending"
            currentPage={state.pendingPage}
            onPageChange={(page) =>
              localDispatch({ type: "SET_PENDING_PAGE", payload: page })
            }
          />
        </MainColumn>

        <SideColumn>
          <UserQuickActions
            isAdmin={isAdmin}
            role={role}
            onCreateBusiness={() =>
              localDispatch({ type: "SHOW_CREATE_BUSINESS" })
            }
          />

          {role === "owner" && (
            <UserBusinessStats
              businesses={businesses}
              businessStats={businessStats}
            />
          )}

          <UserFavorites
            orders={orders}
            userId={profileUserId}
            authEmail={authEmail}
            favorites={user?.favorites || []}
          />

          <UserAddresses
            orders={orders}
            userId={profileUserId}
            authEmail={authEmail}
            selectedAddress={state.selectedAddress}
            currentIndex={state.currentAddressIndex}
            onSelectAddress={(index) =>
              localDispatch({ type: "SET_ADDRESS_INDEX", payload: index })
            }
            onSetDefault={(address) =>
              localDispatch({ type: "SET_SELECTED_ADDRESS", payload: address })
            }
          />

          <UserOrdersSection
            orders={orders}
            userId={profileUserId}
            authEmail={authEmail}
            type="completed"
            currentPage={state.currentPage}
            sortOrder={state.sortOrder}
            onPageChange={(page) =>
              localDispatch({ type: "SET_PAGE", payload: page })
            }
            onSortChange={() => localDispatch({ type: "TOGGLE_SORT_ORDER" })}
          />
        </SideColumn>
      </DashboardGrid>

      {/* Modals */}
      <AnimatePresence>
        {state.showSettings && (
          <ProfileEditModal
            user={user}
            onClose={() => localDispatch({ type: "TOGGLE_SETTINGS" })}
            onSuccess={() =>
              showNotification("¡Perfil actualizado correctamente!")
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.showDeleteConfirmModal && (
          <SimpleConfirmationModal
            showModal={state.showDeleteConfirmModal}
            handleClose={() => localDispatch({ type: "HIDE_DELETE_CONFIRM" })}
            handleConfirm={handleConfirmDelete}
            userName={
              businesses.find((b) => b._id === state.deleteBusinessId)?.name ||
              "negocio"
            }
            itemType="negocio"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.editBusinessModal && (
          <ModalBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => localDispatch({ type: "HIDE_EDIT_BUSINESS" })}
          >
            <ModalContent
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <EditBusinessForm
                business={state.editBusinessModal}
                onClose={() => localDispatch({ type: "HIDE_EDIT_BUSINESS" })}
                onSubmit={async (formData) => {
                  try {
                    localDispatch({ type: "SET_LOADING", payload: true });
                    const updatedBusiness = await dispatch(
                      updateBusiness({
                        businessId: state.editBusinessModal._id,
                        data: { ...formData, ownerId: userId },
                      })
                    ).unwrap();
                    showNotification("¡Negocio actualizado correctamente!");
                    dispatch(updateAuthBusiness(updatedBusiness));
                    localDispatch({ type: "HIDE_EDIT_BUSINESS" });
                    await dispatch(fetchUser(userId)).unwrap();
                    if (role === "owner") {
                      await dispatch(fetchBusinessStats()).unwrap();
                    }
                  } catch (error) {
                    showNotification(
                      error.message || "Error al actualizar negocio",
                      "error"
                    );
                  } finally {
                    localDispatch({ type: "SET_LOADING", payload: false });
                  }
                }}
                isSubmitting={state.loading}
              />
            </ModalContent>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.showCreateBusinessModal && (
          <ModalBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => localDispatch({ type: "HIDE_CREATE_BUSINESS" })}
          >
            <ModalContent
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SetUpBusiness
                isModal
                onClose={() => localDispatch({ type: "HIDE_CREATE_BUSINESS" })}
                onSuccess={() => {
                  showNotification("¡Negocio creado correctamente!");
                  if (role === "owner") {
                    dispatch(fetchBusinessStats());
                    dispatch(fetchUser(userId));
                  }
                }}
                userId={userId}
                userEmail={user?.email}
              />
            </ModalContent>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      <NotificationModal
        isOpen={state.notification.show}
        message={state.notification.message}
        onClose={hideNotification}
        variant={state.notification.variant}
        autoClose={2000}
      />
    </StyledProfile>
  );
};

// Styles
const StyledProfile = styled.div`
  padding: 2rem;
  background-color: #f5f5f7;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

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

const ModalContent = styled(motion.div)`
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
`;

export default UserProfile;