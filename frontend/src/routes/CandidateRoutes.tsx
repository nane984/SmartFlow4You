import { Route, Routes } from "react-router-dom";
import RequireAuth from "../components/common/RequireAuth";
import CandidatePortal from "../pages/candidate/CandidatePortal";
import CandidateJobsPage from "../pages/candidate/CandidateJobsPage";
import CandidateJobApplyPage from "../pages/candidate/CandidateJobApplyPage";
import CandidateInterviewsPage from "../pages/candidate/CandidateInterviewsPage";
import InterviewRoom from "../modules/hr/InterviewRoom";

/** Public candidate portal — `/candidate/*` */
export default function CandidateRoutes() {
    return (
        <Routes>
            <Route index element={<CandidatePortal />} />
            <Route path="jobs" element={<CandidateJobsPage />} />
            <Route path="jobs/:id" element={<CandidateJobApplyPage />} />
            <Route path="interviews" element={<CandidateInterviewsPage />} />
            <Route element={<RequireAuth />}>
                <Route path="interview/:sessionId" element={<InterviewRoom />} />
            </Route>
        </Routes>
    );
}
