const STORAGE_KEY = "bloodbank_patients";

const defaultPatients = [
  { id: "PAT-88123", name: "รชานันท์ มหาวรรณี", group: "AB+", status: "ขอรับเลือดด่วน", units: 2 },
  { id: "PAT-88124", name: "พงศกร อุดมโภชน์", group: "B-", status: "จองเลือดล่วงหน้า", units: 1 },
  { id: "PAT-88125", name: "ชานนท์ เมธานี โกลส์", group: "O+", status: "ขอรับเลือดด่วน", units: 1 },
  { id: "PAT-88126", name: "ทิพนารี วีรวัฒโนดม", group: "A+", status: "จองเลือดล่วงหน้า", units: 1 },
  { id: "PAT-88127", name: "รัตนวดี วงศ์กอง", group: "B+", status: "ขอรับเลือดด่วน", units: 1 },
  { id: "PAT-88128", name: "จุมพล อุลกิตติพร", group: "AB-", status: "ได้รับเลือดแล้ว", units: 0 },
  { id: "PAT-88129", name: "อรรณพัชร์ พูลสวัสดิ์", group: "O-", status: "ได้รับเลือดแล้ว", units: 0 }
];

const searchInput = document.querySelector("#searchInput");
const bloodFilter = document.querySelector("#bloodFilter");
const statusFilter = document.querySelector("#statusFilter");
const patientTableBody = document.querySelector("#patientTableBody");

function getPatients() {
  const patients = localStorage.getItem(STORAGE_KEY);

  if (!patients) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPatients));
    return defaultPatients;
  }

  try {
    return JSON.parse(patients);
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPatients));
    return defaultPatients;
  }
}

function getStatusClass(status) {
  if (status === "ขอรับเลือดด่วน") return "urgent";
  if (status === "จองเลือดล่วงหน้า") return "reserved";
  return "completed";
}

function getStatusText(patient) {
  if (patient.status === "ได้รับเลือดแล้ว") return patient.status;
  return `${patient.status} (${patient.units} ยูนิต)`;
}

function renderPatients() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedBlood = bloodFilter.value;
  const selectedStatus = statusFilter.value;

  const filteredPatients = getPatients().filter((patient) => {
    const patientGroup = patient.group.replace(/[+-]/g, "");
    const matchesSearch =
      patient.id.toLowerCase().includes(keyword) ||
      patient.name.toLowerCase().includes(keyword);
    const matchesBlood = selectedBlood === "all" || patientGroup === selectedBlood;
    const matchesStatus = selectedStatus === "all" || patient.status === selectedStatus;

    return matchesSearch && matchesBlood && matchesStatus;
  });

  if (filteredPatients.length === 0) {
    patientTableBody.innerHTML = '<tr><td class="empty-state" colspan="5">ไม่พบข้อมูลผู้ป่วย</td></tr>';
    return;
  }

  patientTableBody.innerHTML = filteredPatients
    .map((patient) => {
      const canDispatch = patient.status !== "ได้รับเลือดแล้ว";

      return `
        <tr>
          <td>${patient.id}</td>
          <td>${patient.name}</td>
          <td>${patient.group}</td>
          <td><span class="request-status ${getStatusClass(patient.status)}">${getStatusText(patient)}</span></td>
          <td>
            <div class="actions">
              ${canDispatch ? `
                <button class="action-btn dispatch" type="button" title="จ่ายเลือด">
                  <i class="fa-solid fa-truck-medical"></i>
                </button>
              ` : ""}
              <button class="action-btn" type="button" title="แก้ไข">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

[searchInput, bloodFilter, statusFilter].forEach((element) => {
  element.addEventListener("input", renderPatients);
  element.addEventListener("change", renderPatients);
});

renderPatients();
