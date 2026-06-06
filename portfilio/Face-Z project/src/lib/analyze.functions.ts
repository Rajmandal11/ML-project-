import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
});

export type ScanAnalysis = {
  subject: { id: string; class: string; threat: string; affiliation: string };
  physical: {
    heightEstimateCm: number;
    bodyIndex: string;
    skinTone: string;
    hair: string;
    neuralLoadPct: number;
  };
  face: {
    mood: string;
    ageRange: string;
    shape: string;
    eyes: string;
    idScorePct: number;
  };
  torso: { item: string; description: string; confidence: number };
  accessories: { harness: string; gloves: string; watch: string };
  footwear: { model: string; serial: string; material: string };
  style: {
    score: number;
    occasion: { label: string; pct: number };
    trend: { label: string; pct: number };
    color: { label: string; pct: number };
  };
  recommendations: Array<{ name: string; price: string; query: string }>;
  logs: string[];
  noSubject?: boolean;
};

const SYSTEM = `You are AEGIS-7, a cyberpunk AI vision system. Analyze the image of a person and return ONLY valid JSON matching the requested schema. Invent plausible cyberpunk-styled details (codenames, model numbers, serials) when specifics are uncertain. If no person is visible, set noSubject:true and fill fields with placeholder dashes. Keep numeric values realistic. Logs: 5-7 short uppercase status lines like "FACIAL_STRUCTURE_LOCKED". For recommendations, provide 2 real-world fashion items that match/complement the subject's detected style — each with a short cyberpunk product name, a USD price like "$1,240", and a 2-4 word web image search query describing the actual item (e.g. "black leather biker jacket", "white chunky sneakers").`;

const SCHEMA_PROMPT = `Return JSON exactly of shape:
{
 "noSubject": boolean,
 "subject":{"id":string,"class":string,"threat":string,"affiliation":string},
 "physical":{"heightEstimateCm":number,"bodyIndex":string,"skinTone":string,"hair":string,"neuralLoadPct":number},
 "face":{"mood":string,"ageRange":string,"shape":string,"eyes":string,"idScorePct":number},
 "torso":{"item":string,"description":string,"confidence":number},
 "accessories":{"harness":string,"gloves":string,"watch":string},
 "footwear":{"model":string,"serial":string,"material":string},
 "style":{"score":number,"occasion":{"label":string,"pct":number},"trend":{"label":string,"pct":number},"color":{"label":string,"pct":number}},
 "recommendations":[{"name":string,"price":string,"query":string},{"name":string,"price":string,"query":string}],
 "logs":string[]
}`;


export const analyzeFrame = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<ScanAnalysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: SCHEMA_PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${data.imageBase64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg =
        res.status === 429
          ? "RATE_LIMITED — slow down or upgrade Lovable AI"
          : res.status === 402
            ? "AI_CREDITS_EXHAUSTED — add credits in workspace"
            : `AI_GATEWAY_${res.status}`;
      return {
        subject: { id: "—", class: "—", threat: "—", affiliation: "—" },
        physical: { heightEstimateCm: 0, bodyIndex: "—", skinTone: "—", hair: "—", neuralLoadPct: 0 },
        face: { mood: "—", ageRange: "—", shape: "—", eyes: "—", idScorePct: 0 },
        torso: { item: "Awaiting subject…", description: "—", confidence: 0 },
        accessories: { harness: "—", gloves: "—", watch: "—" },
        footwear: { model: "—", serial: "—", material: "—" },
        style: {
          score: 0,
          occasion: { label: "—", pct: 0 },
          trend: { label: "—", pct: 0 },
          color: { label: "—", pct: 0 },
        },
        recommendations: [],
        logs: [`[WARN] ${msg}`, text.slice(0, 60)].filter(Boolean),
        noSubject: true,
      } satisfies ScanAnalysis;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      return JSON.parse(content) as ScanAnalysis;
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as ScanAnalysis;
      throw new Error("Invalid AI response");
    }
  });
