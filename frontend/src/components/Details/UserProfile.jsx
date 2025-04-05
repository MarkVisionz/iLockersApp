import { useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { setHeaders, url } from "../../features/api";
import { LoadingSpinner, ErrorMessage } from "../LoadingAndError";
import { toast } from "react-toastify";
import {
  AiOutlineEdit,
  AiOutlineArrowUp,
  AiOutlineArrowDown,
} from "react-icons/ai";
import { MdOutlineAdminPanelSettings, MdOutlinePerson } from "react-icons/md";
import UserPagination from "./UserAux/UserPagination";
import UserOrdersCard from "./UserAux/UserOrdersCard";
import socket from "../../features/socket";

const UserProfile = () => {
  const params = useParams();
  const auth = useSelector((state) => state.auth);
  const userId = auth.isAdmin ? params.id : auth._id;

  const [user, setUser] = useState({
    name: "",
    email: "",
    isAdmin: false,
    password: "",
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch user info
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/users/find/${userId}`, setHeaders());
      setUser({ ...res.data, password: "" });
    } catch {
      setErrorMessage("Error fetching user data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${url}/orders/find/${userId}`, setHeaders());
      setOrders(res.data);
    } catch {
      setErrorMessage("Error fetching orders");
    }
  }, [userId]);

  // Setup
  useEffect(() => {
    fetchUser();
    fetchOrders();

    const handleCreated = (order) => {
      if (order.userId === userId) {
        setOrders((prev) => [order, ...prev]);
      }
    };

    const handleUpdated = (order) => {
      if (order.userId === userId) {
        setOrders((prev) =>
          prev.map((o) => (o._id === order._id ? { ...o, ...order } : o))
        );
      }
    };

    const handleDeleted = (order) => {
      if (order.userId === userId) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === order._id ? { ...o, delivery_status: "cancelled" } : o
          )
        );
      }
    };

    socket.on("orderCreated", handleCreated);
    socket.on("orderUpdated", handleUpdated);
    socket.on("orderDeleted", handleDeleted);

    return () => {
      socket.off("orderCreated", handleCreated);
      socket.off("orderUpdated", handleUpdated);
      socket.off("orderDeleted", handleDeleted);
    };
  }, [userId, fetchUser, fetchOrders]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        setLoading(true);
        const res = await axios.put(
          `${url}/users/${auth._id}`,
          { ...user },
          setHeaders()
        );
        setUser({ ...res.data, password: "" });
        toast.success("Profile updated");
        setEditing(false);
      } catch (err) {
        setErrorMessage(err.response?.data || "Error updating profile");
      } finally {
        setLoading(false);
      }
    },
    [user, auth._id]
  );

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [orders, sortOrder]);

  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage, itemsPerPage]);

  return (
    <StyledProfile>
      <ProfileContainer>
        <Header>
          <Avatar>{user.name.charAt(0).toUpperCase()}</Avatar>
          <h3>{user.name}</h3>
          <RoleTag isAdmin={user.isAdmin}>
            {user.isAdmin ? <MdOutlineAdminPanelSettings /> : <MdOutlinePerson />}
            {user.isAdmin ? " Admin" : " Customer"}
          </RoleTag>
          <p>{user.email}</p>
          <Button onClick={() => setEditing((prev) => !prev)}>
            <AiOutlineEdit /> {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </Header>

        {loading && <LoadingSpinner />}
        {errorMessage && <ErrorMessage message={errorMessage} />}

        {editing && (
          <EditForm onSubmit={handleSubmit}>
            <label>
              Name
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })}
              />
            </label>
            <Button type="submit">{loading ? "Updating..." : "Save Changes"}</Button>
          </EditForm>
        )}

        <Orders>
          <OrderControls>
            <h4>Your Orders</h4>
            <Button onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}>
              {sortOrder === "asc" ? <AiOutlineArrowDown /> : <AiOutlineArrowUp />}
              {sortOrder === "asc" ? " Oldest First" : " Newest First"}
            </Button>
          </OrderControls>

          {sortedOrders.length === 0 ? (
            <NoOrdersMessage>No orders found.</NoOrdersMessage>
          ) : (
            currentOrders.map((order) => (
              <UserOrdersCard key={`${order._id}-${order.delivery_status}`} order={order} />
            ))
          )}

          <UserPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalNotes={orders.length}
            itemsPerPage={itemsPerPage}
          />
        </Orders>
      </ProfileContainer>
    </StyledProfile>
  );
};

export default UserProfile;


// Estilos CSS
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

const Avatar = styled.div`
  margin: 0 auto;
  width: 80px;
  height: 80px;
  background: white;
  color: #007bff;
  border-radius: 50%;
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
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

