const STORAGE_KEY = "bloodbank_patients";

const patientForm = document.querySelector("#patientForm");

function getPatients() {
  const patients = localStorage.getItem(STORAGE_KEY);

  if (!patients) return [];

  try {
    return JSON.parse(patients);
  } catch (error) {
    return [];
  }
}

function savePatients(patients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

function generatePatientId(patients) {
  const patientNumbers = patients
    .map((patient) => Number(String(patient.id).replace("PAT-", "")))
    .filter((number) => Number.isFinite(number));

  const nextNumber = patientNumbers.length > 0 ? Math.max(...patientNumbers) + 1 : 88123;
  return `PAT-${String(nextNumber).padStart(5, "0")}`;
}

patientForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(patientForm);
  const patients = getPatients();
  const patientCode = formData.get("patientCode").trim();
  const bloodGroup = formData.get("bloodGroup");
  const rhFactor = formData.get("rhFactor");

  const newPatient = {
    id: patientCode || generatePatientId(patients),
    name: formData.get("fullName"),
    group: `${bloodGroup}${rhFactor}`,
    status: formData.get("urgency"),
    units: Number(formData.get("units")),
    profile: {
      citizenId: formData.get("citizenId"),
      gender: formData.get("gender"),
      birthDate: formData.get("birthDate"),
      doctor: formData.get("doctor")
    }
  };

  patients.unshift(newPatient);
  savePatients(patients);

  alert("บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว");
  window.location.href = "patient-management.html";
});
