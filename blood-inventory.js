const STORAGE_KEY = "bloodbank_bags";

const defaultBags = [
  { id: "BAG-A23001", component: "PRC", group: "O+", receivedDate: "15 ม.ค. 2569", expiryDate: "19 ก.พ. 2569", volume: 450, status: "พร้อมใช้งาน", donationId: "DON-12347" },
  { id: "BAG-B23049", component: "Platelets", group: "A+", receivedDate: "1 เม.ย. 2569", expiryDate: "6 เม.ย. 2569", volume: 450, status: "ถูกจอง", donationId: "DON-12346" },
  { id: "BAG-C99822", component: "FFP", group: "B+", receivedDate: "20 ธ.ค. 2568", expiryDate: "20 ธ.ค. 2569", volume: 450, status: "พร้อมใช้งาน", donationId: "DON-12345" },
  { id: "BAG-D5555", component: "Whole Blood", group: "AB-", receivedDate: "21 ก.พ. 2569", expiryDate: "28 มี.ค. 2569", volume: 450, status: "รอทำลาย", donationId: "DON-12349" }
];

const searchInput = document.querySelector("#searchInput");
const bloodFilter = document.querySelector("#bloodFilter");
const componentFilter = document.querySelector("#componentFilter");
const statusFilter = document.querySelector("#statusFilter");
const bagTableBody = document.querySelector("#bagTableBody");

function getBags() {
  const bags = localStorage.getItem(STORAGE_KEY);

  if (!bags) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBags));
    return defaultBags;
  }

  try {
    return JSON.parse(bags);
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBags));
    return defaultBags;
  }
}

function getStatusClass(status) {
  if (status === "ถูกจอง") return "reserved";
  if (status === "รอทำลาย") return "discard";
  return "ready";
}

function renderBags() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedBlood = bloodFilter.value;
  const selectedComponent = componentFilter.value;
  const selectedStatus = statusFilter.value;

  const filteredBags = getBags().filter((bag) => {
    const bagGroup = bag.group.replace(/[+-]/g, "");
    const matchesSearch = bag.id.toLowerCase().includes(keyword);
    const matchesBlood = selectedBlood === "all" || bagGroup === selectedBlood;
    const matchesComponent = selectedComponent === "all" || bag.component === selectedComponent;
    const matchesStatus = selectedStatus === "all" || bag.status === selectedStatus;

    return matchesSearch && matchesBlood && matchesComponent && matchesStatus;
  });

  if (filteredBags.length === 0) {
    bagTableBody.innerHTML = '<tr><td class="empty-state" colspan="7">ไม่พบข้อมูลถุงเลือด</td></tr>';
    return;
  }

  bagTableBody.innerHTML = filteredBags
    .map((bag) => `
      <tr>
        <td><a class="bag-link" href="blood-bag-detail.html?id=${encodeURIComponent(bag.id)}">${bag.id.replace("-", "-<br>")}</a></td>
        <td>${bag.component}</td>
        <td>${bag.group}</td>
        <td>${bag.receivedDate}</td>
        <td>${bag.expiryDate}</td>
        <td><span class="status ${getStatusClass(bag.status)}">${bag.status}</span></td>
        <td>
          <a class="detail-btn" href="blood-bag-detail.html?id=${encodeURIComponent(bag.id)}" title="ดูรายละเอียด">
            <i class="fa-solid fa-angles-right"></i>
          </a>
        </td>
      </tr>
    `)
    .join("");
}

[searchInput, bloodFilter, componentFilter, statusFilter].forEach((element) => {
  element.addEventListener("input", renderBags);
  element.addEventListener("change", renderBags);
});

renderBags();
