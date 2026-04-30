const searchInput = document.querySelector('#searchInput');
const bloodFilter = document.querySelector('#bloodFilter');
const statusFilter = document.querySelector('#statusFilter');
const patientTableBody = document.querySelector('#patientTableBody');

let allPatients = [];

// Inject the edit modal once
const editModal = document.createElement('dialog');
editModal.id = 'patientEditModal';
editModal.innerHTML = `
  <form id="patientEditForm" style="min-width:360px;display:flex;flex-direction:column;gap:1rem">
    <h3 style="margin:0 0 .5rem">แก้ไขข้อมูลผู้ป่วย</h3>
    <input type="hidden" name="patientId" />

    <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
      เลขบัตรประชาชน (13 หลัก)
      <input name="nationalId" required minlength="13" maxlength="13"
        placeholder="x-xxxx-xxxxx-xx-x"
        style="padding:.5rem;border:1px solid #d1d5db;border-radius:.5rem" />
    </label>

    <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
      ชื่อ-นามสกุล
      <input name="name" required placeholder="ชื่อ นามสกุล"
        style="padding:.5rem;border:1px solid #d1d5db;border-radius:.5rem" />
    </label>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
      <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
        เพศ
        <select name="gender" required style="padding:.5rem;border:1px solid #d1d5db;border-radius:.5rem">
          <option value="M">ชาย</option>
          <option value="F">หญิง</option>
        </select>
      </label>
      <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
        วันเกิด
        <input name="birthday" type="date" required
          style="padding:.5rem;border:1px solid #d1d5db;border-radius:.5rem" />
      </label>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
      <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
        กรุ๊ปเลือด
        <select name="bloodGroup" required style="padding:.5rem;border:1px solid #d1d5db;border-radius:.5rem">
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="AB">AB</option>
          <option value="O">O</option>
        </select>
      </label>
      <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
        Rh Factor
        <select name="rhFactor" required style="padding:.5rem;border:1px solid #d1d5db;border-radius:.5rem">
          <option value="+">Rh+</option>
          <option value="-">Rh-</option>
        </select>
      </label>
    </div>

    <label style="display:flex;flex-direction:column;gap:.25rem;font-size:.875rem">
      สถานะการรับเลือด
      <select name="transfusionStatus"
        style="padding:.5rem;border:1px solid #d1d5db;border-radius:.5rem">
        <option value="">-- ไม่ระบุ --</option>
        <option value="ขอรับเลือดด่วน">ขอรับเลือดด่วน</option>
        <option value="จองเลือดล่วงหน้า">จองเลือดล่วงหน้า</option>
        <option value="ได้รับเลือดแล้ว">ได้รับเลือดแล้ว</option>
      </select>
    </label>

    <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:.5rem">
      <button type="button" id="cancelPatientEdit"
        style="padding:.5rem 1.25rem;border:1px solid #d1d5db;border-radius:.5rem;background:#fff;cursor:pointer">
        ยกเลิก
      </button>
      <button type="submit"
        style="padding:.5rem 1.25rem;border:none;border-radius:.5rem;background:#3b4fa8;color:#fff;cursor:pointer">
        บันทึก
      </button>
    </div>
  </form>
`;
editModal.style.cssText = 'border:none;border-radius:12px;padding:1.5rem;box-shadow:0 8px 32px rgba(0,0,0,.15)';
document.body.appendChild(editModal);

document.getElementById('cancelPatientEdit')?.addEventListener('click', () => editModal.close());

document.getElementById('patientEditForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const patientId = parseInt(fd.get('patientId'));
  try {
    await apiPut(`/api/patients/${patientId}`, {
      nationalId: fd.get('nationalId'),
      name: fd.get('name'),
      gender: fd.get('gender'),
      bloodGroup: fd.get('bloodGroup'),
      rhFactor: fd.get('rhFactor'),
      birthday: fd.get('birthday'),
      transfusionStatus: fd.get('transfusionStatus') || null
    });
    editModal.close();
    await loadPatients();
    alert('แก้ไขข้อมูลเรียบร้อยแล้ว');
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  }
});

function formatPatientId(id) {
  return `PAT-${String(id).padStart(5, '0')}`;
}

function getStatusClass(status) {
  if (status === 'ขอรับเลือดด่วน') return 'urgent';
  if (status === 'จองเลือดล่วงหน้า') return 'reserved';
  return 'completed';
}

function renderPatients() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedBlood = bloodFilter.value;
  const selectedStatus = statusFilter.value;

  const filtered = allPatients.filter(patient => {
    const idStr = formatPatientId(patient.patientId).toLowerCase();
    const matchesSearch = !keyword ||
      patient.name.toLowerCase().includes(keyword) ||
      idStr.includes(keyword);
    const matchesBlood = selectedBlood === 'all' || patient.bloodGroup === selectedBlood;
    const matchesStatus = selectedStatus === 'all' || patient.transfusionStatus === selectedStatus;
    return matchesSearch && matchesBlood && matchesStatus;
  });

  if (filtered.length === 0) {
    patientTableBody.innerHTML = '<tr><td class="empty-state" colspan="5">ไม่พบข้อมูลผู้ป่วย</td></tr>';
    return;
  }

  patientTableBody.innerHTML = filtered.map(patient => {
    const status = patient.transfusionStatus || '-';
    const statusClass = getStatusClass(status);
    const canDispatch = status !== 'ได้รับเลือดแล้ว' && status !== '-';
    return `
      <tr>
        <td>${formatPatientId(patient.patientId)}</td>
        <td>${patient.name}</td>
        <td>${patient.bloodGroup}${patient.rhFactor}</td>
        <td><span class="request-status ${statusClass}">${status}</span></td>
        <td>
          <div class="actions">
            ${canDispatch ? `
              <button class="action-btn dispatch" type="button" title="จ่ายเลือด"
                data-dispatch="${patient.patientId}">
                <i class="fa-solid fa-truck-medical"></i>
              </button>
            ` : ''}
            <button class="action-btn" type="button" title="แก้ไข"
              data-edit="${patient.patientId}">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  patientTableBody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.edit)));
  });

  patientTableBody.querySelectorAll('[data-dispatch]').forEach(btn => {
    btn.addEventListener('click', () => handleDispatch(parseInt(btn.dataset.dispatch)));
  });
}

function openEditModal(patientId) {
  const patient = allPatients.find(p => p.patientId === patientId);
  if (!patient) return;

  const form = document.getElementById('patientEditForm');
  form.querySelector('[name=patientId]').value = patientId;
  form.querySelector('[name=name]').value = patient.name || '';
  form.querySelector('[name=nationalId]').value = patient.nationalId || '';
  form.querySelector('[name=birthday]').value = patient.birthday || '';
  form.querySelector('[name=gender]').value = patient.gender || 'M';
  form.querySelector('[name=bloodGroup]').value = patient.bloodGroup || 'A';
  form.querySelector('[name=rhFactor]').value = patient.rhFactor || '+';
  form.querySelector('[name=transfusionStatus]').value = patient.transfusionStatus || '';
  editModal.showModal();
}

async function handleDispatch(patientId) {
  const bagIdRaw = prompt('กรุณาระบุรหัสถุงเลือด (Bag ID, ตัวเลข):');
  if (bagIdRaw === null) return;
  const bagId = parseInt(bagIdRaw);
  if (!bagId || isNaN(bagId)) {
    alert('รหัสถุงเลือดไม่ถูกต้อง กรุณาระบุเป็นตัวเลข');
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  try {
    await apiPost('/api/blood/usage', {
      usageDate: today,
      patientId,
      bagId,
      employeeId: getEmployeeId()
    });
    await loadPatients();
    alert('บันทึกการจ่ายเลือดเรียบร้อยแล้ว');
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  }
}

function setTableState(html) {
  patientTableBody.innerHTML = html;
}

async function loadPatients() {
  setTableState('<tr><td class="empty-state" colspan="5"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...</td></tr>');
  try {
    allPatients = await apiGet('/api/patients');
    renderPatients();
  } catch (err) {
    setTableState(`<tr><td class="empty-state" colspan="5">เกิดข้อผิดพลาด: ${err.message}</td></tr>`);
  }
}

[searchInput, bloodFilter, statusFilter].forEach(el => {
  el.addEventListener('input', renderPatients);
  el.addEventListener('change', renderPatients);
});

loadPatients();
