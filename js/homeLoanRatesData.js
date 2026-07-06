/* =========================================================
   FALLBACK HOME LOAN INTEREST RATES (INDIA)
   Sources: BankBazaar (updated June 2026),
            Paisabazaar (rates as of 1st July 2026)
   Context: RBI repo rate = 5.25% (25 bps cut on 5 Dec 2025;
            held at 5.25% through the April 2026 MPC).
            Most floating starting rates are ~25 bps lower
            than the Nov 2025 data as a result.
   Note: Entries marked "verify" could not be confirmed from
         a current source — check the lender's official site
         before relying on them.
   Update manually when needed
   ========================================================= */
window.HOME_LOAN_RATES = {
  source: "BankBazaar (Jun 2026) / Paisabazaar (Jul 2026)",
  asOf: "1st July 2026",
  repoRate: "5.25%",
  slabs: [
    { id: "upto30", label: "Up to ₹30 Lakh", min: 0, max: 3000000 },
    { id: "30to75", label: "₹30 Lakh – ₹75 Lakh", min: 3000000, max: 7500000 },
    { id: "above75", label: "Above ₹75 Lakh", min: 7500000, max: Infinity }
  ],
  lenders: [
    {
      category: "Public Sector Banks",
      banks: [
        { name: "Union Bank of India", rates: { upto30: "7.15% onwards", "30to75": "7.15% onwards", above75: "7.15% onwards" } },
        { name: "Bank of Baroda", rates: { upto30: "7.20% – 8.95%", "30to75": "7.20% – 8.95%", above75: "7.20% – 8.95%" } },
        { name: "Bank of India", rates: { upto30: "7.10% – 10.25%", "30to75": "7.10% – 10.25%", above75: "7.10% – 10.25%" } },
        { name: "UCO Bank", rates: { upto30: "7.15% onwards", "30to75": "7.15% onwards", above75: "7.15% onwards" } },
        { name: "Bank of Maharashtra", rates: { upto30: "7.10% – 9.15%", "30to75": "7.10% – 9.15%", above75: "7.10% – 9.15%" } },
        { name: "Indian Overseas Bank", rates: { upto30: "7.10% onwards", "30to75": "7.10% onwards", above75: "7.10% onwards" } },
        // verify: sources conflict for Indian Bank (7.15% vs 8.15% starting) — confirm on indianbank.in
        { name: "Indian Bank", rates: { upto30: "7.15% onwards (verify)", "30to75": "7.15% onwards (verify)", above75: "7.15% onwards (verify)" } },
        { name: "Central Bank of India", rates: { upto30: "7.10% – 8.25%", "30to75": "7.10% – 8.25%", above75: "7.10% – 8.25%" } }
      ]
    },
    {
      category: "Private Sector Banks",
      banks: [
        { name: "Karur Vysya Bank", rates: { upto30: "8.50% onwards", "30to75": "8.50% onwards", above75: "8.50% onwards" } },
        { name: "South Indian Bank", rates: { upto30: "7.20% onwards", "30to75": "7.20% onwards", above75: "7.20% onwards" } },
        { name: "Karnataka Bank", rates: { upto30: "7.32% – 12.31%", "30to75": "7.32% – 12.31%", above75: "7.32% – 12.31%" } },
        { name: "Dhanlaxmi Bank", rates: { upto30: "8.20% onwards", "30to75": "8.20% onwards", above75: "8.20% onwards" } },
        { name: "Tamilnad Mercantile Bank", rates: { upto30: "8.80% onwards", "30to75": "8.80% onwards", above75: "8.80% onwards" } },
        { name: "Bandhan Bank", rates: { upto30: "8.41% onwards", "30to75": "8.41% onwards", above75: "8.41% onwards" } }
      ]
    },
    {
      category: "Housing Finance Companies (HFCs)",
      banks: [
        { name: "LIC Housing Finance", rates: { upto30: "7.15% – 10.00%", "30to75": "7.15% – 10.00%", above75: "7.15% – 10.00%" } },
        // verify: no current public source found for Repco — last known 10.10% onwards (Nov 2025); confirm on repcohome.com
        { name: "Repco Home Finance", rates: { upto30: "10.10% onwards (verify)", "30to75": "10.10% onwards (verify)", above75: "10.10% onwards (verify)" } },
        { name: "GIC Housing Finance", rates: { upto30: "8.80% onwards", "30to75": "8.80% onwards", above75: "8.80% onwards" } },
        // verify: ICICI Bank is 7.50% onwards; ICICI Home Finance (the HFC) not separately confirmed — check icicihfc.com
        { name: "ICICI Home Finance", rates: { upto30: "7.50% onwards (verify)", "30to75": "7.50% onwards (verify)", above75: "7.50% onwards (verify)" } },
        { name: "Aditya Birla Capital", rates: { upto30: "8.60% onwards", "30to75": "8.60% onwards", above75: "8.60% onwards" } },
        // verify: no current public source found for Cent Bank HF — last known 10.00% onwards (Nov 2025); confirm on cbhfl.com
        { name: "Cent Bank Home Finance Limited", rates: { upto30: "10.00% onwards (verify)", "30to75": "10.00% onwards (verify)", above75: "10.00% onwards (verify)" } }
      ]
    },
    {
      category: "Foreign Banks",
      banks: [
        { name: "HSBC India", rates: { upto30: "7.45% onwards", "30to75": "7.45% onwards", above75: "7.45% onwards" } },
        { name: "Standard Chartered Bank", rates: { upto30: "7.99% onwards", "30to75": "7.99% onwards", above75: "7.99% onwards" } }
      ]
    }
  ]
};
