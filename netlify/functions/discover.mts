import { client, MODEL, ndjson, toolInput } from "./lib/anthropic.ts";

interface AxisIn {
  key: string;
  label: string;
  labelEn: string;
  low: string;
  lowEn: string;
  high: string;
  highEn: string;
}

interface Body {
  domain?: string;
  lang?: "fr" | "en";
  axes?: AxisIn[];
  avoid?: string[];
  items?: { name: string; rating: string; coords: Record<string, number> }[];
}

const tool = {
  name: "propose",
  description:
    "Propose ONE real, attributable adjacent-unknown item, placed on the domain's existing axes.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "The exact, real name of the work/object (with creator/year if apt).",
      },
      realityNote: {
        type: "string",
        description:
          "One sentence in French stating plainly what it is and who made it — must be a real, verifiable thing.",
      },
      realityNoteEn: { type: "string", description: "Same, in English." },
      why: {
        type: "string",
        description:
          "Two or three sentences in French: why this sits just beyond their cluster, referencing specific items they love.",
      },
      whyEn: { type: "string", description: "Same, in English." },
      oneStep: {
        type: "string",
        description:
          "The SINGLE axis/dimension this stretches them on, in French (e.g. 'un cran plus abstrait').",
      },
      oneStepEn: { type: "string", description: "Same, in English." },
      coords: {
        type: "object",
        description: "Its coordinate on EACH axis, keyed by axis key, every value in [0,1].",
        additionalProperties: { type: "number" },
      },
    },
    required: [
      "name",
      "realityNote",
      "realityNoteEn",
      "why",
      "whyEn",
      "oneStep",
      "oneStepEn",
      "coords",
    ],
  },
};

function system(lang: string): string {
  return `Tu élargis le goût d'une personne. On te donne un DOMAINE, ses AXES perceptuels, et la liste des objets qu'elle a notés (avec coordonnées et appréciation: amour, aime, bof, non).

Trouve UN seul objet RÉEL, vérifiable et correctement attribué de ce domaine qui se trouve JUSTE AU-DELÀ de sa région explorée : assez proche de ce qu'elle aime pour être atteignable, mais qui l'étire sur EXACTEMENT une dimension vers un territoire qu'elle n'a pas encore goûté. Ni un sosie de ce qu'elle adore déjà, ni quelque chose de complètement étranger — l'inconnu adjacent.

RÈGLES DE FER:
- L'objet doit EXISTER réellement et être correctement attribué (créateur/année si pertinent). N'invente JAMAIS d'œuvre, de titre, d'artiste ou d'attribution. Si tu n'es pas sûr qu'une chose existe, choisis-en une autre dont tu es certaine.
- Évite tout ce qui figure dans la liste "avoid".
- Appuie le "pourquoi" sur des objets précis qu'elle aime (cite-les).
- Place l'objet sur les axes fournis (coordonnées [0,1] pour chaque clé d'axe).
- Réponds UNIQUEMENT via l'outil. Langue principale: ${lang === "en" ? "anglais" : "français"} (remplis toujours les deux langues).`;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const body = (await req.json().catch(() => ({}))) as Body;
  const domain = (body.domain ?? "").trim();
  const axes = Array.isArray(body.axes) ? body.axes : [];
  const items = Array.isArray(body.items) ? body.items : [];
  if (!domain || axes.length < 2 || items.length === 0) {
    return new Response(
      JSON.stringify({ error: "domain, axes (>=2) and items required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const lang = body.lang === "en" ? "en" : "fr";
  const avoid = Array.isArray(body.avoid) ? body.avoid : [];

  return ndjson(async () => {
    const anthropic = client();
    const payload = { domain, axes, items, avoid };
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: system(lang),
      messages: [
        {
          role: "user",
          content:
            "Voici la carte de goût de la personne. Propose l'inconnu adjacent.\n" +
            JSON.stringify(payload, null, 2),
        },
      ],
      tools: [tool],
      tool_choice: { type: "tool", name: "propose" },
    });
    return toolInput(res);
  });
};
