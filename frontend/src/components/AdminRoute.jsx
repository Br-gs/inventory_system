import { useContext } from "react";
import AuthContext from "../context/authContext";
import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
    const { user } = useContext(AuthContext);

    if (!user || !user.is_staff) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default AdminRoute;