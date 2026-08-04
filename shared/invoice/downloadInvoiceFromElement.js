import React from "react";
import { pdf } from "@react-pdf/renderer";
import InvoicePdfDocument from "./InvoicePdfDocument.jsx";

export async function generateInvoicePdfBlob(invoiceData = {}) {
  const { order, customer, storeSettings, logoUrl } = invoiceData;
  if (!order) {
    throw new Error("Order data is required for invoice PDF");
  }

  return pdf(
    React.createElement(InvoicePdfDocument, {
      order,
      customer,
      storeSettings,
      logoUrl,
    })
  ).toBlob();
}

export async function shareInvoicePdf(invoiceData = {}, filename = "invoice.pdf") {
  const blob = await generateInvoicePdfBlob(invoiceData);
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.share) {
    const shareData = { files: [file], title: filename };
    if (!navigator.canShare || navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return { method: "share" };
    }
  }

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
  return { method: "download" };
}

export async function downloadInvoiceFromElement(_element, filename = "invoice.pdf", invoiceData = {}) {
  const blob = await generateInvoicePdfBlob(invoiceData);

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
