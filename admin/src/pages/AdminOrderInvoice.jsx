import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderById, getStoreSettings } from "../api/api";
import InvoiceDocument from "../components/invoice/InvoiceDocument";
import InvoicePageShell from "@shared/invoice/InvoicePageShell.jsx";
import { downloadInvoiceFromElement } from "@shared/invoice/downloadInvoiceFromElement.js";
import { getInvoiceFilename } from "@shared/invoice/invoiceHelpers.js";

function AdminOrderInvoice() {
  const { id } = useParams();
  const invoiceRef = useRef(null);
  const autoDownloadedRef = useRef(false);
  const [order, setOrder] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const [orderRes, settingsRes] = await Promise.all([
          getOrderById(id),
          getStoreSettings().catch(() => null),
        ]);
        setOrder(orderRes.data.data);
        setStoreSettings(settingsRes?.data?.data || null);
      } catch {
        setError("Order not found");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleDownload = useCallback(async () => {
    if (downloading || !order) return;

    try {
      setDownloading(true);
      await downloadInvoiceFromElement(
        invoiceRef.current,
        getInvoiceFilename(order),
        { order, customer: order.user, storeSettings }
      );
    } catch {
      setError("Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  }, [downloading, order, storeSettings]);

  useEffect(() => {
    if (loading || !order || autoDownloadedRef.current) return;

    autoDownloadedRef.current = true;
    const timer = setTimeout(() => {
      handleDownload();
    }, 600);

    return () => clearTimeout(timer);
  }, [loading, order, handleDownload]);

  if (loading) {
    return (
      <InvoicePageShell backTo={`/orders/${id}`} backLabel="← Back to Order">
        <div className="animate-pulse rounded-xl bg-neutral-100 p-12" />
      </InvoicePageShell>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-16 text-center">
        <p className="mb-6 text-text-secondary">{error || "Order not found"}</p>
        <Link to={`/orders/${id}`} className="text-sm font-semibold text-primary hover:underline">
          ← Back to Order
        </Link>
      </div>
    );
  }

  return (
    <InvoicePageShell backTo={`/orders/${id}`} backLabel="← Back to Order">
      <InvoiceDocument
        ref={invoiceRef}
        order={order}
        customer={order.user}
        storeSettings={storeSettings}
        onDownload={handleDownload}
        downloading={downloading}
      />
    </InvoicePageShell>
  );
}

export default AdminOrderInvoice;
