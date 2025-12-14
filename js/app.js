/* ============================================================
   LOANWISE — Decision Cockpit Engine (Frontend-only)
   Supports cockpit HTML + dark KPI CSS
   ============================================================ */

/* =========================
   DOM REFERENCES
========================= */

const $ = id => document.getElementById(id);

// Inputs
const principalEl = $("principal");
const rateEl = $("rate");
const tenureValEl = $("tenureValue");
const tenureUnitEl = $("tenureUnit");

const prepayEl = $("prepayment");
const extraEl = $("extraMonthly");
const reductionModeEl = $("reductionMode");

const newRateEl = $("newRate");
const switchCostEl = $("switchCost");

// Outputs
const emiEl = $("emi");
const optEmiEl = $("optEmi");
const interestSavedEl = $("interestSaved");
const loanDurationEl = $("loanDuration");
const verdictEl = $("verdict");

const switchDecisionEl = $("switchDecision");
const switchVerdictEl = $("switchVerdict");

const riskImpactEl = $("riskImpact");

const amortBodyEl = $("amortizationBody");

// Helpers
const principalHelp = $("principalHelp");
const prepayHelp = $("prepaymentHelp");
const extraHelp = $("extraMonthlyHelp");
const switchCostHelp = $("switchCostHelp");

// Live rates
const rateTableEl = $("interestRateTable");
const ratesAsOfEl = $("ratesAsOf");

/* =========================
   UTILITIES
========================= */

const num = v => Number(String(v || "").replace(/[^\d.]/g, "")) || 0;

const inr = v =>
  "₹ " + Math.round(v).toLocaleString("en-IN");

const words = v => {
  if (!v) return "";
  const c = Math.floor(v / 1e7);
  const l = Math.floor((v % 1e7) / 1e5);
  return [c && `${c} crore`, l && `${l} lakh`].filter(Boolean).join(" ");
};

function attachFormatter(input, helper) {
  if (!input || !helper) return;
  input.addEventListener("input", () => {
    const v = num(input.value);
    input.value = v ? v.toLocaleString("en-IN") : "";
    helper.textContent = v ? `${inr(v)} · ${words(v)}` : "";
  });
}

/* =========================
   FINANCIAL CALCULATIONS
========================= */

function emi(P, r, n) {
  if (n === 0) return 0;
  if (r === 0) return P / n;
  const m = r / 1200;
  return (P * m * Math.pow(1 + m, n)) /
         (Math.pow(1 + m, n) - 1);
}

function amortize(P, r, e, n, extra = 0) {
  let bal = P, ti = 0, rows = [];
  const m = r / 1200;

  for (let i = 1; i <= n && bal > 0; i++) {
    const int = r === 0 ? 0 : bal * m;
    let prin = e - int + extra;
    prin = Math.min(prin, bal);
    bal -= prin;
    ti += int;

    rows.push({ i, int, prin, bal });
  }
  return { rows, ti, months: rows.length };
}

function yearly(rows) {
  let y = [], I = 0, P = 0, yr = 1;
  rows.forEach((r, i) => {
    I += r.int; P += r.prin;
    if ((i + 1) % 12 === 0 || r.bal === 0) {
      y.push({ yr, I, P, bal: r.bal });
      I = P = 0; yr++;
    }
  });
  return y;
}

/* =========================
   MAIN ANALYSIS
========================= */

function analyze() {
  const P = num(principalEl.value);
  const r = num(rateEl.value);
  const t = num(tenureValEl.value) *
    (tenureUnitEl.value === "years" ? 12 : 1);

  if (!P || !r || !t) {
    alert("Please enter loan amount, interest rate and tenure.");
    return;
  }

  const lump = num(prepayEl.value);
  const extra = num(extraEl.value);

  /* Base */
  const baseEmi = emi(P, r, t);
  const base = amortize(P, r, baseEmi, t);

  /* Optimized */
  const optP = Math.max(P - lump, 0);
  const optEmi = emi(optP, r, t);
  const opt = amortize(optP, r, optEmi, t, extra);

  /* Summary */
  emiEl.textContent = inr(baseEmi);
  optEmiEl.textContent = inr(optEmi);
  interestSavedEl.textContent = inr(base.ti - opt.ti);
  loanDurationEl.textContent =
    `${Math.floor(opt.months / 12)}y ${opt.months % 12}m`;

  verdictEl.textContent =
    base.ti > opt.ti
      ? `Prepaying now saves ${inr(base.ti - opt.ti)} in interest and closes the loan faster.`
      : `No meaningful savings from prepayment at current inputs.`;

  /* Bank switching */
  const nr = num(newRateEl.value);
  const cost = num(switchCostEl.value);

  if (nr && nr < r) {
    const alt = amortize(P, nr, emi(P, nr, t), t);
    const gain = base.ti - alt.ti - cost;

    if (gain > 0) {
      switchDecisionEl.textContent = "YES";
      switchDecisionEl.className = "decision-yes";
      switchVerdictEl.textContent =
        `Switching saves approximately ${inr(gain)} after costs.`;
    } else {
      switchDecisionEl.textContent = "NO";
      switchDecisionEl.className = "decision-no";
      switchVerdictEl.textContent =
        "Switching does not recover the switching cost.";
    }
  } else {
    switchDecisionEl.textContent = "—";
    switchVerdictEl.textContent = "Enter an alternate interest rate.";
  }

  /* Interest sensitivity */
  const shock = Number(
    document.querySelector("input[name='rateShock']:checked")?.value || 0
  );
  if (shock) {
    const shocked = amortize(P, r + shock, emi(P, r + shock, t), t);
    riskImpactEl.textContent = inr(shocked.ti - base.ti);
  }

  /* Amortization (yearly) */
  amortBodyEl.innerHTML = yearly(opt.rows)
    .map(y =>
      `<tr>
        <td>${y.yr}</td>
        <td>${inr(y.I)}</td>
        <td>${inr(y.P)}</td>
        <td>${inr(y.bal)}</td>
      </tr>`
    ).join("");
}

/* =========================
   TABS
========================= */

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".amortization-panel")
      .forEach(p => p.classList.add("hidden"));

    tab.classList.add("active");
    document.getElementById(`amortization-${tab.dataset.tab}`)
      .classList.remove("hidden");
  });
});

/* =========================
   LIVE INTEREST RATES (FETCH)
========================= */

async function loadRates() {
  try {
    const res = await fetch(
      "https://example.com/home-loan-rates.json"
    );
    const data = await res.json();

    rateTableEl.innerHTML = data.banks.map(b =>
      `<tr>
        <td>${b.name}</td>
        <td>${b.rate}%</td>
        <td>${b.charges || "—"}</td>
      </tr>`
    ).join("");

    ratesAsOfEl.textContent = data.asOf;
  } catch {
    rateTableEl.innerHTML =
      `<tr><td colspan="3">Unable to load rate data.</td></tr>`;
  }
}

/* =========================
   INIT
========================= */

$("calculateBtn").addEventListener("click", analyze);

attachFormatter(principalEl, principalHelp);
attachFormatter(prepayEl, prepayHelp);
attachFormatter(extraEl, extraHelp);
attachFormatter(switchCostEl, switchCostHelp);

loadRates();
