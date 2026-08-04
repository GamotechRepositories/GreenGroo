export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function openRazorpayCheckout({
  keyId,
  amount,
  razorpayOrderId,
  user,
  description = "Order Payment",
  onSuccess,
  onDismiss,
}) {
  const options = {
    key: keyId,
    amount,
    currency: "INR",
    name: "BulkMobileMart",
    description,
    order_id: razorpayOrderId,
    prefill: {
      name: user?.name || "",
      email: user?.email || "",
      contact: user?.phone || "",
    },
    theme: {
      color: "#f97316",
    },
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", onDismiss);
  rzp.open();
}
