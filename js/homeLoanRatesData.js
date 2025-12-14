/* =========================================================
   FALLBACK HOME LOAN INTEREST RATES (INDIA)
   Source: Compiled from publicly available lender disclosures
   Update manually when needed
   ========================================================= */

window.HOME_LOAN_RATES = {
  source: "Public lender disclosures",
  asOf: "6th November 2025",

  disclaimer:
    "Indicative interest rates only. Final rates depend on borrower profile, lender policy, and prevailing market conditions.",

  slabs: [
    { id: "upto30", label: "Up to ₹30 Lakh", min: 0, max: 3000000 },
    { id: "between30to75", label: "₹30 Lakh – ₹75 Lakh", min: 3000000, max: 7500000 },
    { id: "above75", label: "Above ₹75 Lakh", min: 7500000, max: Infinity }
  ],

  lenders: [
    {
      category: "Public Sector Banks",
      banks: [
        {
          name: "Union Bank of India",
          processingFee: null,
          rates: {
            upto30: "7.35% – 10.00%",
            between30to75: "7.35% – 10.00%",
            above75: "7.35% – 10.00%"
          }
        },
        {
          name: "Bank of Baroda",
          processingFee: null,
          rates: {
            upto30: "7.45% – 9.25%",
            between30to75: "7.45% – 9.25%",
            above75: "7.45% – 9.50%"
          }
        }
      ]
    },

    {
      category: "Private Sector Banks",
      banks: [
        {
          name: "Karur Vysya Bank",
          processingFee: null,
          rates: {
            upto30: "8.50% – 10.90%",
            between30to75: "8.50% – 10.90%",
            above75: "8.50% – 10.90%"
          }
        }
      ]
    },

    {
      category: "Housing Finance Companies (HFCs)",
      banks: [
        {
          name: "LIC Housing Finance",
          processingFee: null,
          rates: {
            upto30: "7.50% onwards",
            between30to75: "7.50% onwards",
            above75: "7.50% onwards"
          }
        }
      ]
    },

    {
      category: "Foreign Banks",
      banks: [
        {
          name: "HSBC India",
          processingFee: null,
          rates: {
            upto30: "7.70% onwards",
            between30to75: "7.70% onwards",
            above75: "7.70% onwards"
          }
        }
      ]
    }
  ]
};
