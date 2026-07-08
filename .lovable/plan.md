## Sportsforælder-guide (AI-chat på forælderportalen)

En indlejret AI-samtalepartner på `/parent-dashboard`, der hjælper forældre med at finde deres rolle som sportsforælder. Bygger på Team Danmarks 9 råd (rollemodel, balance i støtte, understøt talentmiljø, ambassadør for trivsel, idrætsglæde, motivation, procesmål, brede fokus ud, udviklings-feedback) — plus barnets kontekst (alder, bæltegrad, klub, aktiv plan, kommende stævner) så svarene bliver konkrete, ikke generiske.

### Placering & UX
- Nyt kort på `/parent-dashboard` under "Kosttilskud & medicin": **"Spørg forældreguiden"** (foldbar, samme mønster som SupplementChecker).
- Åbner en chat-boks: forslagsknapper øverst (fx *"Mit barn er nervøs før stævne"*, *"Hvor meget skal jeg presse?"*, *"Hvordan giver jeg feedback efter dårlig træning?"*), fri tekstinput nedenunder.
- Svar streames ind. Kilde-fodnote: "Baseret på Team Danmarks forældreguide" med link.
- Historik gemmes pr. forælder+barn så samtalen kan fortsætte.

### Sikkerhedsrammer (system prompt)
- Rolle: erfaren dansk talent-idrætspsykolog-assistent. Svarer KUN på spørgsmål om forældrerollen i talent-idræt (kommunikation, motivation, pres/støtte-balance, håndtering af nederlag/sejre, trivsel, samarbejde med træner).
- Afviser høfligt: medicinsk rådgivning, kostspecifik rådgivning (henvis til supplement-checker og træner), diagnoser (angst, spiseforstyrrelser → henvis til fagperson + Team Danmarks kontakter).
- Aldrig konkurrence-taktisk rådgivning eller trænings-programmering (det er trænerens/atletens område).
- Svar på samme sprog som forælderen skriver på (DA default). Korte, konkrete, empatiske svar med max 1 opfølgende spørgsmål.
- Injicerer barnets kontekst diskret: fornavn, alder, bæltegrad, klub, evt. næste stævne — så AI kan sige "Kian har jo stævne på lørdag..." i stedet for generisk snak.

### Data & privatliv
- Ny tabel `parent_guide_conversations` (parent_user_id, athlete_id, messages jsonb, updated_at). RLS: kun forælderen selv kan læse/skrive. Atleten og træneren ser IKKE samtalen (privat refleksionsrum for forælderen).
- Ingen barn-følsomme data (dagbog, mental, sundhed) sendes til AI — kun neutrale profildata (navn, alder, bælte, klub, næste stævne).
- Rate limit i edge function: 30 beskeder/dag pr. forælder.

### Teknisk

**Ny edge function** `supabase/functions/parent-guide-chat/index.ts` (mønster fra `ai-assistant-chat`):
- Lovable AI Gateway, model `google/gemini-2.5-flash` (billig, hurtig, flersproget).
- Auth via Bearer token → `getClaims`.
- Henter barnets kontekst via service role (kun tilladte felter).
- SYSTEM_PROMPT indeholder Team Danmarks 9 principper som numereret liste + sikkerhedsrammer.
- Sanitizer på input (genbrug `_shared/sanitizePrompt.ts`).
- Streaming SSE-svar til klienten.

**Ny tabel** (migration):
```sql
CREATE TABLE public.parent_guide_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_user_id, athlete_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_guide_conversations TO authenticated;
GRANT ALL ON public.parent_guide_conversations TO service_role;
ALTER TABLE public.parent_guide_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parents_own_convo" ON public.parent_guide_conversations
  FOR ALL TO authenticated
  USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());
```

**Ny komponent** `src/components/parent/ParentGuideChat.tsx`:
- Foldbar Card + AthleteId prop.
- 4 forslagsknapper (oversat via i18n).
- Message-liste, streaming render, disabled-state når kvote nået.
- Bruger `supabase.functions.invoke` (eller fetch for streaming).

**Integration**: én ny `<Card>` blok i `src/pages/ParentDashboard.tsx` mellem SupplementChecker og SeasonCalendarMini, pr. barn.

**i18n**: nye nøgler (`parentGuideTitle`, `parentGuideIntro`, `parentGuideSuggestions` (array), `parentGuideDisclaimer`, `parentGuideSourceLink`, `parentGuideDailyLimit`, `parentGuidePlaceholder`) for alle 7 sprog. Systemprompten bliver dog altid på dansk (Team Danmark-kilden er dansk, og AI svarer på brugerens sprog uanset).

### Ude af scope for denne opgave
- Deling af chat mellem forælder og atlet/træner.
- Notifikationer / påmindelser til forælder.
- Fix af de 2 tidligere bugs (`ConsentGate` for forældre + manglende oversættelses-keys) — nævnes stadig, men laves separat hvis du beder om det.

### Åbent spørgsmål
Din formulering nævnte "samtaler mellem atlet og forældre". Jeg har tolket det som en **privat forælder-assistent** (kun forælder ser samtalen), fordi indholdet i Team Danmark-guiden retter sig direkte mod forælderen. Hvis du i stedet vil have en **fælles chat, hvor både atlet og forælder kan skrive og AI faciliterer** (fx samtale-startere før stævne, refleksionsspørgsmål efter kamp), så sig til — det ændrer datamodellen (delt thread, notifikationer, atlet-visning på `/dashboard`) men systemprompten og Team Danmark-grundlaget er stort set det samme.