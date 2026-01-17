import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { createSupabaseRouteClient, getAuthenticatedUser } from "@/lib/supabase/route";
import { getAnalyticsData, Period } from "@/lib/supabase/analytics-queries";

export const maxDuration = 60;

type InsightType = "comprehensive" | "spending" | "savings" | "goals" | "forecast";

function getPromptForType(type: InsightType, periodLabel: string, context: any): string {
  const baseContext = `
Financial Data for ${periodLabel}:
${JSON.stringify(context, null, 2)}
`;

  switch (type) {
    case "comprehensive":
      return `
You are an expert personal finance advisor. Analyze the following financial data and provide a comprehensive financial health report.

${baseContext}

Provide a detailed report with the following sections:

## Financial Health Summary
A brief assessment of overall financial health (2-3 sentences).

## Income Analysis
- Total income and primary sources
- Income stability assessment
- Comparison to expenses

## Expense Analysis  
- Total expenses by category
- Unusual or high spending areas
- Expense patterns

## Savings Performance
- Net savings/loss for the period
- Savings rate percentage
- Assessment of savings habits

## Key Recommendations
3-4 specific, actionable recommendations based on the data to improve financial health.

Tone: Professional, supportive, and specific. Reference actual numbers and categories from the data. Avoid generic advice.
`;

    case "spending":
      return `
You are a spending analysis expert. Analyze the following financial data to provide deep insights into spending patterns.

${baseContext}

Provide a detailed spending analysis with:

## Spending Overview
Total spent and comparison to income.

## Category Breakdown
- List top spending categories with percentages
- Identify any categories that seem unusually high
- Note any concerning patterns

## Largest Transactions
Highlight the biggest expenses and whether they seem reasonable.

## Spending Patterns
- Identify any recurring expenses
- Note any spikes or unusual activity
- Seasonal or timing patterns

## Cost-Cutting Opportunities
Identify 3-5 specific areas where spending could be reduced based on the data.

Be specific with numbers. If a category is taking up a large percentage of income, call it out directly.
`;

    case "savings":
      return `
You are a savings optimization specialist. Analyze the following financial data to find opportunities to save more money.

${baseContext}

Provide a savings opportunity analysis with:

## Current Savings Status
- Current savings rate
- Net income after expenses
- Assessment of savings health

## Money Leaks
Identify areas where money may be being wasted or overspent based on the expense categories.

## Quick Wins
3-5 immediate actions that could improve savings based on the data (be specific to their spending categories).

## Long-Term Strategies
2-3 sustainable changes that could significantly improve their financial position.

## Savings Goals
Suggest a realistic savings target based on their income and expense patterns.

Focus on actionable, specific advice tied to their actual spending data. Avoid generic tips like "make a budget" - give them concrete steps based on what you see.
`;

    case "goals":
      return `
You are a financial goal planning advisor. Analyze the following financial data to help assess progress toward financial goals.

${baseContext}

Provide a goal-oriented analysis with:

## Current Financial Position
Summary of their financial situation based on the data.

## Savings Capacity
Based on income vs expenses, what can they realistically save?

## Goal Projections
If they maintain current habits:
- What could they save in 6 months?
- What could they save in 1 year?
- What major purchases could they afford?

## Improvement Scenarios
If they reduce expenses by 10-20%, how would that change their trajectory?

## Recommended Focus Areas
What should they prioritize to reach financial goals faster?

## Milestone Suggestions
Suggest 2-3 realistic financial milestones they could aim for based on their data.

Be encouraging but realistic. Use actual numbers from their data to make projections.
`;

    case "forecast":
      return `
You are a financial forecasting analyst. Analyze the following financial data to predict future trends.

${baseContext}

Provide a financial forecast with:

## Trend Analysis
Based on the data, what patterns do you see in income and expenses?

## 3-Month Forecast
If current patterns continue:
- Projected income
- Projected expenses
- Projected savings

## Risk Factors
Identify any concerning trends that could lead to financial problems.

## Opportunity Areas
Areas where positive trends could be amplified.

## Best Case Scenario
If they optimize spending, what could their finances look like in 6 months?

## Worst Case Scenario
If expenses grow unchecked, what could happen?

## Action Items
3 specific actions to ensure the best case scenario happens.

Use the trend data to make realistic projections. Be specific with numbers and percentages.
`;

    default:
      return `Analyze this financial data and provide helpful insights: ${baseContext}`;
  }
}

function getPeriodLabel(period: Period, customStart?: string, customEnd?: string): string {
  switch (period) {
    case "7d": return "Last 7 Days";
    case "30d": return "Last 30 Days";
    case "this_month": return "This Month";
    case "this_quarter": return "This Quarter";
    case "3m": return "Last 3 Months";
    case "6m": return "Last 6 Months";
    case "ytd": return "Year to Date";
    case "1y": return "Last Year";
    case "all": return "All Time";
    default:
      if (customStart && customEnd) {
        return `${customStart} to ${customEnd}`;
      }
      return period;
  }
}

export async function POST(request: Request) {
  const { client: supabase } = createSupabaseRouteClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const period: Period = body.period || "this_month";
    const insightType: InsightType = body.insightType || "comprehensive";
    const customStart = body.customStart;
    const customEnd = body.customEnd;

    const analyticsData = await getAnalyticsData(
      supabase, 
      user.id, 
      period,
      customStart,
      customEnd
    );

    const context = {
      period: getPeriodLabel(period, customStart, customEnd),
      summary: {
        totalIncome: analyticsData.totals.income,
        totalExpenses: analyticsData.totals.expenses,
        netSavings: analyticsData.totals.net,
        savingsRate: analyticsData.financialRatios?.savingsRate?.toFixed(1) + "%" || "N/A",
        expenseRatio: analyticsData.financialRatios?.expenseRatio?.toFixed(1) + "%" || "N/A",
      },
      transactionStats: analyticsData.transactionStats,
      expensesByCategory: analyticsData.categoryBreakdown.slice(0, 8).map(c => ({
        category: c.name,
        amount: c.value,
        percentOfExpenses: analyticsData.totals.expenses > 0 
          ? ((c.value / analyticsData.totals.expenses) * 100).toFixed(1) + "%"
          : "0%"
      })),
      incomeByCategory: (analyticsData.incomeBreakdown || []).slice(0, 5).map((c: any) => ({
        category: c.name,
        amount: c.value,
        percentOfIncome: analyticsData.totals.income > 0
          ? ((c.value / analyticsData.totals.income) * 100).toFixed(1) + "%"
          : "0%"
      })),
      sourcePerformance: (analyticsData.sourceBreakdown || []).slice(0, 5),
      trends: analyticsData.monthlyTrends || [],
      bestMonth: analyticsData.insights?.bestMonth || null,
      worstMonth: analyticsData.insights?.worstMonth || null,
      largestExpenses: analyticsData.topEntries.expenses.slice(0, 5).map((e: any) => ({
        amount: Math.abs(e.amount_usd_base),
        category: e.categories?.name || "Uncategorized",
        notes: e.notes || "",
        date: e.entry_date
      })),
      largestIncomes: analyticsData.topEntries.income.slice(0, 5).map((e: any) => ({
        amount: Math.abs(e.amount_usd_base),
        category: e.categories?.name || "Uncategorized",
        notes: e.notes || "",
        date: e.entry_date
      })),
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = getPromptForType(insightType, getPeriodLabel(period, customStart, customEnd), context);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error("AI Generation failed:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
