import { z } from "zod";

const maxDob = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
})();

export const farmerRegistrationSchema = z
  .object({
    name: z.string().trim().min(3, "Enter farmer full name"),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((value) => value <= maxDob, "Farmer must be 18 years or older"),
    gender: z.string().refine((value) => ["Male", "Female", "Other"].includes(value), "Select gender"),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    village: z.string().trim().min(2, "Village is required"),
    taluka: z.string().trim().min(2, "Taluka is required"),
    district: z.string().trim().min(2, "District is required"),
    pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
    profileImage: z.string().min(1, "Farmer photo is required"),
    referralCode: z.string().trim().max(40, "Referral / agent code is too long").optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const REGISTRATION_DEFAULTS = {
  name: "",
  dateOfBirth: "",
  gender: "",
  mobile: "",
  password: "",
  confirmPassword: "",
  village: "",
  taluka: "",
  district: "",
  pincode: "",
  profileImage: "",
  referralCode: "",
};
