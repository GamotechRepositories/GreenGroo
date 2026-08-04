import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getMyOrders,
} from "../api/api";
import AddressForm, { ADDRESS_FORM_FIELDS } from "../components/address/AddressForm";
import BuyAgainCard from "../components/product/BuyAgainCard";
import {
  formatAddressLine,
  getAddressFullName,
  mapAddressToForm,
} from "../utils/addressDisplay";

function profileFirstName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts[0] || "there";
}

function profileInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function extractRecentOrderItems(orders, maxItems = 12) {
  const eligible = orders
    .filter((order) => order.status !== "cancelled" && order.status !== "attempted" && order.status !== "return")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const seen = new Set();
  const items = [];

  for (const order of eligible) {
    for (const item of order.items || []) {
      const productId = item.product?._id || item.product;
      if (!productId || seen.has(String(productId))) continue;
      seen.add(String(productId));
      items.push({
        ...item,
        productId: String(productId),
        image: item.image || item.productImage || item.product?.productImages?.[0] || "",
      });
      if (items.length >= maxItems) return items;
    }
  }

  return items;
}

function ProfileInfoRow({ icon, label, value, onEdit, showDivider }) {
  return (
    <div>
      <div className="flex items-center gap-3 px-3.5 py-3.5 sm:px-4 sm:py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE8D4] text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="truncate text-sm font-semibold text-text-primary">{value}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary"
        >
          Edit
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {showDivider ? <div className="ml-[62px] mr-3.5 border-t border-border-light" /> : null}
    </div>
  );
}

function QuickLink({ icon, label, onClick, to }) {
  const content = (
    <>
      <div className="mx-auto flex h-8 w-8 items-center justify-center text-primary">{icon}</div>
      <span className="mt-1.5 block text-center text-[10px] font-semibold leading-tight text-text-primary">
        {label}
      </span>
    </>
  );

  const className = "flex-1 rounded-xl px-1 py-1 transition hover:bg-white/60";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { user, openAuthModal, logout, updateProfile } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [formError, setFormError] = useState("");
  const [recentItems, setRecentItems] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [addressIndex, setAddressIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const addressesRef = useRef(null);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const { data } = await getAddresses();
      setAddresses(data.data || []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentItems = async () => {
    setRecentLoading(true);
    try {
      const { data } = await getMyOrders();
      setRecentItems(extractRecentOrderItems(data.data || []));
    } catch {
      setRecentItems([]);
    } finally {
      setRecentLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAddresses();
      loadRecentItems();
    } else {
      setAddresses([]);
      setRecentItems([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (addressIndex >= addresses.length) {
      setAddressIndex(Math.max(0, addresses.length - 1));
    }
  }, [addresses.length, addressIndex]);

  const handleSaveAddress = async (formData) => {
    setSavingAddress(true);
    setFormError("");
    try {
      if (editingAddress) {
        const { data } = await updateAddress(editingAddress._id, formData);
        setAddresses((prev) =>
          prev.map((addr) => (addr._id === editingAddress._id ? data.data : addr))
        );
      } else {
        const { data } = await addAddress({
          ...formData,
          isDefault: addresses.length === 0,
        });
        setAddresses((prev) => [data.data, ...prev]);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditProfileField = async (field, label, currentValue) => {
    const nextValue = window.prompt(`Edit ${label}`, currentValue);
    if (nextValue == null || nextValue.trim() === currentValue) return;

    try {
      await updateProfile({ [field]: nextValue.trim() });
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setShowAddressForm(true);
    setFormError("");
  };

  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      await deleteAddress(addrId);
      setAddresses((prev) => prev.filter((addr) => addr._id !== addrId));
    } catch {
      setFormError("Failed to delete address");
    }
  };

  const cancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setFormError("");
  };

  const scrollToAddresses = () => {
    addressesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const currentAddress = addresses[addressIndex];

  if (!user) {
    return (
      <div className="min-h-screen bg-mobile-bg px-4 pb-24 pt-4">
        <div className="mx-auto max-w-xl rounded-2xl border border-border-light bg-white px-6 py-10 text-center">
          <p className="mb-6 text-sm text-text-secondary">
            Sign in to manage your account and addresses.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal("login")}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mobile-bg px-4 pb-24 pt-4 sm:px-6">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Hi, {profileFirstName(user.name)} 👋
            </h1>
            <p className="mt-1 text-sm text-text-secondary">Manage your profile & addresses</p>
          </div>
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/15 bg-[#FFE8D4] text-lg font-bold text-primary">
              {profileInitials(user.name)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border-light bg-white shadow-sm">
              <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a1.5 1.5 0 00-4.5-4.5L4 15.5V20z" />
              </svg>
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm">
          <ProfileInfoRow
            icon={
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            label="Name"
            value={user.name}
            onEdit={() => handleEditProfileField("name", "Name", user.name)}
            showDivider
          />
          <ProfileInfoRow
            icon={
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            label="Email"
            value={user.email || "Not provided"}
            onEdit={() => handleEditProfileField("email", "Email", user.email || "")}
            showDivider
          />
          <ProfileInfoRow
            icon={
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
            label="Phone Number"
            value={user.phone || "Not provided"}
            onEdit={() => handleEditProfileField("phone", "Phone Number", user.phone || "")}
            showDivider={false}
          />
        </div>

        <div className="flex rounded-2xl border border-primary/10 bg-[#FFF5ED] px-2 py-4">
          <QuickLink
            label="My Addresses"
            onClick={scrollToAddresses}
            icon={
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <QuickLink
            label="My Orders"
            to="/orders"
            icon={
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <QuickLink
            label="Wishlist"
            to="/wishlist"
            icon={
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
          <QuickLink
            label="Account Settings"
            onClick={() => setShowSettings(true)}
            icon={
              <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>

        {(recentLoading || recentItems.length > 0) && (
          <section>
            <h2 className="text-base font-bold text-text-primary">Buy Again</h2>
            <p className="mt-0.5 text-sm text-text-secondary">Items from your recent orders</p>
            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recentLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-[210px] w-[140px] shrink-0 animate-pulse rounded-2xl bg-mobile-surface"
                    />
                  ))
                : recentItems.map((item) => (
                    <BuyAgainCard
                      key={`${item.productId}-${item.variantName || "default"}-${item.colorName || "default"}`}
                      item={item}
                    />
                  ))}
            </div>
          </section>
        )}

        <section ref={addressesRef}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-text-primary">Saved Addresses</h2>
            {!showAddressForm && (
              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setShowAddressForm(true);
                  setFormError("");
                }}
                className="text-sm font-semibold text-primary"
              >
                + Add Address
              </button>
            )}
          </div>

          {formError && !showAddressForm && (
            <p className="mb-3 text-sm text-red-600">{formError}</p>
          )}

          {showAddressForm ? (
            <>
              {formError && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
              )}
              <AddressForm
                plain
                initial={
                  editingAddress
                    ? mapAddressToForm(editingAddress)
                    : {
                        ...ADDRESS_FORM_FIELDS,
                        fullName: user.name || "",
                        number: user.phone || "",
                        email: user.email || "",
                      }
                }
                onSubmit={handleSaveAddress}
                onCancel={cancelAddressForm}
                submitting={savingAddress}
              />
            </>
          ) : loading ? (
            <div className="h-52 animate-pulse rounded-2xl border border-border-light bg-white" />
          ) : addresses.length === 0 ? (
            <div className="rounded-2xl border border-border-light bg-white p-5 text-sm text-text-secondary">
              No saved addresses yet.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border-light bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFE8D4] text-primary">
                    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-text-primary">{getAddressFullName(currentAddress)}</p>
                      {currentAddress.isDefault && (
                        <span className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {formatAddressLine(currentAddress)}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      +91 {currentAddress.number}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditAddress(currentAddress)}
                    className="px-2 text-sm font-semibold text-primary"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(currentAddress._id)}
                    className="px-2 text-sm font-semibold text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {addresses.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={addressIndex === 0}
                    onClick={() => setAddressIndex((i) => Math.max(0, i - 1))}
                    className="rounded-full border border-border-light px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <div className="flex gap-1.5">
                    {addresses.map((addr, index) => (
                      <button
                        key={addr._id}
                        type="button"
                        aria-label={`Address ${index + 1}`}
                        onClick={() => setAddressIndex(index)}
                        className={`h-2 rounded-full transition ${
                          index === addressIndex ? "w-2 bg-primary" : "w-2 bg-border-light"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={addressIndex >= addresses.length - 1}
                    onClick={() => setAddressIndex((i) => Math.min(addresses.length - 1, i + 1))}
                    className="rounded-full border border-border-light px-3 py-1 text-xs disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Account Settings</h3>
              <button type="button" onClick={() => setShowSettings(false)} className="text-text-secondary">
                ✕
              </button>
            </div>
            <Link
              to="/support"
              onClick={() => setShowSettings(false)}
              className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-mobile-surface"
            >
              <span className="font-medium text-text-primary">Help & Support</span>
              <span className="text-text-secondary">›</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowSettings(false);
                logout();
                navigate("/");
              }}
              className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left font-medium text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
