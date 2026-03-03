import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register"
import Dashboard from "./pages/Dashbord";
import PrivateRoute from "./routes/PrivateRoute";
import Layout from "./layout/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private routes */}
        <Route path="/" 
          element={ <PrivateRoute> 
                      <Layout> 
                        <Dashboard /> 
                      </Layout> 
                    </PrivateRoute>} 
          />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
