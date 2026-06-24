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
  target?: string;
  lang?: "fr" | "en";
  existingAxes?: AxisIn[];
  known?: { name: string; coords: Record<string, number> }[];
}

const tool = {
  name: "chart",
  description:
    "Define (or reuse) the perceptual axes of a taste domain and place one item on them.",
  input_schema: {
    type: "object" as const,
    properties: {
      axes: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        description:
          "The 4–6 orthogonal perceptual axes of this domain. Each is a 0..1 scale with two named poles. Reuse existing axes verbatim when provided.",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "stable lowercase ascii slug, e.g. 'chaleur' or 'tempo'",
            },
            label: { type: "string", description: "short axis name in French" },
            labelEn: { type: "string", description: "short axis name in English" },
            low: { type: "string", description: "French label for the 0 pole" },
            lowEn: { type: "string", description: "English label for the 0 pole" },
            high: { type: "string", description: "French label for the 1 pole" },
            highEn: { type: "string", description: "English label for the 1 pole" },
          },
          required: ["key", "label", "labelEn", "low", "lowEn", "high", "highEn"],
        },
      },
      coords: {
        type: "object",
        description:
          "The placed item's coordinate on EACH axis, keyed by axis key, every value a number in [0,1].",
        additionalProperties: { type: "number" },
      },
      blurb: {
        type: "string",
        description:
          "One vivid, specific sentence in French characterizing the item's sensory signature. No fluff.",
      },
      blurbEn: { type: "string", description: "The same sentence in English." },
    },
    required: ["axes", "coords", "blurb", "blurbEn"],
  },
};

function system(lang: string): string {
  return `Tu es une cartographe sensorielle. Pour un DOMAINE de goût (films, vins nature, riffs de guitare, polices de caractères, cafés, romans, parfums…), tu définis un petit jeu de 4 à 6 AXES perceptuels orthogonaux qui étalent vraiment les œuvres de ce domaine — pas des axes de qualité ("bon/mauvais"), mais des dimensions de caractère (chaleur, tempo, densité, abstraction, époque, rugosité…). Chaque axe est une échelle 0..1 avec deux pôles nommés.

Ensuite tu PLACES un objet précis sur ces axes, avec une coordonnée dans [0,1] pour chaque axe, et une phrase qui capte sa signature.

RÈGLES:
- Si des axes existants te sont fournis, tu DOIS les réutiliser tels quels (mêmes clés, mêmes libellés) et ne renvoyer que les coordonnées du nouvel objet sur ces axes. N'invente pas de nouveaux axes.
- Les clés d'axes sont des slugs ascii minuscules stables.
- Sois précis et honnête sur l'objet réel ; place-le selon ce qu'il EST, pas selon une moyenne.
- Réponds UNIQUEMENT via l'outil. Langue de l'utilisateur: ${lang === "en" ? "anglais" : "français"} (mais remplis toujours les deux langues).`;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const body = (await req.json().catch(() => ({}))) as Body;
  const domain = (body.domain ?? "").trim();
  const target = (body.target ?? "").trim();
  if (!domain || !target) {
    return new Response(JSON.stringify({ error: "domain and target required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const existingAxes = Array.isArray(body.existingAxes) ? body.existingAxes : [];
  const lang = body.lang === "en" ? "en" : "fr";

  return ndjson(async () => {
    const anthropic = client();
    const userPayload = {
      domain,
      existingAxes: existingAxes.length ? existingAxes : undefined,
      knownItems: (body.known ?? []).map((k) => ({ name: k.name, coords: k.coords })),
      placeThisItem: target,
    };
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1400,
      system: system(lang),
      messages: [
        {
          role: "user",
          content:
            (existingAxes.length
              ? "Réutilise EXACTEMENT ces axes et place le nouvel objet dessus.\n"
              : "Définis les axes de ce domaine, puis place l'objet.\n") +
            JSON.stringify(userPayload, null, 2),
        },
      ],
      tools: [tool],
      tool_choice: { type: "tool", name: "chart" },
    });
    const input = toolInput(res);
    // When axes were supplied, echo them back so the client persists a stable set.
    if (existingAxes.length) input.axes = existingAxes;
    return input;
  });
};
