export type NetSeriesKey = "monthly" | "quarterly" | "halfYear" | "yearly" | "all";

type DashboardYear = {
  year: number;
  targets: { id: string; title: string; subtitle?: string; progress: number }[];
  portfolio: {
    totalValue: number;
    changeValue: number;
    changePercent: number;
  };
  pnl: {
    net: number;
    profit: number;
    loss: number;
  };
  netSeries: Record<NetSeriesKey, { date: string; net: number }[]>;
  categoryContribution: { name: string; value: number }[];
  portfolioSeries: { date: string; value: number }[];
  recentEntries: {
    id: string;
    type: string;
    category: string;
    source: string;
    amount: number;
    date: string;
    notes: string;
  }[];
};

const portfolioSeries2026 = [
  { date: "Jan", value: 54000 },
  { date: "Feb", value: 58500 },
  { date: "Mar", value: 60200 },
  { date: "Apr", value: 66000 },
  { date: "May", value: 70100 },
  { date: "Jun", value: 74250 }
];

export function isAuthDisabled() {
  return process.env.DISABLE_AUTH === "true";
}

export const dashboardYears: DashboardYear[] = [
  {
    year: 2025,
    targets: [
      {
        id: "t-2025-1",
        title: "Target for 2025",
        subtitle: "Annual income goal",
        progress: 0.72
      }
    ],
    portfolio: {
      totalValue: 66840,
      changeValue: 2840,
      changePercent: 4.4
    },
    pnl: {
      net: 9840,
      profit: 19240,
      loss: -9400
    },
    netSeries: {
      monthly: [
        { date: "Jan", net: 920 },
        { date: "Feb", net: 1040 },
        { date: "Mar", net: 880 },
        { date: "Apr", net: 1220 },
        { date: "May", net: 980 },
        { date: "Jun", net: 1350 }
      ],
      quarterly: [
        { date: "Q1", net: 2840 },
        { date: "Q2", net: 3550 },
        { date: "Q3", net: 4020 },
        { date: "Q4", net: 3650 }
      ],
      halfYear: [
        { date: "H1", net: 6390 },
        { date: "H2", net: 7670 }
      ],
      yearly: [
        { date: "2025", net: 9840 }
      ],
      all: [
        { date: "2024", net: 8420 },
        { date: "2025", net: 9840 }
      ]
    },
    categoryContribution: [
      { name: "Consulting", value: 34 },
      { name: "Products", value: 28 },
      { name: "Affiliates", value: 18 },
      { name: "Taxes", value: 10 },
      { name: "Fees", value: 10 }
    ],
    portfolioSeries: [
      { date: "Jan", value: 47200 },
      { date: "Feb", value: 51200 },
      { date: "Mar", value: 54500 },
      { date: "Apr", value: 59800 },
      { date: "May", value: 63100 },
      { date: "Jun", value: 66840 }
    ],
    recentEntries: [
      {
        id: "e25-1",
        type: "profit",
        category: "Consulting",
        source: "Client Work",
        amount: 2400,
        date: "2025-06-10",
        notes: "Retainer payment"
      },
      {
        id: "e25-2",
        type: "loss",
        category: "Products",
        source: "Gumroad",
        amount: -420,
        date: "2025-06-08",
        notes: "Refund batch"
      }
    ]
  },
  {
    year: 2026,
    targets: [
      {
        id: "t-2026-1",
        title: "Income Target",
        subtitle: "Annual income goal",
        progress: 1.52
      },
      {
        id: "t-2026-2",
        title: "Net P/L Target",
        subtitle: "H1 milestone",
        progress: 2.05
      },
      {
        id: "t-2026-3",
        title: "Q1 Goal",
        subtitle: "Quarterly target",
        progress: 0.85
      }
    ],
    portfolio: {
      totalValue: 74250,
      changeValue: 3120,
      changePercent: 6.5
    },
    pnl: {
      net: 12840.5,
      profit: 24210.35,
      loss: -11369.85
    },
    netSeries: {
      monthly: [
        { date: "Jan", net: 1200 },
        { date: "Feb", net: -340 },
        { date: "Mar", net: 980 },
        { date: "Apr", net: 1640 },
        { date: "May", net: 2100 },
        { date: "Jun", net: 1320 }
      ],
      quarterly: [
        { date: "Q1", net: 1840 },
        { date: "Q2", net: 5060 },
        { date: "Q3", net: 3820 },
        { date: "Q4", net: 2120 }
      ],
      halfYear: [
        { date: "H1", net: 6900 },
        { date: "H2", net: 5940 }
      ],
      yearly: [
        { date: "2026", net: 12840 }
      ],
      all: [
        { date: "2024", net: 8100 },
        { date: "2025", net: 9840 },
        { date: "2026", net: 12840 }
      ]
    },
    categoryContribution: [
      { name: "Consulting", value: 34 },
      { name: "Affiliates", value: 22 },
      { name: "Products", value: 18 },
      { name: "Taxes", value: 12 },
      { name: "Fees", value: 14 }
    ],
    portfolioSeries: portfolioSeries2026,
    recentEntries: [
      {
        id: "e1",
        type: "profit",
        category: "Consulting",
        source: "Client Work",
        amount: 3200,
        date: "2026-06-14",
        notes: "Strategy retainer"
      },
      {
        id: "e2",
        type: "loss",
        category: "Products",
        source: "Gumroad",
        amount: -860,
        date: "2026-06-13",
        notes: "Refunds & chargebacks"
      },
      {
        id: "e3",
        type: "fee",
        category: "Fees",
        source: "Stripe",
        amount: -120,
        date: "2026-06-12",
        notes: "Processing fees"
      }
    ]
  },
  {
    year: 2027,
    targets: [
      {
        id: "t-2027-1",
        title: "Target for 2027",
        subtitle: "Annual income goal",
        progress: 0.18
      },
      {
        id: "t-2027-2",
        title: "Target until March",
        subtitle: "Q1 milestone",
        progress: 0.32
      },
      {
        id: "t-2027-3",
        title: "Portfolio growth",
        subtitle: "Capital expansion",
        progress: 0.21
      }
    ],
    portfolio: {
      totalValue: 81200,
      changeValue: 2100,
      changePercent: 2.9
    },
    pnl: {
      net: 6420,
      profit: 15420,
      loss: -9000
    },
    netSeries: {
      monthly: [
        { date: "Jan", net: 540 },
        { date: "Feb", net: 420 },
        { date: "Mar", net: 780 },
        { date: "Apr", net: 920 },
        { date: "May", net: 1100 },
        { date: "Jun", net: 860 }
      ],
      quarterly: [
        { date: "Q1", net: 1740 },
        { date: "Q2", net: 2880 },
        { date: "Q3", net: 2400 },
        { date: "Q4", net: 2400 }
      ],
      halfYear: [
        { date: "H1", net: 4620 },
        { date: "H2", net: 1800 }
      ],
      yearly: [
        { date: "2027", net: 6420 }
      ],
      all: [
        { date: "2025", net: 9840 },
        { date: "2026", net: 12840 },
        { date: "2027", net: 6420 }
      ]
    },
    categoryContribution: [
      { name: "Consulting", value: 40 },
      { name: "Affiliates", value: 24 },
      { name: "Products", value: 16 },
      { name: "Taxes", value: 10 },
      { name: "Fees", value: 10 }
    ],
    portfolioSeries: [
      { date: "Jan", value: 76000 },
      { date: "Feb", value: 77500 },
      { date: "Mar", value: 78900 },
      { date: "Apr", value: 79800 },
      { date: "May", value: 80400 },
      { date: "Jun", value: 81200 }
    ],
    recentEntries: [
      {
        id: "e27-1",
        type: "profit",
        category: "Consulting",
        source: "Client Work",
        amount: 1800,
        date: "2027-06-10",
        notes: "Strategy audit"
      },
      {
        id: "e27-2",
        type: "loss",
        category: "Products",
        source: "Shopify",
        amount: -520,
        date: "2027-06-09",
        notes: "Refund adjustments"
      }
    ]
  }
];

const defaultYear = dashboardYears.find((year) => year.year === 2026) ?? dashboardYears[0];

export const netSeries = defaultYear.netSeries.monthly;
export const categorySeries = defaultYear.categoryContribution;
export const portfolioSeries = defaultYear.portfolioSeries;
export const entries = defaultYear.recentEntries;

export const heatmapDays = Array.from({ length: 180 }).map((_, index) => {
  const baseDate = new Date(Date.UTC(2026, 0, 1));
  baseDate.setUTCDate(baseDate.getUTCDate() + index);
  const dateStr = baseDate.toISOString().slice(0, 10);
  
  const value = Math.round(Math.sin(index / 7) * 800 + (Math.random() - 0.5) * 400);
  return {
    date: dateStr,
    net: value,
    profit: value > 0 ? value : 0,
    loss: value < 0 ? Math.abs(value) : 0,
    topCategory: ["Consulting", "Affiliates", "Products"][index % 3],
    topSource: ["Client Work", "Amazon", "Gumroad"][index % 3]
  };
});

export const goals = [
  {
    id: "g1",
    title: "Monthly Net",
    target: 8000,
    progress: 0.62,
    timeframe: "June"
  },
  {
    id: "g2",
    title: "Portfolio Growth",
    target: 120000,
    progress: 0.48,
    timeframe: "2026"
  }
];
