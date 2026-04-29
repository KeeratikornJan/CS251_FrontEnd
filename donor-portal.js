const user = getAuthUser();

// Populate topbar
document.getElementById('topbarName').textContent = user?.fullName ? `คุณ${user.fullName}` : (user?.username || 'ผู้บริจาค');
document.getElementById('topbarId').textContent  = user?.id ? `DON-${String(user.id).padStart(5, '0')}` : '';
document.getElementById('welcomeName').textContent = user?.fullName || user?.username || 'ผู้บริจาค';

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.location.replace('index.html');
});

function rhLabel(rh) {
  return rh === '+' ? 'Positive (+)' : 'Negative (-)';
}

function genderLabel(g) {
  return g === 'M' ? 'ชาย' : g === 'F' ? 'หญิง' : g || '—';
}

async function loadDashboard() {
  try {
    const data = await apiGet('/api/donors/me/dashboard');
    document.getElementById('totalDonations').textContent = data.totalDonations ?? '0';
    document.getElementById('lastDonation').textContent  = data.latestDonationDate ? formatThaiDate(data.latestDonationDate) : '—';
    document.getElementById('nextEligible').textContent  = data.nextEligibleDate  ? formatThaiDate(data.nextEligibleDate)  : '—';

    const badge = document.getElementById('eligibilityBadge');
    if (data.readyToDonate) {
      badge.innerHTML = '<span class="eligibility-badge ready"><i class="fa-solid fa-circle-check"></i> พร้อมบริจาคได้</span>';
    } else if (data.nextEligibleDate && new Date(data.nextEligibleDate) > new Date()) {
      badge.innerHTML = `<span class="eligibility-badge not-ready"><i class="fa-solid fa-clock"></i> ยังไม่ถึงเวลา — บริจาคได้ ${formatThaiDate(data.nextEligibleDate)}</span>`;
    } else {
      badge.innerHTML = '<span class="eligibility-badge suspended"><i class="fa-solid fa-ban"></i> สิทธิ์ถูกระงับ กรุณาติดต่อเจ้าหน้าที่</span>';
    }
  } catch (err) {
    document.getElementById('eligibilityBadge').textContent = `ไม่สามารถโหลดข้อมูลได้: ${err.message}`;
  }
}

async function loadProfile() {
  const grid = document.getElementById('profileGrid');
  try {
    const p = await apiGet('/api/donors/me/profile');

    const statusLabel = p.status === 1 ? 'ปกติ' : 'ระงับสิทธิ์';
    const statusColor = p.status === 1 ? 'var(--ok)' : 'var(--danger)';

    grid.innerHTML = `
      <div class="profile-row"><span class="profile-label">ชื่อ-นามสกุล</span><span class="profile-value">${p.name || '—'}</span></div>
      <div class="profile-row"><span class="profile-label">เลขบัตรประชาชน</span><span class="profile-value">${p.nationalId || '—'}</span></div>
      <div class="profile-row"><span class="profile-label">กรุ๊ปเลือด</span><span class="profile-value">${p.bloodGroup || '—'} / ${rhLabel(p.rhFactor)}</span></div>
      <div class="profile-row"><span class="profile-label">เพศ</span><span class="profile-value">${genderLabel(p.gender)}</span></div>
      <div class="profile-row"><span class="profile-label">วันเกิด</span><span class="profile-value">${p.birthday ? formatThaiDate(p.birthday) : '—'}</span></div>
      <div class="profile-row"><span class="profile-label">โรคประจำตัว</span><span class="profile-value">${p.congenitalDisease || '—'}</span></div>
      <div class="profile-row"><span class="profile-label">เบอร์โทร</span><span class="profile-value">${p.phone || '—'}</span></div>
      <div class="profile-row"><span class="profile-label">อีเมล</span><span class="profile-value">${p.email || '—'}</span></div>
      <div class="profile-row"><span class="profile-label">ที่อยู่</span><span class="profile-value">${p.place || '—'}</span></div>
      <div class="profile-row"><span class="profile-label">สถานะบัญชี</span><span class="profile-value" style="color:${statusColor};font-weight:700">${statusLabel}</span></div>
    `;
  } catch (err) {
    grid.innerHTML = `<div style="color:red">ไม่สามารถโหลดข้อมูลได้: ${err.message}</div>`;
  }
}

async function loadHistory() {
  const tbody = document.getElementById('historyBody');
  try {
    const rows = await apiGet('/api/donors/me/donations');
    if (!rows || rows.length === 0) {
      tbody.innerHTML = '<tr><td class="empty-state" colspan="4">ยังไม่มีประวัติการบริจาค</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.donationDate ? formatThaiDate(r.donationDate) : '—'}</td>
        <td>${r.donationType || '—'}</td>
        <td>${r.volume ?? '—'}</td>
        <td><span class="badge ${r.screeningResult === 'ผ่าน' ? 'pass' : 'fail'}">${r.screeningResult || '—'}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td class="empty-state" colspan="4">ไม่สามารถโหลดข้อมูลได้: ${err.message}</td></tr>`;
  }
}

loadDashboard();
loadProfile();
loadHistory();
