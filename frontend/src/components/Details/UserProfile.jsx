import { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { setHeaders, url } from "../../features/api";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import { toast } from "react-toastify";
import socket from "../../features/socket";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineLogout,
  AiOutlineSetting,
} from "react-icons/ai";
import { MdOutlineAdminPanelSettings, MdOutlinePerson } from "react-icons/md";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";
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
import { motion, AnimatePresence } from "framer-motion";
import AddressCardList from "./UserAux/AddressCardList";

const CARD_THEMES = [
  "linear-gradient(45deg, #ff6200, #ff8c00)",
  "linear-gradient(45deg, #1a3c34, #2a5d53)",
  "linear-gradient(45deg, #004d7a, #008793)",
  "linear-gradient(45deg, #4b2e2e, #6b4e4e)",
];

const ITEMS_PER_PAGE = 3;
const PASSWORD_CHECK_INTERVAL = 3000;
const PASSWORD_CHECK_ATTEMPTS = 60;

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth);
  const { _id: authId, isAdmin, email: authEmail } = auth;
  const { list: orders, status: ordersStatus } = useSelector(
    (state) => state.orders
  );

  const userId = isAdmin ? id : authId;

  const [initialFormState, setInitialFormState] = useState({
    name: "",
    email: "",
    newPassword: "",
    image: null,
  });

  const [user, setUser] = useState({
    name: "",
    email: "",
    isAdmin: false,
    photoURL: "",
    createdAt: "",
    favorites: [],
  });

  const [editForm, setEditForm] = useState({
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

  const [uiState, setUiState] = useState({
    loading: false,
    currentPage: 1,
    pendingPage: 1,
    sortOrder: "desc",
    authProvider: "password",
    showPasswordSuccessModal: false,
    showPasswordEmailInfo: false,
    isCheckingPasswordUpdate: false,
    showSuccessModal: false,
    showSettings: false,
    selectedAddress: null,
    currentAddressIndex: 0,
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    form: "",
  });

  const allOrders = useMemo(
    () => orders.filter((order) => order.userId === userId),
    [orders, userId]
  );

  const filteredOrders = useMemo(
    () => allOrders.filter((order) => order.delivery_status === "delivered"),
    [allOrders]
  );

  const pendingOrders = useMemo(
    () =>
      allOrders.filter((order) =>
        ["pending", "dispatched"].includes(order.delivery_status)
      ),
    [allOrders]
  );

  const sortedOrders = useMemo(
    () =>
      [...filteredOrders].sort((a, b) =>
        uiState.sortOrder === "asc"
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [filteredOrders, uiState.sortOrder]
  );

  const currentOrders = useMemo(() => {
    const start = (uiState.currentPage - 1) * ITEMS_PER_PAGE;
    return sortedOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedOrders, uiState.currentPage]);

  const currentPendingOrders = useMemo(() => {
    const start = (uiState.pendingPage - 1) * ITEMS_PER_PAGE;
    return pendingOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [pendingOrders, uiState.pendingPage]);

  const accountAge = useMemo(() => {
    if (!user.createdAt) return "N/A";
    const createdDate = new Date(user.createdAt);
    const now = new Date();
    const diffYears = now.getFullYear() - createdDate.getFullYear();
    const diffMonths = now.getMonth() - createdDate.getMonth();
    const totalMonths = diffYears * 12 + diffMonths;
    return totalMonths > 12
      ? `${Math.floor(totalMonths / 12)} years`
      : `${totalMonths} months`;
  }, [user.createdAt]);

  const favoriteProducts = useMemo(() => {
    const productCounts = {};

    allOrders.forEach((order) => {
      if (!order.products || !Array.isArray(order.products)) return;

      order.products.forEach((product) => {
        // Usamos description como identificador único ya que algunos productos no tienen product_id
        const productKey = product.description || product.product_id;

        if (!productKey) return;

        if (!productCounts[productKey]) {
          productCounts[productKey] = {
            id: product.product_id || productKey, // Usamos product_id si existe, sino el description
            name: product.description,
            image: product.image || "",
            timesOrdered: 0,
            totalQuantity: 0,
          };
        }

        productCounts[productKey].timesOrdered += 1;
        productCounts[productKey].totalQuantity += product.quantity || 0;
      });
    });

    // Convertir a array y ordenar por cantidad total (de mayor a menor)
    const sortedProducts = Object.values(productCounts).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    // Tomar solo los 3 primeros y marcar favoritos
    return sortedProducts.slice(0, 3).map((product) => ({
      ...product,
      isFavorite: user.favorites.includes(product.id),
    }));
  }, [allOrders, user.favorites]);

  const addressesFromOrders = useMemo(() => {
    const uniqueAddresses = [];
    const seenAddresses = new Set();

    allOrders.forEach((order) => {
      if (
        !order.shipping ||
        !order.shipping.line1 ||
        !order.shipping.city ||
        !order.shipping.postal_code
      ) {
        return;
      }

      const addressKey = `${order.shipping.line1}-${order.shipping.city}-${order.shipping.postal_code}`;

      if (!seenAddresses.has(addressKey)) {
        seenAddresses.add(addressKey);
        uniqueAddresses.push({
          id: `address-${uniqueAddresses.length}`,
          details: {
            customerName: order.customer_name || "Customer",
            address: `${order.shipping.line1}${
              order.shipping.line2 ? `, ${order.shipping.line2}` : ""
            }`,
            city: order.shipping.city,
            postalCode: order.shipping.postal_code,
            phone: order.phone || "No phone provided",
          },
          rawDetails: JSON.stringify(order.shipping),
        });
      }
    });

    return uniqueAddresses;
  }, [allOrders]);

  const hasChanges = useMemo(() => {
    return (
      editForm.name !== initialFormState.name ||
      editForm.email !== initialFormState.email ||
      editForm.newPassword !== initialFormState.newPassword ||
      editForm.image !== initialFormState.image
    );
  }, [editForm, initialFormState]);

  const toggleFavorite = async (productId) => {
    try {
      setUiState((prev) => ({ ...prev, loading: true }));

      const updatedFavorites = user.favorites.includes(productId)
        ? user.favorites.filter((id) => id !== productId)
        : [...user.favorites, productId];

      await axios.put(
        `${url}/users/${userId}`,
        { favorites: updatedFavorites },
        setHeaders()
      );

      setUser((prev) => ({
        ...prev,
        favorites: updatedFavorites,
      }));

      toast.success(
        updatedFavorites.includes(productId)
          ? "Product added to favorites!"
          : "Product removed from favorites"
      );
    } catch (error) {
      toast.error("Failed to update favorites");
      console.error("Error updating favorites:", error);
    } finally {
      setUiState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setEditForm((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const handleDeletePhoto = async () => {
    if (!user.photoURL) return;
    try {
      const fileRef = ref(storage, user.photoURL);
      await deleteObject(fileRef);
      setUser((prev) => ({ ...prev, photoURL: "" }));
      setEditForm((prev) => ({ ...prev, photoURL: "", preview: "" }));
      toast.success("Photo deleted");
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  const handlePasswordResetEmail = async () => {
    try {
      if (!user.email) throw new Error("No registered email found");
      await sendPasswordResetEmail(firebaseAuth, user.email, {
        url: `${window.location.origin}/login`,
      });
      setUiState((prev) => ({
        ...prev,
        showPasswordEmailInfo: true,
        isCheckingPasswordUpdate: true,
      }));
      toast.success("Reset link sent");
      setUiState((prev) => ({ ...prev, showSettings: false }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: `Failed to send email: ${error.message}`,
      }));
      toast.error(`Failed to send email: ${error.message}`);
    }
  };

  const handlePasswordSuccessClose = () => {
    setUiState((prev) => ({ ...prev, showPasswordSuccessModal: false }));
    signOut(firebaseAuth);
    dispatch(logoutUser());
    navigate("/login", {
      state: {
        message: "Password set! Please log in with your new password.",
      },
    });
  };

  const handleSuccessClose = () => {
    setUiState((prev) => ({ ...prev, showSuccessModal: false }));
  };

  const handleCloseInfoModal = () => {
    setUiState((prev) => ({ ...prev, showPasswordEmailInfo: false }));
    signOut(firebaseAuth);
    dispatch(logoutUser());
    toast.info(
      "Session closed for security. Log in with your new credentials."
    );
    navigate("/login", {
      state: {
        message: "Password reset link sent. Check your email and log in.",
        email: user.email,
      },
    });
  };

  const handleCancelPasswordReset = () => {
    setUiState((prev) => ({
      ...prev,
      showPasswordEmailInfo: false,
      isCheckingPasswordUpdate: false,
    }));
    toast.info("Password reset process canceled.");
  };

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    dispatch(logoutUser());
    navigate("/login");
  };

  const handleViewAddress = (index) => {
    setUiState((prev) => ({ ...prev, currentAddressIndex: index }));
  };

  const handleSelectAddress = async (index) => {
    const selectedAddress = addressesFromOrders[index];
    try {
      await axios.put(
        `${url}/users/${userId}`,
        { preferredAddress: selectedAddress.rawDetails },
        setHeaders()
      );
      setUiState((prev) => ({
        ...prev,
        selectedAddress: selectedAddress.rawDetails,
      }));
      toast.success("Address set as default");
    } catch (error) {
      toast.error("Failed to set default address");
    }
  };

  const handleNextAddress = () => {
    setUiState((prev) => ({
      ...prev,
      currentAddressIndex:
        prev.currentAddressIndex === addressesFromOrders.length - 1
          ? 0
          : prev.currentAddressIndex + 1,
    }));
  };

  const handlePrevAddress = () => {
    setUiState((prev) => ({
      ...prev,
      currentAddressIndex:
        prev.currentAddressIndex === 0
          ? addressesFromOrders.length - 1
          : prev.currentAddressIndex - 1,
    }));
  };

  useEffect(() => {
    if (!authId) return;

    const fetchUser = async () => {
      try {
        setUiState((prev) => ({ ...prev, loading: true }));
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
            form: "Unsupported authentication provider",
          }));
          toast.error("Unsupported authentication provider");
          return;
        }

        setUser({
          name: res.data.name,
          email: res.data.email,
          isAdmin: res.data.isAdmin,
          photoURL: res.data.photoURL,
          createdAt: res.data.createdAt || new Date().toISOString(),
          favorites: res.data.favorites || [],
        });
        setUiState((prev) => ({ ...prev, authProvider: provider }));
      } catch (error) {
        if (error.response?.status !== 401) {
          setErrors((prev) => ({
            ...prev,
            form: "Failed to fetch user data",
          }));
          toast.error("Failed to fetch user data");
        }
      } finally {
        setUiState((prev) => ({ ...prev, loading: false }));
      }
    };

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
          createdAt: updatedUser.createdAt || prev.createdAt,
          favorites: updatedUser.favorites || prev.favorites,
        }));
      }
    };

    socket.on("userUpdated", handleUserUpdated);
    return () => socket.off("userUpdated", handleUserUpdated);
  }, [authId, userId, dispatch]);

  useEffect(() => {
    if (
      !uiState.isCheckingPasswordUpdate ||
      uiState.authProvider === "password"
    )
      return;

    let attempts = 0;

    const checkPasswordUpdate = async () => {
      try {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error("No active session");

        await currentUser.reload();
        const providerId = currentUser.providerData[0]?.providerId;

        if (providerId === "password") {
          const newToken = await currentUser.getIdToken(true);
          await axios.put(
            `${url}/users/${userId}`,
            { authProvider: "password", fromResetFlow: true },
            { headers: { "x-auth-token": newToken } }
          );

          setUiState((prev) => ({
            ...prev,
            authProvider: "password",
            showPasswordSuccessModal: true,
            isCheckingPasswordUpdate: false,
          }));
        }
      } catch (error) {
        toast.error("Error verifying password change");
        setUiState((prev) => ({ ...prev, isCheckingPasswordUpdate: false }));
      }

      attempts++;
      if (attempts >= PASSWORD_CHECK_ATTEMPTS) {
        setUiState((prev) => ({ ...prev, isCheckingPasswordUpdate: false }));
        toast.info("Password setup time expired.");
        await signOut(firebaseAuth);
        dispatch(logoutUser());
        navigate("/login");
      }
    };

    const intervalId = setInterval(
      checkPasswordUpdate,
      PASSWORD_CHECK_INTERVAL
    );
    return () => clearInterval(intervalId);
  }, [
    uiState.isCheckingPasswordUpdate,
    uiState.authProvider,
    userId,
    dispatch,
    navigate,
  ]);

  useEffect(() => {
    if (uiState.showSettings) {
      setInitialFormState({
        name: user.name,
        email: user.email,
        newPassword: "",
        image: null,
      });
      setEditForm({
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        currentPassword: "",
        newPassword: "",
        showCurrentPassword: false,
        showNewPassword: false,
        image: null,
        preview: user.photoURL || "",
      });
    }
  }, [uiState.showSettings, user.name, user.email, user.photoURL]);

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      form: "",
    };

    if (!editForm.name.trim() || editForm.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (
      !editForm.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)
    ) {
      newErrors.email = "Invalid email";
    }

    if (uiState.authProvider === "password" && editForm.newPassword) {
      if (!editForm.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }
      if (editForm.newPassword.length < 6) {
        newErrors.newPassword = "Minimum 6 characters";
      } else if (editForm.newPassword.length > 50) {
        newErrors.newPassword = "Maximum 50 characters";
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
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

    setUiState((prev) => ({ ...prev, loading: true }));

    try {
      let photoURL = editForm.photoURL;
      if (editForm.image) {
        const storageRef = ref(
          storage,
          `users/${userId}/${editForm.image.name}`
        );
        const uploadTask = await uploadBytesResumable(
          storageRef,
          editForm.image
        );
        photoURL = await getDownloadURL(uploadTask.ref);
      }

      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error("No active session. Please log in again.");
      }

      const updates = {
        name: editForm.name,
        email: editForm.email,
        photoURL,
      };

      if (uiState.authProvider === "password") {
        if (editForm.newPassword || editForm.email !== authEmail) {
          const credential = EmailAuthProvider.credential(
            authEmail,
            editForm.currentPassword
          );
          await reauthenticateWithCredential(currentUser, credential);

          if (editForm.newPassword) {
            await updatePassword(currentUser, editForm.newPassword);
            updates.password = editForm.newPassword;
          }

          if (editForm.email !== authEmail) {
            await updateEmail(currentUser, editForm.email);
          }
        }
      } else if (editForm.newPassword) {
        await updatePassword(currentUser, editForm.newPassword);
        updates.password = editForm.newPassword;
        updates.authProvider = "password";
      }

      await axios.put(`${url}/users/${authId}`, updates, setHeaders());

      setUser({
        ...user,
        name: editForm.name,
        email: editForm.email,
        photoURL,
      });

      setEditForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        image: null,
        preview: photoURL || prev.preview,
      }));

      setUiState((prev) => ({
        ...prev,
        showSettings: false,
        showSuccessModal: true,
      }));

      if (editForm.newPassword || editForm.email !== authEmail) {
        toast.info("For security, please log in again.");
        setTimeout(() => {
          dispatch(logoutUser());
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      let msg = "Failed to update profile";
      if (error.code) {
        switch (error.code) {
          case "auth/wrong-password":
            msg = "Incorrect current password";
            break;
          case "auth/invalid-credential":
            msg = "Authentication error. Please log in again.";
            break;
          case "auth/too-many-requests":
            msg = "Too many failed attempts. Try again later.";
            break;
          case "auth/invalid-email":
            msg = "Invalid email format";
            break;
          case "auth/requires-recent-login":
            msg = "For security, please log in again.";
            break;
        }
      } else if (error.response?.data?.message) {
        msg = error.response.data.message;
      }

      setErrors((prev) => ({ ...prev, form: msg }));
      toast.error(msg);
    } finally {
      setUiState((prev) => ({ ...prev, loading: false }));
    }
  };

  console.log("All Orders:", allOrders);
  console.log("User Favorites:", user.favorites);
  console.log("Favorite Products:", favoriteProducts);

  return (
    <StyledProfile>
      <DashboardGrid>
        <MainColumn>
          <ProfileCard>
            <CardTitle>Welcome, {user.name}</CardTitle>
            <AvatarSection>
              {user.photoURL ? (
                <Avatar src={user.photoURL} alt={user.name} />
              ) : (
                <AvatarPlaceholder>
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarPlaceholder>
              )}
              <RoleTag isAdmin={user.isAdmin}>
                {user.isAdmin ? (
                  <MdOutlineAdminPanelSettings />
                ) : (
                  <MdOutlinePerson />
                )}
                {user.isAdmin ? "Admin" : "Customer"}
              </RoleTag>
            </AvatarSection>
            <UserInfo>
              <InfoItem>
                <strong>Email:</strong> {user.email}
              </InfoItem>
              <InfoItem>
                <strong>Total Orders:</strong> {allOrders.length}
              </InfoItem>
              <InfoItem>
                <strong>Account Age:</strong> {accountAge}
              </InfoItem>
            </UserInfo>
            <ButtonGroup>
              <ActionButton
                onClick={() =>
                  setUiState((prev) => ({
                    ...prev,
                    showSettings: !prev.showSettings,
                  }))
                }
              >
                <AiOutlineSetting />{" "}
                {uiState.showSettings ? "Close Settings" : "Edit Profile"}
              </ActionButton>
              <ActionButton onClick={handleLogout}>
                <AiOutlineLogout /> Log Out
              </ActionButton>
            </ButtonGroup>
          </ProfileCard>

          <Card>
            <CardTitle>Orders in Process</CardTitle>
            {pendingOrders.length === 0 ? (
              <EmptyState>No pending or dispatched orders.</EmptyState>
            ) : (
              <>
                {currentPendingOrders.map((order) => (
                  <UserOrdersCard
                    key={`${order._id}-${order.delivery_status}`}
                    order={order}
                  />
                ))}
                <UserPagination
                  currentPage={uiState.pendingPage}
                  setCurrentPage={(page) =>
                    setUiState((prev) => ({ ...prev, pendingPage: page }))
                  }
                  totalNotes={pendingOrders.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            )}
          </Card>
        </MainColumn>

        <SideColumn>
          <Card>
            <CardTitle>Quick Actions</CardTitle>
            <ButtonGroup>
              {isAdmin && (
                <QuickActionButton onClick={() => navigate("/admin")}>
                  Admin Dashboard
                </QuickActionButton>
              )}
              <QuickActionButton onClick={() => navigate("/support")}>
                Contact Support
              </QuickActionButton>
            </ButtonGroup>
          </Card>

          <Card>
            <CardTitle>Your Top 3 Most Ordered Products</CardTitle>
            {favoriteProducts.length === 0 ? (
              <EmptyState>You haven't ordered any products yet.</EmptyState>
            ) : (
              <ProductList>
                {favoriteProducts.map((product) => (
                  <ProductItem key={product.id}>
                    {product.image && (
                      <ProductImage src={product.image} alt={product.name} />
                    )}
                    <ProductInfo>
                      <CustomerName>{product.name}</CustomerName>
                      <ProductMeta>
                        <span>
                          <FaStar color="#FFD700" /> Ordered{" "}
                          {product.timesOrdered} times ({product.totalQuantity}{" "}
                          units total)
                        </span>
                        <FavoriteButton
                          onClick={() => toggleFavorite(product.id)}
                          isFavorite={product.isFavorite}
                        >
                          {product.isFavorite ? (
                            <FaHeart color="#ff3b30" />
                          ) : (
                            <FaRegHeart color="#666" />
                          )}
                        </FavoriteButton>
                      </ProductMeta>
                    </ProductInfo>
                  </ProductItem>
                ))}
              </ProductList>
            )}
          </Card>

          <WalletHolder>
            <WalletSlot />
            <AddressTitle>Saved Addresses</AddressTitle>

            {addressesFromOrders.length === 0 ? (
              <EmptyState>No addresses found.</EmptyState>
            ) : (
              <>
                <AddressCardList
                  addresses={addressesFromOrders}
                  cardThemes={CARD_THEMES}
                  onSelectAddress={handleViewAddress}
                />
                <AnimatePresence mode="wait">
                  <AddressDetails
                    key={uiState.currentAddressIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DetailsColumn>
                      <DetailItem>
                        {
                          addressesFromOrders[uiState.currentAddressIndex]
                            ?.details.customerName
                        }
                      </DetailItem>
                      <DetailItem>
                        {
                          addressesFromOrders[uiState.currentAddressIndex]
                            ?.details.address
                        }
                      </DetailItem>
                      <DetailItem>
                        {
                          addressesFromOrders[uiState.currentAddressIndex]
                            ?.details.city
                        }
                        ,{" "}
                        {
                          addressesFromOrders[uiState.currentAddressIndex]
                            ?.details.postalCode
                        }
                      </DetailItem>
                      <DetailItem>
                        {
                          addressesFromOrders[uiState.currentAddressIndex]
                            ?.details.phone
                        }
                      </DetailItem>
                    </DetailsColumn>
                    <SetDefaultButton
                      onClick={() =>
                        handleSelectAddress(uiState.currentAddressIndex)
                      }
                      selected={
                        uiState.selectedAddress ===
                        addressesFromOrders[uiState.currentAddressIndex]
                          ?.rawDetails
                      }
                    >
                      {uiState.selectedAddress ===
                      addressesFromOrders[uiState.currentAddressIndex]
                        ?.rawDetails
                        ? "✓ Default Address"
                        : "Set as Default"}
                    </SetDefaultButton>
                  </AddressDetails>
                </AnimatePresence>
              </>
            )}
          </WalletHolder>

          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
              <SortButton
                onClick={() =>
                  setUiState((prev) => ({
                    ...prev,
                    sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                  }))
                }
              >
                {uiState.sortOrder === "asc" ? "Older" : "Newer"}
              </SortButton>
            </CardHeader>
            {filteredOrders.length === 0 ? (
              <EmptyState>No delivered orders found.</EmptyState>
            ) : (
              <>
                {currentOrders.map((order) => (
                  <UserOrdersCard
                    key={`${order._id}-${order.delivery_status}`}
                    order={order}
                  />
                ))}
                <UserPagination
                  currentPage={uiState.currentPage}
                  setCurrentPage={(page) =>
                    setUiState((prev) => ({ ...prev, currentPage: page }))
                  }
                  totalNotes={filteredOrders.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            )}
          </Card>
        </SideColumn>
      </DashboardGrid>

      <AnimatePresence>
        {uiState.showSettings && (
          <ModalBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() =>
              setUiState((prev) => ({ ...prev, showSettings: false }))
            }
          >
            <ModalContent
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                {(uiState.loading || ordersStatus === "loading") && (
                  <LoadingSpinner />
                )}
                {errors.form && <ErrorMessage message={errors.form} />}

                <EditForm onSubmit={handleSubmit}>
                  <CardTitle>Edit Profile</CardTitle>
                  <FormField>
                    <label htmlFor="name">Name</label>
                    <input
                      id="name"
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      aria-invalid={!!errors.name}
                      placeholder="Enter your name"
                    />
                    {errors.name && <ErrorMessage message={errors.name} />}
                  </FormField>
                  <FormField>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      aria-invalid={!!errors.email}
                      disabled
                      placeholder="Enter your email"
                    />
                    {errors.email && <ErrorMessage message={errors.email} />}
                  </FormField>

                  {uiState.authProvider === "password" ? (
                    <>
                      <FormField>
                        <label htmlFor="currentPassword">
                          Current Password
                        </label>
                        <PasswordContainer>
                          <input
                            id="currentPassword"
                            type={
                              editForm.showCurrentPassword ? "text" : "password"
                            }
                            value={editForm.currentPassword}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                currentPassword: e.target.value,
                              })
                            }
                            aria-invalid={!!errors.currentPassword}
                            placeholder="Enter current password"
                          />
                          <TogglePassword
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                showCurrentPassword:
                                  !editForm.showCurrentPassword,
                              })
                            }
                            aria-label={
                              editForm.showCurrentPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {editForm.showCurrentPassword ? (
                              <AiOutlineEyeInvisible />
                            ) : (
                              <AiOutlineEye />
                            )}
                          </TogglePassword>
                        </PasswordContainer>
                        {errors.currentPassword && (
                          <ErrorMessage message={errors.currentPassword} />
                        )}
                      </FormField>
                      <FormField>
                        <label htmlFor="newPassword">New Password</label>
                        <PasswordContainer>
                          <input
                            id="newPassword"
                            type={
                              editForm.showNewPassword ? "text" : "password"
                            }
                            value={editForm.newPassword}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                newPassword: e.target.value,
                              })
                            }
                            placeholder="Minimum 6 characters"
                            aria-invalid={!!errors.newPassword}
                          />
                          <TogglePassword
                            onClick={() =>
                              setEditForm({
                                ...editForm,
                                showNewPassword: !editForm.showNewPassword,
                              })
                            }
                            aria-label={
                              editForm.showNewPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {editForm.showNewPassword ? (
                              <AiOutlineEyeInvisible />
                            ) : (
                              <AiOutlineEye />
                            )}
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
                        You are using{" "}
                        {uiState.authProvider === "google.com"
                          ? "Google"
                          : "Facebook"}
                        . Set a password for your account.
                      </p>
                      <ActionButton
                        type="button"
                        onClick={handlePasswordResetEmail}
                        disabled={uiState.isCheckingPasswordUpdate}
                      >
                        {uiState.isCheckingPasswordUpdate
                          ? "Processing..."
                          : "Set Password"}
                      </ActionButton>
                      <small>
                        A link will be sent to{" "}
                        {user.email || "your registered email"}.
                      </small>
                    </PasswordResetBox>
                  )}

                  <FormField>
                    <label htmlFor="photo">Profile Photo</label>
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {editForm.preview && (
                      <div>
                        <PreviewImg src={editForm.preview} alt="Preview" />
                        <ActionButton
                          type="button"
                          onClick={handleDeletePhoto}
                          style={{ background: "#ff3b30", marginTop: "0.5rem" }}
                        >
                          Delete Photo
                        </ActionButton>
                      </div>
                    )}
                  </FormField>

                  <ButtonGroup>
                    <ActionButton
                      type="submit"
                      disabled={uiState.loading || !hasChanges}
                    >
                      {uiState.loading ? "Saving..." : "Save Changes"}
                    </ActionButton>
                    <ActionButton
                      type="button"
                      onClick={() =>
                        setUiState((prev) => ({ ...prev, showSettings: false }))
                      }
                      style={{ background: "#ff3b30" }}
                    >
                      Cancel
                    </ActionButton>
                  </ButtonGroup>
                </EditForm>
              </Card>
            </ModalContent>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      <NotificationModal
        isOpen={uiState.showSuccessModal}
        message="Profile updated successfully!"
        onClose={handleSuccessClose}
        autoClose={3000}
        variant="success"
      />

      <NotificationModal
        isOpen={uiState.showPasswordSuccessModal}
        message="Password set successfully! Redirecting to login."
        onClose={handlePasswordSuccessClose}
        autoClose={3000}
        variant="success"
      />

      <NotificationModal
        isOpen={uiState.showPasswordEmailInfo}
        message={`A password reset link has been sent to ${user.email}. Please check your email.`}
        onClose={handleCloseInfoModal}
        onCancel={handleCancelPasswordReset}
        autoClose={10000}
        showCloseButton
      />
    </StyledProfile>
  );
};

export default UserProfile;

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

const Card = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ProfileCard = styled(Card)`
  background: linear-gradient(45deg, #007bff, #0056b3);
  color: #fff;
  text-align: center;
  h2,
  p {
    color: #fff;
  }
`;

const CardTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 1rem;
  text-align: center;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
`;

const Avatar = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const AvatarPlaceholder = styled.div`
  width: 120px;
  height: 120px;
  background: #e5e5ea;
  color: #007aff;
  border: 3px solid #007bff;
  border-radius: 50%;
  font-size: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const RoleTag = styled.div`
  background: ${({ isAdmin }) => (isAdmin ? "#ffd60a" : "#e5e5ea")};
  color: ${({ isAdmin }) => (isAdmin ? "#1d1d1f" : "#007aff")};
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserInfo = styled.div`
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const InfoItem = styled.p`
  margin: 0.5rem 0;
  font-size: 0.95rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #d1d1d6;
    cursor: not-allowed;
  }
`;

const QuickActionButton = styled(ActionButton)`
  width: 100%;
  justify-content: center;
`;

const SortButton = styled(ActionButton)`
  padding: 0.5rem 1rem;
  background: #e5e5ea;
  color: #1d1d1f;
  font-size: 0.85rem;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #86868b;
  font-size: 0.95rem;
  margin: 1rem 0;
`;

const ChartContainer = styled.div`
  margin-top: 1rem;
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f5f5f7;
  border-radius: 12px;
  font-size: 0.95rem;
`;

const CustomerName = styled.span`
  font-weight: 500;
  color: #1d1d1f;
`;

const Amount = styled.span`
  font-weight: 600;
  color: #34c759;
`;

const WalletHolder = styled.div`
  background: #1c2526;
  border-radius: 16px;
  width: 100%;
  min-height: 300px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  margin-bottom: 1.2rem;
  overflow: visible;
`;

const WalletSlot = styled.div`
  background: #2a2a2a;
  width: 100%;
  height: 20%;
  position: absolute;
  top: 0;
  left: 0;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
`;

const AddressTitle = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
  text-align: center;
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
`;

const AddressDetails = styled(motion.div)`
  padding: 0.5rem 1rem;
  width: 100%;
  margin-top: 1.5rem;
  color: #fff;
  position: absolute;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailsColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const DetailItem = styled.p`
  font-size: 0.85rem;
  margin: 0.2rem 0;
  line-height: 1.3;
`;

const SetDefaultButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${({ selected }) => (selected ? "#34c759" : "#007aff")};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 4rem;

  &:hover {
    background: ${({ selected }) => (selected ? "#2d9e4b" : "#005bb5")};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

  input {
    padding: 0.75rem;
    border: 1px solid #d1d1d6;
    border-radius: 12px;
    font-size: 0.95rem;
    transition: border-color 0.2s ease;

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

const PreviewImg = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin: 1rem auto;
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
`;
// Agrega estos componentes estilizados al final del archivo, con los demás estilos
const ProductImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 1rem;
`;

const ProductInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ProductMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
`;

const FavoriteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.2s;
  padding: 0.5rem;
  display: flex;
  align-items: center;

  &:hover {
    transform: scale(1.1);
  }

  &:focus {
    outline: none;
  }
`;
