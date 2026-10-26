import ApplyLeaveSection from "../../components/ApplyLeaveSection";
import { managerApi } from "../../api/managerApi";
import { useAuth } from "../../context/AuthContext";

export default function ApplyLeavePage() {
  const { manager } = useAuth();
  return (
    <ApplyLeaveSection
      title="Apply for leave"
      applicantName={manager?.name || manager?.email || ""}
      applyLeave={(payload) => managerApi.applyLeave(payload)}
      listMyLeaves={() => managerApi.myLeaves()}
    />
  );
}
