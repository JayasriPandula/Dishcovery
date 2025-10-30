import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dataset from "./data/final_recipes_sample.json";
import "./App.css";

function App() {
  const [ingredients, setIngredients] = useState("");
  const [category, setCategory] = useState("");
  const [mood, setMood] = useState("");
  const [time, setTime] = useState("");
  const [foodType, setFoodType] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [randomMeal, setRandomMeal] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [cuisine, setCuisine] = useState("");
  const [course, setCourse] = useState("");

  const fallbackImage =
    "https://tse2.mm.bing.net/th/id/OIP.dKosBnUC-rTo-QCUmMHKRQHaE8?pid=Api&P=0&h=180";

  // 🗣 Voice feature
  const speakText = (text) => {
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };
  const stopSpeaking = () => window.speechSynthesis.cancel();

  // 🔍 Scoring similarity
  const getScore = (text, words) => {
    if (!text || words.length === 0) return 0;
    let score = 0;
    words.forEach((w) => {
      if (text.includes(w)) score++;
    });
    return score / words.length;
  };

  // 🕒 Convert "1 hr 30 min" → 90
  const extractMinutes = (val) => {
    if (!val) return 0;
    const text = val.toString().toLowerCase();
    const hrMatch = text.match(/(\d+)\s*h/);
    const minMatch = text.match(/(\d+)\s*m/);
    let mins = 0;
    if (hrMatch) mins += parseInt(hrMatch[1]) * 60;
    if (minMatch) mins += parseInt(minMatch[1]);
    if (!hrMatch && !minMatch) {
      const num = parseInt(text.replace(/\D/g, ""));
      if (!isNaN(num)) mins += num;
    }
    return mins;
  };

  // 🔎 Handle Search
  const handleSearch = async () => {
    if (
      !ingredients.trim() &&
      !category &&
      !mood &&
      !time &&
      !foodType &&
      !cuisine &&
      !course
    )
      return;
    setLoading(true);

    const searchWords = [
      ...ingredients.split(",").map((i) => i.trim().toLowerCase()),
      category.toLowerCase(),
      mood.toLowerCase(),
      foodType.toLowerCase(),
      cuisine.toLowerCase(),
      course.toLowerCase(),
    ].filter(Boolean);

    try {
      // 🌐 API Search
      let apiResults = [];
      for (const ing of ingredients.split(",").map((i) => i.trim())) {
        if (!ing) continue;
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ing}`
        );
        const data = await res.json();
        if (data.meals) apiResults.push(...data.meals);
      }

      const apiFormatted = apiResults.map((m) => ({
        id: m.idMeal,
        name: m.strMeal,
        image: m.strMealThumb || fallbackImage,
        source: "api",
        score: getScore(m.strMeal.toLowerCase(), searchWords),
        instructions: "",
      }));

      // 📚 Local Dataset Search
      let localMatches = dataset
        .map((item) => {
          const combinedText = [
            item.name,
            item.description,
            item.ingredients_name,
            item.ingredients_quantity,
            item.instructions,
            item.subcategory,
            item.dish_type,
            item.maincategory,
            item.mood,
            item.cuisine,
            item.difficulty,
            item.prep_time,
            item.diet,
            item.course,
          ]
            .join(" ")
            .toLowerCase();

          const score = getScore(combinedText, searchWords);

          let bonus = 0;
          if (item.mood?.toLowerCase() === mood.toLowerCase()) bonus += 0.5;
          if (
            `${item.maincategory || ""} ${item.subcategory || ""}`
              .toLowerCase()
              .includes(category.toLowerCase())
          )
            bonus += 0.5;

          return { ...item, score: score + bonus };
        })
        .filter((r) => r.score > 0);

      // ⏱ Time, Mood, Food Type Filters
      if (time) {
        const maxTime = parseInt(time);
        localMatches = localMatches.filter((r) => {
          const prep = extractMinutes(r.prep_time);
          return prep > 0 && prep <= maxTime;
        });
      }
      if (mood)
        localMatches = localMatches.filter(
          (r) => r.mood?.toLowerCase() === mood.toLowerCase()
        );
      if (foodType)
        localMatches = localMatches.filter((r) => {
          const type = `${r.dish_type || ""} ${r.maincategory || ""} ${
            r.diet || ""
          }`.toLowerCase();
          return type.includes(foodType.toLowerCase());
        });

      // 🍽 Category + Course + Cuisine
      if (category || course || cuisine) {
        localMatches = localMatches.filter((r) => {
          const cat = `${r.maincategory || ""} ${
            r.subcategory || ""
          }`.toLowerCase();
          const courseType = `${r.course || ""}`.toLowerCase();
          const cuisineType = `${r.cuisine || ""}`.toLowerCase();
          return (
            (!category || cat.includes(category.toLowerCase())) &&
            (!course || courseType.includes(course.toLowerCase())) &&
            (!cuisine || cuisineType.includes(cuisine.toLowerCase()))
          );
        });
      }

      // 🧮 Combine & Sort
      const localFormatted = localMatches.map((r) => {
        const recipeName = r.name ? r.name.replace(/\s+/g, "-") : "recipe";
        const image =
          r.image_url?.trim() ||
          r.image?.trim() ||
          `https://source.unsplash.com/600x400/?${recipeName},food`;
        return {
          id: `local-${r.id || Math.random().toString(36).slice(2, 9)}`,
          name: r.name,
          image,
          instructions: Array.isArray(r.instructions)
            ? r.instructions.join(" ")
            : r.instructions,
          source: "local",
          score: r.score,
          ingredients_name: r.ingredients_name,
          ingredients_quantity: r.ingredients_quantity,
        };
      });

      const allResults = [...localFormatted, ...apiFormatted]
        .map((r) => ({ ...r, image: r.image || fallbackImage }))
        .sort((a, b) => b.score - a.score);

      const uniqueResults = Array.from(
        new Map(allResults.map((r) => [r.name.toLowerCase(), r])).values()
      );

      setRecipes(uniqueResults);
    } catch (err) {
      console.error("Search Error:", err);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // 🧾 View Recipe
  const handleViewRecipe = async (id) => {
    const selected = recipes.find((r) => r.id === id);

    // 🌟 Handle Recipe of the Day
    if (!selected && randomMeal && randomMeal.idMeal === id) {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        );
        const data = await res.json();
        if (data.meals && data.meals[0]) {
          const meal = data.meals[0];
          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ing && ing.trim()) {
              ingredients.push(`${measure ? measure.trim() : ""} ${ing.trim()}`);
            }
          }
          setSelectedMeal({
            name: meal.strMeal,
            image: meal.strMealThumb || fallbackImage,
            instructions: meal.strInstructions || "No instructions available.",
            ingredients,
          });
        }
      } catch (err) {
        console.error("Recipe of the Day Error:", err);
      }
      return;
    }

    if (!selected) return;

    // 🧩 Handle Local Recipe
    if (id.startsWith("local-")) {
      let ingredients = [];
      if (selected.ingredients_name && selected.ingredients_quantity) {
        const names = selected.ingredients_name.split(",").map((n) => n.trim());
        const quantities = selected.ingredients_quantity
          .split(",")
          .map((q) => q.trim());
        ingredients = names.map((name, index) => {
          const qty = quantities[index] || "";
          return qty ? `${qty} — ${name}` : name;
        });
      } else if (selected.ingredients_name) {
        ingredients = selected.ingredients_name.split(",").map((n) => n.trim());
      } else {
        ingredients = ["Ingredients not available."];
      }

      setSelectedMeal({
        name: selected.name,
        image: selected.image || fallbackImage,
        instructions: selected.instructions || "No instructions available.",
        ingredients,
      });
      return;
    }

    // 🌍 Handle API Recipe
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
      );
      const data = await res.json();
      if (data.meals && data.meals[0]) {
        const meal = data.meals[0];
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ing = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];
          if (ing && ing.trim()) {
            ingredients.push(`${measure ? measure.trim() : ""} ${ing.trim()}`);
          }
        }
        setSelectedMeal({
          name: meal.strMeal,
          image: meal.strMealThumb || fallbackImage,
          instructions: meal.strInstructions || "No instructions available.",
          ingredients,
        });
      }
    } catch (err) {
      console.error("View Recipe Error:", err);
    }
  };

  // 🌟 Random Recipe (refresh every 5 hours)
  useEffect(() => {
    const fetchRandomMeal = async () => {
      try {
        const res = await fetch(
          "https://www.themealdb.com/api/json/v1/1/random.php"
        );
        const data = await res.json();
        setRandomMeal(data.meals[0]);
      } catch (err) {
        console.error("Random meal fetch error:", err);
      }
    };

    fetchRandomMeal();
    const interval = setInterval(fetchRandomMeal, 5 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`App ${dark ? "dark" : ""}`}>
      <header className="site-header">
        <h1>🍲 Dishcovery</h1>
        <p>Discover recipes for every mood, cuisine, and craving</p>
        <button className="dark-btn" onClick={() => setDark(!dark)}>
          {dark ? "🌞 Light" : "🌙 Dark"}
        </button>
      </header>

      {/* 🌟 Recipe of the Day */}
      {randomMeal && (
        <motion.div
          className="highlight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>🌟 Recipe of the Day: {randomMeal.strMeal}</h2>
          <img
            src={randomMeal.strMealThumb || fallbackImage}
            alt={randomMeal.strMeal}
          />
          <button
            className="view-btn"
            onClick={() => handleViewRecipe(randomMeal.idMeal)}
          >
            View Recipe
          </button>
        </motion.div>
      )}

      {/* 🔍 Search Filters */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Ingredients (e.g. mushroom, rice)"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />

        <select value={foodType} onChange={(e) => setFoodType(e.target.value)}>
          <option value="">Food Type</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="Non Vegetarian">Non Vegetarian</option>
          <option value="Eggetarian">Eggetarian</option>
          <option value="baking">Baking</option>
          <option value="dessert">Dessert</option>
          <option value="salad">Salad</option>
          <option value="soup">Soup</option>
          <option value="budget">Budget</option>
          <option value="health">Health</option>
          <option value="chicken">Chicken</option>
          <option value="drinks">Drinks</option>
        </select>

        <select value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">Course</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="snacks">Snacks</option>
          <option value="appetizer">Appetizer</option>
          <option value="dinner">Dinner</option>
          <option value="side dish">Side Dish</option>
          <option value="dessert">Dessert</option>
          <option value="beverage">Beverage</option>
          <option value="soup">Soup</option>
          <option value="salad">Salad</option>
        </select>

        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
          <option value="">Cuisine</option>
          <option value="indian">Indian</option>
          <option value="italian">Italian</option>
          <option value="chinese">Chinese</option>
          <option value="thai">Thai</option>
          <option value="mexican">Mexican</option>
          <option value="american">American</option>
          <option value="french">French</option>
          <option value="japanese">Japanese</option>
          <option value="korean">Korean</option>
          <option value="arabic">Arabic</option>
        </select>

        <select value={mood} onChange={(e) => setMood(e.target.value)}>
          <option value="">Mood</option>
          <option value="happy">😊 Happy</option>
          <option value="sad">😢 Sad</option>
          <option value="lazy">😴 Lazy</option>
          <option value="energetic">⚡ Energetic</option>
          <option value="romantic">💖 Romantic</option>
          <option value="general">🍽️ General</option>
        </select>

        <input
          type="number"
          placeholder="Max Prep Time (mins)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          min="1"
        />

        <button onClick={handleSearch}>Search</button>
      </div>

      {loading && <p>Loading recipes...</p>}

      {/* 🧾 Results */}
      <div className="recipes">
        {recipes.length > 0 ? (
          recipes.map((r) => (
            <motion.div
              key={r.id}
              className="recipe-card"
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={r.image || fallbackImage}
                alt={r.name}
                onError={(e) => (e.target.src = fallbackImage)}
              />
              <h3>{r.name}</h3>
              <button
                className="view-btn"
                onClick={() => handleViewRecipe(r.id)}
              >
                View Recipe
              </button>
            </motion.div>
          ))
        ) : (
          !loading && <p>No recipes found. Try adjusting filters!</p>
        )}
      </div>

      {/* 🍽 Recipe Modal */}
      <AnimatePresence>
        {selectedMeal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div className="modal" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <button className="close-btn" onClick={() => setSelectedMeal(null)}>
                ×
              </button>
              <h2>{selectedMeal.name}</h2>
              <img
                src={selectedMeal.image}
                alt={selectedMeal.name}
                onError={(e) => (e.target.src = fallbackImage)}
              />

              {/* 🧂 Ingredients Section */}
              {selectedMeal.ingredients && (
                <div className="ingredients-section">
                  <h3>🧂 Ingredients:</h3>
                  <ul>
                    {selectedMeal.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 🍳 Instructions */}
              <h3>🍳 Instructions:</h3>
              <p>{selectedMeal.instructions}</p>

              <div className="voice-buttons">
                <button onClick={() => speakText(selectedMeal.instructions)}>🔊 Read</button>
                <button onClick={stopSpeaking}>⏹️ Stop</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="site-footer">
        <p>© 2025 Dishcovery — Discover. Cook. Enjoy. 🍴</p>
      </footer>
    </div>
  );
}

export default App;
