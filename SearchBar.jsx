import React, { useState } from "react";

function SearchBar({ onSearch }) {
  const [ingredient, setIngredient] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(ingredient);
  };

  return (
    <form onSubmit={handleSubmit} className="flex justify-center mb-6">
      <input
        type="text"
        value={ingredient}
        onChange={(e) => setIngredient(e.target.value)}
        placeholder="Enter an ingredient (e.g., chicken)"
        className="border p-2 rounded-l-md w-1/2 outline-none"
      />
      <button
        type="submit"
        className="bg-green-500 text-white px-4 rounded-r-md hover:bg-green-600"
      >
        Search
      </button>
    </form>
  );
}

export default SearchBar;
