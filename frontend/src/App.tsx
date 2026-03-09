import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./auth/Login";
import Register from "./auth/Register";

import PrivateRoute from "./components/common/PrivateRoute";
import Layout from "./components/layout/Layout";

import Dashboard from "./pages/Dashbord";
import TenderRoutes from "./routes/TenderRoutes";
import CompanyRoutes from "./routes/CompanyRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Dashboard kao početna */}
          <Route index element={<Dashboard />} />

          {/* Modul Tender */}
          <Route path="tenders/*" element={<TenderRoutes />} />

          {/* Modul Company */}
          <Route path="companies/*" element={<CompanyRoutes />} />

          {/* Ostali moduli */}
          <Route path="hr" element={<div>HR Page</div>} />
          <Route path="time-tracking" element={<div>Time Tracking Page</div>} />
          <Route path="interior" element={<div>Interior Design Page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;