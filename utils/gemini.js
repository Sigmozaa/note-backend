import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const PROMPT_TEXT = `
Jesteś doświadczonym nauczycielem historii i ekspertem w tworzeniu notatek dydaktycznych. 
Twoim zadaniem jest opracowanie **kompletnych, logicznie uporządkowanych i przystępnych notatek** na podstawie treści filmu wideo.
Pomin wszelkie wiadomości do użytkownika przejdz odrazu do notatek.

### Wymagania:
1. **Cel:** Opracuj notatki tak, by uczeń mógł w pełni zrozumieć temat bez oglądania filmu.
2. **Struktura:**
   - Uporządkuj treść w sekcje i podsekcje z nagłówkami Markdown ('##', '###').
   - Użyj chronologii lub logicznej kolejności wydarzeń (np. *tło → przebieg → skutki*).
   - Na końcu każdej głównej sekcji dodaj krótkie **podsumowanie** (2–3 zdania kluczowych wniosków).
3. **Styl:**
   - Stosuj listy punktowane i zagnieżdżone podpunkty.
   - Pogrub **najważniejsze pojęcia**, *kursywą* oznacz dodatkowe informacje lub wyjaśnienia.
   - Używaj krótkich, konkretnych zdań.
4. **Treść:**
   - Uwzględnij definicje, przyczyny, przebieg i skutki wydarzeń.
   - Dla postaci historycznych wypisz ich **rolę i znaczenie**.
   - Dla bitew i traktatów dodaj **daty** oraz **konsekwencje polityczne**.
   - Jeśli film zawiera wnioski lub interpretacje – uwzględnij je w formie „Wniosek:” lub „Znaczenie:”.
5. **Pomijaj:**
   - Reklamy, powitania, dygresje i treści niezwiązane z tematem.
6. **Format:**
   - Użyj estetycznego Markdown.
   - Zachowaj spójny układ i hierarchię wizualną (nagłówki, wcięcia, pogrubienia).
7. **Ton:**
   - Profesjonalny, rzeczowy i edukacyjny.
   - Styl notatek ma przypominać **kompendium maturalne lub akademickie**, łączące klarowność i głębię.

Na końcu dodaj sekcję:
### 📘 Podsumowanie ogólne
W kilku punktach wypisz kluczowe wnioski z całego filmu.
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
