import { forwardRef } from "react";
import TaxInvoiceDocument from "@shared/invoice/TaxInvoiceDocument.jsx";

const InvoiceDocument = forwardRef(function InvoiceDocument(
  { order, customer, storeSettings, onDownload, downloading },
  ref
) {
  return (
    <TaxInvoiceDocument
      ref={ref}
      order={order}
      customer={customer}
      storeSettings={storeSettings}
      onAction={onDownload}
      actionLabel={downloading ? "Downloading..." : "Download Invoice"}
      actionLoading={downloading}
      showAction={false}
    />
  );
});

export default InvoiceDocument;
