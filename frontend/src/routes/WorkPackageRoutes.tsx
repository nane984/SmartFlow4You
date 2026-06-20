import { Route, Routes } from "react-router-dom";
import WorkPackagesIndex from "../pages/workPackages/WorkPackagesIndex";

/** Nested routes for `/work-packages/*` */
export default function WorkPackageRoutes() {
    return (
        <Routes>
            <Route index element={<WorkPackagesIndex />} />
        </Routes>
    );
}
