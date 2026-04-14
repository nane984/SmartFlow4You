import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./auth/Login";
import Register from "./auth/Register";

import RequireAuth from "./components/common/RequireAuth";
import Layout from "./components/layout/Layout";
import AuthShell from "./components/layout/AuthShell";

import Dashboard from "./pages/Dashbord";
import PlaceholderPage from "./pages/PlaceholderPage";
import TenderRoutes from "./routes/TenderRoutes";
import CompanyRoutes from "./routes/CompanyRoutes";
import OfferRoutes from "./routes/OfferRouts";
import HrRoutes from "./routes/HrRoutes";

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

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tenders/*" element={<TenderRoutes />} />
            <Route path="companies/*" element={<CompanyRoutes />} />
            <Route path="offers/*" element={<OfferRoutes />} />
            <Route path="hr/*" element={<HrRoutes />} />
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
