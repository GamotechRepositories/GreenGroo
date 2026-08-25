import { NavLink } from "react-router-dom";

const STEPS = [
  { to: "/farmer/profile", label: "Farmer Profile" },
  { to: "/farmer/farm-profile", label: "Farm Profile" },
  { to: "/farmer/farm-location", label: "Farm Location" },
];

export default function ProfileFlowNav() {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {STEPS.map((step, index) => (
        <span key={step.to} className="inline-flex items-center gap-1">
          {index > 0 ? <span className="text-[#9CA3AF]">→</span> : null}
          <NavLink
            to={step.to}
            className={({ isActive }) =>
              isActive ? "font-bold text-[#217346]" : "font-medium text-[#6B7280] hover:text-[#1F2937]"
            }
          >
            {step.label}
          </NavLink>
        </span>
      ))}
    </div>
  );
}
