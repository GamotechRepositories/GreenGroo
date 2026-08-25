import { useState } from "react";
import Modal from "../ui/Modal";
import { ORDER_REJECTION_REASONS } from "../../utils/constants";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_INPUT } from "../../utils/excelStyles";

function RejectOrderModal({ open, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState("Stock Unavailable");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!reason) {
      setError("Select a rejection reason");
      return;
    }
    if (reason === "Other" && !note.trim()) {
      setError("Enter the other reason");
      return;
    }
    setError("");
    onConfirm({ rejectionReason: reason, rejectionNote: note.trim() });
  };

  return (
    <Modal
      open={open}
      title="Reject order"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={EXCEL_BTN} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={EXCEL_BTN_DANGER} disabled={loading} onClick={submit}>
            {loading ? "Rejecting…" : "Confirm Reject"}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        <label className="block text-xs font-semibold">Rejection reason *</label>
        <select
          className={EXCEL_INPUT}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
        >
          {ORDER_REJECTION_REASONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {reason === "Other" ? (
          <textarea
            className={EXCEL_INPUT}
            rows={3}
            placeholder="Other reason"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        ) : (
          <textarea
            className={EXCEL_INPUT}
            rows={2}
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
        {error ? <p className="text-xs text-[#DC2626]">{error}</p> : null}
      </div>
    </Modal>
  );
}

export default RejectOrderModal;
