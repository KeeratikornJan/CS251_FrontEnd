const bloodBagForm    = document.querySelector('#bloodBagForm');
const linkDonationBtn = document.querySelector('#linkDonationBtn');
const donationInput   = document.querySelector('#donationInput');
const donorNameEl     = document.querySelector('#donorName');
const donorBloodEl    = document.querySelector('#donorBlood');
const todayDisplay    = document.querySelector('#todayDisplay');
const submitBtn       = bloodBagForm.querySelector('.submit-btn');

let linkedDonorId    = null;
let linkedBloodGroup = null;
let linkedRhFactor   = null;

// Auto-set today's date on load
const TODAY = new Date().toISOString().split('T')[0];  // "YYYY-MM-DD"
const todayThai = (() => {
  const [y, m, d] = TODAY.split('-').map(Number);
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                  'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d} ${months[m - 1]} ${y + 543}`;
})();
if (todayDisplay) todayDisplay.textContent = todayThai;

function setLoading(loading) {
  submitBtn.disabled   = loading;
  submitBtn.textContent = loading ? 'กำลังบันทึก...' : 'บันทึกถุงเลือด';
}

linkDonationBtn.addEventListener('click', async () => {
  const raw     = donationInput.value.trim();
  const donorId = parseInt(raw);

  if (!raw || isNaN(donorId)) {
    alert('กรุณาระบุรหัสผู้บริจาค (ตัวเลข)');
    return;
  }

  linkDonationBtn.disabled = true;
  linkDonationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังค้นหา...';

  try {
    const profile    = await apiGet(`/api/donors/${donorId}/profile`);
    linkedDonorId    = donorId;
    linkedBloodGroup = profile.bloodGroup;
    linkedRhFactor   = profile.rhFactor;   // '+' or '-'
    donorNameEl.textContent = `คุณ${profile.name} (DON-${String(profile.donorId).padStart(5, '0')})`;
    donorBloodEl.textContent = `${profile.bloodGroup}${profile.rhFactor} (รอผลยืนยันห้องแล็บ)`;
  } catch (err) {
    alert(`ไม่พบผู้บริจาครหัส ${donorId}: ${err.message}`);
    linkedDonorId    = null;
    linkedBloodGroup = null;
    linkedRhFactor   = null;
    donorNameEl.textContent  = 'ไม่พบข้อมูล';
    donorBloodEl.textContent = '-';
  } finally {
    linkDonationBtn.disabled = false;
    linkDonationBtn.innerHTML = '<i class="fa-solid fa-link"></i> ดึงข้อมูล';
  }
});

bloodBagForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!linkedDonorId) {
    alert('กรุณาดึงข้อมูลผู้บริจาคก่อนบันทึก');
    return;
  }

  const fd         = new FormData(bloodBagForm);
  const expiryDate = fd.get('expiryDate');
  const component  = fd.get('component');
  const volume     = parseInt(fd.get('volume'));

  if (!expiryDate)             { alert('กรุณาระบุวันหมดอายุ'); return; }
  if (!component)              { alert('กรุณาเลือกประเภทส่วนประกอบ'); return; }
  if (!volume || volume <= 0)  { alert('กรุณาระบุปริมาณบรรจุที่ถูกต้อง'); return; }
  if (expiryDate <= TODAY)     { alert('วันหมดอายุต้องอยู่หลังวันนี้'); return; }

  const donationBody = {
    donationDate: TODAY,          // always today
    volume,
    donorId:    linkedDonorId,
    employeeId: getEmployeeId()
  };

  setLoading(true);
  try {
    // Step 1: create Donation record
    const donationId = await apiPost('/api/blood/donations', donationBody);

    // Step 2: create BloodBag record linked to that donation
    const bagBody = {
      componentType:  component,
      bloodGroup:     linkedBloodGroup,
      rhFactor:       linkedRhFactor,
      collectionDate: TODAY,       // collection date = today
      expiryDate,
      donationId
    };
    const bagId = await apiPost('/api/blood/bags', bagBody);

    const donorLabel = `DON-${String(linkedDonorId).padStart(5, '0')}`;
    const bagLabel   = bagId ? `BAG-${String(bagId).padStart(6, '0')}` : '—';

    alert(
      `บันทึกถุงเลือดเรียบร้อยแล้ว\n\n` +
      `รหัสผู้บริจาค  : ${donorLabel}\n` +
      `รหัสถุงเลือดใหม่: ${bagLabel}\n` +
      `วันที่บริจาค   : ${todayThai}`
    );
    window.location.href = 'blood-inventory.html';
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
    setLoading(false);
  }
});
