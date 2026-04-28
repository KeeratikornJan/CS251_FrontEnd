const patientForm = document.querySelector('#patientForm');
const submitBtn = patientForm.querySelector('.submit-btn');

function mapGender(thaiGender) {
  if (thaiGender === 'ชาย') return 'M';
  if (thaiGender === 'หญิง') return 'F';
  return 'M';
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? 'กำลังบันทึก...' : 'บันทึกผู้ป่วย';
}

patientForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fd = new FormData(patientForm);

  const nationalId = fd.get('citizenId').replace(/[-\s]/g, '');
  if (nationalId.length !== 13) {
    alert('กรุณากรอกเลขบัตรประชาชน 13 หลัก');
    return;
  }

  const body = {
    nationalId,
    name: fd.get('fullName'),
    gender: mapGender(fd.get('gender')),
    bloodGroup: fd.get('bloodGroup'),
    rhFactor: fd.get('rhFactor'),
    birthday: fd.get('birthDate'),
    transfusionStatus: fd.get('urgency') || null
  };

  setLoading(true);
  try {
    const patientId = await apiPost('/api/patients', body);
    alert(`บันทึกผู้ป่วยเรียบร้อยแล้ว (Patient ID: ${patientId})`);
    window.location.href = 'patient-management.html';
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
    setLoading(false);
  }
});
