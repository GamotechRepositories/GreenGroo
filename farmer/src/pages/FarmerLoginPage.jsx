import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { loginFarmer, logoutFarmer } from "../store/farmerSlice";
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
  const role = useSelector((s) => s.farmer.role);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { mobile: "", password: "" },
  });
  const mobileField = register("mobile");

  if (token && role !== "FARMER_MANAGER") {
    const from = location.state?.from;
    if (from && String(from).startsWith("/farmer") && !String(from).startsWith("/farmer/manager")) {
      return <Navigate to={from} replace />;
    }
    return <Navigate to="/farmer/dashboard" replace />;
  }

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const result = await dispatch(loginFarmer(values)).unwrap();
      const userRole = result?.farmer?.role;
      if (userRole === "FARMER_MANAGER") {
        dispatch(logoutFarmer());
        toast.error("This login is for farmers. Use the Farmer Manager panel.");
        return;
      }
      toast.success("Welcome to Farmer Panel");
      const from = location.state?.from;
      navigate(from && String(from).startsWith("/farmer") ? from : "/farmer/dashboard", { replace: true });
    } catch (err) {
      toast.error(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="farmer-panel farmer-auth-shell flex min-h-dvh items-center justify-center px-4 py-8">
      <div className={`w-full max-w-md ${EXCEL_PANEL} p-5 sm:p-7`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">GreenGroo Farmer</p>
        <h1 className={`mt-1 ${EXCEL_PAGE_TITLE}`}>Sign in to Farmer Panel</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">Mobile Number</label>
            <input
              {...mobileField}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              placeholder="10-digit mobile number"
              className={EXCEL_INPUT}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                mobileField.onChange(e);
              }}
            />
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
          New farmer?{" "}
          <Link
            to="/farmer/register"
            className="relative z-10 font-semibold text-[#217346] underline underline-offset-2 hover:text-[#1B5E3B]"
          >
            Register here
          </Link>
        </p>
      </div>
      <FarmerToaster />
    </div>
  );
}

export default FarmerLoginPage;
