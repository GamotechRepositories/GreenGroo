import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { loginFarmer } from "../store/farmerSlice";
import { FarmerToaster } from "../components/ui/FarmerToaster";

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
    <div className="flex min-h-screen items-center justify-center bg-[#F7F2E8] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-[#2E7D32]">GreenGroo Farmer</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[#1F2937]">Sign in to Farmer Panel</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Demo login is prefilled. Use any valid mobile + password (4+ chars).
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Mobile Number</label>
            <input
              {...register("mobile")}
              className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/15"
            />
            {errors.mobile ? (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.mobile.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/15"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-[#DC2626]">{errors.password.message}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#2E7D32] py-3 text-sm font-bold text-white hover:bg-[#256628] disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6B7280]">
          <Link to="/" className="font-semibold text-[#2E7D32] hover:underline">
            ← Back to marketplace
          </Link>
        </p>
      </div>
      <FarmerToaster />
    </div>
  );
}

export default FarmerLoginPage;
