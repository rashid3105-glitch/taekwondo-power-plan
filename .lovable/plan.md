

## Plan: Add 20 More Recipes to the Nutrition Library

### What
Add 20 new athlete-focused recipes (no pork) to `src/data/recipes.ts`, continuing from `r21` to `r40`. Each recipe includes full English and Danish translations.

### Recipe Distribution (balanced across categories)
- **Breakfast** (4): Overnight Protein Oats, Scrambled Egg & Avocado Wrap, Banana Protein Pancakes, Bircher Muesli
- **Lunch** (4): Turkey & Quinoa Bowl, Tuna Nicoise Salad, Chicken Caesar Wrap, Black Bean & Sweet Potato Bowl
- **Dinner** (4): Grilled Salmon with Asparagus, Beef Stir-Fry with Broccoli, Chicken Tikka with Rice, Shrimp Pasta Primavera
- **Snack** (3): Cottage Cheese & Fruit Cup, Trail Mix Energy Bites, Hummus & Veggie Sticks
- **Pre-Workout** (3): Rice Cakes with Almond Butter, Banana & Date Smoothie, Oat & Honey Energy Bar
- **Post-Workout** (2): Tuna & Rice Recovery Bowl, Berry Protein Smoothie Bowl

### File Changed
- `src/data/recipes.ts` — append 20 new `RecipeData` entries (r21–r40) with `en` and `da` localized text, macro values, and athlete tips

### No other changes needed
The `getRecipes()` function and `NutritionLibrary` component already dynamically render all entries from the array.

