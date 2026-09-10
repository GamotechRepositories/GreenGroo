import ApplyLeaveSection from "../../components/ApplyLeaveSection";
import { driverApi } from "../../api/driverApi";
import { useDriverAuth } from "../../context/DriverAuthContext";

export default function DriverLeavePage() {
  const { driver } = useDriverAuth();
  return (
    <ApplyLeaveSection
      title="Apply for leave"
      subtitle="Pickup drivers can request leave with one or more dates."
      applicantName={driver?.name || driver?.phone || ""}
      applyLeave={(payload) => driverApi.applyLeave(payload)}
      listMyLeaves={() => driverApi.myLeaves()}
    />
  );
}
