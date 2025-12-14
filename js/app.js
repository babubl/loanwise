/* =========================================================
   LOANWISE — FINAL STABLE JS (CTA-SAFE, AMORTIZATION FIXED)
   ========================================================= */

const $ = (id) => document.getElementById(id);

/* ================= Utilities ================= */

const num = (v) =>
  Number(String(v || "").replace(/[^\d.]/g, "")) || 0;

const inr = (v) =>
  "₹ " + Math.round(v).toLocaleString("en-IN");

/* Attach INR formatter */
function attachFormatter(input, helper) {
  if (!input || !helper) return;
  input.addEventListener("input", () => {
    const v = num(input.value);
    input.value = v ? v.toLocaleString("en-IN") : "";
    helper.textContent = v ? inr(v) : "";
  });
}

/* ================= Finance Core ================= */

function calculateEMI(P, annualRate, months) {
  if (annualRate === 0) return P / months;
  const r = annualRate / 1200;
  return (P * r * Math.pow(1 + r, months)) /
         (Math.pow(1 + r, months) - 1);
}

function amortizeMonthly(P, annualRate, emi, months) {
  let balance = P;
  const rows = [];
  const r = annualRate / 1200;

  for (let m = 1; m <= months && balance > 0; m++) {
    const interest = annualRate ? balance * r : 0;
    const principal = Math.min(emi - interest, balance);
    balance -= principal;

    rows.push({
      month: m,
      emi,
      interest,
      principal,
      balance
    });
  }
  return rows;
}

/* ================= Main Analysis ================= */

function analyzeLoan() {
  const P = num($("principal").value);
  const rate = num($("rate").value);
  const tenureVal = num($("tenureValue").value);
  const tenureMonths =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P || !rate || !tenureMonths) return;

  /* RESET outputs */
  $("amortizationBody").innerHTML = "";
  $("amortizationMonthly").innerHTML = "";

  const emi = calculateEMI(P, rate, tenureMonths);
  const monthlyRows = amortizeMonthly(P, rate, emi, tenureMonths);

  /* Decision summary */
  $("emi").textContent = inr(emi);
  $("optEmi").textContent = inr(emi);
  $("interestSaved").textContent = inr(0);
  $("loanDuration").textContent =
    `${Math.floor(monthlyRows.length / 12)}y ${monthlyRows.length % 12}m`;

  $("verdict").textContent =
    "This reflects your current loan without optimization.";

  $("decisionSummary").classList.remove("hidden");

  renderYearly(monthlyRows);
  renderMonthly(monthlyRows);

  updateRateSensitivity(P, rate, tenureMonths, emi);
  loadInterestRates();
}

/* ================= Amortization ================= */

function renderYearly(rows) {
  const yearly = {};

  rows.forEach((r) => {
    const y = Math.ceil(r.month / 12);
    if (!yearly[y]) yearly[y] = { i: 0, p: 0, b: r.balance };
    yearly[y].i += r.interest;
    yearly[y].p += r.principal;
    yearly[y].b = r.balance;
  });

  $("amortizationBody").innerHTML = Object.entries(yearly)
    .map(
      ([y, v]) => `
      <tr>
        <td>${y}</td>
        <td>${inr(v.i)}</td>
        <td>${inr(v.p)}</td>
        <td>${inr(v.b)}</td>
      </tr>`
    )
    .join("");
}

function renderMonthly(rows) {
  $("amortizationMonthly").innerHTML = rows
    .map(
      (r) => `
      <tr>
        <td>${r.month}</td>
        <td>${inr(r.emi)}</td>
        <td>${inr(r.interest)}</td>
        <td>${inr(r.principal)}</td>
        <td>${inr(r.balance)}</td>
      </tr>`
    )
    .join("");
}

/* ================= Interest Sensitivity ================= */

function updateRateSensitivity(P, rate, months, baseEmi) {
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

  const newEmi = calculateEMI(P, newRate, months);
  const newRows = amortizeMonthly(P, newRate, newEmi, months);
  const baseRows = amortizeMonthly(P, rate, baseEmi, months);

  const sumInterest = (rows) =>
    rows.reduce((a, r) => a + r.interest, 0);

  $("riskImpact").textContent =
    inr(sumInterest(newRows) - sumInterest(baseRows));
}

/* ================= Rent vs EMI ================= */

function analyzeRentOptimizer() {
  const P = num($("principal").value);
  const rate = num($("rate").value);
  const rent = num($("monthlyRent").value);
  const tenureVal = num($("tenureValue").value);
  const months =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P || !rate || !rent || !months) {
    $("rentVerdict").textContent =
      "Please enter loan details and rent.";
    return;
  }

  const emi = calculateEMI(P, rate, months);

  if (emi <= rent) {
    $("rentVerdict").textContent =
      "Your rent already fully covers the EMI.";
    return;
  }

  const extra = emi - rent;
  const accelerated = amortizeMonthly(P, rate, emi + extra, months);

  const yearsSaved =
    Math.floor((months - accelerated.length) / 12);

  $("rentVerdict").textContent =
    `Paying ${inr(extra)} extra per month makes EMI rent-neutral and
     closes the loan about ${yearsSaved} years earlier.`;
}

/* ================= Bank Switching ================= */

function analyzeSwitching() {
  const P = num($("principal").value);
  const rate = num($("rate").value);
  const newRate = num($("newRate").value);
  const switchCost = num($("switchCost").value);
  const tenureVal = num($("tenureValue").value);
  const months =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P || !rate || !newRate || !months) return;

  const currRows = amortizeMonthly(
    P, rate, calculateEMI(P, rate, months), months
  );
  const newRows = amortizeMonthly(
    P, newRate, calculateEMI(P, newRate, months), months
  );

  const sumInterest = (r) =>
    r.reduce((a, x) => a + x.interest, 0);

  const net =
    sumInterest(currRows) - sumInterest(newRows) - switchCost;

  if (net > 0) {
    $("switchDecision").textContent = "YES";
    $("switchDecision").className = "decision-yes";
    $("switchVerdict").textContent =
      `Switching saves about ${inr(net)} even after costs.`;
  } else {
    $("switchDecision").textContent = "NO";
    $("switchDecision").className = "decision-no";
    $("switchVerdict").textContent =
      "Switching does not provide net savings.";
  }
}

/* ================= Interest Rate Table ================= */

function slabId(amount) {
  if (amount <= 3000000) return "upto30";
  if (amount <= 7500000) return "between30to75";
  return "above75";
}

function loadInterestRates() {
  if (!window.HOME_LOAN_RATES) return;

  const p = num($("principal").value);
  const slab = slabId(p || 0);
  let html = "";

  HOME_LOAN_RATES.lenders.forEach((g) => {
    html += `<tr><td colspan="3"><strong>${g.category}</strong></td></tr>`;
    g.banks.forEach((b) => {
      html += `
        <tr>
          <td>${b.name}</td>
          <td>${b.rates[slab] || "—"}</td>
          <td>${b.processingFee || "—"}</td>
        </tr>`;
    });
  });

  $("interestRateTable").innerHTML = html;
  $("ratesAsOf").textContent = HOME_LOAN_RATES.asOf;
}

/* ================= Tabs ================= */

document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");

    $("amortization-yearly").classList.toggle("hidden", t.dataset.view !== "yearly");
    $("amortization-monthly").classList.toggle("hidden", t.dataset.view !== "monthly");
  });
});

/* ================= Events ================= */

$("calculateBtn").addEventListener("click", analyzeLoan);
$("rateShock").addEventListener("input", analyzeLoan);
$("analyzeRent").addEventListener("click", analyzeRentOptimizer);
$("analyzeSwitching").addEventListener("click", analyzeSwitching);

$("toggleSwitching").addEventListener("click", () =>
  $("switchingPanel").classList.toggle("hidden")
);
$("toggleRentOptimizer").addEventListener("click", () =>
  $("rentOptimizerPanel").classList.toggle("hidden")
);

/* ================= Formatters ================= */

attachFormatter($("principal"), $("principalHelp"));
attachFormatter($("prepayment"), $("prepaymentHelp"));
attachFormatter($("extraMonthly"), $("extraMonthlyHelp"));
attachFormatter($("switchCost"), $("switchCostHelp"));
attachFormatter($("monthlyRent"), $("monthlyRentHelp"));

document.addEventListener("DOMContentLoaded", loadInterestRates);
