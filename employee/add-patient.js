const patientForm = document.querySelector('#patientForm');
const submitBtn = patientForm.querySelector('.submit-btn');

function mapGender(thaiGender) {
  if (thaiGender === 'ชาย') return 'M';
  if (thaiGender === 'หญิง') return 'F';
  return null;
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

  if (!fd.get('fullName')?.trim()) {
    alert('กรุณากรอกชื่อ-นามสกุล');
    return;
  }

  const gender = mapGender(fd.get('gender'));
  if (!gender) {
    alert('กรุณาเลือกเพศ');
    return;
  }

  if (!fd.get('birthDate')) {
    alert('กรุณาระบุวันเกิด');
    return;
  }

  if (!fd.get('bloodGroup')) {
    alert('กรุณาเลือกกรุ๊ปเลือด');
    return;
  }

  if (!fd.get('rhFactor')) {
    alert('กรุณาเลือก Rh Factor');
    return;
  }

  const body = {
    nationalId,
    name:             fd.get('fullName').trim(),
    gender,
    bloodGroup:       fd.get('bloodGroup'),
    rhFactor:         fd.get('rhFactor'),
    birthday:         fd.get('birthDate'),
    transfusionStatus: fd.get('urgency') || null
  };

  setLoading(true);
  try {
    const patientId = await apiPost('/api/patients', body);
    const label = `PAT-${String(patientId).padStart(5, '0')}`;
    alert(`บันทึกผู้ป่วยเรียบร้อยแล้ว\n\nรหัสผู้ป่วยใหม่: ${label}`);
    window.location.href = 'patient-management.html';
  } catch (err) {
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
    setLoading(false);
  }
});
