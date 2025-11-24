import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  let isAuthenticated = false;

  try {
    const storedUser = localStorage.getItem("chatUser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      isAuthenticated = !!parsed?.token;
    }
  } catch {
    isAuthenticated = false;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default PrivateRoute;
