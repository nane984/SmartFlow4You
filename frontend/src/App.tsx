import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./auth/Login";
import Register from "./auth/Register";

import RequireAuth from "./components/common/RequireAuth";
import RequireRole from "./components/common/RequireRole";
import Layout from "./components/layout/Layout";
import AuthShell from "./components/layout/AuthShell";

import Dashboard from "./pages/Dashbord";
import PlaceholderPage from "./pages/PlaceholderPage";
import TenderRoutes from "./routes/TenderRoutes";
import CompanyRoutes from "./routes/CompanyRoutes";
import OfferRoutes from "./routes/OfferRouts";
import AccessDenied from "./pages/AccessDenied";
import JobManagement from "./modules/jobs/JobManagement";
import OpenJobsPage from "./modules/jobs/OpenJobsPage";
import JobDetailsPage from "./modules/jobs/JobDetailsPage";
import {
  AdminDashboardPage,
  CandidateDashboardPage,
  HRDashboardPage,
  InterviewerDashboardPage,
} from "./pages/RoleDashboards";

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
        <Route path="/access-denied" element={<AccessDenied />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route element={<RequireRole allowed={["hr", "admin"]} />}>
              <Route path="hr-dashboard" element={<HRDashboardPage />} />
              <Route path="hr/jobs" element={<JobManagement />} />
            </Route>
            <Route element={<RequireRole allowed={["candidate"]} />}>
              <Route path="candidate-dashboard" element={<CandidateDashboardPage />} />
            </Route>
            <Route element={<RequireRole allowed={["interviewer", "admin"]} />}>
              <Route path="interviewer-dashboard" element={<InterviewerDashboardPage />} />
            </Route>
            <Route element={<RequireRole allowed={["admin"]} />}>
              <Route path="admin-dashboard" element={<AdminDashboardPage />} />
            </Route>
            <Route path="tenders/*" element={<TenderRoutes />} />
            <Route path="companies/*" element={<CompanyRoutes />} />
            <Route path="offers/*" element={<OfferRoutes />} />
            <Route path="jobs" element={<OpenJobsPage />} />
            <Route path="jobs/:id" element={<JobDetailsPage />} />
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
