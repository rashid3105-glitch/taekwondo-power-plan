# Ret invitationslinket AURYRF9U

## Konstateret i live-appen
- `https://sportstalent.dk/join/AURYRF9U` er aktivt og viser korrekt klubben Kristianstad Taekwondo.
- Fejlen opstår ved tryk på **Opret konto**: siden sender brugeren til `/invite-signup?code=AURYRF9U`, men den adresse findes ikke og ender på 404-siden.
- Den eksisterende tilmeldingsside findes på `/invite/:code` og forventer koden i adressen.

## Ændringer
1. Ret **Opret konto** til at åbne `/invite/AURYRF9U` via den eksisterende invitationsside.
2. Tilføj en kompatibel viderestilling fra den fejlagtige `/invite-signup?code=...`-adresse, så allerede åbne eller gemte links også virker.
3. Bevar invitationskoden gennem mailbekræftelse og login, og gør en mislykket indmeldelse synlig i stedet for at ignorere fejlen.
4. Brug eksisterende oversættelser og tilføj eventuelle nødvendige beskeder på alle syv sprog.

## Kontrol
- Test det konkrete link som udlogget bruger frem til opret-konto-siden uden 404.
- Test **Log ind** og bekræft, at invitationskoden følger med.
- Kontrollér, at indmeldelsen knytter atleten til invitationsklubben og træneren, samt at en reel fejl vises forståeligt.
