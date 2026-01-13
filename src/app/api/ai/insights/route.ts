import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { getAnalyticsData, Period } from "@/lib/supabase/analytics-queries";

export const maxDuration = 30; // Allow longer timeout for AI generation

export async function POST(request: Request) {
  const supabase = createSupabaseRouteClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const period: Period = body.period || "30d";

    // 1. Fetch Financial Context
    const analyticsRequest = await getAnalyticsData(supabase, userData.user.id, period);

    // Simplify context to reduce token usage and noise
    const context = {
      period: period,
      totals: analyticsRequest.totals,
      top_expenses_breakdown: analyticsRequest.categoryBreakdown.slice(0, 5),
      income_vs_expense_trend: analyticsRequest.chartData.map(d => ({
        date: d.label,
        net: d.net,
        income: d.income,
        expense: d.expenses
      })),
      largest_single_expenses: analyticsRequest.topEntries.expenses.map(e => ({
        amount: e.amount_usd_base,
        category: e.categories?.name,
        notes: e.notes
      }))
    };

    // 2. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert financial analyst. Analyze the following personal finance data for the period "${period}".
      
      Data Context:
      ${JSON.stringify(context, null, 2)}

      Please provide a concise financial report in Markdown format with the following sections:
      1. **Summary**: A definitive statement on financial health for this period (e.g., "High spending month", "Stable savings", etc.).
      2. **Key Findings**: 3 bullet points highlighting notable trends, anomalies, or large expenses.
      3. **Actionable Advice**: 1 specific recommendation based on the data to improve savings or reduce waste.

      Tone: Professional, encouraging, but direct. Avoid generic advice; refer to specific numbers and categories from the data.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error("AI Generation failed:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
