import Modal from "./Modal";

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
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-[#1F2937] hover:bg-[#F9FAFB]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              danger ? "bg-[#DC2626] hover:bg-red-700" : "bg-[#2E7D32] hover:bg-[#256628]"
            }`}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-[#6B7280]">{message}</p>
    </Modal>
  );
}

export default ConfirmDialog;
