/* =========================================================
   FALLBACK HOME LOAN INTEREST RATES (INDIA)
   Source reference: [Provided raw data source]
   Update manually when needed
   ========================================================= */

window.HOME_LOAN_RATES = {
  source: "Raw Data Provided by User",
  asOf: "6th November 2025", // Updated date from your raw data

  slabs: [
    { id: "upto30", label: "Up to ₹30 Lakh", min: 0, max: 3000000 },
    { id: "30to75", label: "₹30 Lakh – ₹75 Lakh", min: 3000000, max: 7500000 },
    { id: "above75", label: "Above ₹75 Lakh", min: 7500000, max: Infinity }
  ],

  lenders: [
    {
      category: "Public Sector Banks",
      banks: [
        { name: "Union Bank of India", rates: { upto30: "7.35% – 10.00%", "30to75": "7.35% – 10.00%", above75: "7.35% – 10.00%" } },
        { name: "Bank of Baroda", rates: { upto30: "7.45% – 9.25%", "30to75": "7.45% – 9.25%", above75: "7.45% – 9.50%" } },
        { name: "Bank of India", rates: { upto30: "7.35% – 10.10%", "30to75": "7.35% – 10.10%", above75: "7.35% – 10.35%" } },
        { name: "UCO Bank", rates: { upto30: "7.40% – 9.50%", "30to75": "7.40% – 9.50%", above75: "7.40% – 9.50%" } },
        { name: "Bank of Maharashtra", rates: { upto30: "7.35% – 10.15%", "30to75": "7.35% – 10.15%", above75: "7.35% – 10.15%" } },
        { name: "Indian Overseas Bank", rates: { upto30: "7.35% onwards", "30to75": "7.35% onwards", above75: "7.35% onwards" } },
        { name: "Indian Bank", rates: { upto30: "7.40% – 9.40%", "30to75": "7.40% – 9.40%", above75: "7.40% – 9.40%" } },
        { name: "Central Bank of India", rates: { upto30: "7.35% – 9.40%", "30to75": "7.35% – 9.40%", above75: "7.35% – 9.40%" } }
      ]
    },

    {
      category: "Private Sector Banks",
      banks: [
        { name: "Karur Vysya Bank", rates: { upto30: "8.50% – 10.90%", "30to75": "8.50% – 10.90%", above75: "8.50% – 10.90%" } },
        { name: "South Indian Bank", rates: { upto30: "7.75% onwards", "30to75": "7.75% onwards", above75: "7.75% onwards" } },
        { name: "Karnataka Bank", rates: { upto30: "8.24% – 10.79%", "30to75": "8.24% – 10.79%", above75: "8.24% – 10.79%" } },
        { name: "Dhanlaxmi Bank", rates: { upto30: "8.60% onwards", "30to75": "8.60% onwards", above75: "8.60% onwards" } },
        { name: "Tamilnad Mercantile Bank", rates: { upto30: "8.15% – 9.50%", "30to75": "8.15% – 9.50%", above75: "8.15% – 9.50%" } },
        { name: "Bandhan Bank", rates: { upto30: "8.41% – 15.00%", "30to75": "8.41% – 12.58%", above75: "8.41% – 12.58%" } }
      ]
    },

    {
      category: "Housing Finance Companies (HFCs)",
      banks: [
        { name: "LIC Housing Finance", rates: { upto30: "7.50% onwards", "30to75": "7.50% onwards", above75: "7.50% onwards" } },
        { name: "Repco Home Finance", rates: { upto30: "10.10% onwards", "30to75": "10.10% onwards", above75: "10.10% onwards" } },
        { name: "GIC Housing Finance", rates: { upto30: "8.20% onwards", "30to75": "8.20% onwards", above75: "8.20% onwards" } },
        { name: "ICICI Home Finance", rates: { upto30: "7.50% onwards", "30to75": "7.50% onwards", above75: "7.50% onwards" } },
        { name: "Aditya Birla Capital", rates: { upto30: "7.75% onwards", "30to75": "7.75% onwards", above75: "7.75% onwards" } },
        { name: "Cent Bank Home Finance Limited", rates: { upto30: "10.00% onwards", "30to75": "10.00% onwards", above75: "10.00% onwards" } }
      ]
    },

    {
      category: "Foreign Banks",
      banks: [
        { name: "HSBC India", rates: { upto30: "7.70% onwards", "30to75": "7.70% onwards", above75: "7.70% onwards" } },
        { name: "Standard Chartered Bank", rates: { upto30: "7.99% onwards", "30to75": "7.99% onwards", above75: "7.99% onwards" } }
      ]
    }
  ]
};
