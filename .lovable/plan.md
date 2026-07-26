## Mål
Give dig et brugbart login til demokontoen "Demo Athlete – Emma" (bekræftet i databasen, `is_demo = true`, godkendt, tilknyttet demoklub, atletkode TKD-634802).

## Vigtigt om adgangskoder
Adgangskoder gemmes kun som hash og kan ikke læses ud. Den eksisterende kode kan derfor ikke findes — den skal sættes til en ny, kendt værdi.

## Hvad jeg gør
1. Slår Emmas e-mail op på hendes bruger-id via admin-API'et (auth-tabellen kan ikke læses direkte).
2. Sætter en ny adgangskode på kontoen og bekræfter e-mailen, så login virker med det samme.
3. Verificerer at login faktisk lykkes med de nye oplysninger.
4. Rydder op i det midlertidige værktøj, der bruges til opdateringen.
5. Giver dig e-mail + adgangskode i chatten.

## Valg du kan tage
Hvis du vil have en bestemt adgangskode (fx til App Review), så skriv den — ellers bruger jeg `DemoEmma2026!`.

## Teknisk
- Midlertidig edge function med service-role, der kalder `auth.admin.getUserById` + `auth.admin.updateUserById` for `b430750e-7ad9-4f36-a2c3-326670ff86ea`.
- Ingen ændringer i skema, RLS, native, push eller betaling.
