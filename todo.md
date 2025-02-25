# Todo List for Weather Forecast Site Project

## Introduction

- [x] Set up a blank HTML document with the appropriate links to your JavaScript and CSS files.
- [ ] Write the functions that hit the API to fetch weather data.
- [ ] Process the JSON data from the API to extract the required information.
- [ ] Set up a form for user input to fetch weather information.
- [ ] Display the fetched weather information on the webpage.
- [ ] Add styling to enhance the appearance of the webpage.
- [ ] (Optional) Implement a loading component to show while fetching data.
- [ ] Push the project to GitHub and share the link.

## Step-by-Step Breakdown

1. **Set up HTML Document**

   - Create an `index.html` file.
   - Link your CSS file (e.g., `styles.css`) and JavaScript file (e.g., `script.js`).

2. **API Functions**

   - Write a function to fetch weather data from the Visual Crossing API.
   - Ensure the function accepts a location as a parameter and logs the response to the console.

3. **Process JSON Data**

   - Create a function that processes the JSON response.
   - Extract only the necessary data (e.g., temperature, weather conditions) and return it in a structured format.

4. **User Input Form**

   - Add a form in your HTML for users to input their location.
   - Attach an event listener to the form to trigger the API call when submitted.

5. **Display Weather Information**

   - Create elements in your HTML to display the weather data.
   - Update these elements with the data received from the API.

6. **Styling**

   - Use CSS to style your webpage.
   - Consider changing the background color or adding images based on the weather conditions.

7. **Loading Component (Optional)**

   - Implement a loading indicator that appears when the form is submitted and disappears once the data is fetched.
   - Use CSS animations or simple text to indicate loading.

8. **Push to GitHub**
   - Initialize a Git repository if you haven't already.
   - Commit your changes and push them to a new GitHub repository.
   - Share the link to your repository.

## Notes

- Remember to handle errors gracefully, especially when dealing with API calls.
- Consider using async/await for your API functions to make the code cleaner.
- Explore using the Giphy API for weather-related gifs as an enhancement.
