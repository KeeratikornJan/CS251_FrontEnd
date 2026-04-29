let currentPatient = null;
let selectedBagId  = null;

const patientIdInput = document.getElementById('patientIdInput');
const searchBtn      = document.getElementById('searchBtn');
const patientInfo    = document.getElementById('patientInfo');
const bagsSection    = document.getElementById('bagsSection');
const bagList        = document.getElementById('bagList');
const confirmRow     = document.getElementById('confirmRow');
const confirmBtn     = document.getElementById('confirmBtn');
const msgBox         = document.getElementById('msgBox');

function parsePatientId(raw) {
  const str = raw.trim().toUpperCase().replace(/^PAT-?0*/, '');
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}

function showMsg(text, type) {
  msgBox.textContent = text;
  msgBox.className = `msg-box ${type}`;
}

function hideMsg() { msgBox.className = 'msg-box hidden'; }

function reset() {
  currentPatient = null;
  selectedBagId = null;
  patientInfo.classList.add('hidden');
  bagsSection.classList.add('hidden');
  confirmRow.classList.add('hidden');
  bagList.innerHTML = '';
  hideMsg();
}

async function handleSearch() {
  reset();
  const patientId = parsePatientId(patientIdInput.value);
  if (!patientId) { showMsg('กรุณากรอกรหัสผู้ป่วยให้ถูกต้อง (เช่น PAT-12345)', 'error'); return; }

  searchBtn.disabled = true;
  searchBtn.textContent = 'กำลังค้นหา...';

  try {
    const patient = await apiGet(`/api/patients/${patientId}`);
    currentPatient = patient;

    document.getElementById('patientName').textContent = patient.name || '—';
    const bg    = patient.bloodGroup  || '';
    const rh    = patient.rhFactor    || '+';  // DB stores '+'/'-'
    const comp  = patient.transfusionStatus || '';
    document.getElementById('bloodNeed').textContent =
      `${bg}${rh} ${comp}`;

    patientInfo.classList.remove('hidden');

    // Load matching bags — DB RhFactor column is '+'/'-' (CHAR(1))
    if (bg) {
      const bags = await apiGet(`/api/blood/bags/available?bloodGroup=${encodeURIComponent(bg)}&rhFactor=${encodeURIComponent(rh)}`);
      if (bags && bags.length > 0) {
        bagList.innerHTML = bags.map(b => {
          const bagLabel = `BAG-${String(b.bagId).padStart(6, '0')}`;
          return `<div class="bag-item" data-bag-id="${b.bagId}">
            <input type="radio" name="bag" id="bag${b.bagId}" value="${b.bagId}" />
            <label for="bag${b.bagId}">${bagLabel}</label>
          </div>`;
        }).join('');

        bagList.querySelectorAll('.bag-item').forEach(item => {
          item.addEventListener('click', () => {
            bagList.querySelectorAll('.bag-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            item.querySelector('input[type="radio"]').checked = true;
            selectedBagId = parseInt(item.dataset.bagId);
          });
        });

        bagsSection.classList.remove('hidden');
        confirmRow.classList.remove('hidden');
      } else {
        showMsg('ไม่มีถุงเลือดที่ตรงกับความต้องการในขณะนี้', 'error');
      }
    }
  } catch (err) {
    showMsg(`ไม่พบข้อมูลผู้ป่วย: ${err.message}`, 'error');
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  }
}

async function handleConfirm() {
  if (!currentPatient || !selectedBagId) {
    showMsg('กรุณาเลือกถุงเลือดก่อนยืนยัน', 'error');
    return;
  }
  hideMsg();
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'กำลังบันทึก...';

  const body = {
    usageDate:  new Date().toISOString().split('T')[0],
    patientId:  currentPatient.patientId,
    bagId:      selectedBagId,
    employeeId: getEmployeeId()
  };

  try {
    await apiPost('/api/blood/usage', body);
    showMsg('บันทึกการจ่ายเลือดเรียบร้อยแล้ว', 'success');
    patientInfo.classList.add('hidden');
    bagsSection.classList.add('hidden');
    confirmRow.classList.add('hidden');
    patientIdInput.value = '';
    currentPatient = null;
    selectedBagId = null;
  } catch (err) {
    showMsg(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'ยืนยันการจ่ายเลือด';
  }
}

searchBtn.addEventListener('click', handleSearch);
patientIdInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
confirmBtn.addEventListener('click', handleConfirm);
