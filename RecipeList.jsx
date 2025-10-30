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
