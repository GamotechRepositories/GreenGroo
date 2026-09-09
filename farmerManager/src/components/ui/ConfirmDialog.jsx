import Modal from "./Modal";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className={EXCEL_BTN}>
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={danger ? EXCEL_BTN_DANGER : EXCEL_BTN_PRIMARY}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-500">{message}</p>
    </Modal>
  );
}

export default ConfirmDialog;
