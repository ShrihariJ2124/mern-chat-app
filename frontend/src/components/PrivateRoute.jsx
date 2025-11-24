import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../authUtils";

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const user = getCurrentUser();
  const isAuthenticated = !!user?.token;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default PrivateRoute;
