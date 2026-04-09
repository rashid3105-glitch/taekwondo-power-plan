export interface MentalQuestion {
  id: string;
  category: string;
  text: { en: string; da: string };
  options: { value: number; label: { en: string; da: string } }[];
}

/** Adult questions (age 15+) — original set */
export const adultQuestions: MentalQuestion[] = [
  // Mental Toughness
  {
    id: "mt1",
    category: "mentalToughness",
    text: { en: "When training gets extremely hard, I...", da: "Når træningen bliver ekstremt hård, så..." },
    options: [
      { value: 1, label: { en: "Usually quit or give up", da: "Giver jeg normalt op" } },
      { value: 2, label: { en: "Struggle and often stop early", da: "Kæmper og stopper ofte tidligt" } },
      { value: 3, label: { en: "Push through most of the time", da: "Presser mig igennem det meste af tiden" } },
      { value: 4, label: { en: "Almost always push through", da: "Presser mig næsten altid igennem" } },
      { value: 5, label: { en: "Thrive under pressure — I love the challenge", da: "Trives under pres — jeg elsker udfordringen" } },
    ],
  },
  {
    id: "mt2",
    category: "mentalToughness",
    text: { en: "When I'm behind on points in a match, I...", da: "Når jeg er bagud på point i en kamp, så..." },
    options: [
      { value: 1, label: { en: "Panic and lose composure completely", da: "Går i panik og mister fatningen helt" } },
      { value: 2, label: { en: "Get frustrated and make more mistakes", da: "Bliver frustreret og laver flere fejl" } },
      { value: 3, label: { en: "Stay calm but struggle to change tactics", da: "Forbliver rolig, men kæmper med at ændre taktik" } },
      { value: 4, label: { en: "Stay composed and adjust my strategy", da: "Bevarer fatningen og justerer min strategi" } },
      { value: 5, label: { en: "Get more determined — being behind fuels me", da: "Bliver mere beslutsom — at være bagud driver mig" } },
    ],
  },
  {
    id: "mt3",
    category: "mentalToughness",
    text: { en: "When I experience pain or discomfort during training, I...", da: "Når jeg oplever smerte eller ubehag under træning, så..." },
    options: [
      { value: 1, label: { en: "Stop immediately and avoid the exercise", da: "Stopper med det samme og undgår øvelsen" } },
      { value: 2, label: { en: "Reduce intensity significantly and feel defeated", da: "Reducerer intensiteten markant og føler mig besejret" } },
      { value: 3, label: { en: "Modify and continue but feel distracted by it", da: "Tilpasser og fortsætter, men er distraheret af det" } },
      { value: 4, label: { en: "Assess if it's safe, then push through with control", da: "Vurderer om det er sikkert, og presser derefter igennem med kontrol" } },
      { value: 5, label: { en: "Embrace it — I know pain is part of growth", da: "Omfavner det — jeg ved smerte er en del af vækst" } },
    ],
  },
  // Competition Anxiety
  {
    id: "ca1",
    category: "competitionAnxiety",
    text: { en: "Before a competition or sparring match, I feel...", da: "Før en konkurrence eller sparringkamp føler jeg mig..." },
    options: [
      { value: 1, label: { en: "Overwhelmed with anxiety, can't function well", da: "Overvældet af angst, kan ikke fungere godt" } },
      { value: 2, label: { en: "Very nervous, it hurts my performance", da: "Meget nervøs, det påvirker min præstation negativt" } },
      { value: 3, label: { en: "Some nerves but I manage them ok", da: "Lidt nerver, men jeg håndterer dem ok" } },
      { value: 4, label: { en: "Good nerves that help me focus", da: "Gode nerver der hjælper mig med at fokusere" } },
      { value: 5, label: { en: "Calm and excited — I channel energy positively", da: "Rolig og begejstret — jeg kanaliserer energien positivt" } },
    ],
  },
  {
    id: "ca2",
    category: "competitionAnxiety",
    text: { en: "My body's physical response to competition stress is...", da: "Min krops fysiske reaktion på konkurrencestress er..." },
    options: [
      { value: 1, label: { en: "Severe — shaking, nausea, can't warm up properly", da: "Alvorlig — rysten, kvalme, kan ikke varme ordentligt op" } },
      { value: 2, label: { en: "Noticeable tension, tight muscles, shallow breathing", da: "Mærkbar spænding, stramme muskler, overfladisk vejrtrækning" } },
      { value: 3, label: { en: "Some butterflies but I can still perform", da: "Lidt sommerfugle, men jeg kan stadig præstere" } },
      { value: 4, label: { en: "Controlled adrenaline, I use breathing techniques", da: "Kontrolleret adrenalin, jeg bruger vejrtræningsteknikker" } },
      { value: 5, label: { en: "I feel energized and physically ready to compete", da: "Jeg føler mig energisk og fysisk klar til at konkurrere" } },
    ],
  },
  {
    id: "ca3",
    category: "competitionAnxiety",
    text: { en: "The night before a competition, my sleep is...", da: "Natten før en konkurrence er min søvn..." },
    options: [
      { value: 1, label: { en: "Terrible — I barely sleep, mind races all night", da: "Forfærdelig — jeg sover næsten ikke, tankerne kører hele natten" } },
      { value: 2, label: { en: "Restless, I wake up multiple times", da: "Urolig, jeg vågner flere gange" } },
      { value: 3, label: { en: "Okay but not great, some difficulty falling asleep", da: "Okay men ikke fantastisk, lidt svært at falde i søvn" } },
      { value: 4, label: { en: "Good — I have a routine that helps me relax", da: "God — jeg har en rutine der hjælper mig med at slappe af" } },
      { value: 5, label: { en: "Great — I sleep well knowing I'm prepared", da: "Fantastisk — jeg sover godt og ved jeg er forberedt" } },
    ],
  },
  // Focus & Concentration
  {
    id: "fc1",
    category: "focusConcentration",
    text: { en: "During a match or intense training, my focus is...", da: "Under en kamp eller intens træning er mit fokus..." },
    options: [
      { value: 1, label: { en: "Easily distracted, mind wanders a lot", da: "Let at distrahere, tankerne vandrer meget" } },
      { value: 2, label: { en: "Often lose focus at critical moments", da: "Mister ofte fokus på kritiske tidspunkter" } },
      { value: 3, label: { en: "Generally focused but sometimes drift", da: "Generelt fokuseret, men driver nogle gange" } },
      { value: 4, label: { en: "Strong focus, rarely lose concentration", da: "Stærkt fokus, mister sjældent koncentrationen" } },
      { value: 5, label: { en: "Laser-focused, nothing breaks my concentration", da: "Laserfokuseret, intet bryder min koncentration" } },
    ],
  },
  {
    id: "fc2",
    category: "focusConcentration",
    text: { en: "When the crowd is loud or my opponent trash-talks, I...", da: "Når publikum er højlydt eller min modstander provokerer, så..." },
    options: [
      { value: 1, label: { en: "Get completely thrown off my game", da: "Bliver fuldstændig distraheret fra min kamp" } },
      { value: 2, label: { en: "It bothers me and affects my decisions", da: "Det generer mig og påvirker mine beslutninger" } },
      { value: 3, label: { en: "Notice it but can refocus after a moment", da: "Bemærker det, men kan genfokusere efter et øjeblik" } },
      { value: 4, label: { en: "Block it out and stay in my zone", da: "Blokerer det og forbliver i min zone" } },
      { value: 5, label: { en: "Use it as fuel — external noise sharpens me", da: "Bruger det som brændstof — ekstern støj skærper mig" } },
    ],
  },
  {
    id: "fc3",
    category: "focusConcentration",
    text: { en: "Between rounds or during breaks, my mind...", da: "Mellem runder eller i pauser er mit sind..." },
    options: [
      { value: 1, label: { en: "Replays mistakes obsessively, I can't let go", da: "Genafspiller fejl tvangsmæssigt, jeg kan ikke slippe" } },
      { value: 2, label: { en: "Wanders to unrelated thoughts, hard to reset", da: "Vandrer til urelaterede tanker, svært at nulstille" } },
      { value: 3, label: { en: "Somewhat focused, but I lose my game plan", da: "Noget fokuseret, men mister min kampplan" } },
      { value: 4, label: { en: "I use breaks to breathe, reset and refocus", da: "Jeg bruger pauser til at trække vejret, nulstille og genfokusere" } },
      { value: 5, label: { en: "I have a clear mental routine for every break", da: "Jeg har en klar mental rutine for hver pause" } },
    ],
  },
  // Recovery from Loss
  {
    id: "rl1",
    category: "recoveryFromLoss",
    text: { en: "After losing a fight or performing poorly, I...", da: "Efter at have tabt en kamp eller præsteret dårligt..." },
    options: [
      { value: 1, label: { en: "Feel devastated for days/weeks, lose motivation", da: "Føler mig knust i dage/uger, mister motivationen" } },
      { value: 2, label: { en: "It affects me a lot, hard to bounce back", da: "Det påvirker mig meget, svært at komme tilbage" } },
      { value: 3, label: { en: "Disappointed but recover within a day or two", da: "Skuffet, men komme mig inden for en dag eller to" } },
      { value: 4, label: { en: "Use it as fuel, analyze and move on quickly", da: "Bruger det som brændstof, analyserer og kommer videre hurtigt" } },
      { value: 5, label: { en: "See losses as the best learning opportunities", da: "Ser nederlag som de bedste læringsmuligheder" } },
    ],
  },
  {
    id: "rl2",
    category: "recoveryFromLoss",
    text: { en: "When I watch video of a match I lost, I...", da: "Når jeg ser video af en kamp, jeg tabte, så..." },
    options: [
      { value: 1, label: { en: "Avoid it completely — too painful to watch", da: "Undgår det fuldstændigt — for smertefuldt at se" } },
      { value: 2, label: { en: "Watch but get frustrated and emotional", da: "Ser det, men bliver frustreret og følelsesladet" } },
      { value: 3, label: { en: "Can watch it and notice some mistakes", da: "Kan se det og bemærke nogle fejl" } },
      { value: 4, label: { en: "Analyze calmly and make notes for improvement", da: "Analyserer roligt og tager noter til forbedring" } },
      { value: 5, label: { en: "Love reviewing — I build a detailed improvement plan", da: "Elsker at gennemgå — jeg laver en detaljeret forbedringsplan" } },
    ],
  },
  {
    id: "rl3",
    category: "recoveryFromLoss",
    text: { en: "When a teammate beats me in training, I...", da: "Når en holdkammerat slår mig i træning, så..." },
    options: [
      { value: 1, label: { en: "Feel embarrassed and avoid sparring them again", da: "Føler mig flov og undgår at spar med dem igen" } },
      { value: 2, label: { en: "Get annoyed and it ruins the rest of my session", da: "Bliver irriteret og det ødelægger resten af min træning" } },
      { value: 3, label: { en: "Accept it but don't learn much from it", da: "Accepterer det, men lærer ikke meget af det" } },
      { value: 4, label: { en: "Ask them what they did and learn from it", da: "Spørger dem hvad de gjorde og lærer af det" } },
      { value: 5, label: { en: "Welcome it — training with better athletes makes me grow", da: "Velkomner det — at træne med bedre atleter får mig til at vokse" } },
    ],
  },
  // Confidence
  {
    id: "cf1",
    category: "confidence",
    text: { en: "My belief in my own abilities is...", da: "Min tro på mine egne evner er..." },
    options: [
      { value: 1, label: { en: "Very low — I doubt myself constantly", da: "Meget lav — jeg tvivler konstant på mig selv" } },
      { value: 2, label: { en: "Low — I often feel I'm not good enough", da: "Lav — jeg føler ofte, at jeg ikke er god nok" } },
      { value: 3, label: { en: "Moderate — depends on the situation", da: "Moderat — afhænger af situationen" } },
      { value: 4, label: { en: "High — I trust my training and skills", da: "Høj — jeg stoler på min træning og mine evner" } },
      { value: 5, label: { en: "Very high — I know I can compete with anyone", da: "Meget høj — jeg ved, at jeg kan konkurrere med alle" } },
    ],
  },
  {
    id: "cf2",
    category: "confidence",
    text: { en: "When facing a higher-ranked or bigger opponent, I...", da: "Når jeg møder en højere rangeret eller større modstander, så..." },
    options: [
      { value: 1, label: { en: "Feel defeated before the match even starts", da: "Føler mig besejret, før kampen overhovedet begynder" } },
      { value: 2, label: { en: "Feel intimidated and play it too safe", da: "Føler mig skræmt og spiller det for sikkert" } },
      { value: 3, label: { en: "Respect them but still give my best effort", da: "Respekterer dem, men giver stadig mit bedste" } },
      { value: 4, label: { en: "See it as a great test and rise to the occasion", da: "Ser det som en stor test og rejser mig til lejligheden" } },
      { value: 5, label: { en: "Love the challenge — I compete harder against top fighters", da: "Elsker udfordringen — jeg kæmper hårdere mod topkæmpere" } },
    ],
  },
  {
    id: "cf3",
    category: "confidence",
    text: { en: "When I learn a new technique, I...", da: "Når jeg lærer en ny teknik, så..." },
    options: [
      { value: 1, label: { en: "Feel overwhelmed and doubt I'll ever master it", da: "Føler mig overvældet og tvivler på at jeg nogensinde mestrer den" } },
      { value: 2, label: { en: "Try it a few times but give up quickly if it's hard", da: "Prøver det et par gange, men giver hurtigt op hvis det er svært" } },
      { value: 3, label: { en: "Practice it but feel unsure about using it in sparring", da: "Øver den, men føler mig usikker på at bruge den i sparring" } },
      { value: 4, label: { en: "Commit to drilling it until it feels natural", da: "Forpligter mig til at drilbe den indtil den føles naturlig" } },
      { value: 5, label: { en: "Get excited — new techniques are opportunities to evolve", da: "Bliver begejstret — nye teknikker er muligheder for at udvikle mig" } },
    ],
  },
  // Motivation
  {
    id: "mo1",
    category: "motivation",
    text: { en: "My motivation to train and compete is...", da: "Min motivation til at træne og konkurrere er..." },
    options: [
      { value: 1, label: { en: "Very low, I often skip training", da: "Meget lav, jeg springer ofte træning over" } },
      { value: 2, label: { en: "Inconsistent, comes and goes", da: "Ustabil, kommer og går" } },
      { value: 3, label: { en: "Steady but could be stronger", da: "Stabil, men kunne være stærkere" } },
      { value: 4, label: { en: "Strong, I'm committed to improvement", da: "Stærk, jeg er dedikeret til forbedring" } },
      { value: 5, label: { en: "Burning — TKD is my passion and purpose", da: "Brændende — TKD er min passion og mit formål" } },
    ],
  },
  {
    id: "mo2",
    category: "motivation",
    text: { en: "When I hit a training plateau with no visible progress, I...", da: "Når jeg rammer et træningsplateau uden synlige fremskridt, så..." },
    options: [
      { value: 1, label: { en: "Lose interest and consider quitting", da: "Mister interessen og overvejer at stoppe" } },
      { value: 2, label: { en: "Get discouraged and train with less intensity", da: "Bliver modløs og træner med mindre intensitet" } },
      { value: 3, label: { en: "Keep going but feel frustrated", da: "Fortsætter, men føler mig frustreret" } },
      { value: 4, label: { en: "Trust the process and stay consistent", da: "Stoler på processen og forbliver konsekvent" } },
      { value: 5, label: { en: "Get creative — try new approaches and seek coaching", da: "Bliver kreativ — prøver nye tilgange og søger coaching" } },
    ],
  },
  {
    id: "mo3",
    category: "motivation",
    text: { en: "When I see others progressing faster than me, I...", da: "Når jeg ser andre gøre hurtigere fremskridt end mig, så..." },
    options: [
      { value: 1, label: { en: "Feel hopeless and want to quit", da: "Føler mig håbløs og vil stoppe" } },
      { value: 2, label: { en: "Get jealous and it kills my motivation", da: "Bliver misundelig og det dræber min motivation" } },
      { value: 3, label: { en: "Feel a bit envious but keep training", da: "Føler mig lidt misundelig, men fortsætter med at træne" } },
      { value: 4, label: { en: "Use it as inspiration to train harder", da: "Bruger det som inspiration til at træne hårdere" } },
      { value: 5, label: { en: "Celebrate their success and focus on my own journey", da: "Fejrer deres succes og fokuserer på min egen rejse" } },
    ],
  },
  {
    id: "mo4",
    category: "motivation",
    text: { en: "My ability to set and follow through on training goals is...", da: "Min evne til at sætte og følge op på træningsmål er..." },
    options: [
      { value: 1, label: { en: "I don't set goals — I just show up when I feel like it", da: "Jeg sætter ikke mål — jeg dukker bare op når jeg har lyst" } },
      { value: 2, label: { en: "I set goals but rarely follow through", da: "Jeg sætter mål, men følger sjældent op" } },
      { value: 3, label: { en: "I set goals and sometimes achieve them", da: "Jeg sætter mål og opnår dem nogle gange" } },
      { value: 4, label: { en: "I set clear goals and track my progress consistently", da: "Jeg sætter klare mål og følger mine fremskridt konsekvent" } },
      { value: 5, label: { en: "I have a structured plan with short and long-term goals", da: "Jeg har en struktureret plan med kort- og langsigtede mål" } },
    ],
  },
];

/** Junior questions (age < 15) — simpler language, relatable scenarios */
export const juniorQuestions: MentalQuestion[] = [
  // Mental Toughness
  {
    id: "mt1",
    category: "mentalToughness",
    text: { en: "When training feels really tough and I'm tired, I...", da: "Når træningen føles rigtig hård og jeg er træt, så..." },
    options: [
      { value: 1, label: { en: "Want to stop and sit down", da: "Har lyst til at stoppe og sætte mig" } },
      { value: 2, label: { en: "Try a little but usually give up", da: "Prøver lidt, men giver som regel op" } },
      { value: 3, label: { en: "Keep going even though it's hard", da: "Fortsætter selvom det er hårdt" } },
      { value: 4, label: { en: "Tell myself 'I can do this' and push through", da: "Siger til mig selv 'det kan jeg godt' og presser igennem" } },
      { value: 5, label: { en: "Love it when it's hard — that's when I grow!", da: "Elsker det når det er hårdt — det er der jeg bliver bedre!" } },
    ],
  },
  {
    id: "mt2",
    category: "mentalToughness",
    text: { en: "When I'm losing in a match, I...", da: "Når jeg er ved at tabe en kamp, så..." },
    options: [
      { value: 1, label: { en: "Get really upset and want to cry", da: "Bliver rigtig ked af det og har lyst til at græde" } },
      { value: 2, label: { en: "Get angry and make silly mistakes", da: "Bliver sur og laver dumme fejl" } },
      { value: 3, label: { en: "Try to stay calm and keep fighting", da: "Prøver at forblive rolig og kæmpe videre" } },
      { value: 4, label: { en: "Think about what I can do differently", da: "Tænker over hvad jeg kan gøre anderledes" } },
      { value: 5, label: { en: "Fight even harder — I never give up!", da: "Kæmper endnu hårdere — jeg giver aldrig op!" } },
    ],
  },
  {
    id: "mt3",
    category: "mentalToughness",
    text: { en: "When something hurts a little during training, I...", da: "Når noget gør lidt ondt under træningen, så..." },
    options: [
      { value: 1, label: { en: "Stop right away and don't want to continue", da: "Stopper med det samme og vil ikke fortsætte" } },
      { value: 2, label: { en: "Get worried and it's hard to focus", da: "Bliver bekymret og det er svært at koncentrere mig" } },
      { value: 3, label: { en: "Tell my coach and try to keep going", da: "Fortæller min træner og prøver at fortsætte" } },
      { value: 4, label: { en: "Check if it's serious, then keep training carefully", da: "Tjekker om det er alvorligt og træner derefter forsigtigt videre" } },
      { value: 5, label: { en: "Know it's normal and keep going with a smile", da: "Ved det er normalt og fortsætter med et smil" } },
    ],
  },
  // Competition Anxiety
  {
    id: "ca1",
    category: "competitionAnxiety",
    text: { en: "Before a competition, I feel...", da: "Før et stævne føler jeg mig..." },
    options: [
      { value: 1, label: { en: "So nervous I feel sick and don't want to go", da: "Så nervøs at jeg har ondt i maven og ikke vil afsted" } },
      { value: 2, label: { en: "Really worried and can't think straight", da: "Rigtig bekymret og kan ikke tænke klart" } },
      { value: 3, label: { en: "A bit nervous but also excited", da: "Lidt nervøs, men også spændt" } },
      { value: 4, label: { en: "Excited and ready to show what I can do", da: "Spændt og klar til at vise hvad jeg kan" } },
      { value: 5, label: { en: "Super excited — competitions are the best!", da: "Mega spændt — stævner er det bedste!" } },
    ],
  },
  {
    id: "ca2",
    category: "competitionAnxiety",
    text: { en: "When I'm about to step onto the mat, my body feels...", da: "Når jeg skal ind på måtten, føles min krop..." },
    options: [
      { value: 1, label: { en: "Shaky and my tummy hurts", da: "Rystende og min mave gør ondt" } },
      { value: 2, label: { en: "Stiff and tense all over", da: "Stiv og anspændt over det hele" } },
      { value: 3, label: { en: "A little tingly but okay", da: "Lidt kriblende, men okay" } },
      { value: 4, label: { en: "Strong and full of energy", da: "Stærk og fuld af energi" } },
      { value: 5, label: { en: "Like a superhero ready to go!", da: "Som en superhelt klar til kamp!" } },
    ],
  },
  {
    id: "ca3",
    category: "competitionAnxiety",
    text: { en: "The night before a competition, I...", da: "Aftenen før et stævne..." },
    options: [
      { value: 1, label: { en: "Can't sleep at all, keep thinking about it", da: "Kan slet ikke sove, tænker hele tiden på det" } },
      { value: 2, label: { en: "Have trouble falling asleep", da: "Har svært ved at falde i søvn" } },
      { value: 3, label: { en: "Sleep okay but wake up early", da: "Sover okay, men vågner tidligt" } },
      { value: 4, label: { en: "Sleep well because I know I'm prepared", da: "Sover godt fordi jeg ved jeg er forberedt" } },
      { value: 5, label: { en: "Sleep great — I'm excited for tomorrow!", da: "Sover fantastisk — jeg glæder mig til i morgen!" } },
    ],
  },
  // Focus & Concentration
  {
    id: "fc1",
    category: "focusConcentration",
    text: { en: "During training, my focus is...", da: "Under træningen er mit fokus..." },
    options: [
      { value: 1, label: { en: "I get distracted a lot and look around", da: "Jeg bliver distraheret meget og kigger rundt" } },
      { value: 2, label: { en: "Sometimes my mind wanders to other things", da: "Nogle gange vandrer mine tanker hen til andre ting" } },
      { value: 3, label: { en: "Pretty good, I usually pay attention", da: "Ret godt, jeg er normalt opmærksom" } },
      { value: 4, label: { en: "Really focused on what my coach says", da: "Rigtig fokuseret på hvad min træner siger" } },
      { value: 5, label: { en: "100% focused — I notice every detail", da: "100% fokuseret — jeg lægger mærke til alle detaljer" } },
    ],
  },
  {
    id: "fc2",
    category: "focusConcentration",
    text: { en: "When people are watching or cheering loudly, I...", da: "Når folk kigger på eller hepper højt, så..." },
    options: [
      { value: 1, label: { en: "Get really distracted and mess up", da: "Bliver rigtig distraheret og laver fejl" } },
      { value: 2, label: { en: "Feel nervous and forget what to do", da: "Bliver nervøs og glemmer hvad jeg skal gøre" } },
      { value: 3, label: { en: "Notice them but can still focus", da: "Lægger mærke til dem, men kan stadig fokusere" } },
      { value: 4, label: { en: "It makes me try harder", da: "Det får mig til at prøve hårdere" } },
      { value: 5, label: { en: "Love it — it gives me extra energy!", da: "Elsker det — det giver mig ekstra energi!" } },
    ],
  },
  {
    id: "fc3",
    category: "focusConcentration",
    text: { en: "When I make a mistake during a match, I...", da: "Når jeg laver en fejl under en kamp, så..." },
    options: [
      { value: 1, label: { en: "Keep thinking about it and can't move on", da: "Bliver ved med at tænke på det og kan ikke komme videre" } },
      { value: 2, label: { en: "Get upset and make more mistakes", da: "Bliver ked af det og laver flere fejl" } },
      { value: 3, label: { en: "Feel bad for a moment but then try again", da: "Føler mig dårlig et øjeblik, men prøver igen" } },
      { value: 4, label: { en: "Quickly forget it and focus on the next move", da: "Glemmer det hurtigt og fokuserer på næste bevægelse" } },
      { value: 5, label: { en: "Learn from it immediately and do better", da: "Lærer af det med det samme og gør det bedre" } },
    ],
  },
  // Recovery from Loss
  {
    id: "rl1",
    category: "recoveryFromLoss",
    text: { en: "After I lose a match, I...", da: "Efter jeg taber en kamp, så..." },
    options: [
      { value: 1, label: { en: "Feel really sad and don't want to train anymore", da: "Bliver rigtig ked af det og har ikke lyst til at træne mere" } },
      { value: 2, label: { en: "Am sad for a long time and it's hard to be happy again", da: "Er ked af det længe og det er svært at blive glad igen" } },
      { value: 3, label: { en: "Feel disappointed but I'm okay the next day", da: "Føler mig skuffet, men er okay næste dag" } },
      { value: 4, label: { en: "Think about what I can improve next time", da: "Tænker på hvad jeg kan forbedre næste gang" } },
      { value: 5, label: { en: "Know that losing helps me learn and get better", da: "Ved at tabe hjælper mig med at lære og blive bedre" } },
    ],
  },
  {
    id: "rl2",
    category: "recoveryFromLoss",
    text: { en: "When my coach gives me corrections, I...", da: "Når min træner retter mig, så..." },
    options: [
      { value: 1, label: { en: "Feel bad about myself and want to stop", da: "Har det dårligt med mig selv og vil stoppe" } },
      { value: 2, label: { en: "Get frustrated because I can't do it right", da: "Bliver frustreret fordi jeg ikke kan gøre det rigtigt" } },
      { value: 3, label: { en: "Listen and try to fix it", da: "Lytter og prøver at rette det" } },
      { value: 4, label: { en: "Am happy to learn something new", da: "Er glad for at lære noget nyt" } },
      { value: 5, label: { en: "Love getting feedback — it makes me better!", da: "Elsker at få feedback — det gør mig bedre!" } },
    ],
  },
  {
    id: "rl3",
    category: "recoveryFromLoss",
    text: { en: "When a friend at the club is better than me at something, I...", da: "Når en ven i klubben er bedre end mig til noget, så..." },
    options: [
      { value: 1, label: { en: "Feel bad and don't want to try that thing", da: "Har det dårligt og vil ikke prøve den ting" } },
      { value: 2, label: { en: "Get a bit sad and compare myself to them", da: "Bliver lidt ked af det og sammenligner mig med dem" } },
      { value: 3, label: { en: "Think it's okay, everyone is good at different things", da: "Tænker det er okay, alle er gode til forskellige ting" } },
      { value: 4, label: { en: "Ask them to help me learn it too", da: "Beder dem om at hjælpe mig med at lære det også" } },
      { value: 5, label: { en: "Feel happy for them and work hard to improve too", da: "Er glad for dem og arbejder hårdt på også at forbedre mig" } },
    ],
  },
  // Confidence
  {
    id: "cf1",
    category: "confidence",
    text: { en: "How much do I believe in myself as a taekwondo athlete?", da: "Hvor meget tror jeg på mig selv som taekwondo-atlet?" },
    options: [
      { value: 1, label: { en: "I don't think I'm any good", da: "Jeg tror ikke jeg er god" } },
      { value: 2, label: { en: "I'm not sure if I'm good enough", da: "Jeg er ikke sikker på om jeg er god nok" } },
      { value: 3, label: { en: "Sometimes I feel good, sometimes not", da: "Nogle gange føler jeg mig god, andre gange ikke" } },
      { value: 4, label: { en: "I believe in myself and my training", da: "Jeg tror på mig selv og min træning" } },
      { value: 5, label: { en: "I know I'm good and getting better every day!", da: "Jeg ved jeg er god og bliver bedre hver dag!" } },
    ],
  },
  {
    id: "cf2",
    category: "confidence",
    text: { en: "When I have to fight someone bigger or more experienced, I...", da: "Når jeg skal kæmpe mod en der er større eller mere erfaren, så..." },
    options: [
      { value: 1, label: { en: "Think I have no chance and feel scared", da: "Tror jeg ikke har nogen chance og bliver bange" } },
      { value: 2, label: { en: "Feel nervous and don't really try my best", da: "Bliver nervøs og prøver ikke rigtig mit bedste" } },
      { value: 3, label: { en: "Feel a bit worried but still try", da: "Føler mig lidt bekymret, men prøver stadig" } },
      { value: 4, label: { en: "See it as a fun challenge", da: "Ser det som en sjov udfordring" } },
      { value: 5, label: { en: "Get excited — I want to show what I can do!", da: "Bliver spændt — jeg vil vise hvad jeg kan!" } },
    ],
  },
  {
    id: "cf3",
    category: "confidence",
    text: { en: "When I try a new kick or technique, I...", da: "Når jeg prøver et nyt spark eller en ny teknik, så..." },
    options: [
      { value: 1, label: { en: "Think I'll never be able to do it", da: "Tror aldrig jeg kan lære det" } },
      { value: 2, label: { en: "Try once or twice but give up if it's hard", da: "Prøver en eller to gange, men giver op hvis det er svært" } },
      { value: 3, label: { en: "Practice it but feel a bit unsure", da: "Øver det, men føler mig lidt usikker" } },
      { value: 4, label: { en: "Keep practicing until I get it right", da: "Bliver ved med at øve til jeg kan det" } },
      { value: 5, label: { en: "Love learning new things — it's the best part!", da: "Elsker at lære nye ting — det er det bedste!" } },
    ],
  },
  // Motivation
  {
    id: "mo1",
    category: "motivation",
    text: { en: "How much do I want to go to taekwondo training?", da: "Hvor meget har jeg lyst til at tage til taekwondo-træning?" },
    options: [
      { value: 1, label: { en: "I often don't want to go", da: "Jeg har ofte ikke lyst til at tage afsted" } },
      { value: 2, label: { en: "Sometimes I want to, sometimes not", da: "Nogle gange har jeg lyst, andre gange ikke" } },
      { value: 3, label: { en: "Usually I want to go", da: "Normalt har jeg lyst til at tage afsted" } },
      { value: 4, label: { en: "I almost always look forward to training", da: "Jeg glæder mig næsten altid til træning" } },
      { value: 5, label: { en: "I LOVE training — I can't wait for every session!", da: "Jeg ELSKER at træne — jeg kan ikke vente til hver session!" } },
    ],
  },
  {
    id: "mo2",
    category: "motivation",
    text: { en: "When training is boring or feels the same every time, I...", da: "Når træningen er kedelig eller føles ens hver gang, så..." },
    options: [
      { value: 1, label: { en: "Don't want to come anymore", da: "Har ikke lyst til at komme mere" } },
      { value: 2, label: { en: "Zone out and don't try very hard", da: "Melder mig ud og prøver ikke særlig hårdt" } },
      { value: 3, label: { en: "Still show up but feel a bit bored", da: "Dukker stadig op, men keder mig lidt" } },
      { value: 4, label: { en: "Try to make it fun for myself anyway", da: "Prøver at gøre det sjovt for mig selv alligevel" } },
      { value: 5, label: { en: "Find new challenges even in boring drills", da: "Finder nye udfordringer selv i kedelige øvelser" } },
    ],
  },
  {
    id: "mo3",
    category: "motivation",
    text: { en: "When other kids at the club learn things faster than me, I...", da: "Når andre børn i klubben lærer ting hurtigere end mig, så..." },
    options: [
      { value: 1, label: { en: "Think I'm bad at taekwondo and want to quit", da: "Tror jeg er dårlig til taekwondo og vil stoppe" } },
      { value: 2, label: { en: "Feel sad and jealous", da: "Bliver ked af det og misundelig" } },
      { value: 3, label: { en: "Feel a bit left behind but keep trying", da: "Føler mig lidt bagud, men fortsætter med at prøve" } },
      { value: 4, label: { en: "Know that everyone learns at their own speed", da: "Ved at alle lærer i deres eget tempo" } },
      { value: 5, label: { en: "Feel happy for them and work extra hard", da: "Er glad for dem og arbejder ekstra hårdt" } },
    ],
  },
  {
    id: "mo4",
    category: "motivation",
    text: { en: "Do I have goals for my taekwondo?", da: "Har jeg mål for min taekwondo?" },
    options: [
      { value: 1, label: { en: "Not really, I just go because my parents say so", da: "Ikke rigtig, jeg går bare fordi mine forældre siger det" } },
      { value: 2, label: { en: "Kind of, but I don't think about them much", da: "Lidt, men jeg tænker ikke så meget over dem" } },
      { value: 3, label: { en: "Yes, I want to get the next belt", da: "Ja, jeg vil gerne have næste bælte" } },
      { value: 4, label: { en: "Yes, I have clear goals and I work towards them", da: "Ja, jeg har klare mål og arbejder hen imod dem" } },
      { value: 5, label: { en: "Yes! I dream big and train hard to get there!", da: "Ja! Jeg drømmer stort og træner hårdt for at nå dertil!" } },
    ],
  },
];

/** Age threshold for junior vs adult questions */
export const JUNIOR_AGE_THRESHOLD = 15;

/** Get the right question set based on athlete age */
export function getQuestionsForAge(age: number | null | undefined): MentalQuestion[] {
  if (age != null && age < JUNIOR_AGE_THRESHOLD) {
    return juniorQuestions;
  }
  return adultQuestions;
}
