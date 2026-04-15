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
  // ─── r21–r40: 20 additional athlete recipes ───
  {
    id: "r21",
    category: "breakfast",
    calories: 410, protein: 28, carbs: 44, fat: 14,
    en: {
      name: "Overnight Protein Oats",
      prepTime: "5 min (+ overnight)",
      ingredients: ["80g rolled oats", "1 scoop vanilla protein powder", "200ml almond milk", "1 tbsp chia seeds", "1 tbsp almond butter", "Cinnamon"],
      steps: ["Mix oats, protein powder, milk, and chia seeds in a jar.", "Stir in almond butter.", "Refrigerate overnight.", "Top with cinnamon and eat cold or warmed."],
      tip: "Protein powder in overnight oats turns a basic breakfast into a 28g protein recovery meal.",
    },
    da: {
      name: "Overnight protein-havregryn",
      prepTime: "5 min (+ natten over)",
      ingredients: ["80g havregryn", "1 scoop vanilje proteinpulver", "200ml mandelmælk", "1 spsk chiafrø", "1 spsk mandelbutter", "Kanel"],
      steps: ["Bland havregryn, proteinpulver, mælk og chiafrø i et glas.", "Rør mandelbutter i.", "Stil i køleskabet natten over.", "Top med kanel og spis koldt eller varmt."],
      tip: "Proteinpulver i overnight oats gør en simpel morgenmad til et 28g protein-restitutionsmåltid.",
    },
  },
  {
    id: "r22",
    category: "breakfast",
    calories: 380, protein: 22, carbs: 34, fat: 16,
    en: {
      name: "Scrambled Egg & Avocado Wrap",
      prepTime: "8 min",
      ingredients: ["3 eggs", "1 whole wheat tortilla", "1/2 avocado", "Cherry tomatoes", "Salt, pepper", "Hot sauce (optional)"],
      steps: ["Scramble eggs in a non-stick pan.", "Warm tortilla briefly.", "Spread mashed avocado on tortilla.", "Add eggs, halved tomatoes, and season. Roll up."],
      tip: "Avocado adds healthy monounsaturated fats that support hormone production in athletes.",
    },
    da: {
      name: "Røræg & avocado-wrap",
      prepTime: "8 min",
      ingredients: ["3 æg", "1 fuldkornstortilla", "1/2 avocado", "Cherrytomater", "Salt, peber", "Chilisauce (valgfrit)"],
      steps: ["Lav røræg i en non-stick pande.", "Varm tortillaen kort.", "Smør moset avocado på tortillaen.", "Tilsæt æg, halverede tomater og krydre. Rul sammen."],
      tip: "Avocado tilføjer sunde enkeltumættede fedtsyrer, der støtter hormonproduktionen hos atleter.",
    },
  },
  {
    id: "r23",
    category: "breakfast",
    calories: 360, protein: 26, carbs: 40, fat: 10,
    en: {
      name: "Banana Protein Muffins",
      prepTime: "25 min",
      ingredients: ["2 ripe bananas", "2 eggs", "60g oat flour", "1 scoop protein powder", "1 tsp baking powder", "1 tbsp honey"],
      steps: ["Preheat oven to 180°C.", "Mash bananas, whisk in eggs.", "Fold in oat flour, protein powder, and baking powder.", "Pour into muffin tin (makes 6). Bake 18-20 min."],
      tip: "Batch-bake on rest days for grab-and-go breakfasts all week.",
    },
    da: {
      name: "Banan protein-muffins",
      prepTime: "25 min",
      ingredients: ["2 modne bananer", "2 æg", "60g havremel", "1 scoop proteinpulver", "1 tsk bagepulver", "1 spsk honning"],
      steps: ["Forvarm ovnen til 180°C.", "Mos bananerne, pisk æggene i.", "Fold havremel, proteinpulver og bagepulver i.", "Hæld i muffinform (giver 6 stk). Bag 18-20 min."],
      tip: "Bag på hviledage og hav morgenmad klar til hele ugen.",
    },
  },
  {
    id: "r24",
    category: "breakfast",
    calories: 370, protein: 18, carbs: 50, fat: 12,
    en: {
      name: "Bircher Muesli",
      prepTime: "10 min (+ overnight)",
      ingredients: ["80g rolled oats", "150ml apple juice", "100g Greek yogurt", "1 apple (grated)", "20g raisins", "10g sunflower seeds"],
      steps: ["Mix oats with apple juice in a jar.", "Refrigerate overnight.", "In the morning, stir in yogurt and grated apple.", "Top with raisins and sunflower seeds."],
      tip: "The Swiss athlete classic — slow-release energy that keeps you fueled through morning sessions.",
    },
    da: {
      name: "Bircher müsli",
      prepTime: "10 min (+ natten over)",
      ingredients: ["80g havregryn", "150ml æblejuice", "100g græsk yoghurt", "1 æble (revet)", "20g rosiner", "10g solsikkefrø"],
      steps: ["Bland havregryn med æblejuice i et glas.", "Stil i køleskabet natten over.", "Om morgenen, rør yoghurt og revet æble i.", "Top med rosiner og solsikkefrø."],
      tip: "Den schweiziske atletklassiker — langsom energifrigivelse der holder dig kørende hele morgentræningen.",
    },
  },
  {
    id: "r25",
    category: "lunch",
    calories: 520, protein: 40, carbs: 52, fat: 14,
    en: {
      name: "Turkey & Quinoa Power Bowl",
      prepTime: "20 min",
      ingredients: ["200g ground turkey", "150g cooked quinoa", "100g black beans", "1/2 avocado", "50g corn", "Lime, cumin, chili powder"],
      steps: ["Brown turkey with cumin and chili powder.", "Build bowl: quinoa base, turkey, black beans, corn.", "Slice avocado on top.", "Squeeze lime over everything."],
      tip: "Quinoa is a complete protein — combined with turkey, this bowl delivers all essential amino acids.",
    },
    da: {
      name: "Kalkun & quinoa power-skål",
      prepTime: "20 min",
      ingredients: ["200g hakket kalkun", "150g kogt quinoa", "100g sorte bønner", "1/2 avocado", "50g majs", "Lime, spidskommen, chilipulver"],
      steps: ["Brun kalkunen med spidskommen og chilipulver.", "Byg skålen: quinoa i bunden, kalkun, sorte bønner, majs.", "Skær avocado i skiver ovenpå.", "Pres lime over det hele."],
      tip: "Quinoa er et komplet protein — kombineret med kalkun leverer denne skål alle essentielle aminosyrer.",
    },
  },
  {
    id: "r26",
    category: "lunch",
    calories: 460, protein: 35, carbs: 28, fat: 22,
    en: {
      name: "Tuna Niçoise Salad",
      prepTime: "15 min",
      ingredients: ["1 can tuna (in olive oil)", "2 hard-boiled eggs", "100g green beans", "8 cherry tomatoes", "6 olives", "1 tbsp Dijon vinaigrette"],
      steps: ["Blanch green beans 3 min, cool in ice water.", "Arrange tuna, halved eggs, beans, tomatoes, and olives on a plate.", "Drizzle with vinaigrette.", "Season with salt and pepper."],
      tip: "A Mediterranean classic packed with omega-3s, protein, and healthy fats for sustained training energy.",
    },
    da: {
      name: "Tun Niçoise-salat",
      prepTime: "15 min",
      ingredients: ["1 dåse tun (i olivenolie)", "2 hårdkogte æg", "100g grønne bønner", "8 cherrytomater", "6 oliven", "1 spsk Dijon-vinaigrette"],
      steps: ["Blancher grønne bønner 3 min, afkøl i isvand.", "Arranger tun, halverede æg, bønner, tomater og oliven på en tallerken.", "Hæld vinaigrette over.", "Krydre med salt og peber."],
      tip: "En middelhavs-klassiker fyldt med omega-3, protein og sunde fedtsyrer til vedvarende træningsenergi.",
    },
  },
  {
    id: "r27",
    category: "lunch",
    calories: 490, protein: 32, carbs: 58, fat: 14,
    en: {
      name: "Black Bean & Sweet Potato Bowl",
      prepTime: "25 min",
      ingredients: ["1 medium sweet potato", "150g black beans", "100g cooked rice", "50g salsa", "30g Greek yogurt", "Cilantro, lime"],
      steps: ["Cube sweet potato, roast at 200°C for 20 min.", "Warm black beans.", "Build bowl: rice, sweet potato, beans.", "Top with salsa, yogurt, cilantro, and lime."],
      tip: "A plant-based powerhouse — black beans and sweet potato deliver fiber, iron, and slow-burning carbs.",
    },
    da: {
      name: "Sorte bønner & sød kartoffel-skål",
      prepTime: "25 min",
      ingredients: ["1 mellem sød kartoffel", "150g sorte bønner", "100g kogte ris", "50g salsa", "30g græsk yoghurt", "Koriander, lime"],
      steps: ["Skær sød kartoffel i tern, rist ved 200°C i 20 min.", "Varm sorte bønner.", "Byg skålen: ris, sød kartoffel, bønner.", "Top med salsa, yoghurt, koriander og lime."],
      tip: "Et plantebaseret kraftcenter — sorte bønner og sød kartoffel giver fiber, jern og langsomt forbrændende kulhydrater.",
    },
  },
  {
    id: "r28",
    category: "lunch",
    calories: 510, protein: 38, carbs: 48, fat: 16,
    en: {
      name: "Chicken Pesto Pasta Salad",
      prepTime: "15 min",
      ingredients: ["150g grilled chicken breast", "120g whole wheat fusilli (cooked)", "2 tbsp pesto", "50g cherry tomatoes", "30g mozzarella", "Fresh basil"],
      steps: ["Slice grilled chicken.", "Toss pasta with pesto.", "Add chicken, halved tomatoes, and torn mozzarella.", "Garnish with fresh basil."],
      tip: "Great cold or warm — perfect for meal prep boxes between double training sessions.",
    },
    da: {
      name: "Kylling pesto pasta-salat",
      prepTime: "15 min",
      ingredients: ["150g grillet kyllingebryst", "120g fuldkorns fusilli (kogt)", "2 spsk pesto", "50g cherrytomater", "30g mozzarella", "Frisk basilikum"],
      steps: ["Skær grillet kylling i skiver.", "Vend pasta med pesto.", "Tilsæt kylling, halverede tomater og revet mozzarella.", "Pynt med frisk basilikum."],
      tip: "Fantastisk kold eller varm — perfekt til meal prep-bokse mellem dobbelte træningspas.",
    },
  },
  {
    id: "r29",
    category: "dinner",
    calories: 540, protein: 42, carbs: 38, fat: 22,
    en: {
      name: "Grilled Salmon with Roasted Vegetables",
      prepTime: "25 min",
      ingredients: ["180g salmon fillet", "1 zucchini", "1 bell pepper", "100g cherry tomatoes", "2 tbsp olive oil", "Herbs de Provence"],
      steps: ["Preheat oven to 200°C.", "Toss chopped vegetables with olive oil and herbs, roast 15 min.", "Season salmon with salt and pepper.", "Add salmon to tray, roast another 12 min."],
      tip: "Roasting vegetables with salmon on one tray saves time and maximizes nutrient retention.",
    },
    da: {
      name: "Grillet laks med ristede grøntsager",
      prepTime: "25 min",
      ingredients: ["180g laksefilet", "1 squash", "1 peberfrugt", "100g cherrytomater", "2 spsk olivenolie", "Herbes de Provence"],
      steps: ["Forvarm ovnen til 200°C.", "Vend hakkede grøntsager med olivenolie og krydderier, rist 15 min.", "Krydre laksen med salt og peber.", "Tilsæt laks til bradepanden, rist yderligere 12 min."],
      tip: "At riste grøntsager med laks på én plade sparer tid og bevarer næringsstofferne bedst muligt.",
    },
  },
  {
    id: "r30",
    category: "dinner",
    calories: 560, protein: 44, carbs: 42, fat: 20,
    en: {
      name: "Chicken Tikka with Basmati Rice",
      prepTime: "30 min",
      ingredients: ["200g chicken breast", "100g Greek yogurt", "2 tbsp tikka paste", "150g basmati rice", "Lemon juice", "Fresh coriander"],
      steps: ["Marinate chicken in yogurt and tikka paste for 10 min.", "Grill or pan-fry chicken 6-7 min per side.", "Cook basmati rice.", "Slice chicken, serve over rice with lemon and coriander."],
      tip: "Yogurt-based marinades tenderize chicken while adding protein — a double win for athletes.",
    },
    da: {
      name: "Chicken tikka med basmatiris",
      prepTime: "30 min",
      ingredients: ["200g kyllingebryst", "100g græsk yoghurt", "2 spsk tikka-paste", "150g basmatiris", "Citronsaft", "Frisk koriander"],
      steps: ["Mariner kylling i yoghurt og tikka-paste i 10 min.", "Gril eller steg kyllingen 6-7 min pr. side.", "Kog basmatiris.", "Skær kyllingen i skiver, server over ris med citron og koriander."],
      tip: "Yoghurt-baserede marinader mørner kyllingen og tilføjer protein — en dobbelt gevinst for atleter.",
    },
  },
  {
    id: "r31",
    category: "dinner",
    calories: 480, protein: 36, carbs: 50, fat: 14,
    en: {
      name: "Shrimp Pasta Primavera",
      prepTime: "20 min",
      ingredients: ["150g shrimp (peeled)", "120g penne pasta", "1 zucchini", "100g cherry tomatoes", "2 cloves garlic", "1 tbsp olive oil", "Fresh parsley"],
      steps: ["Cook pasta al dente.", "Sauté garlic in olive oil, add shrimp, cook 3 min.", "Add diced zucchini and halved tomatoes, cook 3 min.", "Toss with pasta. Garnish with parsley."],
      tip: "Shrimp is one of the leanest protein sources — high protein, minimal fat, fast to cook.",
    },
    da: {
      name: "Rejepasta primavera",
      prepTime: "20 min",
      ingredients: ["150g rejer (pillede)", "120g penne pasta", "1 squash", "100g cherrytomater", "2 fed hvidløg", "1 spsk olivenolie", "Frisk persille"],
      steps: ["Kog pasta al dente.", "Svits hvidløg i olivenolie, tilsæt rejer, steg 3 min.", "Tilsæt tern af squash og halverede tomater, steg 3 min.", "Vend med pasta. Pynt med persille."],
      tip: "Rejer er en af de magreste proteinkilder — høj protein, minimal fedt, hurtig at tilberede.",
    },
  },
  {
    id: "r32",
    category: "dinner",
    calories: 590, protein: 40, carbs: 55, fat: 20,
    en: {
      name: "Beef Bolognese with Whole Wheat Spaghetti",
      prepTime: "35 min",
      ingredients: ["200g lean ground beef", "150g whole wheat spaghetti", "200g crushed tomatoes", "1 carrot (diced)", "1 celery stalk (diced)", "1 onion", "Garlic, oregano, basil"],
      steps: ["Sauté onion, carrot, celery, and garlic.", "Add beef, brown 5 min.", "Pour in tomatoes, season with herbs. Simmer 20 min.", "Cook spaghetti. Serve with sauce on top."],
      tip: "Lean beef bolognese delivers iron, zinc, and B-vitamins crucial for athletic performance.",
    },
    da: {
      name: "Oksekøds-bolognese med fuldkornsspaghetti",
      prepTime: "35 min",
      ingredients: ["200g magert hakket oksekød", "150g fuldkornsspaghetti", "200g knuste tomater", "1 gulerod (i tern)", "1 bladselleri (i tern)", "1 løg", "Hvidløg, oregano, basilikum"],
      steps: ["Svits løg, gulerod, selleri og hvidløg.", "Tilsæt oksekød, brun i 5 min.", "Hæld tomater i, krydre med urter. Lad simre 20 min.", "Kog spaghetti. Server med sauce ovenpå."],
      tip: "Mager bolognese leverer jern, zink og B-vitaminer, der er afgørende for atletisk præstation.",
    },
  },
  {
    id: "r33",
    category: "snack",
    calories: 190, protein: 20, carbs: 18, fat: 5,
    en: {
      name: "Cottage Cheese & Pineapple Cup",
      prepTime: "2 min",
      ingredients: ["200g low-fat cottage cheese", "80g pineapple chunks", "1 tsp honey", "Mint leaves"],
      steps: ["Scoop cottage cheese into a cup.", "Add pineapple chunks.", "Drizzle honey and garnish with mint."],
      tip: "Casein in cottage cheese digests slowly — eat this before bed to support overnight muscle repair.",
    },
    da: {
      name: "Hytteost & ananas-bæger",
      prepTime: "2 min",
      ingredients: ["200g fedtfattig hytteost", "80g ananasstykker", "1 tsk honning", "Mynteblade"],
      steps: ["Hæld hytteost i et bæger.", "Tilsæt ananasstykker.", "Dryp honning over og pynt med mynte."],
      tip: "Kasein i hytteost fordøjes langsomt — spis dette før sengetid for at støtte muskelreparation om natten.",
    },
  },
  {
    id: "r34",
    category: "snack",
    calories: 210, protein: 6, carbs: 28, fat: 9,
    en: {
      name: "Trail Mix Energy Bites",
      prepTime: "10 min",
      ingredients: ["100g rolled oats", "60g mixed nuts (crushed)", "40g dried cranberries", "2 tbsp honey", "2 tbsp coconut oil (melted)", "1 tbsp cocoa powder"],
      steps: ["Mix all ingredients in a bowl.", "Roll into small balls (makes ~10).", "Refrigerate 30 min.", "Store in an airtight container for up to a week."],
      tip: "Keep a batch in your gym bag — natural energy without the crash of processed energy bars.",
    },
    da: {
      name: "Trail mix energikugler",
      prepTime: "10 min",
      ingredients: ["100g havregryn", "60g blandede nødder (knuste)", "40g tørrede tranebær", "2 spsk honning", "2 spsk kokosolie (smeltet)", "1 spsk kakaopulver"],
      steps: ["Bland alle ingredienser i en skål.", "Rul til små kugler (ca. 10 stk.).", "Sæt i køleskabet 30 min.", "Opbevar i en lufttæt beholder op til en uge."],
      tip: "Hav altid en portion i træningstasken — naturlig energi uden nedturen fra forarbejdede energibarer.",
    },
  },
  {
    id: "r35",
    category: "snack",
    calories: 180, protein: 12, carbs: 20, fat: 6,
    en: {
      name: "Greek Yogurt & Granola Cup",
      prepTime: "3 min",
      ingredients: ["150g Greek yogurt", "30g granola", "1 tbsp honey", "Fresh strawberries"],
      steps: ["Layer yogurt in a glass.", "Add granola.", "Top with sliced strawberries and drizzle honey."],
      tip: "The protein-carb combo makes this an ideal snack 2 hours before competition.",
    },
    da: {
      name: "Græsk yoghurt & granola-bæger",
      prepTime: "3 min",
      ingredients: ["150g græsk yoghurt", "30g granola", "1 spsk honning", "Friske jordbær"],
      steps: ["Lag yoghurt i et glas.", "Tilsæt granola.", "Top med skivede jordbær og dryp honning over."],
      tip: "Protein-kulhydrat-kombinationen gør dette til en ideel snack 2 timer før konkurrence.",
    },
  },
  {
    id: "r36",
    category: "pre-workout",
    calories: 280, protein: 8, carbs: 38, fat: 12,
    en: {
      name: "Rice Cakes with Almond Butter & Banana",
      prepTime: "3 min",
      ingredients: ["2 rice cakes", "2 tbsp almond butter", "1 banana (sliced)", "Drizzle of honey"],
      steps: ["Spread almond butter on rice cakes.", "Top with banana slices.", "Drizzle honey over."],
      tip: "Light, fast-digesting, and energy-dense — the ideal fuel 45 min before sparring.",
    },
    da: {
      name: "Riskager med mandelbutter & banan",
      prepTime: "3 min",
      ingredients: ["2 riskager", "2 spsk mandelbutter", "1 banan (i skiver)", "Lidt honning"],
      steps: ["Smør mandelbutter på riskagerne.", "Læg bananskiver ovenpå.", "Dryp honning over."],
      tip: "Let, hurtigt fordøjeligt og energitæt — det ideelle brændstof 45 min før sparring.",
    },
  },
  {
    id: "r37",
    category: "pre-workout",
    calories: 290, protein: 6, carbs: 52, fat: 8,
    en: {
      name: "Banana & Date Smoothie",
      prepTime: "3 min",
      ingredients: ["1 banana", "4 Medjool dates (pitted)", "200ml oat milk", "1 tbsp peanut butter", "Pinch of cinnamon"],
      steps: ["Add all ingredients to a blender.", "Blend until smooth.", "Drink 30-45 min before training."],
      tip: "Dates are nature's energy gel — concentrated natural sugars for quick muscle fuel.",
    },
    da: {
      name: "Banan & daddel-smoothie",
      prepTime: "3 min",
      ingredients: ["1 banan", "4 Medjool-dadler (udstenet)", "200ml havremælk", "1 spsk peanutbutter", "Et drys kanel"],
      steps: ["Tilsæt alle ingredienser i en blender.", "Blend til det er glat.", "Drik 30-45 min før træning."],
      tip: "Dadler er naturens energigel — koncentrerede naturlige sukkerarter til hurtigt muskelbrændstof.",
    },
  },
  {
    id: "r38",
    category: "pre-workout",
    calories: 260, protein: 8, carbs: 40, fat: 8,
    en: {
      name: "Oat & Honey Energy Bars",
      prepTime: "20 min (+ chill)",
      ingredients: ["150g rolled oats", "60g honey", "40g peanut butter", "30g dried apricots (chopped)", "20g pumpkin seeds", "Pinch of salt"],
      steps: ["Mix oats, peanut butter, and honey in a bowl.", "Fold in apricots, pumpkin seeds, and salt.", "Press into a lined tray.", "Refrigerate 1 hour, cut into 8 bars."],
      tip: "Homemade bars cost a fraction of store-bought and contain zero artificial ingredients.",
    },
    da: {
      name: "Havre & honning energibarer",
      prepTime: "20 min (+ afkøling)",
      ingredients: ["150g havregryn", "60g honning", "40g peanutbutter", "30g tørrede abrikoser (hakkede)", "20g græskarkerner", "Et drys salt"],
      steps: ["Bland havregryn, peanutbutter og honning i en skål.", "Fold abrikoser, græskarkerner og salt i.", "Tryk ned i en foret bradepande.", "Sæt i køleskabet 1 time, skær i 8 barer."],
      tip: "Hjemmelavede barer koster en brøkdel af købte og indeholder nul kunstige ingredienser.",
    },
  },
  {
    id: "r39",
    category: "post-workout",
    calories: 420, protein: 38, carbs: 48, fat: 8,
    en: {
      name: "Tuna & Rice Recovery Bowl",
      prepTime: "10 min",
      ingredients: ["1 can tuna (in water)", "150g cooked white rice", "50g edamame", "1 tbsp soy sauce", "1 tsp sesame oil", "Sesame seeds, spring onion"],
      steps: ["Place warm rice in a bowl.", "Drain tuna and flake on top.", "Add edamame.", "Drizzle soy sauce and sesame oil. Top with seeds and spring onion."],
      tip: "White rice after training replenishes glycogen faster than brown rice — save brown rice for other meals.",
    },
    da: {
      name: "Tun & ris restitutions-skål",
      prepTime: "10 min",
      ingredients: ["1 dåse tun (i vand)", "150g kogte hvide ris", "50g edamame", "1 spsk sojasauce", "1 tsk sesamolie", "Sesamfrø, forårsløg"],
      steps: ["Læg varme ris i en skål.", "Dræn tunen og pil den i stykker ovenpå.", "Tilsæt edamame.", "Hæld sojasauce og sesamolie over. Top med frø og forårsløg."],
      tip: "Hvide ris efter træning genopfylder glykogen hurtigere end brune ris — gem brune ris til andre måltider.",
    },
  },
  {
    id: "r40",
    category: "post-workout",
    calories: 350, protein: 28, carbs: 42, fat: 8,
    en: {
      name: "Berry Protein Smoothie Bowl",
      prepTime: "5 min",
      ingredients: ["1 scoop protein powder", "100g frozen mixed berries", "1 banana", "100ml milk", "30g granola", "1 tbsp coconut flakes"],
      steps: ["Blend protein powder, frozen berries, banana, and milk until thick.", "Pour into a bowl.", "Top with granola and coconut flakes.", "Eat with a spoon — it should be thick, not drinkable."],
      tip: "Frozen berries make the smoothie bowl thick and ice-cream-like — the perfect post-training reward.",
    },
    da: {
      name: "Bær protein smoothie-skål",
      prepTime: "5 min",
      ingredients: ["1 scoop proteinpulver", "100g frosne blandede bær", "1 banan", "100ml mælk", "30g granola", "1 spsk kokosflager"],
      steps: ["Blend proteinpulver, frosne bær, banan og mælk til det er tykt.", "Hæld i en skål.", "Top med granola og kokosflager.", "Spis med en ske — det skal være tykt, ikke flydende."],
      tip: "Frosne bær gør smoothie-skålen tyk og is-agtig — den perfekte belønning efter træning.",
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
