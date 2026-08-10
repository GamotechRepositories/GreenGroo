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
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          fontSize: "14px",
        },
        success: { iconTheme: { primary: "#2E7D32", secondary: "#E8F5E9" } },
        error: { iconTheme: { primary: "#DC2626", secondary: "#FEF2F2" } },
      }}
    />
  );
}
