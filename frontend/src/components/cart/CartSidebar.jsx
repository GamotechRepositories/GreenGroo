import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getStoreSettings } from "../../api/api";
import {
  calculateShippingCharge,
} from "../../utils/orderSettings";
import { calculateOrderTotal } from "../../utils/gst";

const formatPrice = (amount, fractionDigits = 2) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

export default function CartSidebar() {
  const { cartSidebarOpen, closeCartSidebar, items, incrementCartItem, decrementCartItem, removeFromCart } = useCart();
  const { user, setAuthModal } = useAuth();
  const navigate = useNavigate();

  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    getStoreSettings().then((res) => {
      setStoreSettings(res.data.data);
    }).catch(() => {});
  }, []);

  if (!cartSidebarOpen) return null;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.discountedPrice || item.price) * item.quantity, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + (item.price || item.discountedPrice) * item.quantity, 0);
  const totalSavings = originalSubtotal - subtotal;
  
  const shipping = calculateShippingCharge(subtotal, storeSettings);
  const handling = 2; // Fixed matching screenshot
  const { total } = calculateOrderTotal(subtotal, shipping);
  const grandTotal = total + handling;

  const hasItems = items.length > 0;
  
  const handleCheckoutClick = () => {
    closeCartSidebar();
    if (!user) {
      setAuthModal("login");
    } else {
      navigate("/cart"); // Go to full checkout page/cart page
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeCartSidebar} />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button onClick={closeCartSidebar} className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-slate-900">My Cart</h2>
          </div>
          <button className="text-[#0C831F] font-bold text-sm flex items-center gap-1.5 transition hover:opacity-80">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          
          {hasItems && totalSavings > 0 && (
            <div className="bg-[#E8F3FF] text-[#006CE5] px-4 py-3 rounded-2xl flex items-center justify-between text-sm shadow-sm border border-blue-100/50">
              <span className="font-semibold">Your total savings</span>
              <span className="font-bold">₹{totalSavings}</span>
            </div>
          )}

          {hasItems ? (
            <>
              {/* Delivery Warning */}
              <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/50 shrink-0 flex items-center justify-center relative overflow-hidden">
                   <span className="text-2xl mt-1">🛵</span>
                   <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#E11D48] rounded-full text-white flex items-center justify-center font-bold text-[9px] shadow-sm ring-2 ring-white">!</div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">No delivery partners available</h3>
                  <p className="text-slate-500 text-[13px] mt-0.5">Shipment of {itemCount} item{itemCount > 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
                {items.map(item => (
                  <div key={`${item._id}-${item.variantName}-${item.colorName}`} className="flex gap-4 border-b border-slate-100/80 pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden flex items-center justify-center p-1">
                      {item.productImages?.[0] ? (
                        <img src={item.productImages[0]} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 rounded-lg" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[13px] font-semibold text-slate-900 line-clamp-2 leading-snug">{item.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{item.variantName || '1 pc'}</p>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-[15px] text-slate-900">₹{item.discountedPrice || item.price}</span>
                          {item.price > item.discountedPrice && (
                            <span className="text-[11px] text-slate-400 line-through">₹{item.price}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center h-[30px] bg-[#0C831F] text-white rounded-[8px] font-bold text-sm px-1 shadow-md w-20 justify-between">
                          <button onClick={() => decrementCartItem(item)} className="w-6 h-full flex items-center justify-center hover:scale-110 transition active:scale-90">−</button>
                          <span className="text-[13px]">{item.quantity}</span>
                          <button onClick={() => incrementCartItem(item)} className="w-6 h-full flex items-center justify-center hover:scale-110 transition active:scale-90">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="font-bold text-[15px] text-slate-900 mb-4">Bill details</h3>
                <div className="space-y-3 text-[13px] text-slate-600">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Items total
                      {totalSavings > 0 && <span className="text-[9px] bg-[#E8F3FF] text-[#006CE5] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Saved ₹{totalSavings}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {totalSavings > 0 && <span className="line-through text-slate-400">₹{originalSubtotal}</span>}
                      <span className="text-slate-900 font-medium">₹{subtotal}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                      Delivery charge
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <span className="line-through text-slate-400">₹{shipping || 12}</span>
                       <span className="text-[#006CE5] font-bold">FREE</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      Handling charge
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span className="text-slate-900 font-medium">₹{handling}</span>
                  </div>

                  <div className="border-t border-slate-100/80 my-3 pt-3 flex justify-between items-center font-bold text-[15px] text-slate-900">
                    <span className="flex items-center gap-1">Grand total <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">Cancellation Policy</h3>
                <p className="text-[12px] text-slate-500 leading-snug">Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.</p>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 pt-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-5">
                 <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                 </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1.5">Your cart is empty</h3>
              <p className="text-[13px] text-slate-500 mb-6 max-w-[250px]">Looks like you haven't added anything to your cart yet.</p>
              <button onClick={closeCartSidebar} className="bg-[#0C831F] text-white font-bold text-[15px] py-3 px-8 rounded-xl shadow-lg hover:bg-[#0A6C19] transition">
                Start Shopping
              </button>
            </div>
          )}
        </div>

        {/* Fixed Bottom Action Bar */}
        {hasItems && (
          <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] relative z-10">
            <button 
              onClick={handleCheckoutClick}
              className="w-full bg-[#0C831F] hover:bg-[#0A6C19] active:scale-[0.98] text-white flex items-center justify-between px-5 py-3.5 rounded-xl font-bold transition-all shadow-lg"
            >
              <div className="flex flex-col text-left justify-center">
                <span className="text-[15px] leading-tight">₹{grandTotal}</span>
                <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-widest mt-0.5">TOTAL</span>
              </div>
              <div className="flex items-center gap-1.5 text-[15px]">
                {user ? "Checkout" : "Login to Proceed"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
