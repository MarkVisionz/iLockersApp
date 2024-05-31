import { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import axios from "axios";
import { setHeaders, url } from "../../features/api";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

const UserProfile = () => {
  const params = useParams();

  const [user, setUser] = useState({
    name: "",
    email: "",
    isAdmin: false,
    password: "",
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewAllOrders, setViewAllOrders] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${url}/users/find/${params.id}`, setHeaders());
        setUser({ ...res.data, password: "" });
        setLoading(false);
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${url}/orders/find/${params.id}`, setHeaders());
        setOrders(res.data);
        setLoading(false);
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };

    fetchUser();
    fetchOrders();
  }, [params.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);
      const res = await axios.put(
        `${url}/users/${params.id}`,
        {
          ...user,
        },
        setHeaders()
      );

      setUser({ ...res.data, password: "" });
      toast.success("Profile updated...", {
        position: "bottom-left",
      });

      setUpdating(false);
      setEditing(false);
    } catch (err) {
      console.log(err);
      setUpdating(false);
      toast.error(err.response.data, {
        position: "bottom-left",
      });
    }
  };

  const sortedOrders = orders.sort((a, b) => {
    if (sortOrder === 'asc') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <StyledProfile>
      <ProfileContainer>
        {loading ? (
          <LoaderContainer>
            <ClipLoader size={50} color={"#007bff"} loading={loading} />
          </LoaderContainer>
        ) : (
          <>
            <Card>
              <CardContent>
                <h3>{user.name}</h3>
                {user.isAdmin ? (
                  <Admin>Admin</Admin>
                ) : (
                  <Customer>Customer</Customer>
                )}
                <p>Email: {user.email}</p>
                <Button onClick={() => setEditing(!editing)}>
                  {editing ? "Cancel" : "Edit Profile"}
                </Button>
                {editing && (
                  <form onSubmit={handleSubmit}>
                    <FormField>
                      <label htmlFor="name">Name:</label>
                      <input
                        type="text"
                        id="name"
                        value={user.name}
                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                      />
                    </FormField>
                    <FormField>
                      <label htmlFor="email">Email:</label>
                      <input
                        type="text"
                        id="email"
                        value={user.email}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                      />
                    </FormField>
                    <FormField>
                      <label htmlFor="password">Password:</label>
                      <input
                        type="password"
                        value={user.password}
                        id="password"
                        onChange={(e) => setUser({ ...user, password: e.target.value })}
                      />
                    </FormField>
                    <Button type="submit">{updating ? "Updating" : "Update Profile"}</Button>
                  </form>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h4>Orders</h4>
                <OrderControls>
                  <Button onClick={() => setViewAllOrders(!viewAllOrders)}>
                    {viewAllOrders ? "Show Less" : "View All Orders"}
                  </Button>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </Select>
                </OrderControls>
                <OrderList>
                  {sortedOrders.slice(0, viewAllOrders ? orders.length : 3).map((order) => (
                    <Order key={order._id}>
                      <p><strong>Order ID:</strong> {order._id}</p>
                      <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                      <p><strong>Total:</strong> ${order.total}</p>
                    </Order>
                  ))}
                  {orders.length === 0 && <p>No orders found</p>}
                </OrderList>
              </CardContent>
            </Card>
          </>
        )}
      </ProfileContainer>
    </StyledProfile>
  );
};

export default UserProfile;

const StyledProfile = styled.div`
  margin: 3rem;
  display: flex;
  justify-content: center;
`;

const ProfileContainer = styled.div`
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Card = styled.div`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
`;

const CardContent = styled.div`
  padding: 2rem;
`;

const FormField = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #555;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background-color: #0056b3;
  }
`;

const Admin = styled.div`
  color: rgb(253, 181, 40);
  width:10%;
  background: rgb(253, 181, 40, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
  margin-bottom: 1rem;
  margin-top: 1rem;
`;

const Customer = styled.div`
  color: rgb(38, 198, 249);
  width:12%;
  background-color: rgb(38, 198, 249, 0.12);
  padding: 3px 5px;
  border-radius: 3px;
  font-size: 14px;
  margin-bottom: 1rem;
  margin-top: 1rem;`;

const OrderControls = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border-radius: 5px;
  border: 1px solid #ccc;
`;

const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Order = styled.div`
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;

  p {
    margin: 0.5rem 0;
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;
