
# 🍽️ Dishcovery(The Recipe Recommendation web app)

##  Overview
The **Dishcovery** is a React-based application that allows users to discover and explore recipes based on their mood,time, ingredients, and category.  
Each recipe card displays a beautiful Unsplash image, recipe name, and a “View Recipe” button that dynamically reveals ingredients with their quantities.

This project integrates user interactivity, animation, and dynamic filtering to create an intuitive cooking companion for food lovers.

---

##  Features

- **Search Recipes** by mood, category,time,cusine, or ingredients  
- **Dynamic Recipe Cards** with Unsplash images,localdataset  
- **View Recipe Details** — ingredients ,ingredients quantities,instruction and reads the recipe
- **Smooth Animations** using Framer Motion  
- **JSON Dataset Integration** for recipes  
- **Responsive UI** using Tailwind CSS  ,Plain CSS

---

##  Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend Framework** | React.js |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |
| **Image Source** | Unsplash API |
| **Data Source** | Local JSON file (`final_recipes_clean.json`) |

---

##  Project Structure

 recipe-app/
│---public/
| |--index.html
├── src/
│ ├── App.js
│ ├── App.css
| |--App.jsx
│ ├── data/
│ │ └── final_recipes_clean.json
│ ├── components/
│ │ ├── RecipeCard.jsx
│ │ ├── RecipeList.jsx
│ │ └── SearchBar.jsx
│
├── package.json
└── README.md
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/recipe-app.git
   cd recipe-app


## Available Scripts
**->App.js**
.> Main component controlling search filters and recipe rendering.
.> Imports and manages dataset from JSON.
.>Passes filtered data to RecipeList.
The **Dishcovery App** is a React-based recipe discovery application that helps users search for meals by ingredients, mood, cuisine, and time while also featuring a random “Recipe of the Day.” When the app loads, it automatically fetches a random recipe from an API and updates it periodically. Users can enter their search filters, after which the app retrieves recipes from both an online API and a local dataset, merges the results, removes duplicates, and ranks them using a scoring function that prioritizes recipes matching more user preferences. The app displays the filtered recipes in a grid format, and when a recipe is selected, it opens a detailed modal showing ingredients and cooking instructions. It also includes a text-to-speech feature that reads the recipe aloud, a time converter to handle preparation times, and a dark mode toggle to enhance the viewing experience. Overall, the app intelligently combines data sources, interactive design, and accessibility features to deliver a smooth and engaging recipe exploration experience.

$**// ======================================================
// 🍽 Dishcovery App — Smart Recipe Finder
// ======================================================**
$

```
// 🔹 Features:
//  - Fetches random "Recipe of the Day"
//  - Searches recipes by ingredients, mood, cuisine, time
//  - Merges API + local dataset results
//  - Ranks recipes by similarity
//  - Speech and Dark Mode support
// ======================================================

```
###### import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dataset from "./data/final_recipes_clean.json";
import "./App.css";

function App() {
  // 1️⃣ State Initialization
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [filters, setFilters] = useState({ ingredients: "", category: "", mood: "", cuisine: "", time: "" });
  const [darkMode, setDarkMode] = useState(false);
  const [recipeOfTheDay, setRecipeOfTheDay] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 2️⃣ On Page Load → Fetch random recipe every 5 hours
  useEffect(() => {
    fetchRandomRecipe();
    const interval = setInterval(fetchRandomRecipe, 5 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 3️⃣ Fetch Random Recipe from API
  const fetchRandomRecipe = async () => {
    try {
      const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
      const data = await response.json();
      setRecipeOfTheDay(data.meals[0]);
    } catch (err) {
      console.error("Error fetching random recipe:", err);
    }
  };

  // 4️⃣ Handle Search: Fetch from API + dataset → Rank results
  const handleSearch = async () => {
    try {
      const { ingredients } = filters;
      const apiRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredients}`);
      const apiData = await apiRes.json();

      // Combine API & local dataset
      let combined = [...dataset];
      if (apiData.meals) combined = [...combined, ...apiData.meals];

      // Remove duplicates
      const unique = Array.from(new Map(combined.map(r => [r.idMeal || r.Recipe_id, r])).values());

      // Rank by similarity
      const ranked = unique
        .map(r => ({ ...r, score: getScore(r) }))
        .sort((a, b) => b.score - a.score);

      setRecipes(ranked);
    } catch (err) {
      console.error("Error searching recipes:", err);
    }
  };

  // 5️⃣ Calculate Similarity Score
  const getScore = (r) => {
    let score = 0;
    if (filters.ingredients && r.Ingredients?.includes(filters.ingredients)) score += 3;
    if (filters.category && r.Category === filters.category) score += 2;
    if (filters.cuisine && r.Area === filters.cuisine) score += 1;
    if (filters.mood && r.Mood === filters.mood) score += 1;
    if (filters.time && extractMinutes(r.PrepTime) <= Number(filters.time)) score += 1;
    return score;
  };

  // 6️⃣ Convert "1 hr 30 min" → 90 (minutes)
  const extractMinutes = (text) => {
    if (!text) return 0;
    const match = text.match(/(\d+)\s*hr\s*(\d*)\s*min*/i);
    if (!match) return parseInt(text) || 0;
    const [_, hr, min] = match;
    return (parseInt(hr) || 0) * 60 + (parseInt(min) || 0);
  };

  // 7️⃣ Speech Functionality
  const speakText = (text) => {
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
  };
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // 8️⃣ View Recipe Details
  const handleViewRecipe = (id) => {
    const recipe = recipes.find(r => r.idMeal === id || r.Recipe_id === id);
    setSelectedRecipe(recipe);
  };

  // 9️⃣ Toggle Theme
  const toggleDarkMode = () => setDarkMode(!darkMode);

  // 🔟 UI Rendering
  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      <header>
        <h1>🍴 Dishcovery</h1>
        <button onClick={toggleDarkMode}>{darkMode ? "☀️ Light" : "🌙 Dark"}</button>
      </header>

      {recipeOfTheDay && (
        <section className="highlight">
          <h2>Recipe of the Day: {recipeOfTheDay.strMeal}</h2>
          <img src={recipeOfTheDay.strMealThumb} alt={recipeOfTheDay.strMeal} />
        </section>
      )}

      <div className="search-box">
        {["ingredients", "category", "mood", "cuisine", "time"].map((key) => (
          <input key={key} placeholder={key} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} />
        ))}
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="recipe-grid">
        {recipes.map((r) => (
          <motion.div key={r.idMeal || r.Recipe_id} whileHover={{ scale: 1.05 }} className="recipe-card">
            <img src={r.strMealThumb || r.Image} alt={r.strMeal || r.Title} />
            <h3>{r.strMeal || r.Title}</h3>
            <button onClick={() => handleViewRecipe(r.idMeal || r.Recipe_id)}>🍽 View</button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedRecipe && (
          <motion.div className="modal">
            <h2>{selectedRecipe.strMeal || selectedRecipe.Title}</h2>
            <p><b>Category:</b> {selectedRecipe.Category || selectedRecipe.strCategory}</p>
            <p><b>Instructions:</b> {selectedRecipe.Instructions || selectedRecipe.strInstructions}</p>
            {isSpeaking ? (
              <button onClick={stopSpeaking}>🛑 Stop</button>
            ) : (
              <button onClick={() => speakText(selectedRecipe.Instructions || selectedRecipe.strInstructions)}>🔊 Speak</button>
            )}
            <button onClick={() => setSelectedRecipe(null)}>❌ Close</button>
          </motion.div>
        )}
      </AnimatePresence>

      <footer>
        <p>© 2025 Dishcovery | Cook Smart, Eat Happy!</p>
      </footer>
    </div>
  );
}

export default App

# RecipeList.jsx
->Displays recipe cards in a responsive grid.
->Maps each recipe to a RecipeCard component.
->// ===================================================
// 🍽 RecipeList Component — Simplified
// ===================================================
// 🧩 Pseudocode Summary:
// 1. Import React and RecipeCard.
// 2. If no recipes → show “No recipes found” message.
// 3. Else, map through all recipes and render RecipeCard for each.
// ===================================================
->>>
The RecipeList component efficiently displays a collection of recipes by mapping each one to a RecipeCard. If no recipes are available, it shows a friendly message instead. The grid layout is responsive, adapting to different screen sizes using TailwindCSS classes. This minimal and clean design ensures smooth integration with the main app and keeps the UI simple, structured, and user-friendly.
________________________________________________________________________________________________________________

 import React from "react";
import RecipeCard from "./RecipeCard";

function RecipeList({ recipes }) {
  if (!recipes.length) {
    return <p className="text-center text-gray-500">No recipes found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.idMeal} recipe={recipe} />
      ))}
    </div>
  );
}

export default RecipeList;

 
### RecipeCard.jsx
->Shows the recipe image and title.
->On “🍽 View Recipe” click, toggles the ingredient list.
->Extracts ingredients and quantities dynamically from JSON fields.
  // ===================================================
// 🍽 RecipeCard Component — Simplified
// ===================================================
// 🧩 Pseudocode Summary:
// 1. Import React + framer-motion.
// 2. Define fallback image.
// 3. Extract title, image, and ingredients from props.
// 4. Toggle ingredients on button click.
// 5. Animate image, title, and ingredient list.
// ===================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function RecipeCard({ recipe, onViewRecipe }) {
  const [show, setShow] = useState(false);

  const fallback =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";

  const title = recipe.name || recipe.strMeal || "Untitled";
  const image = recipe.image || recipe.strMealThumb || fallback;

  const ingredients =
    recipe.ingredients_name?.split(",").map((n, i) => ({
      name: n.trim(),
      qty: recipe.ingredients_quantity?.split(",")[i]?.trim() || "",
    })) || [];

  return (
    <motion.div
      className="recipe-card"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.img src={image} alt={title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.h3>{title}</motion.h3>

      <button
        className="view-btn"
        onClick={() => {
          setShow(!show);
          onViewRecipe?.(recipe.id);
        }}
      >
        🍽 {show ? "Hide" : "View"} Recipe
      </button>

      <AnimatePresence>
        {show && ingredients.length > 0 && (
          <motion.div
            className="ingredients-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4>🧂 Ingredients</h4>
            <ul>
              {ingredients.map((ing, i) => (
                <li key={i}>
                  <strong>{ing.name}</strong> — {ing.qty}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default RecipeCard;


## SearchBar.jsx
->Provides input fields for searching recipes by ingredients, mood, or category.
// ===================================================
// 🔍 SearchBar Component — Simplified
// ===================================================
// 🧩 Pseudocode:
// 1. Initialize ingredient state.
// 2. On form submit → prevent reload → call onSearch(ingredient).
// 3. Render input + button inside a centered form.
// ===================================================
____________________________________________________________________________________________________________________
The SearchBar component provides a simple user input form for searching recipes by ingredient. It maintains the ingredient text using React’s useState, prevents page reload on form submission, and calls the onSearch() callback with the entered ingredient. The layout uses TailwindCSS for responsive styling, keeping the design minimal, functional, and intuitive for quick searches.
___________________________________________________________________________________________________________________


import React, { useState } from "react";

function SearchBar({ onSearch }) {
  const [ingredient, setIngredient] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(ingredient.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex justify-center mb-6">
      <input
        value={ingredient}
        onChange={(e) => setIngredient(e.target.value)}
        placeholder="🔎 Search ingredient..."
        className="border p-2 rounded-l-md w-1/2 outline-none"
      />
      <button className="bg-green-500 text-white px-4 rounded-r-md hover:bg-green-600">
        Search
      </button>
    </form>
  );
}

export default SearchBar;
___________________________________________________________



Absolutely  Here’s a **refined, meaningful, and professional version** of your
*“About Dataset & Local Data Usage”* section — short, human, and clear enough for both reports and README files 

---

##  About the Dataset & Local Data Usage

The **Dishcovery App** enhances recipe recommendations by combining **MealDB API data** with a **locally curated dataset (`final_recipes_clean.json`)**.
While the API provides authentic global recipes in real time, the local dataset ensures quick access, offline availability, and more personalized filtering options such as *mood*, *cuisine type*, and *preparation time*.

This local file stores structured details like recipe name, ingredients, quantities, category, time, mood, and image — allowing the app to suggest dishes even when the API returns limited results.

---

##  Python Dataset Preparation

The dataset was cleaned and prepared using **Python (Pandas)** to remove incomplete entries and format the data uniformly for use in React.
A simple script like the one below was used to process raw data and export it into JSON format:

```python
import pandas as pd

data = pd.read_csv("raw_recipes.csv")
data.dropna(subset=["name", "ingredients"], inplace=True)
data.to_json("final_recipes_clean.json", orient="records", indent=2)
```

The cleaned dataset is then imported into React:

```javascript
import dataset from "./data/final_recipes_clean.json";
```

---

##  Why Combine Local & API Data:

Using both sources improves reliability and user experience:

* **MealDB API** – provides diverse, real-time global recipes.
* **Local Dataset** – offers speed, offline use, and tailored recommendations.

Together, they make **Dishcovery** both **smart and dependable**, delivering accurate and instant recipe results for every search.

---

Perfect question 👏 — let’s make this section **specific to your Dishcovery project**, focusing on *how you actually used Unsplash* and *why it was necessary* in your app.

Here’s the improved, **meaningful and explanatory version** 👇

---

##  Unsplash 

In our **Dishcovery App**, each recipe is displayed inside a visually rich card that includes an image of the dish. However, not all recipes from the **MealDB API** or our **local dataset (`final_recipes_clean.json`)** contain valid image links. To prevent blank spaces or broken thumbnails, we integrated **Unsplash**, a free image service, as a **fallback image source**.

###  How We Used Unsplash:

In the `RecipeCard.jsx` component, we added a default image URL from Unsplash.
When a recipe doesn’t include its own image, the app automatically loads this fallback:

```javascript
const fallbackImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";

const imageSrc = recipe.image || recipe.strMealThumb || fallbackImage;
```

This ensures that **every recipe card** — even from offline or incomplete data — displays a high-quality food image, keeping the layout neat and appealing.

###  Why We Used Unsplash:

* **To Maintain Consistent UI:** Recipes without images still look complete and professional.
* **To Improve User Experience:** Appealing visuals make browsing recipes more engaging.
* **To Handle Missing API Data:** Prevents empty image boxes when MealDB fails to return image URLs.
* **To Reduce Load Time:** Unsplash images are optimized and responsive, improving performance.

By integrating Unsplash, we ensured that the app stays **aesthetically consistent**, **reliable**, and **user-friendly**, even when some recipes lack visual data. It’s a small but powerful enhancement that improves the overall experience of using Dishcovery .

---

Deployment — Using StackBlitz

The Dishcovery App was deployed and tested using StackBlitz, an online web development environment that supports React applications. It allowed us to run, preview, and share our project instantly in the browser without requiring local setup.

⚙️ How We Used StackBlitz

We uploaded all project files — including App.js, RecipeCard.jsx, RecipeList.jsx, and SearchBar.jsx — to StackBlitz.

StackBlitz automatically detected the React environment and installed the required dependencies (npm install).

By clicking the “Start” button, it launched a development server and generated a live preview link (for example: https://stackblitz.com/edit/dishcovery-app).

This link can be shared with others, allowing them to view and interact with the app directly in their browsers — no additional installation needed.

->  # why We Used StackBlitz

Instant Online Development: No local setup or Node.js installation required.

Easy Sharing: Generated live preview links made it simple to demonstrate our project to others.

Cloud Storage: Changes are saved automatically, ensuring version safety.

Lightweight Testing Environment: Allowed us to test and debug quickly from any device.

Using StackBlitz made our development process faster, collaborative, and accessible. It provided a simple yet powerful platform to build, test, and present Dishcovery in real time .
___________________________________________________________
___________________________________________________________


---



###  `npm start`

Runs the **Dishcovery App** in development mode.
Open [http://localhost:3000](http://localhost:3000) in your browser to view it.

* Automatically reloads when you edit components like `App.js`, `RecipeCard`, `RecipeList`, or `SearchBar`.
* Shows ESLint warnings or errors directly in the console.

---

###  `npm test`

Launches the **interactive test runner**.
You can write and run tests for components (like `RecipeCard.test.js` or `SearchBar.test.js`) to ensure they behave correctly.
Learn more about testing React components [here](https://facebook.github.io/create-react-app/docs/running-tests).

---

###  `npm run build`

Builds your **Dishcovery App** for production into the `/build` folder.

* Optimizes the code for best performance.
* Bundles and minifies all assets.
* Prepares your app to be deployed on hosting platforms like **Netlify**, **Vercel**, or **GitHub Pages**.

Once built, your app is ready to go live 🚀

---

###  `npm run eject`

**Use only if necessary.**
This gives you complete control over the project’s configuration (Webpack, Babel, ESLint, etc.) but **cannot be undone**.
You typically don’t need this for small or medium projects.

---
---



###  `npm start`

Runs the **Dishcovery App** in development mode.
Open [http://localhost:3000](http://localhost:3000) in your browser to view it.

* Automatically reloads when you edit components like `App.js`, `RecipeCard`, `RecipeList`, or `SearchBar`.
* Shows ESLint warnings or errors directly in the console.

---

###  `npm test`

Launches the **interactive test runner**.
You can write and run tests for components (like `RecipeCard.test.js` or `SearchBar.test.js`) to ensure they behave correctly.
Learn more about testing React components [here](https://facebook.github.io/create-react-app/docs/running-tests).

---

###  `npm run build`

Builds your **Dishcovery App** for production into the `/build` folder.

* Optimizes the code for best performance.
* Bundles and minifies all assets.
* Prepares your app to be deployed on hosting platforms like **Netlify**, **Vercel**, or **GitHub Pages**.

Once built, your app is ready to go live 🚀

---

###  `npm run eject`

**Use only if necessary.**
This gives you complete control over the project’s configuration (Webpack, Babel, ESLint, etc.) but **cannot be undone**.
You typically don’t need this for small or medium projects.

---

BROWSER TO OPEN IN LOCAL NETWORK:
Then open http://localhost:3000/ in your browser.
   
Local:            http://localhost:3000
On Your Network:  http://192.168.137.1:3000


## 🔗 Project Links

🌐 **Live Demo (Deployed App):**  
[https://stackblitz.com/edit/vitejs-vite-gvehhwdz](https://stackblitz.com/edit/vitejs-vite-gvehhwdz)

💻 **Source Code (GitHub Repository):**  
[https://github.com/JayasriPandula/mood-based-recipe-finder](https://github.com/JayasriPandula/Dishcovery)



    


