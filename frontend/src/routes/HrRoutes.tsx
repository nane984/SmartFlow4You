import { Routes, Route } from "react-router-dom";
import InterviewRoom from "../modules/hr/InterviewRoom";
import HrDashboard from "../modules/hr/HrDashboard";
import CandidateDetail from "../modules/hr/CandidateDetail";

export default function HrRoutes() {
    return (
        <Routes>
            <Route index element={<HrDashboard />} />
            <Route path="dashboard" element={<HrDashboard />} />
            <Route path="cv/:id" element={<CandidateDetail />} />
            <Route path="interview/:sessionId" element={<InterviewRoom />} />
        </Routes>
    );
}
