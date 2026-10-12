import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  const jarvisModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: JARVIS_PROMPT,
  });

  const first = await jarvisModel.generateContent(message);
  const text = first.response.text();

  if (text.startsWith("DELEGATE:")) {
    const [, botName, task] = text.split(":");
    const subModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SUBBOTS[botName.trim()],
    });
    const sub = await subModel.generateContent(task);
    return Response.json({ reply: sub.response.text(), via: botName });
  }

  return Response.json({ reply: text, via: "jarvis" });
}
