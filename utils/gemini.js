import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const PROMPT_TEXT = `
Jesteś doświadczonym dydaktykiem i ekspertem w tworzeniu minimalistycznych, skondensowanych materiałów edukacyjnych. Twoim zadaniem jest opracowanie ekstremalnie zwięzłych, ale kompletnych notatek (styl "PowerPoint" lub "fiszkowy") na podstawie treści filmu wideo, niezależnie od tematyki. Pomiń wszelkie wstępy i wiadomości do użytkownika. Przejdź od razu do generowania notatek w formacie Markdown.

Wymagania:

Cel Nadrzędny: Maksymalna efektywność i zwięzłość. Opracuj notatki zawierające jedynie informacje niezbędne do szybkiego opanowania materiału. Ogranicz objętość o minimum 40-50% w stosunku do normalnej notatki.

SPÓJNY STYL FORMATOWANIA:

Główne Sekcje (##): Używaj Numeracji Arabskiej (1., 2., 3.) jako pierwszego elementu nagłówka.

Podsekcje (###): Używaj Punktów (kropek/myślników).

Klarowność i Język:

Używaj prostego, potocznego języka.

Trudne lub specjalistyczne słowa muszą być podkreślone (np. _kontrasygnata_) i wyjaśnione w sekcji końcowej.

Pogrub tylko kluczowe pojęcia, daty, nazwiska.

SCHEMAT SEKCJI (Logiczne Etykietowanie):

W każdej podsekcji (###) używaj spójnych etykiet, które wskażą funkcję informacji. Dostępne etykiety (używaj tylko tych, które mają zastosowanie w danej sekcji):

Kto/Co ustalił: (Dla instytucji, aktów prawnych)

Cel: (Dla działań, organizacji)

Rola/Znaczenie: (Dla postaci lub wydarzeń)

Przyczyna/Tło:

Skutek/Konsekwencja:

Data/Miejsce:

Treść:

Każda informacja musi być frazą lub najkrótszym, kompletnym zdaniem. Nigdy nie twórz ciągłego tekstu.

Zawsze stawiaj Datę/Postać/Pojęcie jako punkt wyjścia dla etykiety, np.:

Ignacy Daszyński : Kto ustalił: Tymczasowy Rząd Ludowy.

Mała Konstytucja (1919) : Rola/Znaczenie: Tymczasowy ustrój; Sejm władzą najwyższą.

Pomijaj: Wstępy, opisy, dygresje, reklamy, wszelkie niekluczowe szczegóły i wszelkie podsumowania sekcji.

Na końcu dodaj dwie obowiązkowe sekcje:

📘 Podsumowanie ogólne (Fiszki-Klapy)

Podaj dokładnie tyle punktów, ile jest głównych sekcji (##) w notatkach.

Każdy punkt musi być ultra-zwięzłym podsumowaniem treści swojej sekcji głównej.

❓ Słowniczek (Wyjaśnienie trudnych pojęć)

Wypisz i wyjaśnij wszystkie podkreślone słowa użyte w notatkach, w prosty i zrozumiały sposób.
`;

export async function generateNotesFromLink(videoURL) {
  try {
    console.log(`🎬 Analizuję film: ${videoURL}`);

    if (!videoURL || !videoURL.startsWith("http")) {
      throw new Error("Nieprawidłowy lub brakujący adres URL wideo.");
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT_TEXT },
            {
              fileData: {
                fileUri: videoURL,
                mimeType: "video/mp4",
              },
            },
          ],
        },
      ],
    });

    const text = result.response.text();

    if (!text || text.length < 50) {
      throw new Error(
        "Model nie był w stanie wygenerować treści. Upewnij się, że film jest dostępny i ma transkrypcję."
      );
    }

    console.log("✅ Notatki wygenerowane pomyślnie!");
    return text;
  } catch (error) {
    console.error("❌ Błąd podczas generowania notatek:", error);

    let userMessage =
      "Przepraszamy, wystąpił problem podczas generowania notatek. Spróbuj ponownie później.";

    if (
      error.message.includes("API_KEY_INVALID") ||
      error.message.includes("Quota exceeded")
    ) {
      userMessage =
        "Błąd autoryzacji: Problem z kluczem API lub przekroczono limit. Skontaktuj się z administratorem.";
    } else if (
      error.message.includes("Invalid video URL") ||
      error.message.includes("Not a video")
    ) {
      userMessage =
        "Błąd wideo: Wprowadzony adres URL jest nieprawidłowy, wideo nie jest dostępne lub nie można go przetworzyć.";
    } else if (
      error.message.includes("Nieprawidłowy lub brakujący adres URL")
    ) {
      userMessage = error.message;
    } else if (
      error.message.includes("Model nie był w stanie wygenerować treści")
    ) {
      userMessage = error.message;
    }

    throw new Error(userMessage);
  }
}
