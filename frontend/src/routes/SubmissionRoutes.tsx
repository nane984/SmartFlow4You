import { Route, Routes } from "react-router-dom";
import SubcontractorSubmit from "../pages/workPackages/SubcontractorSubmit";
import SubmissionsList from "../pages/workPackages/SubmissionsList";

/** Nested routes for `/submissions/*` */
export default function SubmissionRoutes() {
    return (
        <Routes>
            <Route index element={<SubmissionsList />} />
            <Route path="submit" element={<SubcontractorSubmit />} />
        </Routes>
    );
}
