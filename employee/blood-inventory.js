const searchInput = document.querySelector('#searchInput');
const bloodFilter = document.querySelector('#bloodFilter');
const componentFilter = document.querySelector('#componentFilter');
const statusFilter = document.querySelector('#statusFilter');
const bagTableBody = document.querySelector('#bagTableBody');

let allBags = [];

function formatBagId(id) {
  return `BAG-${String(id).padStart(5, '0')}`;
}

function mapBagStatus(status) {
  const map = { 0: 'พร้อมใช้งาน', 1: 'รอผลตรวจ', 2: 'ใช้แล้ว', 3: 'รอทำลาย', 4: 'หมดอายุ' };
  return map[status] ?? 'ไม่ทราบสถานะ';
}

function getBagStatusClass(status) {
  if (status === 1) return 'reserved';
  if (status === 2 || status === 3) return 'discard';
  if (status === 4) return 'expired';
  return 'ready';
}

// Client-side guard: catch any bag the backend scheduler hasn't swept yet.
// Compares midnight-local of expiryDate against midnight-local of today,
// matching the backend's  ExpiryDate < CURDATE()  logic exactly.
function isClientExpired(bag) {
  if (!bag.expiryDate) return false;
  const expiry = new Date(bag.expiryDate + 'T00:00:00');
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry < today;
}

// Mirrors backend: expired = past ExpiryDate AND not already used/discarded (2/3)
function effectiveStatus(bag) {
  if (bag.bagStatus !== 2 && bag.bagStatus !== 3 && isClientExpired(bag)) return 4;
  return bag.bagStatus;
}

function renderBags() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedBlood = bloodFilter.value;
  const selectedComponent = componentFilter.value;
  const selectedStatus = statusFilter.value;

  const filtered = allBags.filter(bag => {
    const status = effectiveStatus(bag);
    const idStr = formatBagId(bag.bagId).toLowerCase();
    const matchesSearch    = !keyword || idStr.includes(keyword);
    const matchesBlood     = selectedBlood === 'all' || bag.bloodGroup === selectedBlood;
    const matchesComponent = selectedComponent === 'all' || bag.componentType === selectedComponent;
    const matchesStatus    = selectedStatus === 'all' || mapBagStatus(status) === selectedStatus;
    return matchesSearch && matchesBlood && matchesComponent && matchesStatus;
  });

  if (filtered.length === 0) {
    bagTableBody.innerHTML = '<tr><td class="empty-state" colspan="7">ไม่พบข้อมูลถุงเลือด</td></tr>';
    return;
  }

  bagTableBody.innerHTML = filtered.map(bag => {
    const status      = effectiveStatus(bag);
    const displayId   = formatBagId(bag.bagId);
    const statusLabel = mapBagStatus(status);
    const statusClass = getBagStatusClass(status);
    const rowClass    = status === 4 ? ' class="row-expired"' : '';
    return `
      <tr${rowClass}>
        <td>
          <a class="bag-link" href="blood-bag-detail.html?id=${bag.bagId}">
            ${displayId.replace('-', '-<br>')}
          </a>
        </td>
        <td>${bag.componentType || '-'}</td>
        <td>${bag.bloodGroup}${bag.rhFactor}</td>
        <td>${formatThaiDate(bag.collectionDate)}</td>
        <td>${formatThaiDate(bag.expiryDate)}</td>
        <td><span class="status ${statusClass}">${statusLabel}</span></td>
        <td>
          <a class="detail-btn" href="blood-bag-detail.html?id=${bag.bagId}" title="ดูรายละเอียด">
            <i class="fa-solid fa-angles-right"></i>
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function setTableState(html) {
  bagTableBody.innerHTML = html;
}

async function loadBags() {
  setTableState('<tr><td class="empty-state" colspan="7"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...</td></tr>');
  try {
    allBags = await apiGet('/api/blood/bags');
    renderBags();
  } catch (err) {
    setTableState(`<tr><td class="empty-state" colspan="7">เกิดข้อผิดพลาด: ${err.message}</td></tr>`);
  }
}

[searchInput, bloodFilter, componentFilter, statusFilter].forEach(el => {
  el.addEventListener('input', renderBags);
  el.addEventListener('change', renderBags);
});

loadBags();
