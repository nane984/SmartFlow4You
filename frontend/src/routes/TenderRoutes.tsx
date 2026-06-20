import { Route, Routes } from "react-router-dom";
import TenderCreate from "../pages/tenders/TenderCreate";
import TenderDetail from "../pages/tenders/TenderDetail";
import TenderEdit from "../pages/tenders/TenderEdit";
import TenderList from "../pages/tenders/TenderList";
import WorkPackageDetail from "../pages/workPackages/WorkPackageDetail";

/** Nested routes for `/tenders/*` */
export default function TenderRoutes() {
    return (
        <Routes>
            <Route index element={<TenderList />} />
            <Route path="new" element={<TenderCreate />} />
            <Route path=":tenderId/work-packages/:wpId" element={<WorkPackageDetail />} />
            <Route path=":id/edit" element={<TenderEdit />} />
            <Route path=":id" element={<TenderDetail />} />
        </Routes>
    );
}
