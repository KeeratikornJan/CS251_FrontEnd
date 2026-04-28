const bagIdEl = document.querySelector('#bagId');
const donationIdEl = document.querySelector('#donationId');
const bagStatusEl = document.querySelector('#bagStatus');
const componentEl = document.querySelector('#component');
const bloodGroupEl = document.querySelector('#bloodGroup');
const receivedDateEl = document.querySelector('#receivedDate');
const expiryDateEl = document.querySelector('#expiryDate');
const discardBtn = document.querySelector('#discardBtn');

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
  const map = { 0: 'พร้อมใช้งาน', 1: 'ถูกจอง', 2: 'ใช้แล้ว', 3: 'รอทำลาย' };
  return map[status] ?? 'ไม่ทราบสถานะ';
}

function getBagStatusClass(status) {
  if (status === 1) return 'reserved';
  if (status === 3 || status === 2) return 'discard';
  return 'ready';
}

function formatBagId(id) {
  return `BAG-${String(id).padStart(5, '0')}`;
}

function renderBag(bag) {
  currentBag = bag;
  bagIdEl.textContent = formatBagId(bag.bagId);
  donationIdEl.textContent = `BAG-${bag.bagId}`;
  bagStatusEl.textContent = mapBagStatus(bag.bagStatus);
  bagStatusEl.className = `status ${getBagStatusClass(bag.bagStatus)}`;
  componentEl.textContent = getComponentLabel(bag.componentType);
  bloodGroupEl.textContent = `${bag.bloodGroup} / ${getRhLabel(bag.rhFactor)}`;
  receivedDateEl.textContent = formatThaiDate(bag.collectionDate);
  expiryDateEl.textContent = formatThaiDate(bag.expiryDate);

  // Highlight expiry date if bag is available and near expiry
  const expiryEl = expiryDateEl.closest('.info-box');
  if (expiryEl && bag.bagStatus === 0 && bag.expiryDate) {
    const daysLeft = Math.ceil(
      (new Date(bag.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 7) expiryEl.classList.add('warning');
  }
}

function showError(msg) {
  bagIdEl.textContent = 'ไม่พบข้อมูล';
  donationIdEl.textContent = '-';
  bagStatusEl.textContent = '-';
  componentEl.textContent = msg;
  bloodGroupEl.textContent = '-';
  receivedDateEl.textContent = '-';
  expiryDateEl.textContent = '-';
}

async function loadBag() {
  const bagId = getUrlBagId();
  if (!bagId || isNaN(bagId)) {
    showError('รหัสถุงเลือดไม่ถูกต้อง');
    return;
  }
  try {
    const bags = await apiGet('/api/blood/bags');
    const bag = bags.find(b => b.bagId === bagId);
    if (!bag) {
      showError(`ไม่พบถุงเลือดรหัส ${bagId}`);
      return;
    }
    renderBag(bag);
  } catch (err) {
    showError(`เกิดข้อผิดพลาด: ${err.message}`);
  }
}

// Matching / Issue: record blood usage
document.querySelector('.manage-btn.match')?.addEventListener('click', async () => {
  if (!currentBag) return;
  const patientIdRaw = prompt('กรุณาระบุรหัสผู้ป่วย (Patient ID, ตัวเลข):');
  if (patientIdRaw === null) return;
  const patientId = parseInt(patientIdRaw);
  if (!patientId || isNaN(patientId)) {
    alert('รหัสผู้ป่วยไม่ถูกต้อง');
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  try {
    await apiPost('/api/blood/usage', {
      usageDate: today,
      patientId,
      bagId: currentBag.bagId,
      employeeId: getEmployeeId()
    });
    alert('บันทึกการจ่ายเลือดเรียบร้อยแล้ว');
    await loadBag();
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  }
});

// Reserve: not directly supported by API
document.querySelector('.manage-btn.reserve')?.addEventListener('click', () => {
  alert('ฟังก์ชันจองยังไม่รองรับโดยตรงผ่าน API\nกรุณาติดต่อผู้ดูแลระบบ');
});

// Discard: not directly supported by API
discardBtn?.addEventListener('click', () => {
  alert('ฟังก์ชันทำลายถุงเลือดยังไม่รองรับโดยตรงผ่าน API\nกรุณาติดต่อผู้ดูแลระบบ');
});

loadBag();
