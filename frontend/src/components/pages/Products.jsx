import { Outlet, useNavigate } from "react-router-dom";
import { AdminHeaders } from "../admin/CommonStyled";

const Products = () => {
  const navigate = useNavigate();
  return (
    <>
      <AdminHeaders>
        <h2>Products</h2>
      </AdminHeaders>
      <Outlet />
    </>
  );
};

export default Products;
