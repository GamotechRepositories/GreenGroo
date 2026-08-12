import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Prevent wheel scroll from changing number input values globally
document.addEventListener('wheel', () => {
  if (document.activeElement.type === 'number') {
    document.activeElement.blur()
  }
})
