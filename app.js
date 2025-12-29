import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
const issueList = document.getElementById("issueList");
const form = document.getElementById("issueForm");
const reportBtn = document.getElementById("reportBtn");
const adminBtn = document.getElementById("adminBtn");
const reportSection = document.getElementById("reportSection");
const adminSection = document.getElementById("adminSection");
const adminKeyInput = document.getElementById("adminKey");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminStatusText = document.getElementById("adminStatus");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
reportBtn.onclick = () => {
  reportBtn.classList.add("active");
  adminBtn.classList.remove("active");
  reportSection.style.display = "block";
  adminSection.style.display = "none";
};

adminBtn.onclick=()=>{
  adminBtn.classList.add("active");
  reportBtn.classList.remove("active");
  adminSection.style.display="block";
  reportSection.style.display="none";
};
let isAdmin = false;
const ADMIN_SECRET = "KJS_ADMIN_2025";

adminLoginBtn.onclick = () => {
  if (adminKeyInput.value === ADMIN_SECRET) {
    isAdmin = true;
    adminStatusText.textContent = "Admin mode enabled";
    renderIssues();
  } else {
    alert("Invalid admin key");
  }
};

const issuesRef = collection(db, "issues");
let allIssues = [];


let map;
let markers = [];

window.initMap = function () {
  const kjsse = { lat: 19.0728, lng: 72.8994 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 16,
    center: kjsse
  });
  renderMapMarkers();
};
async function getCoordinatesFromLocation(locationText) 
{
  const query = encodeURIComponent(`${locationText}, KJ Somaiya College, Mumbai`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=YOUR_API_KEY`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status==="OK") 
  {
    return data.results[0].geometry.location;
  }
  return null;
}
async function loadIssues() {
  allIssues = [];
  issueList.innerHTML = "";
  const snapshot = await getDocs(issuesRef);
  snapshot.forEach(docSnap => {
    allIssues.push({ id: docSnap.id, ...docSnap.data() });
  });
  renderIssues();
  if (map) renderMapMarkers();
}
function renderIssues() 
{
  issueList.innerHTML = "";

  const searchText = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = allIssues.filter(issue => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchText) ||
      issue.location.toLowerCase().includes(searchText) ||
      issue.category.toLowerCase().includes(searchText);

    const matchesCategory =
      selectedCategory === "all" || issue.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  filtered.forEach(data => {
    const reportedTime = data.createdAt
      ? data.createdAt.toDate().toLocaleString()
      : "—";
    const statusTime = data.statusUpdatedAt
      ? data.statusUpdatedAt.toDate().toLocaleString()
      : "Not updated yet";
    const li = document.createElement("li");
    li.className = "issue-card";
    li.innerHTML = `
      <div class="issue-row"><strong>Issue:</strong> ${data.title}</div>
      <div class="issue-row"><strong>Category:</strong> ${data.category}</div>
      <div class="issue-row"><strong>Location:</strong> ${data.location}</div>
      <div class="issue-row"><strong>Reported On:</strong> ${reportedTime}</div>
      <div class="issue-row"><strong>Status Updated:</strong> ${statusTime}</div>
      <div class="issue-row"><strong>Status:</strong>
        ${
          isAdmin
            ? `<select data-id="${data.id}">
                <option ${data.status === "Reported" ? "selected" : ""}>Reported</option>
                <option ${data.status === "In Progress" ? "selected" : ""}>In Progress</option>
                <option ${data.status === "Resolved" ? "selected" : ""}>Resolved</option>
              </select>`
            : data.status
        }
      </div>

      <div class="issue-row"><strong>Description:</strong> ${data.description}</div>

      <div class="ai-box">
        <div class="ai-title">AI Action Recommendation</div>
        <div class="ai-row"><strong>Recommended Action:</strong> ${getAIAction(data.category)}</div>
        <div class="ai-row"><strong>Responsible Team:</strong> ${getAIDepartment(data.category)}</div>
        <div class="ai-row"><strong>Estimated Resolution:</strong> ${getAITime(data.category)}</div>
      </div>
    `;

    issueList.appendChild(li);
  });
  attachStatusListeners();
}
function renderMapMarkers() 
{
  markers.forEach(m => m.setMap(null));
  markers = [];
  allIssues.forEach(issue => {
    if (!issue.latitude || !issue.longitude) return;

    const marker = new google.maps.Marker({
      position: { lat: issue.latitude, lng: issue.longitude },
      map,
      title: issue.title
    });
    markers.push(marker);
  });
}
function attachStatusListeners() {
  if (!isAdmin) return;
  document.querySelectorAll("select[data-id]").forEach(select => {
    select.onchange = async e => {
      await updateDoc(doc(db, "issues", e.target.dataset.id), {
        status: e.target.value,
        statusUpdatedAt: serverTimestamp()
      });
      loadIssues();
    };
  });
}
form.onsubmit = async (e) => {
  e.preventDefault();
  const titleInput = document.getElementById("title");
  const categoryInput = document.getElementById("category");
  const locationInput = document.getElementById("location");
  const descriptionInput = document.getElementById("description");
  const locationText = locationInput.value;
  const coords = await getCoordinatesFromLocation(locationText);
  await addDoc(issuesRef, {
    title: titleInput.value,
    category: categoryInput.value,
    location: locationText,
    description: descriptionInput.value,
    status: "Reported",
    latitude: coords ? coords.lat : null,
    longitude: coords ? coords.lng : null,
    createdAt: serverTimestamp(),
    statusUpdatedAt: null
  });

  form.reset();
  loadIssues();
};
searchInput.oninput = renderIssues;
categoryFilter.onchange = renderIssues;
function getAIAction(category) 
{
  return 
  {
    Electrical: "Inspect faulty equipment and restore power supply.",
    Water: "Restrict access and initiate plumbing repair.",
    Internet: "Diagnose network connectivity and reset access points.",
    Cleanliness: "Schedule immediate cleaning and sanitation.",
    Furniture: "Inspect and arrange repair or replacement.",
    Other: "Review issue details and assign appropriate team."
  }[category];
}
function getAIDepartment(category) 
{
  return {
    Electrical: "Electrical Maintenance Team",
    Water: "Plumbing & Facilities Team",
    Internet: "IT Support Team",
    Cleanliness: "Housekeeping Department",
    Furniture: "Infrastructure Team",
    Other: "Campus Operations Team"
  }[category];
}
function getAITime(category) {
  return {
    Electrical: "4–6 hours",
    Water: "2–4 hours",
    Internet: "1–2 hours",
    Cleanliness: "Same day",
    Furniture: "1–2 days",
    Other: "To be assessed"
  }[category];
}
loadIssues();
