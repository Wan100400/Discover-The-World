const { ipcRenderer } = require('electron');
const API_URL = 'https://restcountries.com/v3.1/all';
let allCountries = [];

// Fetch and display all countries
async function fetchCountries() {
  try {
    const response = await fetch(API_URL);
    allCountries = await response.json();
    displayCountries(allCountries);
  } catch (error) {
    console.error('Error fetching countries:', error);
  }
}

// Display country data and integrate itinerary buttons
function displayCountries(countries) {
  const countryList = document.getElementById('country-list');
  countryList.innerHTML = ''; // Clear the list
  
  if (countries.length === 0) {
    countryList.innerHTML = '<li>No countries found.</li>'; // Show a message if no countries match
    return;
  }

  countries.forEach((country) => {
    const listItem = document.createElement('li');
    listItem.classList.add('country-item');
    const capital = country.capital ? country.capital[0] : 'N/A';
    const population = country.population ? country.population.toLocaleString() : 'N/A';
    const area = country.area ? `${country.area.toLocaleString()} km²` : 'N/A';
    const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
    const timezone = country.timezones ? country.timezones.join(', ') : 'N/A';
    const region = country.region || 'N/A';
    const subregion = country.subregion || 'N/A';
    const maps = country.maps ? `<a href="${country.maps.googleMaps}" target="_blank">Google Maps</a>` : 'N/A';

    listItem.innerHTML = `
      <div class="country-header">
        <img src="${country.flags.png}" alt="Flag of ${country.name.common}" class="country-flag">
        <h3 class="country-name">${country.name.common}</h3>
        <button class="toggle-details">Details ▼</button>
        <button class="add-itinerary" onclick="addItinerary(${JSON.stringify(country).replace(/"/g, '&quot;')})">Add to Itinerary</button>
      </div>
      <div class="country-details" style="display: none;">
        ${country.coatOfArms?.png ? `<img src="${country.coatOfArms.png}" alt="Coat of Arms of ${country.name.common}" class="coat-of-arms">` : ''}
        <p><strong>Continent:</strong> ${region}</p>
        <p><strong>Subregion:</strong> ${subregion}</p>
        <p><strong>Capital:</strong> ${capital}</p>
        <p><strong>Area:</strong> ${area}</p>
        <p><strong>Population:</strong> ${population}</p>
        <p><strong>Languages:</strong> ${languages}</p>
        <p><strong>Timezone:</strong> ${timezone}</p>
        <p><strong>Location:</strong> ${maps}</p>
        <h4>Nearby Countries</h4>
        <ul class="nearby-countries">Loading nearby countries...</ul>
      </div>
    `;
    countryList.appendChild(listItem);

    // Toggle country details
    listItem.querySelector('.toggle-details').addEventListener('click', () => {
      const details = listItem.querySelector('.country-details');
      const isVisible = details.style.display === 'block';
      details.style.display = isVisible ? 'none' : 'block';
      listItem.querySelector('.toggle-details').textContent = isVisible ? 'Details ▼' : 'Details ▲';
    });

    // Fetch and display nearby countries
    if (country.borders && country.borders.length > 0) {
      fetchNearbyCountries(country.borders)
        .then(nearbyCountriesHTML => {
          listItem.querySelector('.nearby-countries').innerHTML = nearbyCountriesHTML;
        })
        .catch(() => {
          listItem.querySelector('.nearby-countries').innerHTML = '<li>Unable to load nearby countries</li>';
        });
    } else {
      listItem.querySelector('.nearby-countries').innerHTML = '<li>No nearby countries available</li>';
    }
  });
}

// Fetch and display nearby countries with flags
async function fetchNearbyCountries(borderCodes) {
  try {
    const response = await fetch(`https://restcountries.com/v3.1/alpha?codes=${borderCodes.join(',')}`);
    const borderCountries = await response.json();
    return borderCountries.map(borderCountry => 
      `<li>
        <img src="${borderCountry.flags.png}" alt="Flag of ${borderCountry.name.common}" class="nearby-flag">
        ${borderCountry.name.common}
      </li>`
    ).join('');
  } catch (error) {
    console.error('Error fetching nearby countries:', error);
    return '<li>Error loading nearby countries</li>';
  }
}

// CRUD functionality for itinerary
function addItinerary(country) {
  const itinerary = JSON.parse(localStorage.getItem('itinerary')) || [];
  if (!itinerary.some(itineraryCountry => itineraryCountry.name.common === country.name.common)) {
    itinerary.push(country);
    localStorage.setItem('itinerary', JSON.stringify(itinerary));
    alert(`Added ${country.name.common} to your itinerary!`);
  } else {
    alert(`${country.name.common} is already in your itinerary.`);
  }
  displayItinerary();
}

function updateItinerary(index, updatedCountry) {
    const itinerary = JSON.parse(localStorage.getItem('itinerary')) || [];
    itinerary[index] = updatedCountry; // Update the country at the specified index
    localStorage.setItem('itinerary', JSON.stringify(itinerary));
    alert(`Updated ${updatedCountry.name.common} in your itinerary!`);
    displayItinerary(); // Refresh the itinerary display
}
function displayItinerary() {
  const itineraryList = document.getElementById('itinerary-list');
  const itinerary = JSON.parse(localStorage.getItem('itinerary')) || [];
  itineraryList.innerHTML = '';

  itinerary.forEach((country, index) => {
    const capital = country.capital ? country.capital[0] : 'N/A';
    const population = country.population ? country.population.toLocaleString() : 'N/A';
    const area = country.area ? `${country.area.toLocaleString()} km²` : 'N/A';
    const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
    const timezone = country.timezones ? country.timezones.join(', ') : 'N/A';
    const region = country.region || 'N/A';
    const subregion = country.subregion || 'N/A';
    const maps = country.maps ? `<a href="${country.maps.googleMaps}" target="_blank">Google Maps</a>` : 'N/A';

    const listItem = document.createElement('li');
    listItem.classList.add('country-item');

    listItem.innerHTML = `
      <div class="country-header">
        <img src="${country.flags.png}" alt="Flag of ${country.name.common}" class="country-flag">
        <h3 class="country-name">${country.name.common}</h3>
        <button class="toggle-details">Details ▼</button>
        <button onclick="removeItinerary(${index})">Remove</button>
        <input type="text" id="fileName" placeholder="Enter file name">
        <button onclick="createFile()">save file</button>
      </div>
      <div class="country-details" style="display: none;">
        ${country.coatOfArms?.png ? `<img src="${country.coatOfArms.png}" alt="Coat of Arms of ${country.name.common}" class="coat-of-arms">` : ''}
        <p><strong>Continent:</strong> ${region}</p>
        <p><strong>Subregion:</strong> ${subregion}</p>
        <p><strong>Capital:</strong> ${capital}</p>
        <p><strong>Area:</strong> ${area}</p>
        <p><strong>Population:</strong> ${population}</p>
        <p><strong>Languages:</strong> ${languages}</p>
        <p><strong>Timezone:</strong> ${timezone}</p>
        <p><strong>Location:</strong> ${maps}</p>
        <h4>Nearby Countries</h4>
        <ul class="nearby-countries">Loading nearby countries...</ul>
      </div>
    `;

    itineraryList.appendChild(listItem);

    listItem.querySelector('.toggle-details').addEventListener('click', () => {
      const details = listItem.querySelector('.country-details');
      const isVisible = details.style.display === 'block';
      details.style.display = isVisible ? 'none' : 'block';
      listItem.querySelector('.toggle-details').textContent = isVisible ? 'Details ▼' : 'Details ▲';
    });

    if (country.borders && country.borders.length > 0) {
      fetchNearbyCountries(country.borders)
        .then(nearbyCountriesHTML => {
          listItem.querySelector('.nearby-countries').innerHTML = nearbyCountriesHTML;
        })
        .catch(() => {
          listItem.querySelector('.nearby-countries').innerHTML = '<li>Unable to load nearby countries</li>';
        });
    } else {
      listItem.querySelector('.nearby-countries').innerHTML = '<li>No nearby countries available</li>';
    }
  });
}

function removeItinerary(index) {
  const itinerary = JSON.parse(localStorage.getItem('itinerary')) || [];
  const removedCountry = itinerary.splice(index, 1)[0];
  localStorage.setItem('itinerary', JSON.stringify(itinerary));
  alert(`Removed ${removedCountry.name.common} from your itinerary.`);
  displayItinerary();
}

// Initialize the main page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('country-list')) {
    fetchCountries();
    document.getElementById('search-input').addEventListener('input', searchCountries);
  }
});

// Search functionality for countries
function searchCountries() {
  const searchInput = document.getElementById('search-input').value.toLowerCase();

  const filteredCountries = allCountries.filter(country =>
    country.name.common.toLowerCase().includes(searchInput)
  );

  displayCountries(filteredCountries);
}

const fs = require('fs');
const path = require('path');

function createFile() {
    const fileNameInput = document.getElementById('fileName').value.trim();
    if (!fileNameInput) {
        alert('Please enter a valid file name.');
        return;
    }

    const itinerary = JSON.parse(localStorage.getItem('itinerary')) || [];
    if (itinerary.length === 0) {
        alert('No countries in the itinerary to save.');
        return;
    }

    const content = itinerary.map(country => JSON.stringify(country, null, 2)).join('\n\n');
    const filePath = path.join(__dirname, 'txt', `${fileNameInput}.txt`);

    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error('Error saving itinerary:', err);
            alert('Failed to save itinerary.');
        } else {
            alert(`Itinerary saved to ${filePath}`);
        }
    });
}
