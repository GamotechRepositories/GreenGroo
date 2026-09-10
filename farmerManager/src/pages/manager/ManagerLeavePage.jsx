import { useSelector } from "react-redux";
import ApplyLeaveSection from "../../components/ApplyLeaveSection";
import { applyLeave, listMyLeaves } from "../../api/farmerApi";

export default function ManagerLeavePage() {
  const farmer = useSelector((s) => s.farmer.farmer);
  return (
    <ApplyLeaveSection
      title="Apply for leave"
      subtitle="Farmer managers can request leave with one or more dates."
      applicantName={farmer?.name || farmer?.email || ""}
      applyLeave={(payload) => applyLeave(payload)}
      listMyLeaves={() => listMyLeaves()}
    />
  );
}
