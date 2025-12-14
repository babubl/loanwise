/* =========================================================
   LOANWISE — FINAL BUG-FIXED JS
   ========================================================= */

const $ = (id) => document.getElementById(id);

/* ---------------- Utilities ---------------- */

const num = (v) =>
  Number(String(v || "").replace(/[^\d.]/g, "")) || 0;

const inr = (v) =>
  "₹ " + Math.round(v).toLocaleString("en-IN");

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

function amortize(P, rate, emi, months, extraMonthly = 0) {
  let balance = P;
  let totalInterest = 0;
  const rows = [];
  const r = rate / 1200;

  for (let m = 1; m <= months && balance > 0; m++) {
    const interest = balance * r;
    const principal = Math.min(emi + extraMonthly - interest, balance);
    balance -= principal;
    totalInterest += interest;
    rows.push({ month: m, interest, principal, balance });
  }

  return { rows, months: rows.length, totalInterest };
}

/* ---------------- MAIN CTA ---------------- */

function analyzeLoan() {
  const P0 = num($("principal").value);
  const rate = num($("rate").value);
  const tenureVal = num($("tenureValue").value);
  const months =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P0 || !rate || !months) return;

  const lumpSum = num($("prepayment").value);
  const extraMonthly = num($("extraMonthly").value);
  const reductionMode = $("reductionMode").value;

  const rateShock = Number($("rateShock").value || 0);
  const effectiveRate = rate + rateShock;
  if (effectiveRate <= 0) return;

  const baseEmi = calculateEMI(P0, rate, months);
  const base = amortize(P0, rate, baseEmi, months);

  let principal = Math.max(P0 - lumpSum, 0);
  let emi = baseEmi;

  if (reductionMode === "emi") {
    emi = calculateEMI(principal, effectiveRate, months);
  }

  const opt = amortize(principal, effectiveRate, emi, months, extraMonthly);

  $("emi").textContent = inr(baseEmi);
  $("optEmi").textContent = inr(emi + extraMonthly);
  $("interestSaved").textContent =
    inr(base.totalInterest - opt.totalInterest);

  $("loanDuration").textContent =
    `${Math.floor(opt.months / 12)}y ${opt.months % 12}m`;

  $("verdict").textContent =
    `You save ${inr(base.totalInterest - opt.totalInterest)} and
     close the loan ${Math.floor((base.months - opt.months) / 12)} years earlier.`;

  $("decisionSummary").classList.remove("hidden");

  renderAmortization(opt.rows);
  updateRateSensitivity(P0, rate, months, baseEmi);
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

  const shocked = amortize(
    P,
    rate + shock,
    calculateEMI(P, rate + shock, months),
    months
  );

  const base = amortize(P, rate, baseEmi, months);

  $("riskImpact").textContent =
    inr(shocked.totalInterest - base.totalInterest);
}

/* ---------------- Rent Optimizer ---------------- */

function analyzeRentOptimizer() {
  const P = num($("principal").value);
  const rate = num($("rate").value);
  const rent = num($("monthlyRent").value);
  const tenureVal = num($("tenureValue").value);
  const months =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P || !rate || !rent || !months) return;

  const emi = calculateEMI(P, rate, months);

  if (emi <= rent) {
    $("rentVerdict").textContent = "Rent already covers EMI.";
    return;
  }

  let low = 0, high = P, lump = 0;
  for (let i = 0; i < 30; i++) {
    lump = (low + high) / 2;
    calculateEMI(P - lump, rate, months) > rent
      ? (low = lump)
      : (high = lump);
  }

  $("rentVerdict").textContent =
    `Pay ${inr(emi - rent)} extra monthly OR
     a one-time prepayment of ${inr(lump)} to align rent with EMI.`;
}

/* ---------------- Bank Switching ---------------- */

function analyzeSwitching() {
  const P = num($("principal").value);
  const rate = num($("rate").value);
  const newRate = num($("newRate").value);
  const cost = num($("switchCost").value);
  const tenureVal = num($("tenureValue").value);
  const months =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P || !rate || !newRate || !months) return;

  const curr = amortize(P, rate, calculateEMI(P, rate, months), months);
  const alt = amortize(P, newRate, calculateEMI(P, newRate, months), months);

  const net = curr.totalInterest - alt.totalInterest - cost;

  if (net > 0) {
    $("switchDecision").textContent = "YES";
    $("switchDecision").className = "decision-yes";
    $("switchVerdict").textContent =
      `Switching saves ${inr(net)} after costs.`;
  } else {
    $("switchDecision").textContent = "NO";
    $("switchDecision").className = "decision-no";
    $("switchVerdict").textContent =
      "Switching does not result in net savings.";
  }
}

/* ---------------- Interest Rates ---------------- */

function slabId(p) {
  if (p <= 3000000) return "upto30";
  if (p <= 7500000) return "30to75";
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
          <td>—</td>
        </tr>`;
    });
  });

  $("interestRateTable").innerHTML = html;
  $("ratesAsOf").textContent = HOME_LOAN_RATES.asOf;
}

/* ---------------- Tabs ---------------- */

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    $("amortization-yearly").classList.toggle(
      "hidden", tab.dataset.view !== "yearly"
    );
    $("amortization-monthly").classList.toggle(
      "hidden", tab.dataset.view !== "monthly"
    );
  });
});

/* ---------------- Events ---------------- */

$("calculateBtn").addEventListener("click", analyzeLoan);
$("rateShock").addEventListener("input", analyzeLoan);
$("analyzeRent").addEventListener("click", analyzeRentOptimizer);
$("analyzeSwitching").addEventListener("click", analyzeSwitching);

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
