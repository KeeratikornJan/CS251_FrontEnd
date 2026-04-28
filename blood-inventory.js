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
  const map = { 0: 'พร้อมใช้งาน', 1: 'ถูกจอง', 2: 'ใช้แล้ว', 3: 'รอทำลาย' };
  return map[status] ?? 'ไม่ทราบสถานะ';
}

function getBagStatusClass(status) {
  if (status === 1) return 'reserved';
  if (status === 3 || status === 2) return 'discard';
  return 'ready';
}

function renderBags() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedBlood = bloodFilter.value;
  const selectedComponent = componentFilter.value;
  const selectedStatus = statusFilter.value;

  const filtered = allBags.filter(bag => {
    const idStr = formatBagId(bag.bagId).toLowerCase();
    const matchesSearch = !keyword || idStr.includes(keyword);
    const matchesBlood = selectedBlood === 'all' || bag.bloodGroup === selectedBlood;
    const matchesComponent = selectedComponent === 'all' || bag.componentType === selectedComponent;
    const statusLabel = mapBagStatus(bag.bagStatus);
    const matchesStatus = selectedStatus === 'all' || statusLabel === selectedStatus;
    return matchesSearch && matchesBlood && matchesComponent && matchesStatus;
  });

  if (filtered.length === 0) {
    bagTableBody.innerHTML = '<tr><td class="empty-state" colspan="7">ไม่พบข้อมูลถุงเลือด</td></tr>';
    return;
  }

  bagTableBody.innerHTML = filtered.map(bag => {
    const displayId = formatBagId(bag.bagId);
    const statusLabel = mapBagStatus(bag.bagStatus);
    const statusClass = getBagStatusClass(bag.bagStatus);
    return `
      <tr>
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
