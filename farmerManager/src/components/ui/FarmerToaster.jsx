import { Toaster } from "react-hot-toast";

export function FarmerToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3200,
        style: {
          background: "#FFFFFF",
          color: "#1F2937",
          border: "1px solid #D4D4D4",
          borderRadius: "0",
          fontSize: "12px",
        },
        success: { iconTheme: { primary: "#217346", secondary: "#F2F2F2" } },
        error: { iconTheme: { primary: "#DC2626", secondary: "#F2F2F2" } },
      }}
    />
  );
}
