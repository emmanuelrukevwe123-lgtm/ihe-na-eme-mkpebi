import { systemPrompt } from "./prompt.js";

const MODEL = "openai/gpt-oss-20b";

export async function groqDecide(situation, options) {
  const names = options.map((o) => o.name);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt(names),
        },
        { role: "user", content: JSON.stringify({ situation, options }) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const j = await res.json();
  const out = JSON.parse(j.choices[0].message.content);
  return { ...out, source: "groq" };
}
