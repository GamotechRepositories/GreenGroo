import ApplyLeaveSection from "../../components/ApplyLeaveSection";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";

export default function ApplyLeavePage() {
  const { manager } = useAuth();
  return (
    <ApplyLeaveSection
      title="Apply for leave"
      subtitle="Delivery managers can request leave with one or more dates."
      applicantName={manager?.name || manager?.email || ""}
      applyLeave={(payload) => managerApi.applyLeave(payload)}
      listMyLeaves={() => managerApi.myLeaves()}
    />
  );
}
