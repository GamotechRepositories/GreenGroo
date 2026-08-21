import { useCallback, useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  getLocationByPincode,
  getLocationCities,
  getLocationPincodes,
  getLocationStates,
} from "../../api/api";
import LocationAutocomplete from "./LocationAutocomplete";

export const ADDRESS_FORM_FIELDS = {
  fullName: "",
  number: "",
  email: "",
  shopNo: "",
  shopName: "",
  fullAddress: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  location: null,
};

const PHONE_PATTERN = /^[6789]\d{9}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAddressForm(form) {
  const fullName = form.fullName?.trim();
  const number = form.number?.trim();
  const email = form.email?.trim();
  const shopNo = form.shopNo?.trim();
  const shopName = form.shopName?.trim();
  const fullAddress = form.fullAddress?.trim();
  const landmark = form.landmark?.trim();
  const city = form.city?.trim();
  const state = form.state?.trim();
  const pincode = form.pincode?.trim();

  if (!fullName) return "Full name is required";
  if (!number) return "Phone number is required";
  if (!PHONE_PATTERN.test(number)) {
    return "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9";
  }
  if (!email) return "Email is required";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address";
  if (!shopNo) return "Shop number is required";
  if (!shopName) return "Shop name is required";
  if (!fullAddress) return "Full address is required";
  if (!landmark) return "Landmark is required";
  if (!city) return "City is required";
  if (!state) return "State is required";
  if (!pincode) return "Pincode is required";
  if (!PINCODE_PATTERN.test(pincode)) return "Pincode must be 6 digits";
  return "";
}

const inputClass =
  "w-full rounded-lg border border-border-light bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 outline-none focus:border-primary";

async function fetchList(apiCall) {
  const { data } = await apiCall;
  return data?.data || [];
}

function AddressForm({ initial, onSubmit, onCancel, submitting, plain = false }) {
  const [form, setForm] = useState(initial || ADDRESS_FORM_FIELDS);
  const [validationError, setValidationError] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const state = addr.state || "";
            const pincode = addr.postcode || "";
            const fullAddress = data.display_name || "";
            
            setForm(prev => ({
              ...prev,
              city,
              state,
              pincode,
              fullAddress: prev.fullAddress || fullAddress,
              location: { lat, lng }
            }));
            toast.success("Location detected successfully!");
          } else {
            toast.error("Could not resolve address from location.");
            setForm(prev => ({ ...prev, location: { lat, lng } }));
          }
        } catch (error) {
          toast.error("Failed to fetch address details.");
          setForm(prev => ({ ...prev, location: { lat, lng } }));
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error("Failed to detect location. Please ensure location services are enabled.");
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError("");
  };

  const fetchStates = useCallback(async (query) => {
    return fetchList(getLocationStates(query));
  }, []);

  const fetchCities = useCallback(
    async (query) => {
      if (!form.state.trim()) return [];
      return fetchList(getLocationCities(form.state, query));
    },
    [form.state]
  );

  const fetchPincodes = useCallback(
    async (query) => {
      if (!form.state.trim() || !form.city.trim()) return [];
      return fetchList(getLocationPincodes(form.state, form.city, query));
    },
    [form.state, form.city]
  );

  const handleStateChange = (value) => {
    setForm((prev) => ({ ...prev, state: value, city: "", pincode: "" }));
    if (validationError) setValidationError("");
  };

  const handleCityChange = (value) => {
    setForm((prev) => ({ ...prev, city: value, pincode: "" }));
    if (validationError) setValidationError("");
  };

  const handlePincodeChange = async (value) => {
    const pincode = value.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, pincode }));
    if (validationError) setValidationError("");

    if (pincode.length === 6) {
      try {
        const { data } = await getLocationByPincode(pincode);
        if (data?.data) {
          setForm((prev) => ({
            ...prev,
            pincode,
            city: data.data.city || prev.city,
            state: data.data.state || prev.state,
          }));
        }
      } catch {
        // keep typed pincode if lookup fails
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateAddressForm(form);
    if (error) {
      setValidationError(error);
      return;
    }

    onSubmit({
      fullName: form.fullName.trim(),
      number: form.number.trim(),
      email: form.email.trim(),
      shopNo: form.shopNo.trim(),
      shopName: form.shopName.trim(),
      fullAddress: form.fullAddress.trim(),
      landmark: form.landmark.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      location: form.location,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        plain
          ? "space-y-3"
          : "space-y-3 rounded-xl border border-border-light bg-white p-4"
      }
    >
      {validationError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{validationError}</p>
      )}

      <button
        type="button"
        onClick={handleDetectLocation}
        disabled={isDetecting}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-70"
      >
        {isDetecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LocateFixed className="h-4 w-4" />
        )}
        {isDetecting ? "Detecting location..." : "Detect Live Location"}
      </button>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          required
          placeholder="Full name"
          className={inputClass}
        />
        <input
          name="number"
          value={form.number}
          onChange={handleChange}
          required
          maxLength={10}
          pattern="[6789][0-9]{9}"
          placeholder="Number"
          inputMode="numeric"
          className={inputClass}
        />
      </div>

      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
        placeholder="Email ID"
        className={inputClass}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="shopNo"
          value={form.shopNo}
          onChange={handleChange}
          required
          placeholder="Shop no."
          className={inputClass}
        />
        <input
          name="shopName"
          value={form.shopName}
          onChange={handleChange}
          required
          placeholder="Shop name"
          className={inputClass}
        />
      </div>

      <textarea
        name="fullAddress"
        value={form.fullAddress}
        onChange={handleChange}
        required
        rows={2}
        placeholder="Full address"
        className={`${inputClass} resize-none`}
      />

      <input
        name="landmark"
        value={form.landmark}
        onChange={handleChange}
        required
        placeholder="Landmark"
        className={inputClass}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <LocationAutocomplete
          name="state"
          placeholder="State"
          value={form.state}
          onChange={handleStateChange}
          fetchSuggestions={fetchStates}
          required
        />
        <LocationAutocomplete
          name="city"
          placeholder={form.state ? "City" : "Select state first"}
          value={form.city}
          onChange={handleCityChange}
          fetchSuggestions={fetchCities}
          disabled={!form.state.trim()}
          required
        />
        <LocationAutocomplete
          name="pincode"
          placeholder={form.city ? "Pincode" : "Select city first"}
          value={form.pincode}
          onChange={handlePincodeChange}
          fetchSuggestions={fetchPincodes}
          disabled={!form.state.trim() || !form.city.trim()}
          required
        />
      </div>

      <div className="flex items-center justify-end gap-4 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-text-secondary transition hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save Address"}
        </button>
      </div>
    </form>
  );
}

export default AddressForm;
