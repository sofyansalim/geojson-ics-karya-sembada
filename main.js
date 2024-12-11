// GitHub Configuration
const GITHUB_TOKEN = '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'; // Replace with your token
const REPO_OWNER = 'sofyansalim'; // Replace with your GitHub username
const REPO_NAME = 'geojson-ics-karya-sembada'; // Replace with your repository name
const FILE_PATH = 'data.geojson'; // Path to the GeoJSON file in the repository
const BRANCH = 'main'; // Branch where the file is located

let geojsonLayer;

// Initialize Map
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// Fetch GeoJSON from GitHub
async function fetchGeoJSON() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  });

  const fileData = await response.json();
  const geojsonContent = JSON.parse(atob(fileData.content)); // Decode base64 content
  return { geojsonContent, sha: fileData.sha };
}

// Load GeoJSON onto the map
async function loadGeoJSON() {
  const { geojsonContent } = await fetchGeoJSON();

  geojsonLayer = L.geoJSON(geojsonContent, {
    onEachFeature: (feature, layer) => {
      layer.on('click', (e) => editAttributes(feature, layer, e.latlng));
    },
  }).addTo(map);
}

// Edit Attribute Form
function editAttributes(feature, layer, latlng) {
  const form = document.getElementById('attributeForm');
  const nameInput = document.getElementById('name');
  const locationInput = document.getElementById('location');

  // Populate form with current values
  nameInput.value = feature.properties.name || '';
  locationInput.value = feature.properties.location || '';

  // Position form near clicked feature
  const point = map.latLngToContainerPoint(latlng);
  form.style.left = `${point.x}px`;
  form.style.top = `${point.y}px`;
  form.style.display = 'block';

  // Save button action
  document.getElementById('saveAttributes').onclick = function () {
    feature.properties.name = nameInput.value;
    feature.properties.location = locationInput.value;

    // Update popup or visualization
    layer.bindPopup(`Name: ${feature.properties.name}<br>Location: ${feature.properties.location}`).openPopup();

    form.style.display = 'none';
  };
}

// Save GeoJSON to GitHub
async function saveToGitHub() {
  const { sha } = await fetchGeoJSON();
  const geojsonData = geojsonLayer.toGeoJSON();

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update GeoJSON file',
      content: btoa(JSON.stringify(geojsonData, null, 2)), // Encode as base64
      sha, // Required for updating file
      branch: BRANCH,
    }),
  });

  if (response.ok) {
    alert('GeoJSON saved successfully to GitHub!');
  } else {
    alert('Failed to save GeoJSON to GitHub');
    console.error(await response.json());
  }
}

// Event Listener for Save Button
document.getElementById('saveToGitHub').addEventListener('click', saveToGitHub);

// Load GeoJSON on Map
loadGeoJSON();
