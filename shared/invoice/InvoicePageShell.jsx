import { Link } from "react-router-dom";

export default function InvoicePageShell({ backTo, backLabel, children }) {
  return (
    <div className="invoice-page-shell">
      {backTo ? (
        <div className="invoice-page-toolbar no-print">
          <Link to={backTo}>{backLabel}</Link>
        </div>
      ) : null}
      <div className="invoice-page-content">{children}</div>
    </div>
  );
}
