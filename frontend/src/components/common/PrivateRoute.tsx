import { Navigate } from "react-router-dom";

interface Props{
    children: React.ReactNode;
}

const PrivateRoute = ({ children }: Props) => {
    const token = localStorage.getItem("access");

    if(!token){
        return <Navigate to="/login" />;
    }
    return children;
};

export default PrivateRoute;