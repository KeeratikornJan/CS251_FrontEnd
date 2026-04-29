let selectedBagId  = null;
let savedDonorName = null;
let savedBagLabel  = null;

const donorIdInput   = document.getElementById('donorIdInput');
const searchBtn      = document.getElementById('searchBtn');
const donorCard      = document.getElementById('donorCard');
const testForm       = document.getElementById('testForm');
const msgBox         = document.getElementById('msgBox');
const submitBtn      = document.getElementById('submitBtn');
const successPanel   = document.getElementById('successPanel');
const successTitle   = document.getElementById('successTitle');
const successDetails = document.getElementById('successDetails');
const successStatus  = document.getElementById('successStatus');
const countdownEl    = document.getElementById('countdown');
const goNowBtn       = document.getElementById('goNowBtn');

function parseDonorId(raw) {
  const str = raw.trim().toUpperCase().replace(/^DON-?0*/, '');
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}

function showMsg(text, type) {
  msgBox.textContent = text;
  msgBox.className   = `msg-box ${type}`;
}

function hideMsg() { msgBox.className = 'msg-box hidden'; }

function updateDiseaseColors() {
  document.querySelectorAll('.disease-select').forEach(sel => {
    sel.classList.toggle('reactive', sel.value === 'Reactive');
  });
}

document.querySelectorAll('.disease-select').forEach(sel => {
  sel.addEventListener('change', updateDiseaseColors);
});

function showSuccessPanel(isAllNegative, donorName, bagLabel) {
  donorCard.classList.add('hidden');
  testForm.classList.add('hidden');
  hideMsg();

  successTitle.textContent = isAllNegative
    ? 'บันทึกผลการตรวจเรียบร้อยแล้ว'
    : 'บันทึกผล — พบการติดเชื้อ';

  successDetails.innerHTML =
    `ผู้บริจาค : <strong>${donorName}</strong><br>` +
    `ถุงเลือด  : <strong>${bagLabel}</strong>`;

  if (isAllNegative) {
    successStatus.textContent = '✓ ผลตรวจปกติทุกรายการ — ถุงเลือดพร้อมใช้งาน';
    successStatus.className   = 'success-status cleared';
  } else {
    successStatus.textContent = '✕ พบผลผิดปกติ — ถุงเลือดถูกตั้งค่ารอทบทวน';
    successStatus.className   = 'success-status reactive';
  }

  successPanel.classList.remove('hidden');

  // Countdown + auto-redirect
  let secs = 3;
  countdownEl.textContent = secs;
  const timer = setInterval(() => {
    secs--;
    countdownEl.textContent = secs;
    if (secs <= 0) {
      clearInterval(timer);
      window.location.href = 'blood-inventory.html';
    }
  }, 1000);

  goNowBtn.addEventListener('click', () => {
    clearInterval(timer);
    window.location.href = 'blood-inventory.html';
  }, { once: true });
}

async function handleSearch() {
  hideMsg();
  donorCard.classList.add('hidden');
  testForm.classList.add('hidden');
  successPanel.classList.add('hidden');
  selectedBagId = null;

  const donorId = parseDonorId(donorIdInput.value);
  if (!donorId) { showMsg('กรุณากรอกรหัสผู้บริจาคให้ถูกต้อง (เช่น DON-13579)', 'error'); return; }

  searchBtn.disabled    = true;
  searchBtn.textContent = 'กำลังค้นหา...';

  try {
    const [donor, bags] = await Promise.all([
      apiGet(`/api/donors/${donorId}/profile`),
      apiGet(`/api/blood/bags/by-donor/${donorId}`)
    ]);

    // Find the most recent bag that has NOT been tested yet (BagStatus = 0 or BagStatus = anything new)
    const bag = bags && bags.length > 0 ? bags[0] : null;

    savedDonorName = donor.name || '—';
    savedBagLabel  = bag ? `BAG-${String(bag.bagId).padStart(6, '0')}` : '—';

    document.getElementById('donorName').textContent      = savedDonorName;
    document.getElementById('collectionDate').textContent = bag ? formatThaiDate(bag.collectionDate) : '—';
    document.getElementById('bloodComponent').textContent = bag ? (bag.componentType || '—') : '—';

    // rhFactor from DB is '+' or '-'
    const rhLabel = donor.rhFactor === '+' ? 'Positive' : 'Negative';
    document.getElementById('bloodGroupDisplay').textContent =
      `${donor.bloodGroup || ''} (${rhLabel})`;

    // Pre-fill confirmatory selects
    const aboSel = document.getElementById('confirmatoryAbo');
    const rhSel  = document.getElementById('confirmatoryRh');
    if (donor.bloodGroup) aboSel.value = donor.bloodGroup;
    if (donor.rhFactor)   rhSel.value  = rhLabel;

    donorCard.classList.remove('hidden');

    if (bag) {
      selectedBagId = bag.bagId;
      testForm.classList.remove('hidden');
    } else {
      showMsg('ไม่พบถุงเลือดของผู้บริจาครายนี้', 'error');
    }
  } catch (err) {
    showMsg(`ไม่พบข้อมูล: ${err.message}`, 'error');
  } finally {
    searchBtn.disabled    = false;
    searchBtn.textContent = 'ค้นหาข้อมูล';
  }
}

async function handleSubmit() {
  if (!selectedBagId) return;
  hideMsg();
  submitBtn.disabled    = true;
  submitBtn.textContent = 'กำลังบันทึก...';

  const hivVal   = document.getElementById('hiv').value;
  const hbsagVal = document.getElementById('hbsag').value;
  const hcvVal   = document.getElementById('hcv').value;
  const vdrlVal  = document.getElementById('vdrl').value;

  const reactiveTests = [];
  if (hivVal   === 'Reactive') reactiveTests.push('HIV');
  if (hbsagVal === 'Reactive') reactiveTests.push('HBsAG');
  if (hcvVal   === 'Reactive') reactiveTests.push('HCV');
  if (vdrlVal  === 'Reactive') reactiveTests.push('VDRL');

  const isAllNegative   = reactiveTests.length === 0;
  const infectiousResult = isAllNegative
    ? 'Negative All'
    : 'Reactive: ' + reactiveTests.join(', ');

  // DB stores RhFactor as '+' or '-' (CHAR(1) with CHECK constraint)
  const rhDisplay = document.getElementById('confirmatoryRh').value;
  const rhChar    = rhDisplay === 'Positive' ? '+' : '-';

  const body = {
    infectiousDiseaseResult: infectiousResult,
    confirmatoryAbo: document.getElementById('confirmatoryAbo').value,
    confirmatoryRh:  rhChar,
    testDate: new Date().toISOString().split('T')[0],
    bagId: selectedBagId
  };

  try {
    await apiPost('/api/blood/tests', body);
    // Show prominent success panel with countdown
    showSuccessPanel(isAllNegative, savedDonorName, savedBagLabel);
    donorIdInput.value = '';
    selectedBagId = null;
  } catch (err) {
    showMsg(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'บันทึกผล';
  }
}

searchBtn.addEventListener('click', handleSearch);
donorIdInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
submitBtn.addEventListener('click', handleSubmit);
