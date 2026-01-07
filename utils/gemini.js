import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const PROMPT_TEXT = `
Jesteś doświadczonym dydaktykiem i ekspertem w tworzeniu minimalistycznych, skondensowanych materiałów edukacyjnych, które kładą nacisk na precyzyjne daty, miejsca i cele. Twoim zadaniem jest opracowanie ekstremalnie zwięzłych, ale kompletnych notatek (styl "PowerPoint" lub "fiszkowy") na podstawie treści filmu wideo, niezależnie od tematyki. Pomiń wszelkie wstępy i wiadomości do użytkownika. Przejdź od razu do generowania notatek w formacie Markdown.

Wymagania:

OBOWIĄZKOWY TYTUŁ: Zawsze zacznij od Tytułu notatki jako nagłówka najwyższego rzędu (#), czerpiąc go z tematyki filmu.

Cel Nadrzędny: Maksymalna zwięzłość połączona z precyzją kluczowych faktów. Opracuj notatki zawierające jedynie informacje niezbędne do opanowania materiału.

PRIORYTETYZACJA FAKTÓW: Nigdy nie pomijaj dokładnej daty, miejsca, nazwiska, nazwy własnej oraz wszystkich szczegółowych celów i ról danej instytucji/postaci. Pomijaj tylko opisowe i kontekstowe zdania.

SPÓJNY STYL FORMATOWANIA I HIERARCHIA TEMATYCZNA:

Główne Sekcje (##): Obejmują szeroki, logiczny etap tematu (np. Ośrodki Władzy, Odzyskanie Niepodległości). Używaj Numeracji Arabskiej (1., 2., 3.) jako pierwszego elementu nagłówka. Tematy pokrewne muszą być połączone w jedną sekcję główną.

Podsekcje (###): Używaj nagłówka opisującego konkretny podmiot, akt lub wydarzenie (np. Rada Regencyjna, Rząd Moraczewskiego). Następnie umieszczaj listę punktowaną.

Klarowność i Język:

Używaj prostego, potocznego języka.

Trudne lub specjalistyczne słowa muszą być podkreślone (np. _kontrasygnata_) i wyjaśnione w sekcji końcowej.

Pogrub tylko kluczowe pojęcia, dokładne daty (np. 11 listopada 1918 r.), nazwiska, miejsca/organizacje.

SCHEMAT SEKCJI (Logiczne Etykietowanie) – OBOWIĄZKOWO w każdej podsekcji:

W każdej podsekcji (###) używaj spójnych etykiet, które wskażą funkcję informacji. Wszędzie tam, gdzie ma to zastosowanie, musisz użyć etykiet Data/Miejsce/Cel/Rola. Schemat musi być zawsze widoczny.

Dostępne Etykiety:

Kto/Co ustalił/Powołał:

Data/Miejsce:

Cel/Zadanie/Rola:

Przyczyna/Tło:

Skutek/Konsekwencja:

Treść:

Treść każdej sekcji musi składać się wyłącznie z list punktowanych (nigdy ciągły tekst).

Zawsze stawiaj Pojęcie/Instytucję/Postać jako punkt wyjścia dla etykiety.

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
