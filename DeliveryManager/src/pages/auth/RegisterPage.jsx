import { Link } from "react-router-dom";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Registration closed</h1>
        <p className="mt-3 text-sm text-gray-500">
          Delivery manager accounts are created by a Product Manager. Contact your
          Product Manager for login credentials.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-lg bg-green-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-active"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
