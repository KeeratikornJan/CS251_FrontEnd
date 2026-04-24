const STORAGE_KEY = "bloodbank_donors";

const defaultDonors = [
  { id: "DON-12345", name: "ศุภณี สว่างวงศ์", group: "A+", lastDonate: "12 มิ.ย. 2568", status: "ปกติ" },
  { id: "DON-12346", name: "พิเชษฐ์ ธีรเดชสกุลวงศ์", group: "B+", lastDonate: "17 เม.ย. 2568", status: "ปกติ" },
  { id: "DON-12347", name: "ชยธร โตระรัตนประดิษฐ์", group: "O+", lastDonate: "22 ม.ค. 2569", status: "ปกติ", highlight: true },
  { id: "DON-12348", name: "ธนัท ด่านเจษฎา", group: "AB-", lastDonate: "12 ก.ย. 2568", status: "ปกติ" },
  { id: "DON-12349", name: "จักรภัทร แก้วพันธุ์พงษ์", group: "B-", lastDonate: "16 มี.ค. 2569", status: "ระงับ" },
  { id: "DON-12350", name: "รพีพงศ์ ศุภธีภัตตเตชา", group: "A-", lastDonate: "3 พ.ค. 2568", status: "ปกติ" },
  { id: "DON-12351", name: "พนรรรม หรรษา", group: "O-", lastDonate: "-", status: "ผู้บริจาคใหม่" }
];

const searchInput = document.querySelector("#searchInput");
const bloodFilter = document.querySelector("#bloodFilter");
const statusFilter = document.querySelector("#statusFilter");
const donorTableBody = document.querySelector("#donorTableBody");

function getDonors() {
  const donors = localStorage.getItem(STORAGE_KEY);

  if (!donors) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDonors));
    return defaultDonors;
  }

  try {
    return JSON.parse(donors);
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDonors));
    return defaultDonors;
  }
}

function getStatusClass(status) {
  if (status === "ระงับ") return "suspended";
  if (status === "ผู้บริจาคใหม่") return "new";
  return "normal";
}

function getActionIcon(status) {
  if (status === "ระงับ") {
    return '<i class="fa-solid fa-check"></i>';
  }

  return '<i class="fa-solid fa-ban"></i>';
}

function renderDonors() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedBlood = bloodFilter.value;
  const selectedStatus = statusFilter.value;

  const filteredDonors = getDonors().filter((donor) => {
    const donorGroup = donor.group.replace(/[+-]/g, "");
    const matchesSearch =
      donor.id.toLowerCase().includes(keyword) ||
      donor.name.toLowerCase().includes(keyword);
    const matchesBlood = selectedBlood === "all" || donorGroup === selectedBlood;
    const matchesStatus = selectedStatus === "all" || donor.status === selectedStatus;

    return matchesSearch && matchesBlood && matchesStatus;
  });

  if (filteredDonors.length === 0) {
    donorTableBody.innerHTML = '<tr><td class="empty-state" colspan="6">ไม่พบข้อมูลผู้บริจาค</td></tr>';
    return;
  }

  donorTableBody.innerHTML = filteredDonors
    .map((donor) => {
      const displayStatus = donor.status === "ระงับ" ? "ระงับ (มีอาการไว)" : donor.status;

      return `
        <tr class="${donor.highlight ? "highlight" : ""}">
          <td>${donor.id}</td>
          <td>${donor.name}</td>
          <td>${donor.group}</td>
          <td>${donor.lastDonate}</td>
          <td><span class="status ${getStatusClass(donor.status)}">${displayStatus}</span></td>
          <td>
            <div class="actions">
              <button class="action-btn" type="button" title="แก้ไข">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="action-btn danger" type="button" title="เปลี่ยนสถานะ">
                ${getActionIcon(donor.status)}
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

[searchInput, bloodFilter, statusFilter].forEach((element) => {
  element.addEventListener("input", renderDonors);
  element.addEventListener("change", renderDonors);
});

renderDonors();
