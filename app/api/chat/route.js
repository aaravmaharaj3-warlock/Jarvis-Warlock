import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUBBOTS = {
  researcher: "You are a research sub-bot. Search and summarize facts concisely, citing sources.",
  coder: "You are a coding sub-bot. Write clean, working code and explain it briefly.",
  scheduler: "You are a scheduling sub-bot. Organize tasks, dates, and reminders clearly.",
};

const JARVIS_PROMPT = `You are Jarvis, a calm, witty, polite British AI assistant.
Decide if a request needs a specialist: "researcher", "coder", or "scheduler".
If yes, reply with exactly: DELEGATE:<name>:<task>
Otherwise, answer directly yourself.`;

export async function POST(req) {
  const { message } = await req.json();

  const first = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 500,
    system: JARVIS_PROMPT,
    messages: [{ role: "user", content: message }],
  });

  const text = first.content[0].text;

  if (text.startsWith("DELEGATE:")) {
    const [, botName, task] = text.split(":");
    const sub = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: SUBBOTS[botName.trim()],
      messages: [{ role: "user", content: task }],
    });
    return Response.json({ reply: sub.content[0].text, via: botName });
  }

  return Response.json({ reply: text, via: "jarvis" });
}
