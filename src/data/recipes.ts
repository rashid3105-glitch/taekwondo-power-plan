export type RecipeCategory = "breakfast" | "lunch" | "dinner" | "snack" | "pre-workout" | "post-workout";

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
  tip: string;
}

interface LocalizedRecipeText {
  name: string;
  prepTime: string;
  ingredients: string[];
  steps: string[];
  tip: string;
}

interface RecipeData {
  id: string;
  category: RecipeCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  en: LocalizedRecipeText;
  da: LocalizedRecipeText;
}

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  "pre-workout": "Pre-Workout",
  "post-workout": "Post-Workout",
};

export const RECIPE_CATEGORY_ICONS: Record<RecipeCategory, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  snack: "🥜",
  "pre-workout": "⚡",
  "post-workout": "💪",
};

// NOTE: No pork or pig-derived products — uses poultry, beef, fish, or plant-based proteins.
const recipesData: RecipeData[] = [
  {
    id: "r1",
    category: "breakfast",
    calories: 420, protein: 32, carbs: 48, fat: 12,
    en: {
      name: "Greek Yogurt Power Bowl",
      prepTime: "5 min",
      ingredients: ["250g Greek yogurt", "1 banana", "30g oats", "15g honey", "20g almonds", "Handful of blueberries"],
      steps: ["Add Greek yogurt to a bowl.", "Slice banana and scatter on top.", "Sprinkle oats and almonds.", "Drizzle with honey and add blueberries."],
      tip: "Use full-fat yogurt for sustained energy on heavy training days.",
    },
    da: {
      name: "Græsk yoghurt power-skål",
      prepTime: "5 min",
      ingredients: ["250g græsk yoghurt", "1 banan", "30g havregryn", "15g honning", "20g mandler", "En håndfuld blåbær"],
      steps: ["Hæld græsk yoghurt i en skål.", "Skær bananen i skiver og læg ovenpå.", "Drys havregryn og mandler over.", "Dryp honning over og tilsæt blåbær."],
      tip: "Brug fedtrig yoghurt for vedvarende energi på hårde træningsdage.",
    },
  },
  {
    id: "r2",
    category: "lunch",
    calories: 550, protein: 45, carbs: 55, fat: 14,
    en: {
      name: "Chicken & Rice Meal Prep Box",
      prepTime: "25 min",
      ingredients: ["200g chicken breast", "150g brown rice (cooked)", "100g broccoli", "1 tbsp olive oil", "Salt, pepper, garlic powder"],
      steps: ["Season chicken with garlic powder, salt, and pepper.", "Grill or pan-fry chicken for 6-7 min per side.", "Steam broccoli for 4 minutes.", "Serve over cooked brown rice with a drizzle of olive oil."],
      tip: "Batch cook 4-5 boxes on Sunday for the whole training week.",
    },
    da: {
      name: "Kylling & ris meal prep-boks",
      prepTime: "25 min",
      ingredients: ["200g kyllingebryst", "150g brune ris (kogt)", "100g broccoli", "1 spsk olivenolie", "Salt, peber, hvidløgspulver"],
      steps: ["Krydre kyllingen med hvidløgspulver, salt og peber.", "Gril eller steg kyllingen 6-7 min pr. side.", "Damp broccoli i 4 minutter.", "Server over kogte brune ris med lidt olivenolie."],
      tip: "Forbered 4-5 bokse om søndagen til hele træningsugen.",
    },
  },
  {
    id: "r3",
    category: "dinner",
    calories: 580, protein: 40, carbs: 45, fat: 22,
    en: {
      name: "Salmon & Sweet Potato Plate",
      prepTime: "30 min",
      ingredients: ["180g salmon fillet", "1 medium sweet potato", "100g asparagus", "1 tbsp olive oil", "Lemon juice", "Dill"],
      steps: ["Preheat oven to 200°C.", "Cube sweet potato, toss with olive oil, roast 20 min.", "Season salmon with lemon, dill, salt. Bake 12-15 min.", "Steam asparagus 3-4 min. Serve together."],
      tip: "Salmon provides omega-3s critical for joint recovery and inflammation control.",
    },
    da: {
      name: "Laks & sød kartoffel-tallerken",
      prepTime: "30 min",
      ingredients: ["180g laksefilet", "1 mellem sød kartoffel", "100g asparges", "1 spsk olivenolie", "Citronsaft", "Dild"],
      steps: ["Forvarm ovnen til 200°C.", "Skær sød kartoffel i tern, vend i olivenolie, rist i 20 min.", "Krydre laksen med citron, dild og salt. Bag i 12-15 min.", "Damp asparges 3-4 min. Server sammen."],
      tip: "Laks giver omega-3 fedtsyrer, som er afgørende for ledrestitution og betændelseskontrol.",
    },
  },
  {
    id: "r4",
    category: "snack",
    calories: 180, protein: 8, carbs: 24, fat: 7,
    en: {
      name: "Banana Oat Energy Bites",
      prepTime: "10 min",
      ingredients: ["2 ripe bananas", "150g rolled oats", "2 tbsp peanut butter", "1 tbsp honey", "30g dark chocolate chips"],
      steps: ["Mash bananas in a bowl.", "Mix in oats, peanut butter, honey, and chocolate chips.", "Roll into small balls (makes ~12).", "Refrigerate for 30 min before eating."],
      tip: "Perfect grab-and-go fuel 1 hour before training.",
    },
    da: {
      name: "Banan-havre energikugler",
      prepTime: "10 min",
      ingredients: ["2 modne bananer", "150g havregryn", "2 spsk peanutbutter", "1 spsk honning", "30g mørke chokoladestykker"],
      steps: ["Mos bananerne i en skål.", "Rør havregryn, peanutbutter, honning og chokolade i.", "Rul til små kugler (ca. 12 stk.).", "Sæt i køleskabet 30 min inden servering."],
      tip: "Perfekt hurtig energi 1 time før træning.",
    },
  },
  {
    id: "r5",
    category: "pre-workout",
    calories: 320, protein: 14, carbs: 42, fat: 10,
    en: {
      name: "Pre-Training Toast",
      prepTime: "5 min",
      ingredients: ["2 slices whole grain bread", "1 tbsp almond butter", "1 banana", "Drizzle of honey", "Pinch of cinnamon"],
      steps: ["Toast bread lightly.", "Spread almond butter on both slices.", "Slice banana on top.", "Drizzle honey and sprinkle cinnamon."],
      tip: "Eat 60-90 minutes before training for optimal energy without heaviness.",
    },
    da: {
      name: "Før-træning toast",
      prepTime: "5 min",
      ingredients: ["2 skiver fuldkornsbrød", "1 spsk mandelbutter", "1 banan", "Lidt honning", "Et drys kanel"],
      steps: ["Rist brødet let.", "Smør mandelbutter på begge skiver.", "Skær banan i skiver ovenpå.", "Dryp honning over og drys kanel."],
      tip: "Spis 60-90 minutter før træning for optimal energi uden tyngde.",
    },
  },
  {
    id: "r6",
    category: "post-workout",
    calories: 380, protein: 35, carbs: 40, fat: 8,
    en: {
      name: "Post-Training Protein Shake",
      prepTime: "3 min",
      ingredients: ["1 scoop whey protein", "1 banana", "200ml milk", "1 tbsp oats", "1 tbsp peanut butter", "Ice cubes"],
      steps: ["Add all ingredients to a blender.", "Blend until smooth (30 seconds).", "Drink within 30 minutes of training."],
      tip: "The 2:1 carb-to-protein ratio is optimal for recovery after intense sessions.",
    },
    da: {
      name: "Protein-shake efter træning",
      prepTime: "3 min",
      ingredients: ["1 scoop valleprotein", "1 banan", "200ml mælk", "1 spsk havregryn", "1 spsk peanutbutter", "Isterninger"],
      steps: ["Tilsæt alle ingredienser i en blender.", "Blend til det er glat (30 sekunder).", "Drik inden for 30 minutter efter træning."],
      tip: "2:1 kulhydrat-til-protein forholdet er optimalt for restitution efter intense sessioner.",
    },
  },
  {
    id: "r7",
    category: "dinner",
    calories: 620, protein: 42, carbs: 65, fat: 18,
    en: {
      name: "Turkey Meatball Pasta",
      prepTime: "25 min",
      ingredients: ["200g ground turkey", "150g whole wheat pasta", "100ml tomato sauce", "1 egg", "30g breadcrumbs", "Garlic, basil, oregano"],
      steps: ["Mix turkey, egg, breadcrumbs, and herbs. Form meatballs.", "Pan-fry meatballs in olive oil until golden (8-10 min).", "Cook pasta according to package.", "Simmer meatballs in tomato sauce 5 min. Serve over pasta."],
      tip: "Turkey is a lean, high-protein alternative that's easier to digest before evening rest.",
    },
    da: {
      name: "Kalkun-kødbolle pasta",
      prepTime: "25 min",
      ingredients: ["200g hakket kalkun", "150g fuldkornspasta", "100ml tomatsauce", "1 æg", "30g rasp", "Hvidløg, basilikum, oregano"],
      steps: ["Bland kalkun, æg, rasp og krydderurter. Form kødboller.", "Steg kødboller i olivenolie til de er gyldne (8-10 min).", "Kog pasta efter anvisning.", "Lad kødboller simre i tomatsauce 5 min. Server over pasta."],
      tip: "Kalkun er et magert proteinalternativ, der er lettere at fordøje inden aftenhvile.",
    },
  },
  {
    id: "r8",
    category: "breakfast",
    calories: 350, protein: 24, carbs: 12, fat: 22,
    en: {
      name: "Egg & Veggie Scramble",
      prepTime: "10 min",
      ingredients: ["3 eggs", "50g spinach", "1/2 bell pepper", "30g feta cheese", "1 tsp olive oil", "Salt, pepper"],
      steps: ["Heat olive oil in a pan.", "Sauté diced pepper and spinach for 2 min.", "Whisk eggs, pour into pan, scramble gently.", "Top with crumbled feta. Season and serve."],
      tip: "Eggs provide all essential amino acids — the perfect athlete's protein source.",
    },
    da: {
      name: "Æg & grøntsagsrøræg",
      prepTime: "10 min",
      ingredients: ["3 æg", "50g spinat", "1/2 peberfrugt", "30g fetaost", "1 tsk olivenolie", "Salt, peber"],
      steps: ["Varm olivenolie i en pande.", "Svits hakket peber og spinat i 2 min.", "Pisk æggene, hæld i panden og rør forsigtigt.", "Top med smuldret feta. Krydre og server."],
      tip: "Æg indeholder alle essentielle aminosyrer — den perfekte proteinkilde for atleter.",
    },
  },
  {
    id: "r9",
    category: "lunch",
    calories: 480, protein: 35, carbs: 45, fat: 16,
    en: {
      name: "Tuna & Avocado Rice Bowl",
      prepTime: "10 min",
      ingredients: ["1 can tuna (in water)", "1/2 avocado", "150g cooked rice", "1 tbsp soy sauce", "Sesame seeds", "Spring onion"],
      steps: ["Place rice in a bowl.", "Drain tuna and add on top.", "Slice avocado alongside.", "Drizzle soy sauce, top with sesame seeds and sliced spring onion."],
      tip: "Keep canned tuna stocked — it's the fastest high-protein meal you can make.",
    },
    da: {
      name: "Tun & avocado ris-skål",
      prepTime: "10 min",
      ingredients: ["1 dåse tun (i vand)", "1/2 avocado", "150g kogte ris", "1 spsk sojasauce", "Sesamfrø", "Forårsløg"],
      steps: ["Læg ris i en skål.", "Dræn tunen og læg ovenpå.", "Skær avocado i skiver ved siden af.", "Hæld sojasauce over, top med sesamfrø og snittet forårsløg."],
      tip: "Hav altid dåsetun på lager — det er det hurtigste proteinrige måltid du kan lave.",
    },
  },
  {
    id: "r10",
    category: "dinner",
    calories: 520, protein: 38, carbs: 35, fat: 20,
    en: {
      name: "Beef Stir-Fry with Vegetables",
      prepTime: "20 min",
      ingredients: ["180g beef sirloin (sliced thin)", "100g broccoli", "1 bell pepper", "100g snap peas", "2 tbsp soy sauce", "1 tbsp sesame oil", "1 clove garlic", "Cooked rice or noodles"],
      steps: ["Heat sesame oil in a wok or large pan.", "Stir-fry beef strips on high heat 2-3 min. Set aside.", "Add vegetables and garlic, stir-fry 3-4 min.", "Return beef, add soy sauce, toss together.", "Serve over rice or noodles."],
      tip: "Beef provides iron and B12 — essential for oxygen transport during high-intensity training.",
    },
    da: {
      name: "Oksekøds wok med grøntsager",
      prepTime: "20 min",
      ingredients: ["180g oksemørbrad (skåret i tynde strimler)", "100g broccoli", "1 peberfrugt", "100g sukkererter", "2 spsk sojasauce", "1 spsk sesamolie", "1 fed hvidløg", "Kogte ris eller nudler"],
      steps: ["Varm sesamolie i en wok eller stor pande.", "Steg oksekødsstrimler på høj varme 2-3 min. Sæt til side.", "Tilsæt grøntsager og hvidløg, steg 3-4 min.", "Tilsæt oksekødet igen, hæld sojasauce over, vend sammen.", "Server over ris eller nudler."],
      tip: "Oksekød giver jern og B12 — essentielt for ilttransport under højintens træning.",
    },
  },
  {
    id: "r11",
    category: "breakfast",
    calories: 400, protein: 20, carbs: 52, fat: 12,
    en: {
      name: "Overnight Oats",
      prepTime: "5 min (+ overnight)",
      ingredients: ["80g rolled oats", "200ml milk", "1 scoop protein powder", "1 tbsp chia seeds", "100g mixed berries", "1 tsp honey"],
      steps: ["Combine oats, milk, protein powder, and chia seeds in a jar.", "Stir well, cover, and refrigerate overnight.", "In the morning, top with berries and honey.", "Eat cold or microwave 2 min if preferred."],
      tip: "Prepare 3-4 jars on Sunday night for effortless weekday breakfasts.",
    },
    da: {
      name: "Overnight havregrød",
      prepTime: "5 min (+ natten over)",
      ingredients: ["80g havregryn", "200ml mælk", "1 scoop proteinpulver", "1 spsk chiafrø", "100g blandede bær", "1 tsk honning"],
      steps: ["Bland havregryn, mælk, proteinpulver og chiafrø i et glas.", "Rør godt, læg låg på og stil i køleskabet natten over.", "Om morgenen, top med bær og honning.", "Spis koldt eller varm i mikrobølgeovn 2 min."],
      tip: "Forbered 3-4 glas søndag aften til ubesværede morgenmåltider i hverdagen.",
    },
  },
  {
    id: "r12",
    category: "lunch",
    calories: 450, protein: 38, carbs: 32, fat: 18,
    en: {
      name: "Chicken Caesar Wrap",
      prepTime: "10 min",
      ingredients: ["150g grilled chicken breast", "1 large whole wheat tortilla", "30g romaine lettuce", "2 tbsp Caesar dressing (light)", "15g parmesan", "Lemon juice"],
      steps: ["Slice grilled chicken into strips.", "Lay tortilla flat, spread dressing.", "Add lettuce, chicken, and parmesan.", "Squeeze lemon juice, roll tightly, cut in half."],
      tip: "Wraps are easy to eat between training sessions when you're short on time.",
    },
    da: {
      name: "Kylling Caesar wrap",
      prepTime: "10 min",
      ingredients: ["150g grillet kyllingebryst", "1 stor fuldkornstortilla", "30g romansalat", "2 spsk Caesar dressing (light)", "15g parmesan", "Citronsaft"],
      steps: ["Skær grillet kylling i strimler.", "Læg tortillaen fladt, smør dressing på.", "Tilsæt salat, kylling og parmesan.", "Pres citronsaft over, rul stramt, skær i halve."],
      tip: "Wraps er nemme at spise mellem træningspas, når du har travlt.",
    },
  },
  {
    id: "r13",
    category: "snack",
    calories: 220, protein: 22, carbs: 20, fat: 6,
    en: {
      name: "Cottage Cheese & Fruit Plate",
      prepTime: "3 min",
      ingredients: ["200g cottage cheese", "100g pineapple chunks", "1 tbsp honey", "10g walnuts"],
      steps: ["Scoop cottage cheese onto a plate.", "Add pineapple chunks and walnuts.", "Drizzle with honey."],
      tip: "Cottage cheese is rich in casein protein — ideal for slow-release fuel between meals.",
    },
    da: {
      name: "Hytteost & frugttallerken",
      prepTime: "3 min",
      ingredients: ["200g hytteost", "100g ananasstykker", "1 spsk honning", "10g valnødder"],
      steps: ["Læg hytteost på en tallerken.", "Tilsæt ananasstykker og valnødder.", "Dryp honning over."],
      tip: "Hytteost er rig på kaseinprotein — ideel til langsom energifrigivelse mellem måltider.",
    },
  },
  {
    id: "r14",
    category: "pre-workout",
    calories: 300, protein: 10, carbs: 52, fat: 6,
    en: {
      name: "Pre-Workout Energy Smoothie",
      prepTime: "5 min",
      ingredients: ["1 banana", "150g mango chunks", "200ml orange juice", "1 tbsp oats", "1 tsp honey"],
      steps: ["Add all ingredients to a blender.", "Blend until smooth.", "Drink 45-60 minutes before training."],
      tip: "Fast-digesting carbs from fruit give quick energy without stomach discomfort.",
    },
    da: {
      name: "Energi-smoothie før træning",
      prepTime: "5 min",
      ingredients: ["1 banan", "150g mangostykker", "200ml appelsinjuice", "1 spsk havregryn", "1 tsk honning"],
      steps: ["Tilsæt alle ingredienser i en blender.", "Blend til det er glat.", "Drik 45-60 minutter før træning."],
      tip: "Hurtigt fordøjelige kulhydrater fra frugt giver hurtig energi uden mavebesvær.",
    },
  },
  {
    id: "r15",
    category: "post-workout",
    calories: 380, protein: 32, carbs: 30, fat: 12,
    en: {
      name: "Recovery Chicken Soup",
      prepTime: "30 min",
      ingredients: ["200g chicken breast", "1 carrot", "1 celery stalk", "100g egg noodles", "500ml chicken broth", "Garlic, salt, pepper, parsley"],
      steps: ["Dice carrot and celery. Mince garlic.", "Simmer chicken in broth for 15 min. Remove and shred.", "Add vegetables to broth, cook 5 min.", "Add noodles, cook until tender. Return chicken.", "Season and top with parsley."],
      tip: "Warm soup rehydrates, replenishes sodium, and delivers protein — the ultimate recovery meal.",
    },
    da: {
      name: "Restitutions-kyllingesuppe",
      prepTime: "30 min",
      ingredients: ["200g kyllingebryst", "1 gulerod", "1 bladselleri", "100g æggenudler", "500ml kyllingebouillon", "Hvidløg, salt, peber, persille"],
      steps: ["Skær gulerod og selleri i tern. Hak hvidløg.", "Kog kylling i bouillon i 15 min. Tag op og pil i stykker.", "Tilsæt grøntsager til bouillonen, kog 5 min.", "Tilsæt nudler, kog til de er møre. Tilsæt kylling igen.", "Krydre og top med persille."],
      tip: "Varm suppe rehydrerer, genopfylder natrium og leverer protein — det ultimative restitutionsmåltid.",
    },
  },
  {
    id: "r16",
    category: "snack",
    calories: 200, protein: 8, carbs: 22, fat: 10,
    en: {
      name: "Hummus & Veggie Sticks",
      prepTime: "5 min",
      ingredients: ["100g hummus", "1 carrot", "1 cucumber", "1 bell pepper", "2 whole wheat crackers"],
      steps: ["Cut vegetables into sticks.", "Scoop hummus into a small bowl.", "Arrange veggies and crackers around hummus.", "Dip and enjoy."],
      tip: "Plant-based snacking keeps energy stable without the crash of processed foods.",
    },
    da: {
      name: "Hummus & grøntsagsstave",
      prepTime: "5 min",
      ingredients: ["100g hummus", "1 gulerod", "1 agurk", "1 peberfrugt", "2 fuldkornscrackers"],
      steps: ["Skær grøntsagerne i stave.", "Hæld hummus i en lille skål.", "Arranger grøntsager og crackers rundt om hummus.", "Dyp og nyd."],
      tip: "Plantebaserede snacks holder energien stabil uden nedturen fra forarbejdede fødevarer.",
    },
  },
  {
    id: "r17",
    category: "lunch",
    calories: 530, protein: 40, carbs: 58, fat: 12,
    en: {
      name: "Teriyaki Chicken Rice Bowl",
      prepTime: "20 min",
      ingredients: ["200g chicken thigh (boneless)", "150g cooked jasmine rice", "50g edamame", "1 carrot (shredded)", "3 tbsp teriyaki sauce", "Sesame seeds"],
      steps: ["Cook chicken in a pan with teriyaki sauce, 5-6 min per side.", "Slice chicken into strips.", "Build bowl: rice base, chicken, edamame, shredded carrot.", "Drizzle remaining sauce, top with sesame seeds."],
      tip: "Jasmine rice is fast-digesting — great for refueling glycogen stores after morning training.",
    },
    da: {
      name: "Teriyaki kylling ris-skål",
      prepTime: "20 min",
      ingredients: ["200g kyllingelår (udbenet)", "150g kogte jasminris", "50g edamame", "1 gulerod (revet)", "3 spsk teriyakisauce", "Sesamfrø"],
      steps: ["Steg kylling i en pande med teriyakisauce, 5-6 min pr. side.", "Skær kyllingen i strimler.", "Byg skålen: ris i bunden, kylling, edamame, revet gulerod.", "Hæld resten af saucen over, top med sesamfrø."],
      tip: "Jasminris fordøjes hurtigt — perfekt til at genopfylde glykogenlagrene efter morgentræning.",
    },
  },
  {
    id: "r18",
    category: "breakfast",
    calories: 380, protein: 30, carbs: 38, fat: 10,
    en: {
      name: "Protein Pancakes",
      prepTime: "15 min",
      ingredients: ["1 banana", "2 eggs", "30g oats", "1 scoop protein powder", "1 tsp baking powder", "Berries for topping"],
      steps: ["Blend banana, eggs, oats, protein powder, and baking powder.", "Heat a non-stick pan on medium heat.", "Pour small circles, cook 2 min per side.", "Stack and top with fresh berries."],
      tip: "A training-day breakfast that tastes like a treat but fuels like a performance meal.",
    },
    da: {
      name: "Protein-pandekager",
      prepTime: "15 min",
      ingredients: ["1 banan", "2 æg", "30g havregryn", "1 scoop proteinpulver", "1 tsk bagepulver", "Bær til topping"],
      steps: ["Blend banan, æg, havregryn, proteinpulver og bagepulver.", "Varm en non-stick pande på medium varme.", "Hæld små cirkler, steg 2 min pr. side.", "Stak pandekagerne og top med friske bær."],
      tip: "En morgenmad på træningsdage, der smager som en dessert men giver energi som et præstationsmåltid.",
    },
  },
  {
    id: "r19",
    category: "dinner",
    calories: 450, protein: 22, carbs: 58, fat: 12,
    en: {
      name: "Lentil & Vegetable Curry",
      prepTime: "25 min",
      ingredients: ["200g red lentils", "1 can coconut milk (light)", "200g diced tomatoes", "1 onion", "2 cloves garlic", "1 tbsp curry powder", "100g spinach", "Cooked rice"],
      steps: ["Sauté diced onion and garlic in olive oil.", "Add curry powder, stir 1 min.", "Add lentils, tomatoes, and coconut milk. Simmer 15-18 min.", "Stir in spinach until wilted.", "Serve over rice."],
      tip: "Lentils are a powerhouse — high protein, high fiber, and packed with iron for plant-based recovery.",
    },
    da: {
      name: "Linse- og grøntsagscurry",
      prepTime: "25 min",
      ingredients: ["200g røde linser", "1 dåse kokosmælk (light)", "200g hakkede tomater", "1 løg", "2 fed hvidløg", "1 spsk karrypulver", "100g spinat", "Kogte ris"],
      steps: ["Svits hakket løg og hvidløg i olivenolie.", "Tilsæt karrypulver, rør i 1 min.", "Tilsæt linser, tomater og kokosmælk. Lad simre 15-18 min.", "Rør spinat i til det falder sammen.", "Server over ris."],
      tip: "Linser er et kraftcenter — høj protein, høj fiber og fulde af jern til plantebaseret restitution.",
    },
  },
  {
    id: "r20",
    category: "post-workout",
    calories: 320, protein: 16, carbs: 42, fat: 10,
    en: {
      name: "Post-Workout Chocolate Milk Recovery",
      prepTime: "2 min",
      ingredients: ["400ml whole milk", "2 tbsp cocoa powder", "1 tbsp honey", "Pinch of salt"],
      steps: ["Heat milk slightly (or use cold).", "Whisk in cocoa powder, honey, and salt.", "Drink within 30 minutes of training."],
      tip: "Research shows chocolate milk rivals expensive recovery drinks for post-exercise glycogen replenishment.",
    },
    da: {
      name: "Chokolademælk-restitution efter træning",
      prepTime: "2 min",
      ingredients: ["400ml sødmælk", "2 spsk kakaopulver", "1 spsk honning", "Et drys salt"],
      steps: ["Varm mælken let (eller brug kold).", "Pisk kakaopulver, honning og salt i.", "Drik inden for 30 minutter efter træning."],
      tip: "Forskning viser, at chokolademælk matcher dyre restitutionsdrikke til genopfyldning af glykogen efter træning.",
    },
  },
];

export function getRecipes(locale: string = "en"): Recipe[] {
  const lang = locale === "da" ? "da" : "en";
  return recipesData.map((r) => {
    const text = r[lang];
    return {
      id: r.id,
      category: r.category,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      name: text.name,
      prepTime: text.prepTime,
      ingredients: text.ingredients,
      steps: text.steps,
      tip: text.tip,
    };
  });
}

// Keep backward compat
export const recipes = getRecipes("en");
