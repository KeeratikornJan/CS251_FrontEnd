const bagIdEl       = document.querySelector('#bagId');
const donationIdEl  = document.querySelector('#donationId');
const bagStatusEl   = document.querySelector('#bagStatus');
const componentEl   = document.querySelector('#component');
const bloodGroupEl  = document.querySelector('#bloodGroup');
const receivedDateEl = document.querySelector('#receivedDate');
const expiryDateEl  = document.querySelector('#expiryDate');
const discardBtn    = document.querySelector('#discardBtn');

let currentBag = null;

function getUrlBagId() {
  return parseInt(new URLSearchParams(window.location.search).get('id'));
}

function getComponentLabel(type) {
  const labels = {
    PRC: 'Packed Red Cell (PRC)',
    Platelets: 'Platelets',
    FFP: 'Fresh Frozen Plasma (FFP)',
    'Whole Blood': 'Whole Blood'
  };
  return labels[type] || type || '-';
}

function getRhLabel(rh) {
  return rh === '+' ? 'Positive (+)' : 'Negative (-)';
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

function formatBagId(id) {
  return `BAG-${String(id).padStart(6, '0')}`;
}

function renderBag(bag) {
  currentBag = bag;
  bagIdEl.textContent       = formatBagId(bag.bagId);
  donationIdEl.textContent  = `DON-REF-${bag.donationId ?? bag.bagId}`;
  bagStatusEl.textContent   = mapBagStatus(bag.bagStatus);
  bagStatusEl.className     = `status ${getBagStatusClass(bag.bagStatus)}`;
  componentEl.textContent   = getComponentLabel(bag.componentType);
  bloodGroupEl.textContent  = `${bag.bloodGroup} / ${getRhLabel(bag.rhFactor)}`;
  receivedDateEl.textContent = formatThaiDate(bag.collectionDate);
  expiryDateEl.textContent  = formatThaiDate(bag.expiryDate);

  // Highlight expiry if available and near expiry
  const expiryBox = expiryDateEl.closest('.info-box');
  if (expiryBox && bag.bagStatus === 0 && bag.expiryDate) {
    const daysLeft = Math.ceil(
      (new Date(bag.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 7) expiryBox.classList.add('warning');
  }

  // Disable match/reserve buttons if bag is not available
  const matchBtn   = document.querySelector('.manage-btn.match');
  const reserveBtn = document.querySelector('.manage-btn.reserve');
  if (bag.bagStatus !== 0) {
    if (matchBtn)   { matchBtn.disabled = true;   matchBtn.title = 'ถุงเลือดนี้ไม่พร้อมใช้งาน'; }
    if (reserveBtn) { reserveBtn.disabled = true; reserveBtn.title = 'ถุงเลือดนี้ไม่พร้อมใช้งาน'; }
  }
}

function showError(msg) {
  bagIdEl.textContent       = 'ไม่พบข้อมูล';
  donationIdEl.textContent  = '-';
  bagStatusEl.textContent   = '-';
  componentEl.textContent   = msg;
  bloodGroupEl.textContent  = '-';
  receivedDateEl.textContent = '-';
  expiryDateEl.textContent  = '-';
}

async function loadBag() {
  const bagId = getUrlBagId();
  if (!bagId || isNaN(bagId)) { showError('รหัสถุงเลือดไม่ถูกต้อง'); return; }
  try {
    const bags = await apiGet('/api/blood/bags');
    const bag  = bags.find(b => b.bagId === bagId);
    if (!bag) { showError(`ไม่พบถุงเลือดรหัส ${bagId}`); return; }
    renderBag(bag);
  } catch (err) {
    showError(`เกิดข้อผิดพลาด: ${err.message}`);
  }
}

// ── Matching / Issue ─────────────────────────────────────────────────────────
document.querySelector('.manage-btn.match')?.addEventListener('click', async () => {
  if (!currentBag) return;

  // Guard: bag must be available
  if (currentBag.bagStatus !== 0) {
    alert(`ไม่สามารถจับคู่ได้\n\nสถานะปัจจุบัน: "${mapBagStatus(currentBag.bagStatus)}"\nถุงเลือดต้องมีสถานะ "พร้อมใช้งาน" เท่านั้น`);
    return;
  }

  const patientIdRaw = prompt('กรุณาระบุรหัสผู้ป่วย (ตัวเลข เช่น 9001):');
  if (patientIdRaw === null) return;
  const patientId = parseInt(patientIdRaw.trim());
  if (!patientId || isNaN(patientId)) {
    alert('รหัสผู้ป่วยไม่ถูกต้อง กรุณาระบุเป็นตัวเลข');
    return;
  }

  // Validate patient exists and check blood compatibility
  let patient;
  try {
    patient = await apiGet(`/api/patients/${patientId}`);
  } catch {
    alert(`ไม่พบผู้ป่วยรหัส PAT-${String(patientId).padStart(5, '0')}\n\nกรุณาตรวจสอบรหัสผู้ป่วยอีกครั้ง`);
    return;
  }

  const bagType = `${currentBag.bloodGroup}${currentBag.rhFactor}`;
  const patType = `${patient.bloodGroup}${patient.rhFactor}`;
  const compatible = (currentBag.bloodGroup === patient.bloodGroup) &&
                     (currentBag.rhFactor    === patient.rhFactor);

  const confirmMsg = compatible
    ? `ยืนยันการจ่ายเลือด?\n\n` +
      `ผู้ป่วย : ${patient.name} (PAT-${String(patientId).padStart(5,'0')})\n` +
      `กรุ๊ปเลือดผู้ป่วย : ${patType}\n` +
      `กรุ๊ปเลือดถุง     : ${bagType}  ✓ ตรงกัน`
    : `⚠️  คำเตือน: กรุ๊ปเลือดไม่ตรงกัน!\n\n` +
      `ถุงเลือด  : ${bagType}\n` +
      `ผู้ป่วย   : ${patient.name} — ${patType}\n\n` +
      `ยังคงดำเนินการต่อหรือไม่?\n(กรุณาได้รับการยืนยันจากแพทย์ก่อน)`;

  if (!confirm(confirmMsg)) return;

  try {
    await apiPost('/api/blood/usage', {
      usageDate:  new Date().toISOString().split('T')[0],
      patientId,
      bagId:      currentBag.bagId,
      employeeId: getEmployeeId()
    });
    alert(
      `บันทึกการจ่ายเลือดเรียบร้อยแล้ว\n\n` +
      `ถุงเลือด : ${formatBagId(currentBag.bagId)}\n` +
      `ผู้ป่วย  : ${patient.name}\n` +
      `สถานะถุกเลือด → "ใช้แล้ว"`
    );
    await loadBag();
  } catch (err) {
    alert(`บันทึกไม่สำเร็จ: ${err.message}`);
  }
});

// ── Reserve ──────────────────────────────────────────────────────────────────
document.querySelector('.manage-btn.reserve')?.addEventListener('click', () => {
  alert('ฟังก์ชันจองยังไม่รองรับโดยตรงผ่าน API\nกรุณาติดต่อผู้ดูแลระบบ');
});

// ── Discard ──────────────────────────────────────────────────────────────────
discardBtn?.addEventListener('click', async () => {
  if (!currentBag) return;
  if (currentBag.bagStatus === 2) {
    alert('ถุงเลือดนี้ถูกใช้งานแล้ว ไม่สามารถทำลายได้');
    return;
  }
  if (currentBag.bagStatus === 3) {
    alert('ถุงเลือดนี้ถูกทำลายไปแล้ว');
    return;
  }

  const bagLabel = formatBagId(currentBag.bagId);
  if (!confirm(
    `ยืนยันการทำลายถุงเลือด ${bagLabel}?\n\n` +
    `ถุงเลือดจะถูกตั้งสถานะเป็น "รอทำลาย" และไม่สามารถนำกลับมาใช้งานได้อีก`
  )) return;

  try {
    await apiPatch(`/api/blood/bags/${currentBag.bagId}/discard`, {});
    alert(`ถุงเลือด ${bagLabel} ถูกตั้งสถานะ "รอทำลาย" เรียบร้อยแล้ว`);
    await loadBag();
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  }
});

loadBag();
