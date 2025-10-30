import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function RecipeCard({ recipe, onViewRecipe }) {
  const [showIngredients, setShowIngredients] = useState(false);

  const fallbackImage =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";

  const imageSrc = recipe.image || recipe.strMealThumb || fallbackImage;
  const title = recipe.name || recipe.strMeal || "Untitled Recipe";

  const ingredients =
    recipe.ingredients_name && recipe.ingredients_quantity
      ? recipe.ingredients_name.split(",").map((name, i) => ({
          name: name.trim(),
          quantity: recipe.ingredients_quantity.split(",")[i]?.trim() || "",
        }))
      : [];

  return (
    <motion.div
      className="recipe-card"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <motion.img
        src={imageSrc}
        alt={title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      />

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h3>

      <button
        className="view-btn"
        onClick={() => {
          setShowIngredients(!showIngredients);
          if (onViewRecipe) onViewRecipe(recipe.id);
        }}
      >
        🍽 {showIngredients ? "Hide" : "View"} Recipe
      </button>

      <AnimatePresence>
        {showIngredients && ingredients.length > 0 && (
          <motion.div
            className="ingredients-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h4>🧂 Ingredients:</h4>
            <ul>
              {ingredients.map((ing, idx) => (
                <li key={idx}>
                  <strong>{ing.name}</strong> — {ing.quantity}
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
