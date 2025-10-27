import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const PROMPT_TEXT = `
Jesteś doświadczonym dydaktykiem i ekspertem w tworzeniu skondensowanych materiałów edukacyjnych. Twoim zadaniem jest opracowanie kompletnych, logicznie uporządkowanych i przystępnych notatek na podstawie treści filmu wideo, niezależnie od tematyki (np. nauki ścisłe, humanistyczne, techniczne). Pomiń wszelkie wstępy i wiadomości do użytkownika. Przejdź od razu do generowania notatek w formacie Markdown.

Wymagania:

Cel: Opracuj notatki tak, by uczeń mógł w pełni zrozumieć temat bez oglądania filmu.

Struktura:

Uporządkuj treść w logicznie powiązane sekcje i podsekcje z nagłówkami Markdown (##, ###).

Zastosuj strukturę adekwatną do tematu, np. Wprowadzenie/Definicja → Kluczowe koncepcje/Procesy → Przykłady/Zastosowania → Wnioski.

Na końcu każdej głównej sekcji dodaj krótkie podsumowanie (2–3 zdania kluczowych wniosków z tej sekcji).

Styl:

Stosuj listy punktowane i zagnieżdżone podpunkty do precyzyjnego wyliczania informacji.

Pogrub najważniejsze pojęcia, terminy, definicje i nazwiska.

Używaj kursywy do oznaczania dodatkowych wyjaśnień, przykładów lub dygresji merytorycznych.

Pisz krótkimi, konkretnymi zdaniami. Notatki muszą być zwięzłe, ale kompletne – nie przepisuj filmu słowo w słowo, ale uchwyć wszystkie kluczowe informacje niezbędne do zrozumienia tematu.

Treść:

Uwzględnij definicje kluczowych pojęć, opisywane procesy, główne tezy i argumenty oraz praktyczne przykłady.

Jeśli pojawiają się ważne osoby, teorie lub modele, opisz ich rolę i znaczenie dla tematu.

Wyróżnij kluczowe daty, wzory, formuły, lub dane statystyczne, jeśli są niezbędne do zrozumienia kontekstu.

Jeśli film zawiera końcowe wnioski lub interpretacje – uwzględnij je w formie „Wniosek:” lub „Znaczenie:”.

Pomijaj:

Reklamy, prośby o subskrypcję, powitania, pożegnania, dygresje i treści niezwiązane bezpośrednio z tematem merytorycznym.

Format:

Użyj estetycznego Markdown.

Zachowaj spójny układ i hierarchię wizualną (nagłówki, wcięcia, pogrubienia).

Ton:

Profesjonalny, rzeczowy i edukacyjny.

Styl notatek ma przypominać kompendium maturalne lub akademickie, łączące klarowność i głębię merytoryczną.

Na końcu dodaj sekcję:

📘 Podsumowanie ogólne

W kilku punktach wypisz kluczowe wnioski (3-5) z całego filmu.
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
