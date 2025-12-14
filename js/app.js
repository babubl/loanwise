/* =========================================================
   LOANWISE — FINAL DECISION ENGINE (STABLE)
   ========================================================= */

const $ = (id) => document.getElementById(id);

/* ---------------- Utilities ---------------- */

const num = (v) =>
  Number(String(v || "").replace(/[^\d.]/g, "")) || 0;

const inr = (v) =>
  "₹ " + Math.round(v).toLocaleString("en-IN");

/* INR formatter */
function attachFormatter(input, helper) {
  if (!input || !helper) return;
  input.addEventListener("input", () => {
    const v = num(input.value);
    input.value = v ? v.toLocaleString("en-IN") : "";
    helper.textContent = v ? inr(v) : "";
  });
}

/* ---------------- Finance Core ---------------- */

function calculateEMI(P, annualRate, months) {
  if (annualRate === 0) return P / months;
  const r = annualRate / 1200;
  return (P * r * Math.pow(1 + r, months)) /
         (Math.pow(1 + r, months) - 1);
}

function amortize(P, annualRate, emi, months, extraMonthly = 0) {
  let balance = P;
  let totalInterest = 0;
  const rows = [];
  const r = annualRate / 1200;

  for (let m = 1; m <= months && balance > 0; m++) {
    const interest = balance * r;
    const principal = Math.min(emi + extraMonthly - interest, balance);
    balance -= principal;
    totalInterest += interest;

    rows.push({ month: m, interest, principal, balance });
  }

  return {
    rows,
    months: rows.length,
    totalInterest
  };
}

/* ---------------- MAIN CTA ---------------- */

function analyzeLoan() {
  const P0 = num($("principal").value);
  const rate = num($("rate").value);
  const tenureVal = num($("tenureValue").value);
  const tenureMonths =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P0 || !rate || !tenureMonths) return;

  /* Inputs */
  const lumpSum = num($("prepayment").value);
  const extraMonthly = num($("extraMonthly").value);
  const reductionMode = $("reductionMode").value;
  const rateShock = Number($("rateShock").value || 0);

  const effectiveRate = rate + rateShock;
  if (effectiveRate <= 0) return;

  /* Base loan */
  const baseEmi = calculateEMI(P0, rate, tenureMonths);
  const base = amortize(P0, rate, baseEmi, tenureMonths);

  /* Apply prepayment */
  let P = Math.max(P0 - lumpSum, 0);
  let emi = baseEmi;

  if (reductionMode === "emi") {
    emi = calculateEMI(P, effectiveRate, tenureMonths);
  }

  const optimized = amortize(
    P,
    effectiveRate,
    emi,
    tenureMonths,
    extraMonthly
  );

  /* Decision summary */
  $("emi").textContent = inr(baseEmi);
  $("optEmi").textContent = inr(emi + extraMonthly);
  $("interestSaved").textContent =
    inr(base.totalInterest - optimized.totalInterest);

  $("loanDuration").textContent =
    `${Math.floor(optimized.months / 12)}y ${optimized.months % 12}m`;

  $("verdict").textContent =
    `This strategy saves ${inr(base.totalInterest - optimized.totalInterest)}
     and closes your loan about
     ${Math.floor((base.months - optimized.months) / 12)} years earlier.`;

  $("decisionSummary").classList.remove("hidden");

  renderAmortization(optimized.rows);
  updateRateSensitivity(P0, rate, tenureMonths, baseEmi);
  loadInterestRates();
}

/* ---------------- Amortization ---------------- */

function renderAmortization(rows) {
  $("amortizationBody").innerHTML = "";
  $("amortizationMonthly").innerHTML = "";

  const yearly = {};

  rows.forEach((r) => {
    const y = Math.ceil(r.month / 12);
    if (!yearly[y]) yearly[y] = { i: 0, p: 0, b: r.balance };

    yearly[y].i += r.interest;
    yearly[y].p += r.principal;
    yearly[y].b = r.balance;

    $("amortizationMonthly").innerHTML += `
      <tr>
        <td>${r.month}</td>
        <td>${inr(r.interest)}</td>
        <td>${inr(r.principal)}</td>
        <td>${inr(r.balance)}</td>
      </tr>`;
  });

  Object.entries(yearly).forEach(([y, v]) => {
    $("amortizationBody").innerHTML += `
      <tr>
        <td>${y}</td>
        <td>${inr(v.i)}</td>
        <td>${inr(v.p)}</td>
        <td>${inr(v.b)}</td>
      </tr>`;
  });
}

/* ---------------- Interest Sensitivity ---------------- */

function updateRateSensitivity(P, rate, months, baseEmi) {
  const shock = Number($("rateShock").value || 0);
  $("rateShockValue").textContent =
    `${shock >= 0 ? "+" : ""}${shock.toFixed(2)}%`;

  if (shock === 0) {
    $("riskImpact").textContent = inr(0);
    return;
  }

  const newRate = rate + shock;
  if (newRate <= 0) return;

  const base = amortize(P, rate, baseEmi, months);
  const shocked = amortize(
    P,
    newRate,
    calculateEMI(P, newRate, months),
    months
  );

  $("riskImpact").textContent =
    inr(shocked.totalInterest - base.totalInterest);
}

/* ---------------- Rent vs EMI ---------------- */

function analyzeRentOptimizer() {
  const P0 = num($("principal").value);
  const rate = num($("rate").value);
  const rent = num($("monthlyRent").value);
  const tenureVal = num($("tenureValue").value);
  const months =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P0 || !rate || !rent || !months) return;

  const emi = calculateEMI(P0, rate, months);

  if (emi <= rent) {
    $("rentVerdict").textContent =
      "Your rent already fully covers EMI.";
    return;
  }

  /* Monthly */
  const extraMonthly = emi - rent;

  /* Lump sum (binary search) */
  let low = 0, high = P0, lump = 0;
  for (let i = 0; i < 30; i++) {
    lump = (low + high) / 2;
    const testEmi = calculateEMI(P0 - lump, rate, months);
    testEmi > rent ? (low = lump) : (high = lump);
  }

  $("rentVerdict").textContent =
    `To align rent with EMI:
     • Pay ${inr(extraMonthly)} extra per month, OR
     • Make a one-time prepayment of about ${inr(lump)} today.`;
}

/* ---------------- Interest Rate Table ---------------- */

function slabId(amount) {
  if (amount <= 3000000) return "upto30";
  if (amount <= 7500000) return "30to75";
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

/* ---------------- Events ---------------- */

$("calculateBtn").addEventListener("click", analyzeLoan);
$("analyzeRent").addEventListener("click", analyzeRentOptimizer);

$("toggleRentOptimizer").addEventListener("click", () =>
  $("rentOptimizerPanel").classList.toggle("hidden")
);

$("toggleSwitching").addEventListener("click", () =>
  $("switchingPanel").classList.toggle("hidden")
);

/* ---------------- Formatters ---------------- */

attachFormatter($("principal"), $("principalHelp"));
attachFormatter($("prepayment"), $("prepaymentHelp"));
attachFormatter($("extraMonthly"), $("extraMonthlyHelp"));
attachFormatter($("monthlyRent"), $("monthlyRentHelp"));
attachFormatter($("switchCost"), $("switchCostHelp"));

document.addEventListener("DOMContentLoaded", loadInterestRates);
