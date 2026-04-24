const STORAGE_KEY = "bloodbank_bags";

const defaultBag = {
  id: "BAG-A23001",
  component: "PRC",
  group: "O+",
  receivedDate: "15 ม.ค. 2569",
  expiryDate: "19 ก.พ. 2569",
  volume: 450,
  status: "พร้อมใช้งาน",
  donationId: "DON-12347"
};

const bagIdEl = document.querySelector("#bagId");
const donationIdEl = document.querySelector("#donationId");
const bagStatusEl = document.querySelector("#bagStatus");
const componentEl = document.querySelector("#component");
const bloodGroupEl = document.querySelector("#bloodGroup");
const receivedDateEl = document.querySelector("#receivedDate");
const expiryDateEl = document.querySelector("#expiryDate");
const discardBtn = document.querySelector("#discardBtn");

function getBags() {
  const bags = localStorage.getItem(STORAGE_KEY);

  if (!bags) return [defaultBag];

  try {
    return JSON.parse(bags);
  } catch (error) {
    return [defaultBag];
  }
}

function saveBags(bags) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bags));
}

function getCurrentBag() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return getBags().find((bag) => bag.id === id) || defaultBag;
}

function getComponentLabel(component) {
  const labels = {
    PRC: "Packed Red Cell (PRC)",
    Platelets: "Platelets",
    FFP: "Fresh Frozen Plasma (FFP)",
    "Whole Blood": "Whole Blood"
  };

  return labels[component] || component;
}

function getBloodLabel(group) {
  const blood = group.replace(/[+-]/g, "");
  const rh = group.includes("+") ? "Positive (+)" : "Negative (-)";
  return `${blood} / ${rh}`;
}

function getStatusClass(status) {
  if (status === "ถูกจอง") return "reserved";
  if (status === "รอทำลาย") return "discard";
  return "ready";
}

function renderBag() {
  const bag = getCurrentBag();

  bagIdEl.textContent = bag.id;
  donationIdEl.textContent = bag.donationId || "DON-12347";
  bagStatusEl.textContent = bag.status;
  bagStatusEl.className = `status ${getStatusClass(bag.status)}`;
  componentEl.textContent = getComponentLabel(bag.component);
  bloodGroupEl.textContent = getBloodLabel(bag.group);
  receivedDateEl.textContent = bag.receivedDate;
  expiryDateEl.textContent = bag.expiryDate;
}

discardBtn.addEventListener("click", () => {
  const bag = getCurrentBag();
  const bags = getBags().map((item) => (
    item.id === bag.id ? { ...item, status: "รอทำลาย" } : item
  ));

  saveBags(bags);
  renderBag();
  alert("เปลี่ยนสถานะถุงเลือดเป็นรอทำลายแล้ว");
});

renderBag();
