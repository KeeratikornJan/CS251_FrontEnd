const API_BASE = 'http://localhost:8080';

function getToken() {
  return localStorage.getItem('auth_token');
}

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch { return null; }
}

function getEmployeeId() {
  const user = getAuthUser();
  return user ? Number(user.id) : 1;
}

function getAuthHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiRequest(method, path, body = null) {
  const options = { method, headers: getAuthHeaders() };
  if (body !== null) options.body = JSON.stringify(body);
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
  }
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.replace('index.html');
    return;
  }
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

const apiGet = (path) => apiRequest('GET', path);
const apiPost = (path, body) => apiRequest('POST', path, body);
const apiPut = (path, body) => apiRequest('PUT', path, body);
const apiPatch = (path, body) => apiRequest('PATCH', path, body);

function formatThaiDate(isoDate) {
  if (!isoDate) return '-';
  const parts = String(isoDate).split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts.map(Number);
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${day} ${months[month - 1]} ${year + 543}`;
}

// Redirect to login if not authenticated; redirect donors away from employee pages
(function () {
  const path = window.location.pathname;
  const onLogin  = path.endsWith('index.html') || path === '/' || path.endsWith('/');
  const onDonorPortal = path.endsWith('donor-portal.html');

  if (!onLogin && !getToken()) {
    window.location.replace('index.html');
    return;
  }

  if (!onLogin && getToken()) {
    const user = getAuthUser();
    if (user && user.role === 'Donor' && !onDonorPortal) {
      window.location.replace('donor-portal.html');
    }
    if (user && user.role === 'Employee' && onDonorPortal) {
      window.location.replace('dashboard.html');
    }
  }
})();
