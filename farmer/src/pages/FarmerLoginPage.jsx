import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { loginFarmer } from "../store/farmerSlice";
import { FarmerToaster } from "../components/ui/FarmerToaster";
import {
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PANEL,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
} from "../utils/excelStyles";
import "../styles/farmer.css";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(4, "Password is required"),
});

function FarmerLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((s) => s.farmer.token);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { mobile: "9876543210", password: "farm123" },
  });

  if (token) {
    return <Navigate to="/farmer/dashboard" replace />;
  }

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await dispatch(loginFarmer(values)).unwrap();
      toast.success("Welcome to Farmer Panel");
      navigate(location.state?.from || "/farmer/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="farmer-panel flex min-h-screen items-center justify-center bg-white px-4">
      <div className={`w-full max-w-md ${EXCEL_PANEL} p-4 sm:p-5`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">GreenGroo Farmer</p>
        <h1 className={`mt-1 ${EXCEL_PAGE_TITLE}`}>Sign in to Farmer Panel</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
          Demo login is prefilled. Use any valid mobile + password (4+ chars).
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Mobile Number</label>
            <input {...register("mobile")} className={EXCEL_INPUT} />
            {errors.mobile ? (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.mobile.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Password</label>
            <input type="password" {...register("password")} className={EXCEL_INPUT} />
            {errors.password ? (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.password.message}</p>
            ) : null}
          </div>
          <button type="submit" disabled={submitting} className={`w-full ${EXCEL_BTN_PRIMARY} py-2`}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className={`mt-4 text-center ${EXCEL_PAGE_SUB}`}>
          <Link to="/" className="font-semibold text-[#217346] hover:underline">
            ← Back to marketplace
          </Link>
        </p>
      </div>
      <FarmerToaster />
    </div>
  );
}

export default FarmerLoginPage;
