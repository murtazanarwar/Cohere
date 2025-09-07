import type { NextApiRequest, NextApiResponse } from "next";

const HF_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL = process.env.HF_MODEL;

const fetchSummaryFromHF = async (text: string) => {
  const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  const body = JSON.stringify({ inputs: text });

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (!resp.ok) {
        const tx = await resp.text().catch(() => "");
        throw new Error(`HF error ${resp.status}: ${tx}`);
      }

      const data = await resp.json();
      const summary = Array.isArray(data) ? data[0]?.summary_text ?? "" : data.summary_text ?? "";
      return summary || "No summary available.";
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
  throw new Error("Unreachable");
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { summaries } = req.body as { summaries?: string[] };
    if (!Array.isArray(summaries) || summaries.length === 0) {
      return res.status(400).json({ error: "Missing summaries array" });
    }

    const mergedInput = summaries.join("\n\n");
    const instruction = `Summarize the following notes into a concise summary (2-4 sentences). Keep named actions / decisions if present.\n\n${mergedInput}`;

    const finalSummary = await fetchSummaryFromHF(instruction);

    return res.status(200).json({ summary: finalSummary });
  } catch (err: any) {
    console.error("summarize-merge error", err);
    return res.status(500).json({ error: err?.message ?? "Merge failed" });
  }
}
