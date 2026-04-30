const donorForm = document.querySelector('#donorForm');
const submitBtn = donorForm.querySelector('.submit-btn');

function mapGender(thaiGender) {
  if (thaiGender === 'ชาย') return 'M';
  if (thaiGender === 'หญิง') return 'F';
  return 'M';
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? 'กำลังบันทึก...' : 'บันทึกผู้บริจาค';
}

donorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fd = new FormData(donorForm);

  const nationalId = fd.get('citizenId').replace(/[-\s]/g, '');
  if (nationalId.length !== 13) {
    alert('กรุณากรอกเลขบัตรประชาชน 13 หลัก');
    return;
  }

  const password = fd.get('password');
  if (password.length < 6) {
    alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    return;
  }

  const body = {
    name: fd.get('fullName'),
    nationalId,
    gender: mapGender(fd.get('gender')),
    birthday: fd.get('birthDate'),
    bloodGroup: fd.get('bloodGroup'),
    rhFactor: fd.get('rhFactor'),
    congenitalDisease: fd.get('disease') || 'ไม่มี',
    email: fd.get('email'),
    phone: fd.get('phone'),
    place: fd.get('address') || '',
    username: fd.get('username'),
    password
  };

  setLoading(true);
  try {
    const donorId = await apiPost('/api/donors/register', body);
    alert(`บันทึกผู้บริจาคเรียบร้อยแล้ว (Donor ID: ${donorId})`);
    window.location.href = 'donor-management.html';
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
    setLoading(false);
  }
});
