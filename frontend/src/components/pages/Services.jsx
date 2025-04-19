import { Outlet, useNavigate } from "react-router-dom";
import { AdminHeaders } from "../admin/CommonStyled";

const Services = () => {
  const navigate = useNavigate();

  return (
    <>
      <AdminHeaders>
        <h2>Services</h2>
      </AdminHeaders>
      <Outlet />
    </>
  );
};

export default Services;
