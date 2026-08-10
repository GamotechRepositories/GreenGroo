import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import FarmerRoutes from "./routes/FarmerRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/farmer/*" element={<FarmerRoutes />} />
        <Route path="/" element={<Navigate to="/farmer/login" replace />} />
        <Route path="*" element={<Navigate to="/farmer/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
