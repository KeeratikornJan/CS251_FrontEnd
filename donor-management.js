const searchInput = document.querySelector('#searchInput');
const bloodFilter = document.querySelector('#bloodFilter');
const statusFilter = document.querySelector('#statusFilter');
const donorTableBody = document.querySelector('#donorTableBody');

let allDonors = [];

// ── Edit modal ───────────────────────────────────────────────────────────────
const editModal = document.createElement('dialog');
editModal.id = 'donorEditModal';
editModal.innerHTML = `
  <form id="donorEditForm" style="min-width:380px;display:flex;flex-direction:column;gap:1rem">
    <h3 style="margin:0 0 .5rem;color:#33364a">แก้ไขข้อมูลผู้บริจาค</h3>
    <input type="hidden" name="donorId" />

    <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
      ชื่อ-นามสกุล <span style="color:#e22c34">*</span>
      <input name="name" required placeholder="ชื่อ นามสกุล"
        style="padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:.5rem;font-family:inherit;font-size:.875rem" />
    </label>

    <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
      วันเกิด
      <input name="birthday" type="date"
        style="padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:.5rem;font-family:inherit;font-size:.875rem" />
    </label>

    <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
      โรคประจำตัว
      <input name="congenitalDisease" placeholder="ระบุโรคประจำตัว (ถ้ามี)"
        style="padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:.5rem;font-family:inherit;font-size:.875rem" />
    </label>

    <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
      เบอร์โทรศัพท์
      <input name="phone" type="tel" placeholder="0XX-XXX-XXXX"
        style="padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:.5rem;font-family:inherit;font-size:.875rem" />
    </label>

    <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
      อีเมล
      <input name="email" type="email" placeholder="example@email.com"
        style="padding:.5rem .75rem;border:1px solid #d1d5db;border-radius:.5rem;font-family:inherit;font-size:.875rem" />
    </label>

    <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:.5rem">
      <button type="button" id="cancelDonorEdit"
        style="padding:.5rem 1.25rem;border:1px solid #d1d5db;border-radius:.5rem;background:#fff;cursor:pointer;font-family:inherit">
        ยกเลิก
      </button>
      <button type="submit" id="donorEditSubmit"
        style="padding:.5rem 1.25rem;border:none;border-radius:.5rem;background:#3b4fa8;color:#fff;cursor:pointer;font-family:inherit">
        บันทึก
      </button>
    </div>
  </form>
`;
editModal.style.cssText = 'border:none;border-radius:12px;padding:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,.15)';
document.body.appendChild(editModal);

document.getElementById('cancelDonorEdit').addEventListener('click', () => editModal.close());

document.getElementById('donorEditForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const donorId = parseInt(fd.get('donorId'));
  const btn = document.getElementById('donorEditSubmit');
  btn.disabled = true;
  btn.textContent = 'กำลังบันทึก...';

  const body = {};
  const name    = fd.get('name')?.trim();
  const birthday = fd.get('birthday');
  const disease  = fd.get('congenitalDisease')?.trim();
  const phone    = fd.get('phone')?.trim();
  const email    = fd.get('email')?.trim();

  if (name)     body.name = name;
  if (birthday) body.birthday = birthday;
  if (disease)  body.congenitalDisease = disease;
  if (phone)    body.phone = phone;
  if (email)    body.email = email;

  try {
    await apiPut(`/api/donors/${donorId}`, body);
    editModal.close();
    await loadDonors();
    alert('แก้ไขข้อมูลเรียบร้อยแล้ว');
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'บันทึก';
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDonorId(id) {
  return `DON-${String(id).padStart(5, '0')}`;
}

// Status: 1 = active (ปกติ), 0 = suspended (ระงับ)
function mapStatus(status) {
  return status === 0 ? 'ระงับ' : 'ปกติ';
}

function getStatusClass(status) {
  return status === 0 ? 'suspended' : 'normal';
}

// ── Render ────────────────────────────────────────────────────────────────────
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
    const isSuspended = donor.status === 0;
    const statusText  = isSuspended ? 'ระงับ (มีอาการไว)' : 'ปกติ';
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
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.edit)));
  });
}

// ── Suspend / Reinstate ───────────────────────────────────────────────────────
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

// ── Open edit modal (fetch full profile first) ────────────────────────────────
async function openEditModal(donorId) {
  const form = document.getElementById('donorEditForm');
  form.querySelector('[name=donorId]').value    = donorId;
  form.querySelector('[name=name]').value         = '';
  form.querySelector('[name=birthday]').value     = '';
  form.querySelector('[name=congenitalDisease]').value = '';
  form.querySelector('[name=phone]').value        = '';
  form.querySelector('[name=email]').value        = '';

  editModal.showModal();

  try {
    const p = await apiGet(`/api/donors/${donorId}/profile`);
    form.querySelector('[name=name]').value         = p.name             || '';
    form.querySelector('[name=birthday]').value     = p.birthday         || '';
    form.querySelector('[name=congenitalDisease]').value = p.congenitalDisease || '';
    form.querySelector('[name=phone]').value        = p.phone            || '';
    form.querySelector('[name=email]').value        = p.email            || '';
  } catch (err) {
    editModal.close();
    alert(`ไม่สามารถโหลดข้อมูล: ${err.message}`);
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────
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
