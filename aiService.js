// AI Question Generator for AI Imposter Game
// Uses Google Gemini API if GEMINI_API_KEY is available in env, or intelligent dynamic template fallback engine.

export async function generateAIQuestion(secretWordItem, roundNumber) {
  const apiKey = process.env.GEMINI_API_KEY;
  const word = secretWordItem.word;
  const description = secretWordItem.description;

  if (apiKey) {
    try {
      const prompt = `You are the game master of an exciting social deduction game called "AI Imposter".
The secret word for the normal players is: "${word}" (${description}).

Generate ONE short, simple, clear question for ROUND ${roundNumber} of the game.
Rules for the question:
1. It MUST NOT mention or explicitly reveal the secret word "${word}".
2. It should be easy to understand for tech/office employees.
3. It must encourage a short 1-2 phrase answer.
4. ${roundNumber === 1 ? 'Focus on a key feature, trait, or noticeable characteristic of this concept.' : 'Focus on when, why, or how a team or developer relies on this in their daily work.'}
5. Return ONLY the raw question string without quotes or preamble. Max 15 words.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && text.length > 5 && text.length < 150) {
          // Strip any quotes if present
          return text.replace(/^["']|["']$/g, '');
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed, using intelligent fallback question:", err.message);
    }
  }

  // Dynamic template fallback engine tailored for IT & Tech concepts
  return getFallbackQuestion(word, roundNumber);
}

function getFallbackQuestion(word, roundNumber) {
  const round1Questions = [
    `What is one key feature or characteristic of this concept?`,
    `How would you describe what this looks like or does in simple terms?`,
    `What is a noticeable property of this in daily work?`,
    `What is something essential about how this behaves?`,
    `What comes to mind when you think of its main function?`
  ];

  const round2Questions = [
    `In what situation or workflow would a team depend on this most?`,
    `What main problem or challenge does this help solve?`,
    `What happens if a developer or team forgets to handle this properly?`,
    `Why is this so commonly used and discussed in IT organizations?`,
    `What value does this bring to a software project or company?`
  ];

  const pool = roundNumber === 1 ? round1Questions : round2Questions;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
