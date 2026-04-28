const searchInput = document.querySelector('#searchInput');
const bloodFilter = document.querySelector('#bloodFilter');
const statusFilter = document.querySelector('#statusFilter');
const donorTableBody = document.querySelector('#donorTableBody');

let allDonors = [];

function formatDonorId(id) {
  return `DON-${String(id).padStart(5, '0')}`;
}

function mapStatus(status) {
  return status === 1 ? 'ระงับ' : 'ปกติ';
}

function getStatusClass(status) {
  return status === 1 ? 'suspended' : 'normal';
}

function renderDonors() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedBlood = bloodFilter.value;
  const selectedStatus = statusFilter.value;

  const filtered = allDonors.filter(donor => {
    const idStr = formatDonorId(donor.donorId).toLowerCase();
    const matchesSearch = !keyword ||
      donor.name.toLowerCase().includes(keyword) ||
      idStr.includes(keyword);
    const matchesBlood = selectedBlood === 'all' || donor.bloodGroup === selectedBlood;
    const statusLabel = mapStatus(donor.status);
    const matchesStatus = selectedStatus === 'all' || statusLabel === selectedStatus;
    return matchesSearch && matchesBlood && matchesStatus;
  });

  if (filtered.length === 0) {
    donorTableBody.innerHTML = '<tr><td class="empty-state" colspan="6">ไม่พบข้อมูลผู้บริจาค</td></tr>';
    return;
  }

  donorTableBody.innerHTML = filtered.map(donor => {
    const isSuspended = donor.status === 1;
    const statusText = isSuspended ? 'ระงับ (มีอาการไว)' : 'ปกติ';
    const statusClass = getStatusClass(donor.status);
    return `
      <tr>
        <td>${formatDonorId(donor.donorId)}</td>
        <td>${donor.name}</td>
        <td>${donor.bloodGroup}${donor.rhFactor}</td>
        <td>-</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
        <td>
          <div class="actions">
            <button class="action-btn" type="button" title="แก้ไข"
              data-edit="${donor.donorId}">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button class="action-btn ${isSuspended ? '' : 'danger'}" type="button"
              title="${isSuspended ? 'ยกเลิกระงับสิทธิ์' : 'ระงับสิทธิ์'}"
              data-toggle="${donor.donorId}" data-suspended="${isSuspended}">
              ${isSuspended
                ? '<i class="fa-solid fa-check"></i>'
                : '<i class="fa-solid fa-ban"></i>'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  donorTableBody.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () =>
      handleToggle(parseInt(btn.dataset.toggle), btn.dataset.suspended === 'true'));
  });

  donorTableBody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => handleEdit(parseInt(btn.dataset.edit)));
  });
}

async function handleToggle(donorId, isSuspended) {
  const action = isSuspended ? 'ยกเลิกระงับสิทธิ์' : 'ระงับสิทธิ์';
  const remark = prompt(`กรุณาระบุเหตุผลในการ${action}:`);
  if (remark === null) return;

  try {
    const path = isSuspended
      ? `/api/donors/${donorId}/reinstate`
      : `/api/donors/${donorId}/suspend`;
    await apiPatch(path, { remark });
    await loadDonors();
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  }
}

async function handleEdit(donorId) {
  const donor = allDonors.find(d => d.donorId === donorId);
  if (!donor) return;

  const name = prompt('ชื่อ-นามสกุลใหม่:', donor.name);
  if (name === null || !name.trim()) return;

  const phone = prompt('เบอร์โทรศัพท์ใหม่ (เว้นว่างเพื่อคงเดิม):', '') || undefined;
  const email = prompt('อีเมลใหม่ (เว้นว่างเพื่อคงเดิม):', '') || undefined;

  const body = { name: name.trim() };
  if (phone) body.phone = phone;
  if (email) body.email = email;

  try {
    await apiPut(`/api/donors/${donorId}`, body);
    await loadDonors();
    alert('แก้ไขข้อมูลเรียบร้อยแล้ว');
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  }
}

function setTableState(html) {
  donorTableBody.innerHTML = html;
}

async function loadDonors() {
  setTableState('<tr><td class="empty-state" colspan="6"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...</td></tr>');
  try {
    allDonors = await apiGet('/api/donors');
    renderDonors();
  } catch (err) {
    setTableState(`<tr><td class="empty-state" colspan="6">เกิดข้อผิดพลาด: ${err.message}</td></tr>`);
  }
}

[searchInput, bloodFilter, statusFilter].forEach(el => {
  el.addEventListener('input', renderDonors);
  el.addEventListener('change', renderDonors);
});

loadDonors();
