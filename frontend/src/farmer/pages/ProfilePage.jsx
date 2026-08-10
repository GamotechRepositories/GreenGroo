import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  changeFarmerPassword,
  getFarmerProfile,
  updateFarmerProfile,
} from "../api/farmerApi";
import { logoutFarmer, setFarmerProfile } from "../store/farmerSlice";
import LoadingState from "../components/ui/LoadingState";

const profileSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email(),
  farmName: z.string().min(2),
  farmLocation: z.string().min(2),
  farmAddress: z.string().min(5),
  farmType: z.string().min(2),
  totalFarmArea: z.string().min(1),
  accountHolderName: z.string().min(2),
  bankName: z.string().min(2),
  accountNumber: z.string().min(4),
  ifsc: z.string().min(4),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(4),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const inputClass =
  "w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/15";

function ProfilePage() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  const profileForm = useForm({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    (async () => {
      try {
        const profile = await getFarmerProfile();
        profileForm.reset({
          name: profile.name,
          mobile: profile.mobile,
          email: profile.email,
          farmName: profile.farmName,
          farmLocation: profile.farmLocation,
          farmAddress: profile.farmAddress,
          farmType: profile.farmType,
          totalFarmArea: profile.totalFarmArea,
          accountHolderName: profile.bank.accountHolderName,
          bankName: profile.bank.bankName,
          accountNumber: profile.bank.accountNumber,
          ifsc: profile.bank.ifsc,
        });
      } catch (err) {
        toast.error(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState rows={6} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Profile</h1>
        <p className="mt-1 text-sm text-[#6B7280]">Manage your personal, farm, and bank details.</p>
      </div>

      <form
        onSubmit={profileForm.handleSubmit(async (values) => {
          setSaving(true);
          try {
            const updated = await updateFarmerProfile({
              name: values.name,
              mobile: values.mobile,
              email: values.email,
              farmName: values.farmName,
              farmLocation: values.farmLocation,
              farmAddress: values.farmAddress,
              farmType: values.farmType,
              totalFarmArea: values.totalFarmArea,
              bank: {
                accountHolderName: values.accountHolderName,
                bankName: values.bankName,
                accountNumber: values.accountNumber,
                ifsc: values.ifsc,
              },
            });
            dispatch(setFarmerProfile(updated));
            toast.success("Profile updated");
          } catch (err) {
            toast.error(err.message || "Update failed");
          } finally {
            setSaving(false);
          }
        })}
        className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
      >
        <Section title="Personal Information">
          <Field label="Farmer Name" error={profileForm.formState.errors.name?.message}>
            <input className={inputClass} {...profileForm.register("name")} />
          </Field>
          <Field label="Mobile Number" error={profileForm.formState.errors.mobile?.message}>
            <input className={inputClass} {...profileForm.register("mobile")} />
          </Field>
          <Field label="Email" error={profileForm.formState.errors.email?.message}>
            <input className={inputClass} {...profileForm.register("email")} />
          </Field>
        </Section>

        <Section title="Farm Information">
          <Field label="Farm Name">
            <input className={inputClass} {...profileForm.register("farmName")} />
          </Field>
          <Field label="Farm Location">
            <input className={inputClass} {...profileForm.register("farmLocation")} />
          </Field>
          <Field label="Farm Address">
            <textarea rows={3} className={inputClass} {...profileForm.register("farmAddress")} />
          </Field>
          <Field label="Farm Type">
            <input className={inputClass} {...profileForm.register("farmType")} />
          </Field>
          <Field label="Total Farm Area">
            <input className={inputClass} {...profileForm.register("totalFarmArea")} />
          </Field>
        </Section>

        <Section title="Bank Information">
          <Field label="Account Holder Name">
            <input className={inputClass} {...profileForm.register("accountHolderName")} />
          </Field>
          <Field label="Bank Name">
            <input className={inputClass} {...profileForm.register("bankName")} />
          </Field>
          <Field label="Account Number">
            <input className={inputClass} {...profileForm.register("accountNumber")} />
          </Field>
          <Field label="IFSC">
            <input className={inputClass} {...profileForm.register("ifsc")} />
          </Field>
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#2E7D32] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <form
        onSubmit={passwordForm.handleSubmit(async (values) => {
          setPwdSaving(true);
          try {
            await changeFarmerPassword(values);
            toast.success("Password changed");
            passwordForm.reset();
          } catch (err) {
            toast.error(err.message || "Password change failed");
          } finally {
            setPwdSaving(false);
          }
        })}
        className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold">Security</h2>
        <Field label="Current Password" error={passwordForm.formState.errors.currentPassword?.message}>
          <input type="password" className={inputClass} {...passwordForm.register("currentPassword")} />
        </Field>
        <Field label="New Password" error={passwordForm.formState.errors.newPassword?.message}>
          <input type="password" className={inputClass} {...passwordForm.register("newPassword")} />
        </Field>
        <Field
          label="Confirm Password"
          error={passwordForm.formState.errors.confirmPassword?.message}
        >
          <input
            type="password"
            className={inputClass}
            {...passwordForm.register("confirmPassword")}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pwdSaving}
            className="rounded-xl border border-[#2E7D32] px-4 py-2.5 text-sm font-bold text-[#2E7D32]"
          >
            {pwdSaving ? "Updating..." : "Change Password"}
          </button>
          <button
            type="button"
            onClick={() => dispatch(logoutFarmer())}
            className="rounded-xl bg-[#DC2626] px-4 py-2.5 text-sm font-bold text-white"
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="sm:col-span-1">
      <label className="mb-1 block text-sm font-semibold">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-[#DC2626]">{error}</p> : null}
    </div>
  );
}

export default ProfilePage;
