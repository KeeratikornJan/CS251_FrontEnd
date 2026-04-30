const layoutRoot = document.querySelector('#layoutRoot');
const activeMenu = document.body.dataset.activeMenu || 'donors';
const pageContent = document.querySelector('#pageContent')?.innerHTML || '';

const menuItems = [
  { key: 'dashboard',      label: 'Dashboard',            href: 'dashboard.html',      icon: 'fa-table-cells-large' },
  { key: 'donors',         label: 'ผู้บริจาค',             href: 'donor-management.html', icon: 'fa-users' },
  { key: 'patients',       label: 'ผู้ป่วย',               href: 'patient-management.html', icon: 'fa-bed' },
  { key: 'blood-stock',    label: 'คลังเลือด',             href: 'blood-inventory.html', icon: 'fa-prescription-bottle-medical' },
  { key: 'blood-test',     label: 'บันทึกการตรวจเลือด',   href: 'blood-testing.html',  icon: 'fa-vial' },
  { key: 'blood-transfer', label: 'การจ่ายเลือด',          href: 'blood-usage.html',    icon: 'fa-briefcase-medical' },
  { key: 'notification',   label: 'แจ้งเตือน',             href: 'alerts.html',         icon: 'fa-bell',     regular: true },
  { key: 'report',         label: 'รายงาน',                href: 'reports.html',        icon: 'fa-chart-bar', regular: true }
];

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch { return null; }
}

function createMenu() {
  return menuItems.map(item => {
    const iconClass = item.regular ? 'fa-regular' : 'fa-solid';
    const activeClass = item.key === activeMenu ? ' active' : '';
    return `<a class="nav-link${activeClass}" href="${item.href}"><i class="${iconClass} ${item.icon}"></i>${item.label}</a>`;
  }).join('');
}

const user = getAuthUser();
const displayName = user?.fullName ? `คุณ${user.fullName}` : (user?.username ? user.username : 'ผู้ใช้งาน');
const employeeNum = user?.id ? String(user.id).padStart(5, '0') : '00000';
const displayId = `บุคลากรเลขที่ EMP-${employeeNum}`;

layoutRoot.innerHTML = `
  <header class="topbar">
    <a class="brand" href="donor-management.html">
      <i class="fa-solid fa-user-doctor"></i>
      <span>BloodBank Staff</span>
    </a>
    <div class="staff-area">
      <div class="staff-text">
        <strong>${displayName}</strong>
        <span>${displayId}</span>
      </div>
      <button class="logout-btn" type="button" id="logoutBtn">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        Logout
      </button>
    </div>
  </header>
  <div class="app-layout">
    <aside class="sidebar">${createMenu()}</aside>
    <main class="page-content" id="pageContent">${pageContent}</main>
  </div>
`;

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.location.href = '../index.html';
});
