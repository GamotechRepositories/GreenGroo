import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ManagerRoutes from "./routes/FarmerRoutes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/manager/*" element={<ManagerRoutes />} />
        <Route path="/" element={<Navigate to="/manager/login" replace />} />
        <Route path="*" element={<Navigate to="/manager/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
