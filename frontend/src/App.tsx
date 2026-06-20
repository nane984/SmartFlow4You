import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./auth/Login";
import Register from "./auth/Register";
import ConfirmEmailPage from "./pages/auth/ConfirmEmailPage";

import RequireAuth from "./components/common/RequireAuth";
import RequireAccess from "./components/common/RequireAccess";
import RequireRole from "./components/common/RequireRole";
import Layout from "./components/layout/Layout";
import PublicLayout from "./components/layout/PublicLayout";
import CandidateAreaLayout from "./components/layout/CandidateAreaLayout";
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
import SupplierRequestsPage from "./pages/admin/SupplierRequestsPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import JobRoutes from "./routes/JobRoutes";
import HrRoutes from "./routes/HrRoutes";
import HrDashboard from "./modules/hr/HrDashboard";
import {
  CandidateDashboardPage,
  InterviewerDashboardPage,
} from "./pages/RoleDashboards";
import { ACCESS_DOMAINS } from "./auth/accessConfig";
import { ROLES } from "./auth/roles";

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
          path="/confirm-email"
          element={
            <AuthShell subtitle="Activate your account">
              <ConfirmEmailPage />
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

        {/* Public marketing — candidate portal uses CandidateAreaLayout below */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="access-denied" element={<AccessDenied />} />
        </Route>

        {/* Candidate portal — sidebar when logged in, public navbar for guests */}
        <Route element={<CandidateAreaLayout />}>
          <Route path="candidate/*" element={<CandidateRoutes />} />
        </Route>

        {/* Private app — sidebar + topbar */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />

            <Route element={<RequireAccess domain={ACCESS_DOMAINS.HR} />}>
              <Route path="hr-dashboard" element={<HrDashboard />} />
              <Route path="hr/jobs/*" element={<JobRoutes />} />
              <Route path="hr/*" element={<HrRoutes />} />
              <Route element={<RequireRole allowed={[ROLES.INTERVIEWER, ROLES.ADMIN]} />}>
                <Route path="interviewer-dashboard" element={<InterviewerDashboardPage />} />
              </Route>
            </Route>

            <Route element={<RequireRole allowed={[ROLES.CANDIDATE, ROLES.ADMIN]} />}>
              <Route path="candidate-dashboard" element={<CandidateDashboardPage />} />
            </Route>

            <Route element={<RequireRole allowed={[ROLES.ADMIN]} />}>
              <Route path="admin/supplier-requests" element={<SupplierRequestsPage />} />
              <Route path="admin/users" element={<UserManagementPage />} />
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
