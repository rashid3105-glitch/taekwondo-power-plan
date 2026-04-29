## Medical Document Translator (Rehab tab)

A helper that turns medical jargon (doctor's notes, MRI/X-ray reports, discharge papers) into something an athlete can understand. Result is shown on screen only — not saved.

### User flow

1. In the Rehab tab, below the "Generate Rehab Plan" card, a new card: **"Understand a medical document"**.
2. User can either:
   - Paste/type text into a textarea, OR
   - Upload an image (JPG/PNG/HEIC) of the document, OR
   - Upload a PDF of the report.
3. Click **"Translate to plain language"**.
4. The system returns a structured explanation in the user's selected language:
   - **Summary** — 2-3 sentence overview
   - **Key findings** — bullet list, each medical term followed by a plain-language explanation
   - **What this likely means for training** — TKD-relevant context
   - **Questions to ask your doctor** — 3-5 follow-up questions
   - **Disclaimer** — clearly states this is not medical advice
5. User can copy the explanation or clear it and start over.

### Safety & guardrails

- Visible disclaimer above and below the result: "This is an educational explanation, not medical advice. Always follow your doctor's or physiotherapist's instructions."
- No diagnoses, no treatment recommendations, no medication dosing.
- File size limit: 10 MB. Text limit: 15,000 characters.
- Result is one-off — nothing stored in the database. Files are sent to the edge function and discarded.

### Technical details

**New edge function: `translate-medical-document`** (verify_jwt = true)
- Accepts `{ text?: string, fileBase64?: string, mimeType?: string, language: string }`.
- Validates: at least one of text or file is provided, payload < 12 MB, text < 15,000 chars, mimeType in allowed list (`image/jpeg`, `image/png`, `image/webp`, `image/heic`, `application/pdf`, `text/plain`).
- Calls Lovable AI Gateway with `google/gemini-3-flash-preview` (vision-capable, handles images and PDFs natively via `image_url` content parts with base64 data URI; PDFs sent the same way).
- System prompt: "You are a medical communicator helping a martial arts athlete understand a medical document. Translate jargon into plain ${lang}. Never diagnose, never prescribe, never give dosing advice. If the document is not medical, say so."
- Uses tool-calling for structured output: returns `{ summary, keyFindings: [{term, explanation}], trainingImplications, questionsForDoctor: [string] }`.
- Handles 429/402 from gateway and surfaces friendly errors.

**New component: `src/components/MedicalDocumentTranslator.tsx`**
- Tabs: "Paste text" | "Upload file"
- File input with drag-and-drop, accepts the allowed MIME types, shows filename + size.
- Converts file to base64 client-side.
- Calls the edge function via `supabase.functions.invoke`.
- Renders result with the structured sections, copy button, clear button.
- Loading state with spinner; error toasts.

**Dashboard integration**
- Import and render `<MedicalDocumentTranslator />` inside the rehab tab block in `src/pages/Dashboard.tsx`, placed below the rehab plan generator card.
- Gated the same way as the rehab plan: hidden in demo mode (`renderDemoLockedState`), available to all paid/free users (no coach gating needed since it's just educational).

**i18n**
- Add ~15 keys to `src/i18n/translations.ts` for all 6 supported languages (DA, EN, SV, DE, AR, NO):
  - card title, description, tab labels, placeholder, button label, loading text, disclaimer, section headers (summary, key findings, training implications, questions for doctor), copy/clear button labels, file too large error, unsupported file error.

**Config**
- Add `[functions.translate-medical-document]` block to `supabase/config.toml` (default `verify_jwt = true` is fine, no override needed — but added explicitly for clarity).

### Files touched

- new: `supabase/functions/translate-medical-document/index.ts`
- new: `src/components/MedicalDocumentTranslator.tsx`
- edit: `src/pages/Dashboard.tsx` (add component into rehab tab section)
- edit: `src/i18n/translations.ts` (new keys × 6 languages)
- edit: `supabase/config.toml` (optional explicit block)

### Out of scope

- Saving translations to history (per your decision)
- OCR fallback (Gemini handles images and PDFs directly via vision)
- Per-paragraph term highlighting in the source document
- Sharing the translation with a coach
