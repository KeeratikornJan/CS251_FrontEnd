const STORAGE_KEY = "bloodbank_bags";

const bloodBagForm = document.querySelector("#bloodBagForm");
const linkDonationBtn = document.querySelector("#linkDonationBtn");
const donationInput = document.querySelector("#donationInput");
const donorName = document.querySelector("#donorName");
const donorBlood = document.querySelector("#donorBlood");

const donorReferences = {
  "DONATION-12349": {
    name: "คุณจักรภัทร แก้วพันธุ์พงษ์ (DON-12349)",
    blood: "B- (รอเลือดยืนยัน)"
  },
  "DONATION-12347": {
    name: "คุณชยธร โตระรัตนประดิษฐ์ (DON-12347)",
    blood: "O / Positive (+)"
  }
};

function getBags() {
  const bags = localStorage.getItem(STORAGE_KEY);

  if (!bags) return [];

  try {
    return JSON.parse(bags);
  } catch (error) {
    return [];
  }
}

function saveBags(bags) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bags));
}

function formatThaiDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function getGroupFromText(text) {
  const match = text.match(/(AB|A|B|O)\s*\/?\s*(Positive \(\+\)|Negative \(-\)|[+-])/i);
  if (!match) return "B-";

  const rh = match[2].includes("+") || match[2].toLowerCase().includes("positive") ? "+" : "-";
  return `${match[1].toUpperCase()}${rh}`;
}

linkDonationBtn.addEventListener("click", () => {
  const reference = donorReferences[donationInput.value.trim().toUpperCase()] || donorReferences["DONATION-12349"];
  donorName.textContent = reference.name;
  donorBlood.textContent = reference.blood;
});

bloodBagForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(bloodBagForm);
  const bags = getBags();

  const newBag = {
    id: formData.get("bagId"),
    component: formData.get("component"),
    group: getGroupFromText(donorBlood.textContent),
    receivedDate: formatThaiDate(formData.get("receivedDate")),
    expiryDate: formatThaiDate(formData.get("expiryDate")),
    volume: Number(formData.get("volume")),
    status: "พร้อมใช้งาน",
    donationId: formData.get("donationId") || "DONATION-12349"
  };

  bags.unshift(newBag);
  saveBags(bags);

  alert("บันทึกข้อมูลถุงเลือดเรียบร้อยแล้ว");
  window.location.href = "blood-inventory.html";
});
