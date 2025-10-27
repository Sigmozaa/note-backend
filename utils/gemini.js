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

Cel Nadrzędny: Maksymalna efektywność i zwięzłość. Opracuj notatki tak, by zawierały jedynie informacje niezbędne do zdania sprawdzianu, egzaminu lub szybkiego powtórzenia tematu. Ogranicz objętość o minimum 40-50% w stosunku do normalnej notatki.

Struktura i Koncentracja:

Użyj logicznego podziału (##, ###), ale wyeliminuj opisowe teksty wprowadzające i podsumowania sekcji.

Treść każdej sekcji musi składać się wyłącznie z list punktowanych (nie twórz ciągłego tekstu).

Zastosuj format "Fakt : Wyjaśnienie/Data/Rola". Przykład: Mała Konstytucja (1919) : Tymczasowy ustrój; Sejm władzą najwyższą; kontrasygnata.

SPÓJNY STYL FORMATOWANIA:

Główne Sekcje (##): Używaj Numeracji Arabskiej (1., 2., 3.) jako pierwszego elementu nagłówka.

Podsekcje (###): Używaj Punktów (kropek/myślników).

Głębokie Zagnieżdżenia: Używaj wciętych Myślników (-).

Pogrub tylko kluczowe pojęcia, daty, nazwiska, nazwy własne (absolutne minimum).

Wyeliminuj kursywę i wszelkie dygresje.

Treść (Co Musi Zostać):

Kluczowe Definicje.

Daty (tylko najważniejsze).

Przyczyny (tylko główne).

Skutki/Konsekwencje (tylko główne).

Rola i Funkcja kluczowych postaci/instytucji.

Pomijaj:

Wstępy, opisy, dygresje, reklamy, powitania, wszelkie niekluczowe szczegóły.

Całe podsumowania sekcji (wyjątkiem jest podsumowanie końcowe).

Ton: Rzeczowy, ultra-zwięzły, techniczny.

Na końcu dodaj sekcję:

📘 Podsumowanie ogólne (Kluczowe 3-5 Fiszki)

W 3–5 punktach wypisz najważniejsze fakty/konkluzje z całego filmu, w stylu Kluczowy Fakt + Data/Osoba.
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
