import { Navigate } from "react-router-dom";

/** Legacy HR dashboard — recruitment overview is on the main dashboard. */
export default function HrDashboard() {
    return <Navigate to="/dashboard" replace />;
}
