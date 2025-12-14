/* =========================================================
   LOANWISE — FINAL FRONTEND ENGINE
   ========================================================= */

const $ = id => document.getElementById(id);

/* ---------- Utilities ---------- */

const num = v => Number(String(v || "").replace(/[^\d.]/g, "")) || 0;
const inr = v => "₹ " + Math.round(v).toLocaleString("en-IN");

/* ---------- Indian formatting helpers ---------- */

function attachFormatter(input, helper) {
  if (!input || !helper) return;
  input.addEventListener("input", () => {
    const v = num(input.value);
    input.value = v ? v.toLocaleString("en-IN") : "";
    helper.textContent = v ? inr(v) : "";
  });
}

/* ---------- Finance core ---------- */

function emi(P, r, n) {
  if (r === 0) return P / n;
  const m = r / 1200;
  return (P * m * Math.pow(1 + m, n)) /
         (Math.pow(1 + m, n) - 1);
}

function amortize(P, r, e, n) {
  let bal = P, ti = 0, rows = [];
  const m = r / 1200;

  for (let i = 1; i <= n && bal > 0; i++) {
    const interest = r ? bal * m : 0;
    const principal = Math.min(e - interest, bal);
    bal -= principal;
    ti += interest;

    rows.push({
      year: Math.ceil(i / 12),
      interest,
      principal,
      balance: bal
    });
  }
  return { rows, ti, months: rows.length };
}

/* ---------- Main analysis ---------- */

function analyze() {
  const P = num($("principal").value);
  const r = num($("rate").value);
  const tenureVal = num($("tenureValue").value);
  const tenureMonths =
    tenureVal * ($("tenureUnit").value === "years" ? 12 : 1);

  if (!P || !r || !tenureMonths) return;

  const baseEmi = emi(P, r, tenureMonths);
  const base = amortize(P, r, baseEmi, tenureMonths);

  $("emi").textContent = inr(baseEmi);
  $("optEmi").textContent = inr(baseEmi);
  $("interestSaved").textContent = inr(0);
  $("loanDuration").textContent =
    `${Math.floor(base.months / 12)}y ${base.months % 12}m`;

  $("verdict").textContent =
    "This is your current loan position without any optimization.";

  /* ---------- Interest sensitivity (slider) ---------- */

  const shock = Number($("rateShock").value || 0);
  $("rateShockValue").textContent = `+${shock.toFixed(2)}%`;

  if (shock > 0) {
    const shocked = amortize(
      P,
      r + shock,
      emi(P, r + shock, tenureMonths),
      tenureMonths
    );
    $("riskImpact").textContent = inr(shocked.ti - base.ti);
  } else {
    $("riskImpact").textContent = inr(0);
  }

  /* ---------- Amortization (year-wise) ---------- */

  const yearly = {};
  base.rows.forEach(r => {
    if (!yearly[r.year]) yearly[r.year] = { i: 0, p: 0, b: r.balance };
    yearly[r.year].i += r.interest;
    yearly[r.year].p += r.principal;
    yearly[r.year].b = r.balance;
  });

  $("amortizationBody").innerHTML = Object.keys(yearly)
    .map(y => `
      <tr>
        <td>${y}</td>
        <td>${inr(yearly[y].i)}</td>
        <td>${inr(yearly[y].p)}</td>
        <td>${inr(yearly[y].b)}</td>
      </tr>
    `).join("");
}

/* ---------- Tabs ---------- */

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

/* ---------- Interest rates (fallback display) ---------- */

function loadRates() {
  if (!window.HOME_LOAN_RATES) return;

  $("interestRateTable").innerHTML =
    HOME_LOAN_RATES.lenders.map(b =>
      `<tr>
        <td>${b.name}</td>
        <td>${b.rate}</td>
        <td>${b.charges || "—"}</td>
      </tr>`
    ).join("");

  $("ratesAsOf").textContent = HOME_LOAN_RATES.asOf;
}

/* ---------- Init ---------- */

$("calculateBtn").addEventListener("click", analyze);
$("rateShock").addEventListener("input", analyze);

attachFormatter($("principal"), $("principalHelp"));
attachFormatter($("prepayment"), $("prepaymentHelp"));
attachFormatter($("extraMonthly"), $("extraMonthlyHelp"));
attachFormatter($("switchCost"), $("switchCostHelp"));

loadRates();
