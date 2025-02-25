const apiKey = "W66J7CBUGEY4FC9SRYYK66YEQ"; // Replace with your actual API key

function fetchWeatherData(location) {
  const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?key=${apiKey}`;

  return fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json(); // Convert the response to JSON
    })
    .then((data) => {
      console.log(data); // Log the fetched data for debugging
      return data; // Return the data for further processing
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

// Add event listener to the form
document.addEventListener("DOMContentLoaded", () => {
  const weatherForm = document.getElementById("weather-form");
  const weatherInfo = document.getElementById("weather-info");

  if (weatherForm) {
    weatherForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const location = document.getElementById("location").value;

      weatherInfo.innerHTML = "Loading...";

      fetchWeatherData(location)
        .then((data) => {
          if (data) {
            // Display current conditions
            const current = data.currentConditions;
            weatherInfo.innerHTML = `
              <h2>Current Weather for ${data.resolvedAddress}</h2>
              <p>Temperature: ${current.temp}°F</p>
              <p>Conditions: ${current.conditions}</p>
              <p>Humidity: ${current.humidity}%</p>
              <p>Wind: ${current.windspeed} mph</p>
            `;
          }
        })
        .catch((error) => {
          weatherInfo.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        });
    });
  }
});
