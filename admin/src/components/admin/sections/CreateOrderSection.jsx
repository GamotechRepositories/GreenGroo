import { useEffect, useState } from "react";
import {
  createUser,
  createUserAddress,
  getUserAddresses,
  getUsers,
  updateUserAddress,
} from "../../../api/api";
import AdminAlert from "../AdminAlert";
import AdminAddressForm from "../AdminAddressForm";
import CreateOrderCheckout from "../CreateOrderCheckout";
import UserEditModal from "../UserEditModal";
import {
  adminFilterInputClass,
  btnPrimary,
  btnSecondary,
  cardClass,
  labelClass,
} from "../adminStyles";
import { formatAddressLine, getAddressFullName } from "../../../utils/addressDisplay";

function CreateOrderSection() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [savedAddress, setSavedAddress] = useState(null);
  const [existingAddresses, setExistingAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pendingSelectId, setPendingSelectId] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");

  const loadUserAddresses = async (userId) => {
    try {
      setLoadingAddresses(true);
      const { data } = await getUserAddresses(userId);
      const addresses = data.data || [];
      setExistingAddresses(addresses);
      if (addresses.length > 0) {
        setSavedAddress(addresses[0]);
        setShowAddressForm(false);
        setEditingAddressId("");
      } else {
        setSavedAddress(null);
        setShowAddressForm(true);
        setEditingAddressId("");
      }
    } catch (err) {
      setExistingAddresses([]);
      setSavedAddress(null);
      setShowAddressForm(true);
      setError(err.response?.data?.message || "Failed to load addresses");
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (!selectedUser?._id) {
      setExistingAddresses([]);
      setSavedAddress(null);
      setShowAddressForm(false);
      setEditingAddressId("");
      return;
    }
    loadUserAddresses(selectedUser._id);
  }, [selectedUser?._id]);

  const handleSearch = async () => {
    if (!nameFilter.trim() && !phoneFilter.trim()) {
      setError("Enter a name or phone number to search");
      return;
    }
    try {
      setSearching(true);
      setError("");
      setSuccess("");
      setHasSearched(true);
      setPendingSelectId("");
      const params = { page: 1, limit: 20 };
      if (nameFilter.trim()) params.name = nameFilter.trim();
      if (phoneFilter.trim()) params.phone = phoneFilter.trim();
      const { data } = await getUsers(params);
      const results = data.data || [];
      setSearchResults(results);
      if (results.length === 1) {
        setPendingSelectId(results[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search users");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const resetSelection = () => {
    setSelectedUser(null);
    setSavedAddress(null);
    setExistingAddresses([]);
    setShowAddressForm(false);
    setEditingAddressId("");
    setSearchResults([]);
    setHasSearched(false);
    setPendingSelectId("");
    setError("");
    setSuccess("");
  };

  const handleConfirmSelection = () => {
    const user = searchResults.find((u) => u._id === pendingSelectId);
    if (!user) {
      setError("Select a customer from the search results");
      return;
    }
    setSelectedUser(user);
    setSuccess("");
    setError("");
  };

  const handleCreateUser = async (_id, payload) => {
    try {
      setSavingUser(true);
      setError("");
      setSuccess("");
      if (!payload.password) {
        delete payload.password;
      }
      const { data } = await createUser(payload);
      setSelectedUser(data.data);
      setSuccess("User created. Add a delivery address below.");
      setShowCreateUser(false);
      setSearchResults([]);
      setHasSearched(false);
      setPendingSelectId("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveAddress = async (addressPayload) => {
    if (!selectedUser?._id) return;
    try {
      setSavingAddress(true);
      setError("");
      setSuccess("");
      let address = null;
      if (editingAddressId) {
        const { data } = await updateUserAddress(selectedUser._id, editingAddressId, addressPayload);
        address = data.data;
        setExistingAddresses((prev) =>
          prev.map((item) => (item._id === editingAddressId ? address : item))
        );
      } else {
        const { data } = await createUserAddress(selectedUser._id, addressPayload);
        address = data.data;
        setExistingAddresses((prev) => [address, ...prev]);
      }
      setSavedAddress(address);
      setShowAddressForm(false);
      setEditingAddressId("");
      setSuccess(
        editingAddressId
          ? "Address updated. Continue to checkout."
          : "Address saved. Add products to create the order."
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleOrderSuccess = (order) => {
    setSuccess(`Order #${order.orderNumber || order._id?.slice(-6)} created successfully.`);
    setError("");
  };

  const addressInitial = showAddressForm
    ? editingAddressId
      ? existingAddresses.find((item) => item._id === editingAddressId) || null
      : selectedUser
        ? {
            fullName: selectedUser.name || "",
            number: selectedUser.phone || "",
            email: selectedUser.email || "",
            shopNo: "",
            shopName: "",
            fullAddress: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
          }
        : null
    : null;

  return (
    <div className="min-w-0 space-y-6">
      <AdminAlert
        error={error}
        success={success}
        onClear={() => {
          setError("");
          setSuccess("");
        }}
      />

      {!selectedUser ? (
        <div className={cardClass}>
          <div className="grid grid-cols-2 items-end gap-2 sm:gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
            <div className="min-w-0">
              <label className={labelClass}>Search by name</label>
              <input
                type="search"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Customer name"
                className={adminFilterInputClass}
              />
            </div>
            <div className="min-w-0">
              <label className={labelClass}>Search by phone</label>
              <input
                type="search"
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Phone number"
                className={adminFilterInputClass}
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className={`${btnPrimary} w-full lg:w-auto`}
            >
              {searching ? "Searching..." : "Search Customer"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateUser(true)}
              className={`${btnSecondary} w-full lg:w-auto`}
            >
              Create User
            </button>
          </div>

          {hasSearched && !searching ? (
            searchResults.length === 0 ? (
              <p className="mt-4 text-sm text-text-secondary">
                No customers found. Try different filters or create a new user.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 items-end gap-3 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <label className={labelClass}>Select customer</label>
                  <select
                    value={pendingSelectId}
                    onChange={(e) => setPendingSelectId(e.target.value)}
                    className={adminFilterInputClass}
                  >
                    <option value="">Choose a customer...</option>
                    {searchResults.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} — {user.phone}
                        {user.email ? ` (${user.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={!pendingSelectId}
                  className={`${btnPrimary} w-full lg:w-auto`}
                >
                  Continue
                </button>
              </div>
            )
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button type="button" onClick={resetSelection} className={btnSecondary}>
              Change Customer
            </button>
          </div>

          <div className={cardClass}>
            <h2 className="text-base font-bold text-text-primary">Customer</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-text-secondary">Name</dt>
                <dd className="font-medium text-text-primary">{selectedUser.name}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Email</dt>
                <dd className="font-medium text-text-primary">{selectedUser.email}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Phone</dt>
                <dd className="font-medium text-text-primary">{selectedUser.phone}</dd>
              </div>
            </dl>
          </div>

          <div className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-text-primary">Delivery Address</h2>
              {!showAddressForm ? (
                <div className="flex flex-wrap gap-2">
                  {savedAddress?._id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(savedAddress._id);
                        setShowAddressForm(true);
                      }}
                      className={btnSecondary}
                    >
                      Edit Address
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId("");
                      setShowAddressForm(true);
                    }}
                    className={btnSecondary}
                  >
                    Add New Address
                  </button>
                </div>
              ) : null}
            </div>

            {loadingAddresses ? (
              <p className="mt-3 text-sm text-text-secondary">Loading addresses...</p>
            ) : existingAddresses.length > 0 ? (
              <div className="mt-3">
                <label className={labelClass}>Select address</label>
                <select
                  value={savedAddress?._id || ""}
                  onChange={(e) => {
                    const address = existingAddresses.find((item) => item._id === e.target.value);
                    setSavedAddress(address || null);
                    setShowAddressForm(false);
                    setEditingAddressId("");
                  }}
                  className={adminFilterInputClass}
                >
                  {existingAddresses.map((address) => (
                    <option key={address._id} value={address._id}>
                      {getAddressFullName(address)} — {formatAddressLine(address)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {savedAddress && !showAddressForm ? (
              <div className="mt-3 rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
                <p className="text-sm font-medium text-text-primary">
                  {getAddressFullName(savedAddress)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  {formatAddressLine(savedAddress)}
                </p>
              </div>
            ) : null}

            {showAddressForm ? (
              <div className="mt-4">
                <AdminAddressForm
                  initial={addressInitial}
                  onSubmit={handleSaveAddress}
                  submitting={savingAddress}
                  submitLabel={editingAddressId ? "Update Address" : "Save Address"}
                />
                {existingAddresses.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId("");
                    }}
                    className={`${btnSecondary} mt-3`}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {savedAddress?._id ? (
            <CreateOrderCheckout
              userId={selectedUser._id}
              addressId={savedAddress._id}
              onSuccess={handleOrderSuccess}
              onError={setError}
            />
          ) : null}
        </>
      )}

      <UserEditModal
        user={null}
        isAdd={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onSave={handleCreateUser}
        saving={savingUser}
      />
    </div>
  );
}

export default CreateOrderSection;
