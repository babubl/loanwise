/* ============================================================
   LOANWISE — Stable Frontend Engine
   Defensive • No-crash • GitHub Pages safe
   ============================================================ */

const $ = id => document.getElementById(id);

/* ---------- Inputs ---------- */
const principalEl = $("principal");
const rateEl = $("rate");
const tenureValEl = $("tenureValue");
const tenureUnitEl = $("tenureUnit");
const prepayEl = $("prepayment");
const extraEl = $("extraMonthly");
const newRateEl = $("newRate");
const switchCostEl = $("switchCost");

/* ---------- Outputs ---------- */
const emiEl = $("emi");
const optEmiEl = $("optEmi");
const interestSavedEl = $("interestSaved");
const loanDurationEl = $("loanDuration");
const verdictEl = $("verdict");

const switchDecisionEl = $("switchDecision");
const switchVerdictEl = $("switchVerdict");
const riskImpactEl = $("riskImpact");
const amortBodyEl = $("amortizationBody");

/* ---------- Helpers ---------- */
const principalHelp = $("principalHelp");
const prepayHelp = $("prepaymentHelp");
const extraHelp = $("extraMonthlyHelp");
const switchCostHelp = $("switchCostHelp");

const rateTableEl = $("interestRateTable");
const ratesAsOfEl = $("ratesAsOf");

/* =========================
   UTILITIES
========================= */

const num = v => Number(String(v || "").replace(/[^\d.]/g, "")) || 0;
const inr = v => "₹ " + Math.round(v).toLocaleString("en-IN");

const words = v => {
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
   FINANCE CORE
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
  let out = [], I = 0, P = 0, y = 1;
  rows.forEach((r, i) => {
    I += r.int; P += r.prin;
    if ((i + 1) % 12 === 0 || r.bal === 0) {
      out.push({ y, I, P, bal: r.bal });
      I = P = 0; y++;
    }
  });
  return out;
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
    verdictEl.textContent = "Please enter loan amount, interest rate and tenure.";
    return;
  }

  const lump = num(prepayEl.value);
  const extra = num(extraEl.value);

  const baseEmi = emi(P, r, t);
  const base = amortize(P, r, baseEmi, t);

  const optP = Math.max(P - lump, 0);
  const optEmi = emi(optP, r, t);
  const opt = amortize(optP, r, optEmi, t, extra);

  emiEl.textContent = inr(baseEmi);
  optEmiEl.textContent = inr(optEmi);
  interestSavedEl.textContent = inr(base.ti - opt.ti);
  loanDurationEl.textContent =
    `${Math.floor(opt.months / 12)}y ${opt.months % 12}m`;

  verdictEl.textContent =
    base.ti > opt.ti
      ? `Prepaying saves ${inr(base.ti - opt.ti)} in interest and shortens the loan.`
      : `Prepayment impact is minimal at current inputs.`;

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
        `Switching saves about ${inr(gain)} after costs.`;
    } else {
      switchDecisionEl.textContent = "NO";
      switchDecisionEl.className = "decision-no";
      switchVerdictEl.textContent =
        "Switching does not recover switching cost.";
    }
  }

  /* Interest sensitivity */
  const shockEl = document.querySelector("input[name='rateShock']:checked");
  if (shockEl) {
    const shock = Number(shockEl.value);
    const shocked = amortize(P, r + shock, emi(P, r + shock, t), t);
    riskImpactEl.textContent = inr(shocked.ti - base.ti);
  }

  /* Amortization */
  amortBodyEl.innerHTML = yearly(opt.rows).map(y =>
    `<tr>
      <td>${y.y}</td>
      <td>${inr(y.I)}</td>
      <td>${inr(y.P)}</td>
      <td>${inr(y.bal)}</td>
    </tr>`
  ).join("");
}

/* =========================
   LIVE RATES (SAFE FALLBACK)
========================= */

function loadRates() {
  const fallback = [
    { name: "SBI", rate: "8.40%", charges: "₹10,000" },
    { name: "HDFC", rate: "8.45%", charges: "₹3,000" },
    { name: "ICICI", rate: "8.50%", charges: "₹3,000" }
  ];

  rateTableEl.innerHTML = fallback.map(b =>
    `<tr>
      <td>${b.name}</td>
      <td>${b.rate}</td>
      <td>${b.charges}</td>
    </tr>`
  ).join("");

  ratesAsOfEl.textContent = new Date().toLocaleDateString("en-IN");
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
