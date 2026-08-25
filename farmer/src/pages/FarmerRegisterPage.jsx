import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { registerFarmerAccount } from "../store/farmerSlice";
import { FarmerToaster } from "../components/ui/FarmerToaster";
import ImageUploadField from "../components/ui/ImageUploadField";
import { farmerRegistrationSchema, REGISTRATION_DEFAULTS } from "../auth/registrationSchema";
import { GENDER_OPTIONS } from "../utils/constants";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PANEL,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
} from "../utils/excelStyles";
import "../styles/farmer.css";

const maxDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
})();

function FarmerRegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((s) => s.farmer.token);
  const role = useSelector((s) => s.farmer.role);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(farmerRegistrationSchema),
    defaultValues: REGISTRATION_DEFAULTS,
  });

  if (token && role === "FARMER_MANAGER") {
    return <Navigate to="/farmer/manager/dashboard" replace />;
  }

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await dispatch(
        registerFarmerAccount({
          name: values.name,
          dateOfBirth: values.dateOfBirth,
          gender: values.gender,
          mobile: values.mobile,
          password: values.password,
          village: values.village,
          taluka: values.taluka,
          district: values.district,
          pincode: values.pincode,
          profileImage: values.profileImage,
          referralCode: values.referralCode || "",
        })
      ).unwrap();
      toast.success("Farmer account created");
      navigate("/farmer/register/success", { replace: true });
    } catch (err) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="farmer-panel min-h-screen bg-white px-4 py-8">
      <div className={`mx-auto w-full max-w-2xl ${EXCEL_PANEL} p-4 sm:p-5`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#217346]">Farmer Registration</p>
        <h1 className={`mt-1 ${EXCEL_PAGE_TITLE}`}>Create your farmer account</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
          Fill in your details. After registration you can continue to KYC.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">Farmer Full Name *</label>
              <input {...register("name")} className={EXCEL_INPUT} placeholder="e.g. Ramesh Patil" />
              {errors.name ? <p className="mt-1 text-xs text-[#DC2626]">{errors.name.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Date of Birth *</label>
              <input type="date" max={maxDob} {...register("dateOfBirth")} className={EXCEL_INPUT} />
              {errors.dateOfBirth ? (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.dateOfBirth.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Gender *</label>
              <select {...register("gender")} className={EXCEL_INPUT}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {errors.gender ? <p className="mt-1 text-xs text-[#DC2626]">{errors.gender.message}</p> : null}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">Mobile Number *</label>
              <input
                {...register("mobile")}
                className={EXCEL_INPUT}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                autoComplete="tel"
              />
              {errors.mobile ? <p className="mt-1 text-xs text-[#DC2626]">{errors.mobile.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Password *</label>
              <input
                type="password"
                {...register("password")}
                className={EXCEL_INPUT}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {errors.password ? <p className="mt-1 text-xs text-[#DC2626]">{errors.password.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Confirm Password *</label>
              <input
                type="password"
                {...register("confirmPassword")}
                className={EXCEL_INPUT}
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
              {errors.confirmPassword ? (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.confirmPassword.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Village *</label>
              <input {...register("village")} className={EXCEL_INPUT} placeholder="Village" />
              {errors.village ? <p className="mt-1 text-xs text-[#DC2626]">{errors.village.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Taluka *</label>
              <input {...register("taluka")} className={EXCEL_INPUT} placeholder="Taluka" />
              {errors.taluka ? <p className="mt-1 text-xs text-[#DC2626]">{errors.taluka.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">District *</label>
              <input {...register("district")} className={EXCEL_INPUT} placeholder="District" />
              {errors.district ? <p className="mt-1 text-xs text-[#DC2626]">{errors.district.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Pincode *</label>
              <input
                {...register("pincode")}
                className={EXCEL_INPUT}
                inputMode="numeric"
                maxLength={6}
                placeholder="422001"
              />
              {errors.pincode ? <p className="mt-1 text-xs text-[#DC2626]">{errors.pincode.message}</p> : null}
            </div>

            <div className="sm:col-span-2">
              <Controller
                name="profileImage"
                control={control}
                render={({ field }) => (
                  <ImageUploadField
                    label="Farmer Photo *"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.profileImage?.message}
                    showPresets={false}
                  />
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">Referral / Agent Code (Optional)</label>
              <input
                {...register("referralCode")}
                className={EXCEL_INPUT}
                placeholder="Enter referral or agent code if you have one"
              />
              {errors.referralCode ? (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.referralCode.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="submit" disabled={submitting} className={`${EXCEL_BTN_PRIMARY} px-5 py-2`}>
              {submitting ? "Creating account…" : "Create Farmer Account"}
            </button>
            <Link to="/farmer/login" className={`${EXCEL_BTN} px-4 py-2`}>
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
      <FarmerToaster />
    </div>
  );
}

export default FarmerRegisterPage;
