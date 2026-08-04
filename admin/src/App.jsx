import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SupportNotificationProvider } from "./context/AdminNotificationContext";
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SupportNotificationProvider>
          <Admin />
        </SupportNotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
