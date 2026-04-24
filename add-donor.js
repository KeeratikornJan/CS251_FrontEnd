const STORAGE_KEY = "bloodbank_donors";

const donorForm = document.querySelector("#donorForm");

function getDonors() {
  const donors = localStorage.getItem(STORAGE_KEY);

  if (!donors) return [];

  try {
    return JSON.parse(donors);
  } catch (error) {
    return [];
  }
}

function saveDonors(donors) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donors));
}

function generateDonorId(donors) {
  const donorNumbers = donors
    .map((donor) => Number(String(donor.id).replace("DON-", "")))
    .filter((number) => Number.isFinite(number));

  const nextNumber = donorNumbers.length > 0 ? Math.max(...donorNumbers) + 1 : 12345;
  return `DON-${String(nextNumber).padStart(5, "0")}`;
}

donorForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(donorForm);
  const donors = getDonors();
  const bloodGroup = formData.get("bloodGroup");
  const rhFactor = formData.get("rhFactor");

  const newDonor = {
    id: generateDonorId(donors),
    name: formData.get("fullName"),
    group: `${bloodGroup}${rhFactor}`,
    lastDonate: "-",
    status: "ผู้บริจาคใหม่",
    profile: {
      citizenId: formData.get("citizenId"),
      gender: formData.get("gender"),
      birthDate: formData.get("birthDate"),
      phone: formData.get("phone"),
      username: formData.get("username"),
      email: formData.get("email"),
      address: formData.get("address"),
      disease: formData.get("disease")
    }
  };

  donors.unshift(newDonor);
  saveDonors(donors);

  alert("บันทึกข้อมูลผู้บริจาคเรียบร้อยแล้ว");
  window.location.href = "donor-management.html";
});
