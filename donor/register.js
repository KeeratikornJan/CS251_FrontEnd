const API_BASE = 'http://localhost:8080';

// Redirect already-logged-in users
(function () {
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
      window.location.replace(user && user.role === 'Donor' ? 'donor-portal.html' : '../employee/dashboard.html');
    } catch {
      window.location.replace('../employee/dashboard.html');
    }
  }
})();

const form      = document.getElementById('registerForm');
const errorMsg  = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('show');
  errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  errorMsg.classList.remove('show');
}

function val(id) {
  return document.getElementById(id).value.trim();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const firstName   = val('firstName');
  const lastName    = val('lastName');
  const nationalId  = val('nationalId');
  const gender      = val('gender');
  const birthday    = val('birthday');
  const bloodGroup  = val('bloodGroup');
  const rhFactor    = val('rhFactor');
  const phone       = val('phone');
  const email       = val('email');
  const username    = val('username');
  const password    = document.getElementById('password').value;
  const confirm     = document.getElementById('confirmPassword').value;

  // Client-side validation
  if (!firstName || !lastName) return showError('กรุณาระบุชื่อและนามสกุล');
  if (nationalId.length !== 13 || !/^\d{13}$/.test(nationalId))
    return showError('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
  if (!gender)     return showError('กรุณาเลือกเพศ');
  if (!birthday)   return showError('กรุณาระบุวันเกิด');
  if (!bloodGroup) return showError('กรุณาเลือกกรุ๊ปเลือด');
  if (!rhFactor)   return showError('กรุณาเลือก Rh Factor');
  if (!phone)      return showError('กรุณาระบุเบอร์โทร');
  if (!email)      return showError('กรุณาระบุอีเมล');
  if (username.length < 3) return showError('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
  if (password.length < 6) return showError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
  if (password !== confirm) return showError('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังสมัครสมาชิก...';

  const payload = {
    name:               `${firstName} ${lastName}`,
    nationalId,
    gender,
    birthday,
    bloodGroup,
    rhFactor,
    congenitalDisease:  val('congenitalDisease') || null,
    phone,
    email,
    place:              val('place') || null,
    username,
    password
  };

  try {
    const res  = await fetch(`${API_BASE}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'สมัครสมาชิกไม่สำเร็จ');
    }

    // Auto-login: store token and redirect to donor portal
    const data = json.data;
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    window.location.replace('donor-portal.html');

  } catch (err) {
    const isCorsOrNetwork = err instanceof TypeError && err.message === 'Failed to fetch';
    showError(isCorsOrNetwork
      ? 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      : (err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> สมัครสมาชิก';
  }
});
