// API keys
const visualCrossingApiKey = "W66J7CBUGEY4FC9SRYYK66YEQ";
const openWeatherMapApiKey = "bd5e378503939ddaee76f12ad7a97608"; // Free tier API key for OpenWeatherMap

// State variables
let useMetric = true; // true = Celsius, false = Fahrenheit
let savedLocations = [];

// Load saved locations from localStorage if available
document.addEventListener("DOMContentLoaded", () => {
  // Set up event listeners
  setupEventListeners();

  // Load saved locations from localStorage
  loadSavedLocations();

  // Render saved location cards
  renderSavedLocationCards();

  // Set the initial state of the toggle switch
  const unitSwitch = document.getElementById("unit-switch");
  if (unitSwitch) {
    unitSwitch.checked = !useMetric; // Invert the logic: checked = Fahrenheit
    const celsiusText = document.querySelector(".toggle-text.celsius");
    const fahrenheitText = document.querySelector(".toggle-text.fahrenheit");
    if (useMetric) {
      celsiusText.classList.add("active");
      fahrenheitText.classList.remove("active");
    } else {
      celsiusText.classList.remove("active");
      fahrenheitText.classList.add("active");
    }
  }
});

// Set up all event listeners
function setupEventListeners() {
  // Form submission
  const weatherForm = document.getElementById("weather-form");
  if (weatherForm) {
    weatherForm.addEventListener("submit", handleFormSubmit);
  }

  // Temperature unit toggle
  const unitSwitch = document.getElementById("unit-switch");
  if (unitSwitch) {
    unitSwitch.addEventListener("change", handleUnitToggle);
  }

  // Event delegation for remove card buttons
  const weatherCards = document.getElementById("weather-cards");
  if (weatherCards) {
    weatherCards.addEventListener("click", handleCardActions);
  }
}

// Handle form submission
function handleFormSubmit(e) {
  e.preventDefault();
  const locationInput = document.getElementById("location");
  const location = locationInput.value.trim();

  if (location) {
    // Check if location is already saved
    if (
      !savedLocations.some(
        (loc) => loc.toLowerCase() === location.toLowerCase()
      )
    ) {
      // Add to saved locations
      savedLocations.push(location);
      // Save to localStorage
      saveLocations();
      // Fetch and add new card
      fetchAndAddWeatherCard(location);
      // Clear input
      locationInput.value = "";
    } else {
      // Location already exists, just update it
      updateWeatherCard(location);
      // Clear input
      locationInput.value = "";
    }
  }
}

// Handle temperature unit toggle
function handleUnitToggle(e) {
  useMetric = !e.target.checked; // Invert the logic: checked = Fahrenheit

  // Update toggle UI
  const celsiusText = document.querySelector(".toggle-text.celsius");
  const fahrenheitText = document.querySelector(".toggle-text.fahrenheit");

  if (useMetric) {
    celsiusText.classList.add("active");
    fahrenheitText.classList.remove("active");
  } else {
    celsiusText.classList.remove("active");
    fahrenheitText.classList.add("active");
  }

  // Immediately update all cards with the new temperature unit
  updateAllCards();
}

// Handle card actions (remove button)
function handleCardActions(e) {
  const removeButton = e.target.closest(".remove-card");
  if (removeButton) {
    // Call the removeCard function instead of deleteWeatherCard
    removeCard(e); // Pass the event to prevent default scrolling
    // Prevent event from bubbling up
    e.stopPropagation();
  }
}

// Fetch weather data from API
function fetchWeatherData(location) {
  // Always fetch in metric units for consistency, regardless of display preference
  const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?key=${visualCrossingApiKey}&unitGroup=metric&include=current,alerts&elements=datetime,temp,feelslike,humidity,windspeed,conditions,aqi`;

  console.log("Fetching weather data from:", apiUrl);

  return fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      // Store original temperature values (always in metric)
      const originalTemp = data.currentConditions.temp;
      const originalFeelsLike = data.currentConditions.feelslike;

      // Store original values in the dataset for future conversions
      data.currentConditions.originalTemp = originalTemp;
      data.currentConditions.originalFeelsLike = originalFeelsLike;

      console.log("API Response:", data);
      return data;
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
      throw error;
    });
}

// Fetch AQI data from OpenWeatherMap as a fallback
function fetchAqiData(location) {
  // First get coordinates for the location
  return fetch(
    `https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${openWeatherMapApiKey}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to geocode location");
      }
      return response.json();
    })
    .then((geoData) => {
      console.log("Geocoding data:", geoData);
      if (geoData && geoData.length > 0) {
        const { lat, lon } = geoData[0];
        // Now fetch AQI data using coordinates
        return fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${openWeatherMapApiKey}`
        );
      }
      throw new Error("Location not found");
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch AQI data");
      }
      return response.json();
    })
    .then((data) => {
      console.log("OpenWeatherMap AQI data:", data);
      if (data && data.list && data.list[0] && data.list[0].main) {
        // Convert OpenWeatherMap AQI (1-5 scale) to standard AQI scale (0-500)
        const aqiValue = data.list[0].main.aqi;
        // Map the 1-5 scale to approximate AQI ranges
        const aqiMapping = {
          1: 25, // Good (0-50)
          2: 75, // Moderate (51-100)
          3: 125, // Unhealthy for Sensitive Groups (101-150)
          4: 175, // Unhealthy (151-200)
          5: 300, // Very Unhealthy (201-300)
        };
        return aqiMapping[aqiValue] || 150; // Default to middle value if mapping fails
      }
      return null;
    })
    .catch((error) => {
      console.error("Error fetching AQI data:", error);
      return null;
    });
}

// Fetch weather data and add a new card
function fetchAndAddWeatherCard(location) {
  const weatherCards = document.getElementById("weather-cards");

  // Create loading placeholder
  const cardId = `card-${location.replace(/\s+/g, "-").toLowerCase()}`;
  const loadingCard = createLoadingCard(location, cardId);
  weatherCards.appendChild(loadingCard);

  // Fetch actual data
  fetchWeatherData(location)
    .then((data) => {
      // Check if we need to fetch AQI data separately
      const current = data.currentConditions;
      let hasAqi = current && current.aqi !== undefined;

      if (!hasAqi) {
        // Try to fetch AQI data from OpenWeatherMap
        return fetchAqiData(location).then((aqiValue) => {
          if (aqiValue !== null) {
            // Add AQI to the data
            if (!data.currentConditions) {
              data.currentConditions = {};
            }
            data.currentConditions.aqi = aqiValue;
          }
          return data;
        });
      }

      return data;
    })
    .then((data) => {
      // Replace loading card with actual data
      const weatherCard = createWeatherCard(data, cardId);
      const existingCard = document.getElementById(cardId);
      if (existingCard) {
        weatherCards.replaceChild(weatherCard, existingCard);
      } else {
        weatherCards.appendChild(weatherCard);
      }
    })
    .catch((error) => {
      // Show error in card
      const errorCard = createErrorCard(location, error.message, cardId);
      const existingCard = document.getElementById(cardId);
      if (existingCard) {
        weatherCards.replaceChild(errorCard, existingCard);
      } else {
        weatherCards.appendChild(errorCard);
      }

      // Remove from saved locations if there's an error
      removeLocation(location);
    });
}

// Update an existing weather card
function updateWeatherCard(location) {
  const cardId = `card-${location.replace(/\s+/g, "-").toLowerCase()}`;
  const existingCard = document.getElementById(cardId);

  if (existingCard) {
    // Show loading state
    existingCard.classList.add("loading");

    // Check if we're just updating for temperature unit change
    const isUnitChange =
      existingCard.dataset.lastUpdate &&
      Date.now() - parseInt(existingCard.dataset.lastUpdate) < 60000; // Less than 1 minute

    if (isUnitChange) {
      // Just update the temperature display without fetching new data
      const existingData = JSON.parse(
        existingCard.dataset.weatherData || "null"
      );
      if (existingData) {
        console.log("Using cached data for unit change:", existingData);

        // Use original temperature values for conversion
        const originalTemp = existingData.currentConditions.originalTemp;
        const originalFeelsLike =
          existingData.currentConditions.originalFeelsLike;

        // Convert temperature and feels like based on the current unit
        const temp = useMetric ? originalTemp : (originalTemp * 9) / 5 + 32;
        const feelsLike = useMetric
          ? originalFeelsLike
          : (originalFeelsLike * 9) / 5 + 32;

        const weatherCard = createWeatherCard(
          {
            ...existingData,
            currentConditions: {
              ...existingData.currentConditions,
              temp,
              feelslike: feelsLike,
              // Keep the original AQI value unchanged
              aqi: existingData.currentConditions.aqi,
            },
          },
          cardId
        );
        existingCard.parentNode.replaceChild(weatherCard, existingCard);
        return;
      }
    }

    // Fetch updated data if not just a unit change
    fetchWeatherData(location)
      .then((data) => {
        const weatherCard = createWeatherCard(data, cardId);
        existingCard.parentNode.replaceChild(weatherCard, existingCard);
      })
      .catch((error) => {
        const errorCard = createErrorCard(location, error.message, cardId);
        existingCard.parentNode.replaceChild(errorCard, existingCard);
      });
  } else {
    // Card doesn't exist, do not create a new one
    console.log(`Card for ${location} does not exist, skipping update.`);
  }
}

// Update all cards with current temperature unit
function updateAllCards() {
  savedLocations.forEach((location) => {
    updateWeatherCard(location);
  });
}

// Create a loading card placeholder
function createLoadingCard(location, cardId) {
  const card = document.createElement("div");
  card.className = "weather-card loading";
  card.id = cardId;
  card.dataset.location = location;

  card.innerHTML = `
    <div class="card-header">
      <h2 class="location-name">${location}</h2>
      <button class="remove-card" aria-label="Remove card">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="weather-details">
      <p>Loading weather data...</p>
    </div>
  `;

  return card;
}

// Create a weather card with data
function createWeatherCard(data, cardId) {
  const current = data.currentConditions;
  const location = data.resolvedAddress;

  console.log("Creating weather card with data:", data);
  console.log("Current conditions:", current);

  // Get original temperature values
  const originalTemp = current.originalTemp || current.temp;
  const originalFeelsLike = current.originalFeelsLike || current.feelslike;
  const originalWindSpeed = current.windspeed;

  // Format temperature based on selected unit
  const temp = Math.round(
    useMetric ? originalTemp : (originalTemp * 9) / 5 + 32
  );
  const feelsLike = Math.round(
    useMetric ? originalFeelsLike : (originalFeelsLike * 9) / 5 + 32
  );
  const tempUnit = useMetric ? "°C" : "°F";

  // Convert wind speed based on selected unit
  const windSpeed = useMetric
    ? Math.round(originalWindSpeed)
    : Math.round(originalWindSpeed * 0.621371); // Convert km/h to mph
  const windUnit = useMetric ? "km/h" : "mph";

  const card = document.createElement("div");
  card.className = "weather-card";
  card.id = cardId;
  card.dataset.location = location;
  card.dataset.lastUpdate = Date.now().toString();
  card.dataset.weatherData = JSON.stringify(data);

  // Get weather icon based on conditions
  const weatherIcon = getWeatherIcon(current.conditions);

  // Get AQI information if available
  let aqiHtml = "";

  // Check for AQI in different possible locations in the API response
  let aqiValue = null;
  if (current.aqi !== undefined) {
    aqiValue = current.aqi;
    console.log("Found AQI in currentConditions.aqi:", aqiValue);
  } else if (
    data.currentConditions &&
    data.currentConditions.aqi !== undefined
  ) {
    aqiValue = data.currentConditions.aqi;
    console.log("Found AQI in data.currentConditions.aqi:", aqiValue);
  } else if (data.aqi !== undefined) {
    aqiValue = data.aqi;
    console.log("Found AQI in data.aqi:", aqiValue);
  }

  if (aqiValue !== null) {
    const aqiLevel = getAqiLevel(aqiValue);
    aqiHtml = `
      <div class="weather-info-row">
        <span class="info-label">Air Quality</span>
        <span class="info-value aqi-value ${aqiLevel.className}">${aqiValue} - ${aqiLevel.label}</span>
      </div>
    `;
  } else {
    console.log("No AQI data found in the API response");
    // Add a placeholder for AQI when not available
    aqiHtml = `
      <div class="weather-info-row">
        <span class="info-label">Air Quality</span>
        <span class="info-value">Not available</span>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="card-header">
      <h2 class="location-name">${location}</h2>
      <button class="remove-card" aria-label="Remove card">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="weather-details">
      <div class="temp-display">${temp}${tempUnit}</div>
      <div class="conditions">
        <i class="${weatherIcon}"></i>
        <span class="conditions-text">${current.conditions}</span>
      </div>
      
      <div class="weather-info-row">
        <span class="info-label">Feels Like</span>
        <span class="info-value">${feelsLike}${tempUnit}</span>
      </div>
      <div class="weather-info-row">
        <span class="info-label">Humidity</span>
        <span class="info-value">${current.humidity}%</span>
      </div>
      <div class="weather-info-row">
        <span class="info-label">Wind</span>
        <span class="info-value">${windSpeed} ${windUnit}</span>
      </div>
      ${aqiHtml}
    </div>
  `;

  // Synchronize the toggle switch with the displayed temperature unit
  const unitSwitch = document.getElementById("unit-switch");
  if (unitSwitch) {
    unitSwitch.checked = !useMetric; // Invert the logic: checked = Fahrenheit
    const celsiusText = document.querySelector(".toggle-text.celsius");
    const fahrenheitText = document.querySelector(".toggle-text.fahrenheit");
    if (useMetric) {
      celsiusText.classList.add("active");
      fahrenheitText.classList.remove("active");
    } else {
      celsiusText.classList.remove("active");
      fahrenheitText.classList.add("active");
    }
  }

  return card;
}

// Create an error card
function createErrorCard(location, errorMessage, cardId) {
  const card = document.createElement("div");
  card.className = "weather-card error";
  card.id = cardId;
  card.dataset.location = location;

  card.innerHTML = `
    <div class="card-header">
      <h2 class="location-name">${location}</h2>
      <button class="remove-card" aria-label="Remove card">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="weather-details">
      <p class="error">Error: ${errorMessage}</p>
    </div>
  `;

  return card;
}

// Get appropriate weather icon based on conditions
function getWeatherIcon(conditions) {
  const conditionsLower = conditions.toLowerCase();

  if (conditionsLower.includes("clear") || conditionsLower.includes("sunny")) {
    return "fas fa-sun";
  } else if (conditionsLower.includes("cloud")) {
    return "fas fa-cloud";
  } else if (
    conditionsLower.includes("rain") ||
    conditionsLower.includes("drizzle")
  ) {
    return "fas fa-cloud-rain";
  } else if (
    conditionsLower.includes("snow") ||
    conditionsLower.includes("flurries")
  ) {
    return "fas fa-snowflake";
  } else if (
    conditionsLower.includes("thunder") ||
    conditionsLower.includes("storm")
  ) {
    return "fas fa-bolt";
  } else if (
    conditionsLower.includes("fog") ||
    conditionsLower.includes("mist")
  ) {
    return "fas fa-smog";
  } else {
    return "fas fa-cloud-sun"; // Default icon
  }
}

// Format datetime for display
function formatDateTime(datetimeStr) {
  const now = new Date();
  const today = now.toLocaleDateString();

  // If datetime is just a time (no date component)
  if (!datetimeStr.includes("-") && !datetimeStr.includes("/")) {
    const time = new Date(`${today}T${datetimeStr}`);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // If it's a full datetime
  const date = new Date(datetimeStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Save locations to localStorage
function saveLocations() {
  localStorage.setItem("weatherLocations", JSON.stringify(savedLocations));
}

// Load saved locations from localStorage
function loadSavedLocations() {
  const saved = localStorage.getItem("weatherLocations");
  if (saved) {
    try {
      savedLocations = JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing saved locations:", e);
      savedLocations = [];
    }
  }
}

// Render all saved location cards
function renderSavedLocationCards() {
  if (savedLocations.length > 0) {
    savedLocations.forEach((location) => {
      fetchAndAddWeatherCard(location);
    });
  }
}

// Remove a location from saved locations
function removeLocation(location) {
  const index = savedLocations.findIndex(
    (loc) => loc.toLowerCase() === location.toLowerCase()
  );

  if (index !== -1) {
    savedLocations.splice(index, 1);
    saveLocations();
  }

  // Remove card from DOM
  const cardId = `card-${location.replace(/\s+/g, "-").toLowerCase()}`;
  const card = document.getElementById(cardId);
  if (card) {
    card.remove();

    // Ensure proper rearrangement of remaining cards
    const weatherCards = document.getElementById("weather-cards");
    if (weatherCards) {
      // Force a reflow to ensure cards rearrange properly
      weatherCards.style.display = "none";
      // This line forces a reflow/layout recalculation
      void weatherCards.offsetHeight;
      weatherCards.style.display = "grid";

      // Add transition to remaining cards for smooth rearrangement
      const remainingCards = weatherCards.querySelectorAll(".weather-card");
      remainingCards.forEach((card) => {
        card.style.transition = "all 0.3s ease-in-out";
      });

      // Reset transitions after animation completes
      setTimeout(() => {
        remainingCards.forEach((card) => {
          card.style.transition = "";
        });
      }, 300);
    }
  }
}

// Get AQI level information
function getAqiLevel(aqi) {
  if (aqi <= 50) {
    return { label: "Good", className: "aqi-good" };
  } else if (aqi <= 100) {
    return { label: "Moderate", className: "aqi-moderate" };
  } else if (aqi <= 150) {
    return {
      label: "Unhealthy for Sensitive Groups",
      className: "aqi-sensitive",
    };
  } else if (aqi <= 200) {
    return { label: "Unhealthy", className: "aqi-unhealthy" };
  } else if (aqi <= 300) {
    return { label: "Very Unhealthy", className: "aqi-very-unhealthy" };
  } else {
    return { label: "Hazardous", className: "aqi-hazardous" };
  }
}

function addWeatherCard(data) {
  const card = createWeatherCard(data);
  const weatherCardsContainer = document.getElementById("weather-cards");

  // Find the first available position (if any)
  const firstAvailableCard =
    weatherCardsContainer.querySelector(".weather-card");
  if (firstAvailableCard) {
    weatherCardsContainer.insertBefore(card, firstAvailableCard);
  } else {
    weatherCardsContainer.appendChild(card);
  }
}

// Modify the deleteWeatherCard function to include sliding effect
function deleteWeatherCard(card) {
  // Add a removal animation
  card.classList.add("removing");

  // Wait for animation to complete before actually removing
  setTimeout(() => {
    card.remove();

    // Slide left effect for remaining cards
    const weatherCardsContainer = document.getElementById("weather-cards");
    const cards = weatherCardsContainer.children;

    // Apply sliding effect
    for (let i = 0; i < cards.length; i++) {
      cards[i].style.transition = "margin-left 0.3s";
      cards[i].style.marginLeft = "0"; // Reset margin to slide left
    }

    // Force a layout recalculation to ensure cards rearrange properly
    weatherCardsContainer.style.display = "none";
    void weatherCardsContainer.offsetHeight; // Trigger reflow
    weatherCardsContainer.style.display = "grid";
  }, 150); // Match this with the CSS animation duration
}

function removeCard(event) {
  event.preventDefault(); // Prevent default action that may cause scrolling
  const card = event.target.closest(".weather-card");
  if (card) {
    card.classList.add("removing");
    setTimeout(() => {
      card.remove();
    }, 150); // Adjust the timeout to match your CSS animation duration
  }
}
