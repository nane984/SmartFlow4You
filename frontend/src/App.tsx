import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./auth/Login";
import Register from "./auth/Register";

import RequireAuth from "./components/common/RequireAuth";
import RequireAccess from "./components/common/RequireAccess";
import RequireRole from "./components/common/RequireRole";
import Layout from "./components/layout/Layout";
import AuthShell from "./components/layout/AuthShell";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashbord";
import PlaceholderPage from "./pages/PlaceholderPage";
import TenderRoutes from "./routes/TenderRoutes";
import CompanyRoutes from "./routes/CompanyRoutes";
import OfferRoutes from "./routes/OfferRouts";
import WorkPackageRoutes from "./routes/WorkPackageRoutes";
import SubmissionRoutes from "./routes/SubmissionRoutes";
import CandidateRoutes from "./routes/CandidateRoutes";
import AccessDenied from "./pages/AccessDenied";
import JobManagement from "./modules/jobs/JobManagement";
import {
  AdminDashboardPage,
  CandidateDashboardPage,
  HRDashboardPage,
  InterviewerDashboardPage,
} from "./pages/RoleDashboards";
import { ACCESS_DOMAINS } from "./auth/accessConfig";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthShell subtitle="Workforce & operations hub">
              <Login />
            </AuthShell>
          }
        />
        <Route
          path="/register"
          element={
            <AuthShell subtitle="Create your SmartFlow account">
              <Register />
            </AuthShell>
          }
        />

        {/* Global app shell — navbar + page content on every in-app route */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="access-denied" element={<AccessDenied />} />
          <Route path="candidate/*" element={<CandidateRoutes />} />

          <Route element={<RequireAuth />}>
            <Route path="dashboard" element={<Dashboard />} />

            <Route element={<RequireAccess domain={ACCESS_DOMAINS.HR} />}>
              <Route path="hr-dashboard" element={<HRDashboardPage />} />
              <Route path="hr/jobs" element={<JobManagement />} />
              <Route element={<RequireRole allowed={["interviewer", "admin"]} />}>
                <Route path="interviewer-dashboard" element={<InterviewerDashboardPage />} />
              </Route>
            </Route>

            <Route element={<RequireRole allowed={["candidate"]} />}>
              <Route path="candidate-dashboard" element={<CandidateDashboardPage />} />
            </Route>

            <Route element={<RequireRole allowed={["admin"]} />}>
              <Route path="admin-dashboard" element={<AdminDashboardPage />} />
            </Route>

            <Route element={<RequireAccess domain={ACCESS_DOMAINS.TENDERS} />}>
              <Route path="tenders/*" element={<TenderRoutes />} />
              <Route path="work-packages/*" element={<WorkPackageRoutes />} />
              <Route path="submissions/*" element={<SubmissionRoutes />} />
              <Route path="companies/*" element={<CompanyRoutes />} />
              <Route path="offers/*" element={<OfferRoutes />} />
            </Route>

            <Route
              path="time-tracking"
              element={
                <PlaceholderPage
                  title="Time tracking"
                  description="Track hours and attendance across teams."
                />
              }
            />
            <Route
              path="interior"
              element={
                <PlaceholderPage
                  title="Interior design"
                  description="Concepts and project boards will appear here."
                />
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
