import { Route, Routes } from "react-router-dom";
import JobCreatePage from "../modules/jobs/JobCreatePage";
import JobListPage from "../modules/jobs/JobListPage";

export default function JobRoutes() {
    return (
        <Routes>
            <Route index element={<JobListPage />} />
            <Route path="new" element={<JobCreatePage />} />
        </Routes>
    );
}
