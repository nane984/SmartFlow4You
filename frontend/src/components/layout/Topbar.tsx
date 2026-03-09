import { useNavigate } from "react-router-dom";

const Topbar = () => {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
    }

    return(
        <div className="topbar">
            <button onClick={logout}>Logout</button>
        </div>
    );
};

export default Topbar;