import { Route, Routes } from "react-router-dom";
import TenderCreate from "../pages/tenders/TenderCreate";
import TenderDetail from "../pages/tenders/TenderDetail";
import TenderList from "../pages/tenders/TenderList";

export default function TenderRoutes() {
    return (
        <Routes>
            <Route index element={<TenderList />} />
            <Route path="new" element={<TenderCreate />} />
            <Route path=":id" element={<TenderDetail />} />
        </Routes>
    );
}
