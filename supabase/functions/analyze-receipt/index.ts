import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expense receipt analyzer for a booth construction company. Analyze the receipt image and extract:
1. mainCategory: one of 差旅, 物料, 人工, 三方, 电费, 其他
2. subCategory: based on mainCategory:
   - 差旅: Airbnb, Flight, Hotel, Uber, Gas, Parking, 餐補, 租車, Walmart
   - 物料: Amazon, 画面, 铝合金备料, 地毯, 桌椅, 电视, 其他物料
   - 人工: 日薪, 人工搭建, 撤展
   - 三方: 吊顶, 劳工, 木柜过磅, 型材物料过磅, 布/吊顶过磅, 其他三方
   - 电费: 电费, 其他电费
   - 其他: 其他
3. amount: the total amount on the receipt (number only)
4. description: brief description of what was purchased

Return ONLY a JSON object with these 4 fields. If uncertain about category, use 其他.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this receipt and extract expense information:" },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_receipt",
              description: "Extract expense data from receipt",
              parameters: {
                type: "object",
                properties: {
                  mainCategory: { type: "string", enum: ["差旅", "物料", "人工", "三方", "电费", "其他"] },
                  subCategory: { type: "string" },
                  amount: { type: "number" },
                  description: { type: "string" },
                },
                required: ["mainCategory", "subCategory", "amount", "description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_receipt" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted, please add funds" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not parse receipt" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-receipt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
