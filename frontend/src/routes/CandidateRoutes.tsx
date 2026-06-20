import { Route, Routes } from "react-router-dom";
import CandidatePortal from "../pages/candidate/CandidatePortal";
import CandidateJobsPage from "../pages/candidate/CandidateJobsPage";
import CandidateJobApplyPage from "../pages/candidate/CandidateJobApplyPage";

/** Public candidate portal — `/candidate/*` */
export default function CandidateRoutes() {
    return (
        <Routes>
            <Route index element={<CandidatePortal />} />
            <Route path="jobs" element={<CandidateJobsPage />} />
            <Route path="jobs/:id" element={<CandidateJobApplyPage />} />
        </Routes>
    );
}
