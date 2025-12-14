/* =========================================================
   LOANWISE — FINAL DECISION ENGINE (FRONTEND ONLY)
   ========================================================= */

const $ = (id) => document.getElementById(id);

/* ----------------- Utilities ----------------- */

const num = (v) =>
  Number(String(v || "").replace(/[^\d.]/g, "")) || 0;

const inr = (v) =>
  "₹ " + Math.round(v).toLocaleString("en-IN");

/* Indian number formatting + helper text */
function attachFormatter(input, helper) {
  if (!input || !helper) return;
  input.addEventListener("input", () => {
    const v = num(input.value);
    input.value = v ? v.toLocaleString("en-IN") : "";
    helper.textContent = v ? inr(v) : "";
  });
}

/* ----------------- Finance Core ----------------- */

function calculateEMI(P, annualRate, months) {
  if (annualRate === 0) return P / months;
  const r = annualRate / 1200;
  return (P * r * Math.pow(1 + r, months)) /
         (Math.pow(1 + r, months) - 1);
}

function amortize(P, annualRate, emi, months) {
  let balance = P;
  let totalInterest = 0;
  const rows = [];
  const r = annualRate / 1200;

  for (let m = 1; m <= months && balance > 0; m++) {
    const interest = annualRate ? balance * r : 0;
    const principal = Math.min(emi - interest, balance);
    balance -= principal;
    totalInterest += interest;

    rows.push({
      year: Math.ceil(m / 12),
      interest,
      principal,
      balance
    });
  }

  return { rows, totalInterest, months: rows.length };
}

/* ----------------- Main Loan Analysis ----------------- */

function analyzeLoan() {
  const P = num($("principal").value);
  const rate = num($("rate").value);
  const tenureValue = num($("tenureValue").value);
  const tenureMonths =
    tenureValue * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P || !rate || !tenureMonths) return;

  const emi = calculateEMI(P, rate, tenureMonths);
  const base = amortize(P, rate, emi, tenureMonths);

  $("emi").textContent = inr(emi);
  $("optEmi").textContent = inr(emi);
  $("interestSaved").textContent = inr(0);
  $("loanDuration").textContent =
    `${Math.floor(base.months / 12)}y ${base.months % 12}m`;

  $("verdict").textContent =
    "This reflects your current loan position without any optimization.";

  /* Reveal decision summary */
  $("decisionSummary").classList.remove("hidden");

  /* ---------- Interest Sensitivity ---------- */
  updateRateSensitivity(base, P, rate, tenureMonths);

  /* ---------- Amortization (Year-wise) ---------- */
  renderAmortization(base.rows);

  /* ---------- Interest rates table refresh ---------- */
  loadInterestRates();
}

/* ----------------- Interest Rate Sensitivity ----------------- */

function updateRateSensitivity(base, P, rate, months) {
  const shock = Number($("rateShock").value || 0);
  $("rateShockValue").textContent =
    `${shock > 0 ? "+" : ""}${shock.toFixed(2)}%`;

  if (shock === 0) {
    $("riskImpact").textContent = inr(0);
    return;
  }

  const newRate = rate + shock;
  if (newRate <= 0) {
    $("riskImpact").textContent = "—";
    return;
  }

  const shocked = amortize(
    P,
    newRate,
    calculateEMI(P, newRate, months),
    months
  );

  $("riskImpact").textContent =
    inr(shocked.totalInterest - base.totalInterest);
}

/* ----------------- Amortization Renderer ----------------- */

function renderAmortization(rows) {
  const yearly = {};

  rows.forEach((r) => {
    if (!yearly[r.year]) {
      yearly[r.year] = { i: 0, p: 0, b: r.balance };
    }
    yearly[r.year].i += r.interest;
    yearly[r.year].p += r.principal;
    yearly[r.year].b = r.balance;
  });

  $("amortizationBody").innerHTML = Object.keys(yearly)
    .map((y) => `
      <tr>
        <td>${y}</td>
        <td>${inr(yearly[y].i)}</td>
        <td>${inr(yearly[y].p)}</td>
        <td>${inr(yearly[y].b)}</td>
      </tr>
    `)
    .join("");
}

/* ----------------- Bank Switching ----------------- */

function analyzeSwitching() {
  const P = num($("principal").value);
  const rate = num($("rate").value);
  const newRate = num($("newRate").value);
  const switchCost = num($("switchCost").value);
  const tenureValue = num($("tenureValue").value);
  const tenureMonths =
    tenureValue * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P || !rate || !newRate || !tenureMonths) return;

  const current = amortize(
    P,
    rate,
    calculateEMI(P, rate, tenureMonths),
    tenureMonths
  );

  const switched = amortize(
    P,
    newRate,
    calculateEMI(P, newRate, tenureMonths),
    tenureMonths
  );

  const netSaving =
    current.totalInterest - switched.totalInterest - switchCost;

  if (netSaving > 0) {
    $("switchDecision").textContent = "YES";
    $("switchDecision").className = "decision-yes";
    $("switchVerdict").textContent =
      `Switching saves approximately ${inr(netSaving)} even after costs.`;
  } else {
    $("switchDecision").textContent = "NO";
    $("switchDecision").className = "decision-no";
    $("switchVerdict").textContent =
      "Switching does not recover the switching cost within the remaining tenure.";
  }
}

/* ----------------- Interest Rate Table (Fallback Data) ----------------- */

function getLoanSlabId(amount) {
  if (amount <= 3000000) return "upto30";
  if (amount <= 7500000) return "30to75";
  return "above75";
}

function loadInterestRates() {
  if (!window.HOME_LOAN_RATES) return;

  const principal = num($("principal").value);
  const slabId = getLoanSlabId(principal || 0);

  let html = "";

  HOME_LOAN_RATES.lenders.forEach((group) => {
    html += `
      <tr>
        <td colspan="3" style="font-weight:700;padding-top:10px;">
          ${group.category}
        </td>
      </tr>
    `;

    group.banks.forEach((bank) => {
      html += `
        <tr>
          <td>${bank.name}</td>
          <td>${bank.rates[slabId] || "—"}</td>
          <td>—</td>
        </tr>
      `;
    });
  });

  $("interestRateTable").innerHTML = html;
  $("ratesAsOf").textContent = HOME_LOAN_RATES.asOf || "—";
}

/* ----------------- Init & Events ----------------- */

$("calculateBtn").addEventListener("click", analyzeLoan);
$("rateShock").addEventListener("input", () => {
  if (!$("decisionSummary").classList.contains("hidden")) {
    analyzeLoan();
  }
});

$("toggleSwitching").addEventListener("click", () => {
  $("switchingPanel").classList.toggle("hidden");
});

$("analyzeSwitching").addEventListener("click", analyzeSwitching);

/* Format currency inputs */
attachFormatter($("principal"), $("principalHelp"));
attachFormatter($("prepayment"), $("prepaymentHelp"));
attachFormatter($("extraMonthly"), $("extraMonthlyHelp"));
attachFormatter($("switchCost"), $("switchCostHelp"));

/* Initial rate table load */
document.addEventListener("DOMContentLoaded", loadInterestRates);
