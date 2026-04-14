import { Routes, Route } from "react-router-dom";
import CvUploadForm from "../modules/hr/CvUploadForm";
import InterviewRoom from "../modules/hr/InterviewRoom";

export default function HrRoutes() {
    return (
        <Routes>
            <Route index element={<CvUploadForm />} />
            <Route path="interview/:sessionId" element={<InterviewRoom />} />
        </Routes>
    );
}
