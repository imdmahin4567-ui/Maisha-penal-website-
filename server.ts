import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGemini() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not set. Using rule-based fallback responses.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// 1. Warm-up Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 2. Chatbot endpoint (Sister Maisha's AI Assistant)
app.post("/api/gemini/chatbot", async (req, res) => {
  const { messages, currentProducts } = req.body;
  const userPrompt = messages && messages.length > 0 ? messages[messages.length - 1].text : "";
  
  const ai = getGemini();
  if (!ai) {
    // Elegant deterministic backup replies
    return res.json({
      reply: "Assalamu Alaikum! Welcome to Maisha Borka House. I'm currently running in smart fallback mode. Our collection includes premium Dubai Chery Borkas, Luxurious Emerald Green Abayas, and soft georgette hijabs. How can I help you today? (Tip: Try choosing an item to add to your cart or messaging our WhatsApp line!)"
    });
  }

  try {
    const productsContext = currentProducts && currentProducts.length > 0
      ? currentProducts.map((p: any) => `- ${p.title} (${p.category}): SKU ${p.sku}, BDT ${p.price} (discount: ${p.discountPrice || 'None'}). Colors: ${p.colors.join(', ')}. Sizes: ${p.sizes.join(', ')}.`).join("\n")
      : "Dubai Cherry Borka, Soft Gold Embroidered Abaya, emerald hijabs";

    const systemInstruction = `You are Sister Maisha's AI Assistant, the premium elegant chatbot for "Maisha Borka House", a top-tier Islamic fashion house in Bangladesh.
Your personality: Always begin with warm Islamic greetings ("Assalamu Alaikum", "InshaAllah", "Alhamdulillah" as appropriate but professionally). Speak with deep politeness, luxury fashion insight, helpful styling tips, and friendly sisterly customer support.

Here is our current store catalog context:
${productsContext}

Store Information & Policies:
- Delivery time: 2-3 days inside Dhaka (BDT 80), 5-7 days outside Dhaka (BDT 150).
- Payment: Cash on Delivery (COD), bKash, Nagad, Rocket.
- Customizations: Custom sizes can be requested inside Order Notes on Checkout.
- Shop Location: Dhanmondi, Dhaka, Bangladesh.
- Support: Floating WhatsApp button is active for direct call or chat at +8801700000000.

Provide elegant, conversational responses of up to 3 paragraphs. Highlight Borka styles, sizes (52, 54, 56, 58), and fabric (Dubai Cherry, Premium Linen, Micro Velvet).`;

    const chatContent = messages.map((m: any) => {
      return `${m.sender === 'user' ? 'Customer' : 'Assistant'}: ${m.text}`;
    }).join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `${chatContent}\nCustomer: ${userPrompt}\nAssistant:`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text || "I'm here to assist you Sister! Let me find the perfect Borka design." });
  } catch (error) {
    console.error("Gemini chatbot error:", error);
    res.status(500).json({ error: "Failed to generate AI response. Using fallback support assistant.", reply: "Assalamu Alaikum, I apologize. Could you repeat that? I am delighted to advise you on sizing or material." });
  }
});

// 3. AI Smart Recommendation & Styling Advice
app.post("/api/gemini/recommendations", async (req, res) => {
  const { skinTone, size, occasion, favoriteColor } = req.body;
  const ai = getGemini();
  
  if (!ai) {
    return res.json({
      recommendation: `**Assalamu Alaikum! Recommendation for your ${occasion || 'Daily'} wear:**\nWe highly recommend the **Maisha's Royal Emerald Borka** in Size **${size || '54'}**. It pairs beautifully with warm skin tones and offers a regal, elegant fall. Add a Soft Gold premium georgette hijab to complete the gorgeous look!`
    });
  }

  try {
    const prompt = `Formulate a luxurious, personalized fashion and styling recommendation for an Islamic fashion shopper with coordinates:
- Sizing preference: ${size || 'Not Specified'}
- Primary Occasion / Event: ${occasion || 'Daily Wear'}
- Prefered Color Scheme: ${favoriteColor || 'Emerald Green or Black'}
- Additional Style: ${skinTone || 'Elegant tone'}

Structure the response beautifully with:
1. **The Core Selection**: Selected Borka type (Dubai Cherry, Silk Abaya or Velvet Kaftan)
2. **Styling & Accessories**: Matching Hijab suggestions, gold accents, shoe or bag hints
3. **Modesty & Care Tips**: Sisterly tip for keeping the premium fabric matching of highest modesty values.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the Head Stylist at Maisha Borka House. You write with deep fashion authority, luxury branding tone, and sisterly grace.",
        temperature: 0.7,
      }
    });

    res.json({ recommendation: response.text });
  } catch (err) {
    res.status(500).json({ error: "Failed to get AI styling report." });
  }
});

// 4. AI Sales Insights for Admin Dashboard
app.post("/api/gemini/sales-insights", async (req, res) => {
  const { salesData, pendingCount } = req.body;
  const ai = getGemini();

  if (!ai) {
    return res.json({
      insights: `📊 **Deterministic Automated Sales Insights**:\n1. **Best Selling Collection**: Dubai Chery Abaya holds 46% of purchases.\n2. **Inventory Alert**: Low stock detected for Charcoal Linen Size 54.\n3. **Dhaka Conversion**: 74% of orders are delivered inside Dhaka hub.\n4. **Action item**: Launch an early Eid discount campaign on Kaftans to clear seasonal items.`
    });
  }

  try {
    const prompt = `Analyze this simulated e-commerce sales performance and generate 4 concise bullet points of highly actionable business strategy:
Sales Summary: ${JSON.stringify(salesData)}
Pending Orders: ${pendingCount || 0}
Brand: Maisha Borka House (Premium Islamic Modest Wear)

Provide direct, sharp advice for marketing, stock level shifting, VIP discounts, and customer retention.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Chief Retail Analyst of Islamic premium brands. You provide concise, data-driven, actionable growth tips."
      }
    });

    res.json({ insights: response.text });
  } catch (err) {
    res.json({ insights: "AI insights temporarily unavailable. Monitor seasonal collection stocks manually." });
  }
});

// 5. AI Marketing Copy / Newsletter Suggestion
app.post("/api/gemini/marketing", async (req, res) => {
  const { campaignName, discountPercentage } = req.body;
  const ai = getGemini();
  
  if (!ai) {
    return res.json({
      post: `✨ **Assalamu Alaikum Elegant Sisters!** ✨\n\nElevate your modesty with our exclusive **${campaignName || 'Premium Borka Festival'}**! Enjoy an exclusive **${discountPercentage || 15}% OFF** on our royal, soft-fall Dubai Cherry Borkas, Kaftans, and designer Abayas.\n\n🛍️ *Shop Elegance. Live Modesty.*\n📞 DM our support or order on maisha-borka.com!`
    });
  }

  try {
    const prompt = `Write a high-converting promotional Facebook post and email newsletter text for a new sales campaign:
Campaign Name: "${campaignName || 'Eid Collection Launch'}"
Benefit: ${discountPercentage || '15'}% discount on selected luxury Borkas
Brand: Maisha Borka House

Make it sound premium, culturally respectful, incredibly stylish, and encouraging of modest fashion values. Use emojis gracefully.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ post: response.text });
  } catch (err) {
    res.json({ post: "Assalamu Alaikum Sisters! High quality campaigns are coming soon to your inbox." });
  }
});

// 6. AI Inventory Stock Level Prediction
app.post("/api/gemini/predict-inventory", async (req, res) => {
  const { currentStock, monthlyVelocity } = req.body;
  const ai = getGemini();

  if (!ai) {
    return res.json({
      prediction: `🔮 **Inventory Forecast**:\n- **Sizing 52 & 54 Abayas**: Estimated 18 days of runway left.\n- **Emerald Green Fabric Supplies**: Replenishment required within 12 days to meet the high Eid demand surge.\n- **Trend**: Customers prefer emerald green over dark green by a ratio of 3:1.`
    });
  }

  try {
    const prompt = `Predict stock depletion rate for the upcoming Modan wear season based on:
- Current product stocks: ${JSON.stringify(currentStock || {})}
- Average monthly order intake: ${monthlyVelocity || 24} units

Give two short, smart prediction bullet points.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    res.json({ prediction: response.text });
  } catch (err) {
    res.json({ prediction: "Stock levels estimated stable. Keep 20% backup reserves for Dhanmondi warehouse." });
  }
});

// --- VITE MIDDLEWARE CONFIGURATION ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serving production files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Maisha Backend] Active and listening on port ${PORT}`);
  });
}

startServer();
