/* ============================================================
   LOANWISE — FINAL ADVISORY JS
   Professional • Calm • Decision-first • Frontend-only
   ============================================================ */

/* =========================
   UTILITIES
========================= */

function cleanNumber(val) {
  return Number(String(val || "").replace(/[^\d]/g, "")) || 0;
}

function formatINR(n) {
  return "₹ " + Math.round(n).toLocaleString("en-IN");
}

function amountInWords(n) {
  if (!n) return "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  let parts = [];
  if (crore) parts.push(crore + " crore");
  if (lakh) parts.push(lakh + " lakh");
  return parts.join(" ");
}

/* =========================
   INDIAN INPUT FORMATTER
========================= */

function attachFormatter(input, helper) {
  input.addEventListener("input", () => {
    const val = cleanNumber(input.value);
    if (!val) {
      input.value = "";
      helper.innerText = "";
      return;
    }
    input.value = val.toLocaleString("en-IN");
    helper.innerText =
      formatINR(val) +
      (amountInWords(val) ? " · " + amountInWords(val) : "");
  });
}

/* =========================
   CORE CALCULATIONS
========================= */

function calculateEMI(P, rate, months) {
  const r = rate / 12 / 100;
  return (P * r * Math.pow(1 + r, months)) /
         (Math.pow(1 + r, months) - 1);
}

function amortization(P, rate, emi, months, extra = 0) {
  let balance = P;
  let totalInterest = 0;
  const r = rate / 12 / 100;
  const schedule = [];

  for (let m = 1; m <= months && balance > 0; m++) {
    const interest = balance * r;
    let principal = emi - interest + extra;
    if (principal > balance) principal = balance;
    balance -= principal;
    totalInterest += interest;

    schedule.push({
      month: m,
      interest,
      principal,
      balance: Math.max(balance, 0)
    });
  }

  return {
    schedule,
    totalInterest,
    months: schedule.length
  };
}

function yearlySummary(schedule) {
  let years = [];
  let i = 0, p = 0, y = 1;

  schedule.forEach((row, idx) => {
    i += row.interest;
    p += row.principal;
    if ((idx + 1) % 12 === 0 || row.balance === 0) {
      years.push({
        year: y++,
        interest: i,
        principal: p,
        balance: row.balance
      });
      i = 0; p = 0;
    }
  });

  return years;
}

/* =========================
   MAIN ANALYSIS
========================= */

function analyzeLoan() {

  /* ---------- BASIC INPUTS ---------- */

  const P = cleanNumber(principal.value);
  const rate = Number(rateInput.value || rate.value);
  const tenureMonths =
    tenureUnit.value === "years"
      ? Number(tenureValue.value) * 12
      : Number(tenureValue.value);

  if (!P || !rate || !tenureMonths) {
    alert("Please enter loan amount, interest rate and tenure.");
    return;
  }

  /* ---------- ADVANCED INPUTS (OPTIONAL) ---------- */

  const lumpSum = cleanNumber(prepayment.value);
  const extraMonthly = cleanNumber(extraMonthlyInput?.value || extraMonthly.value);
  const reductionMode = reductionModeInput?.value || reductionMode.value;
  const rent = cleanNumber(rentInput.value);
  const newRate = Number(newRateInput?.value || newRate.value);
  const switchCost = cleanNumber(switchCostInput?.value || switchCost.value);

  /* ---------- BASE SCENARIO ---------- */

  const baseEmi = calculateEMI(P, rate, tenureMonths);
  const baseResult = amortization(P, rate, baseEmi, tenureMonths);

  /* ---------- OPTIMIZED SCENARIO ---------- */

  let optPrincipal = P - lumpSum;
  if (optPrincipal < 0) optPrincipal = 0;

  let optEmi = calculateEMI(optPrincipal, rate, tenureMonths);
  let optResult = amortization(
    optPrincipal,
    rate,
    optEmi,
    tenureMonths,
    extraMonthly
  );

  /* ---------- OUTPUT: NUMBERS ---------- */

  emi.innerText = formatINR(baseEmi);
  optEmiEl.innerText = formatINR(optEmi);
  interestSaved.innerText =
    formatINR(baseResult.totalInterest - optResult.totalInterest);

  loanDuration.innerText =
    Math.floor(optResult.months / 12) +
    " years " +
    (optResult.months % 12) +
    " months";

  /* ---------- DECISION SUMMARY ---------- */

  let decision =
    "Based on your inputs, prepaying " +
    formatINR(lumpSum) +
    " and paying an extra " +
    formatINR(extraMonthly) +
    " per month reduces your total interest by " +
    formatINR(baseResult.totalInterest - optResult.totalInterest) +
    " and closes your loan earlier.";

  if (!lumpSum && !extraMonthly) {
    decision =
      "With no prepayments, your loan will run for the full tenure with a total interest of " +
      formatINR(baseResult.totalInterest) +
      ". Any early principal reduction will meaningfully reduce this.";
  }

  if (rent) {
    decision +=
      " Your rental income covers approximately " +
      Math.round((rent / optEmi) * 100) +
      "% of your EMI.";
  }

  verdict.innerText = decision;

  /* ---------- BANK SWITCHING (ONLY IF DATA PRESENT) ---------- */

  if (newRate && newRate < rate) {
    const altEmi = calculateEMI(P, newRate, tenureMonths);
    const altResult = amortization(P, newRate, altEmi, tenureMonths);
    const netGain =
      baseResult.totalInterest - altResult.totalInterest - switchCost;

    switchVerdict.innerText =
      netGain > 0
        ? "Switching to a lower rate saves approximately " +
          formatINR(netGain) +
          " over the loan tenure."
        : "After considering switching costs, switching banks does not provide a financial benefit.";
  } else {
    switchVerdict.innerText =
      "Bank switching analysis was not applied.";
  }

  /* ---------- RISK (INFORMATIONAL) ---------- */

  risk025.innerText =
    formatINR(
      amortization(P, rate + 0.25, calculateEMI(P, rate + 0.25, tenureMonths), tenureMonths).totalInterest
      - baseResult.totalInterest
    ) + " additional interest";

  risk050.innerText =
    formatINR(
      amortization(P, rate + 0.5, calculateEMI(P, rate + 0.5, tenureMonths), tenureMonths).totalInterest
      - baseResult.totalInterest
    ) + " additional interest";

  risk100.innerText =
    formatINR(
      amortization(P, rate + 1, calculateEMI(P, rate + 1, tenureMonths), tenureMonths).totalInterest
      - baseResult.totalInterest
    ) + " additional interest";

  /* ---------- AMORTIZATION ---------- */

  amortizationBody.innerHTML = "";
  yearlySummary(optResult.schedule).forEach(y => {
    amortizationBody.innerHTML += `
      <tr>
        <td>${y.year}</td>
        <td>${formatINR(y.interest)}</td>
        <td>${formatINR(y.principal)}</td>
        <td>${formatINR(y.balance)}</td>
      </tr>
    `;
  });
}

/* =========================
   EVENTS
========================= */

calculateBtn.addEventListener("click", analyzeLoan);

toggleAmortization.addEventListener("click", () => {
  amortizationContainer.classList.toggle("hidden");
});

/* =========================
   INIT FORMATTERS
========================= */

attachFormatter(principal, principalHelp);
attachFormatter(prepayment, prepaymentHelp);
attachFormatter(extraMonthly, extraMonthlyHelp);
attachFormatter(switchCost, switchCostHelp);
