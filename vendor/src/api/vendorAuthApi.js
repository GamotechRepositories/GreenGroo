const API_BASE = 'http://localhost:5001';

export async function loginVendor({ emailOrPhone, password }) {
  const isPhone = /^[6789]\d{9}$/.test(emailOrPhone.trim());
  const body = isPhone
    ? { phone: emailOrPhone.trim(), password }
    : { email: emailOrPhone.trim().toLowerCase(), password };

  const response = await fetch(`${API_BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Login failed. Please check credentials.');
  }
  return data;
}

export async function registerVendor(formData) {
  const payload = {
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    email: formData.email?.trim().toLowerCase() || undefined,
    password: formData.password,
    shopName: formData.shopName?.trim() || '',
    shopAddress: formData.shopAddress?.trim() || '',
    gstNumber: formData.gstNumber?.trim().toUpperCase() || '',
    role: 'vendor',
  };

  const response = await fetch(`${API_BASE}/api/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed.');
  }
  return data;
}

export async function getVendorProfile(token) {
  const response = await fetch(`${API_BASE}/api/users/me`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch profile.');
  }
  return data;
}
