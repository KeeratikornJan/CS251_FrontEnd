const bloodBagForm = document.querySelector('#bloodBagForm');
const linkDonationBtn = document.querySelector('#linkDonationBtn');
const donationInput = document.querySelector('#donationInput');
const donorNameEl = document.querySelector('#donorName');
const donorBloodEl = document.querySelector('#donorBlood');
const submitBtn = bloodBagForm.querySelector('.submit-btn');

let linkedDonorId = null;

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? 'กำลังบันทึก...' : 'บันทึกถุงเลือด';
}

linkDonationBtn.addEventListener('click', async () => {
  const raw = donationInput.value.trim();
  const donorId = parseInt(raw);

  if (!raw || isNaN(donorId)) {
    alert('กรุณาระบุรหัสผู้บริจาค (ตัวเลข)');
    return;
  }

  linkDonationBtn.disabled = true;
  linkDonationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังค้นหา...';

  try {
    const profile = await apiGet(`/api/donors/${donorId}/profile`);
    linkedDonorId = donorId;
    donorNameEl.textContent = `คุณ${profile.name} (DON-${String(profile.donorId).padStart(5, '0')})`;
    donorBloodEl.textContent = `${profile.bloodGroup}${profile.rhFactor} (รอผลยืนยันห้องแล็บ)`;
  } catch (err) {
    alert(`ไม่พบผู้บริจาครหัส ${donorId}: ${err.message}`);
    linkedDonorId = null;
    donorNameEl.textContent = 'ไม่พบข้อมูล';
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

  const fd = new FormData(bloodBagForm);
  const donationDate = fd.get('receivedDate');
  const volume = parseInt(fd.get('volume'));

  if (!donationDate) {
    alert('กรุณาระบุวันที่ถ่ายเติม');
    return;
  }
  if (!volume || volume <= 0) {
    alert('กรุณาระบุปริมาณบรรจุที่ถูกต้อง');
    return;
  }

  const body = {
    donationDate,
    volume,
    donorId: linkedDonorId,
    employeeId: getEmployeeId()
  };

  setLoading(true);
  try {
    const donationId = await apiPost('/api/blood/donations', body);
    alert(`บันทึกการรับบริจาคเรียบร้อยแล้ว (Donation ID: ${donationId})`);
    window.location.href = 'blood-inventory.html';
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
    setLoading(false);
  }
});
