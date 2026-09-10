import ApplyLeaveSection from '../../components/ApplyLeaveSection'
import { staffApi } from '../../api/staffApi'
import { useAuth } from '../../context/AuthContext'

export default function ApplyLeavePage() {
  const { staff } = useAuth()
  return (
    <ApplyLeaveSection
      title="Apply for leave"
      subtitle="Segregation managers can request leave with one or more dates."
      applicantName={staff?.name || staff?.email || ''}
      applyLeave={(payload) => staffApi.applyLeave(payload)}
      listMyLeaves={() => staffApi.myLeaves()}
    />
  )
}
