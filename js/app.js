/* =========================================================
   LOANWISE – FINAL ADVISORY ENGINE
   Consumer-grade | Bank-demo safe | Frontend only
   ========================================================= */

/* =========================================================
   SECTION 1 — GENERAL UTILITIES
   ========================================================= */

// Strip formatting
function num(v) {
  return Number(String(v || "").replace(/[^\d]/g, "")) || 0;
}

// Indian currency formatter
function fmt(n) {
  return "₹ " + Math.round(n).toLocaleString("en-IN");
}

// Number to words (crore / lakh)
function words(n) {
  if (!n) return "";
  const c = Math.floor(n / 10000000);
  const l = Math.floor((n % 10000000) / 100000);
  let p = [];
  if (c) p.push(c + " crore");
  if (l) p.push(l + " lakh");
  return p.join(" ");
}

/* =========================================================
   SECTION 2 — EMI & AMORTIZATION CORE
   ========================================================= */

// EMI formula (standard Indian banking)
function calculateEMI(principal, annualRate, months) {
  const r = annualRate / 12 / 100;
  return (principal * r * Math.pow(1 + r, months)) /
         (Math.pow(1 + r, months) - 1);
}

// Full amortization generator
function amortize(principal, annualRate, emi, months, extraMonthly = 0) {
  const r = annualRate / 12 / 100;
  let balance = principal;
  let schedule = [];
  let totalInterest = 0;

  for (let m = 1; m <= months && balance > 0; m++) {
    const interest = balance * r;
    let principalPaid = emi - interest + extraMonthly;

    if (principalPaid > balance) principalPaid = balance;

    balance -= principalPaid;
    totalInterest += interest;

    schedule.push({
      month: m,
      interest,
      principal: principalPaid,
      balance: balance > 0 ? balance : 0
    });
  }

  return {
    schedule,
    totalInterest,
    months: schedule.length
  };
}

/* =========================================================
   SECTION 3 — SCENARIO A (BASELINE)
   ========================================================= */

function baselineScenario(P, rate, tenureMonths) {
  const emi = calculateEMI(P, rate, tenureMonths);
  const result = amortize(P, rate, emi, tenureMonths);

  return {
    emi,
    totalInterest: result.totalInterest,
    totalPayment: result.totalInterest + P,
    months: result.months,
    schedule: result.schedule
  };
}

/* =========================================================
   SECTION 4 — SCENARIO B (OPTIMIZED)
   ========================================================= */

function optimizedScenario(
  P,
  rate,
  tenureMonths,
  lumpSum,
  extraMonthly,
  reductionMode // "tenure" or "emi"
) {
  let balance = P - lumpSum;
  if (balance < 0) balance = 0;

  let emi = calculateEMI(balance, rate, tenureMonths);
  let months = 0;
  let totalInterest = 0;
  let schedule = [];

  const r = rate / 12 / 100;

  while (balance > 0 && months < 1000) {
    const interest = balance * r;
    let principalPaid = emi - interest + extraMonthly;

    if (principalPaid > balance) principalPaid = balance;

    balance -= principalPaid;
    totalInterest += interest;
    months++;

    schedule.push({
      month: months,
      interest,
      principal: principalPaid,
      balance: balance > 0 ? balance : 0
    });

    // EMI recalculation logic (Indian banks)
    if (reductionMode === "emi" && months === 1) {
      emi = calculateEMI(balance, rate, tenureMonths - 1);
    }
  }

  return {
    emi,
    totalInterest,
    totalPayment: totalInterest + P,
    months,
    schedule
  };
}
/* =========================================================
   SECTION 5 — INTEREST RATE STRESS TEST
   ========================================================= */

function stressTestScenario(P, rate, tenureMonths, shock) {
  const stressedRate = rate + shock;
  const emi = calculateEMI(P, stressedRate, tenureMonths);
  const result = amortize(P, stressedRate, emi, tenureMonths);

  return {
    stressedRate,
    emi,
    totalInterest: result.totalInterest,
    totalPayment: result.totalInterest + P
  };
}

/* =========================================================
   SECTION 6 — BANK SWITCHING / BALANCE TRANSFER ENGINE
   ========================================================= */

/*
  Assumptions:
  - Floating to floating rate
  - Same remaining tenure
  - Switching costs paid upfront
*/

function bankSwitchingAnalysis(
  P,
  currentRate,
  newRate,
  tenureMonths,
  switchingCost
) {
  const currentEMI = calculateEMI(P, currentRate, tenureMonths);
  const current = amortize(P, currentRate, currentEMI, tenureMonths);

  const newEMI = calculateEMI(P, newRate, tenureMonths);
  const newer = amortize(P, newRate, newEMI, tenureMonths);

  const netSavings =
    current.totalInterest - newer.totalInterest - switchingCost;

  // Break-even calculation
  let breakevenMonth = null;
  let cumulativeSavings = -switchingCost;

  for (let i = 0; i < Math.min(current.schedule.length, newer.schedule.length); i++) {
    const monthlySaving =
      (current.schedule[i].interest || 0) -
      (newer.schedule[i].interest || 0);

    cumulativeSavings += monthlySaving;

    if (cumulativeSavings > 0 && breakevenMonth === null) {
      breakevenMonth = i + 1;
      break;
    }
  }

  return {
    currentEMI,
    newEMI,
    interestSaved: current.totalInterest - newer.totalInterest,
    netSavings,
    breakevenMonth,
    verdict:
      netSavings > 0
        ? "Switching is financially beneficial."
        : "Switching does not provide meaningful savings."
  };
}

/* =========================================================
   SECTION 7 — RENTAL CASH FLOW ANALYSIS
   ========================================================= */

/*
  Assumptions:
  - Net rent received (after vacancy & maintenance)
*/

function rentalCashFlow(rent, emi) {
  const gap = emi - rent;

  return {
    rentCoversPercent: Math.min((rent / emi) * 100, 100),
    monthlyOutOfPocket: gap > 0 ? gap : 0,
    monthlySurplus: gap < 0 ? -gap : 0
  };
}

/* =========================================================
   SECTION 8 — TAX IMPACT (INDIAN, SIMPLIFIED)
   ========================================================= */

/*
  Assumptions:
  - Self-occupied property
  - Old tax regime
  - Section 24: ₹2L interest cap
  - Section 80C: ₹1.5L principal cap
*/

function taxImpact(annualInterest, annualPrincipal) {
  const interestDeduction = Math.min(annualInterest, 200000);
  const principalDeduction = Math.min(annualPrincipal, 150000);

  return {
    interestDeduction,
    principalDeduction,
    totalDeduction: interestDeduction + principalDeduction,
    warning:
      annualInterest < 200000
        ? "Prepayment may reduce available tax benefit."
        : ""
  };
}

/* =========================================================
   SECTION 9 — YEAR-WISE AMORTIZATION SUMMARY
   ========================================================= */

function yearWiseSummary(schedule) {
  let summary = [];
  let year = 1;
  let interest = 0;
  let principal = 0;

  schedule.forEach((row, index) => {
    interest += row.interest;
    principal += row.principal;

    if ((index + 1) % 12 === 0 || row.balance === 0) {
      summary.push({
        year,
        interest,
        principal,
        closingBalance: row.balance
      });

      year++;
      interest = 0;
      principal = 0;
    }
  });

  return summary;
}

/* =========================================================
   SECTION 10 — INSIGHT GENERATOR
   ========================================================= */

function generateInsights(base, opt) {
  let insights = [];

  const interestSaved = base.totalInterest - opt.totalInterest;
  const monthsSaved = base.months - opt.months;

  if (interestSaved > 500000) {
    insights.push(
      `You save ${fmt(interestSaved)} in interest by optimizing your loan.`
    );
  } else if (interestSaved > 0) {
    insights.push(
      `You save ${fmt(interestSaved)} in interest with this strategy.`
    );
  }

  if (monthsSaved > 12) {
    insights.push(
      `Your loan closes ${Math.floor(monthsSaved / 12)} years earlier.`
    );
  } else if (monthsSaved > 0) {
    insights.push(
      `Your loan closes ${monthsSaved} months earlier.`
    );
  }

  if (interestSaved <= 0 && monthsSaved <= 0) {
    insights.push(
      "This strategy does not materially improve your loan outcome."
    );
  }

  return insights.join(" ");
}

/* =========================================================
   SECTION 11 — MAIN CONTROLLER
   ========================================================= */

function runFinalAnalysis() {
  /* ---------- INPUT PARSING ---------- */

  const P = num(principal.value);
  const baseRate = Number(rate.value);
  const shock = Number(rateShock.value || 0);
  const effectiveRate = baseRate + shock;

  const tenureMonths =
    tenureUnit.value === "years"
      ? Number(tenureValue.value) * 12
      : Number(tenureValue.value);

  const lumpSum = num(prepayment.value);
  const extraMonthly = num(extraMonthly.value);
  const reductionMode = reductionModeEl.value;

  const newBankRate = Number(newRate.value || 0);
  const switchCost = num(switchCost.value);

  const rent = num(rentInput?.value || 0);

  if (!P || !effectiveRate || !tenureMonths) {
    alert("Please enter valid loan details.");
    return;
  }

  /* ---------- SCENARIO A (BASELINE) ---------- */

  const base = baselineScenario(P, effectiveRate, tenureMonths);

  /* ---------- SCENARIO B (OPTIMIZED) ---------- */

  const opt = optimizedScenario(
    P,
    effectiveRate,
    tenureMonths,
    lumpSum,
    extraMonthly,
    reductionMode
  );

  /* ---------- SUMMARY OUTPUT ---------- */

  emi.innerText = fmt(base.emi);
  optEmi.innerText = fmt(opt.emi);
  interestSaved.innerText = fmt(base.totalInterest - opt.totalInterest);

  loanDuration.innerText =
    Math.floor(opt.months / 12) + " years " + (opt.months % 12) + " months";

  verdict.innerText = generateInsights(base, opt);

  /* ---------- BANK SWITCHING ---------- */

  if (newBankRate && newBankRate < effectiveRate) {
    const switchResult = bankSwitchingAnalysis(
      P,
      effectiveRate,
      newBankRate,
      tenureMonths,
      switchCost
    );

    switchVerdict.innerText =
      `${switchResult.verdict} ` +
      (switchResult.breakevenMonth
        ? `Break-even in ${switchResult.breakevenMonth} months.`
        : "No clear break-even identified.");
  } else {
    switchVerdict.innerText = "Bank switching analysis not applicable.";
  }

  /* ---------- RENTAL CASH FLOW ---------- */

  if (rent > 0) {
    const cashFlow = rentalCashFlow(rent, opt.emi);
    verdict.innerText +=
      ` Rent covers ${cashFlow.rentCoversPercent.toFixed(0)}% of EMI.`;
  }

  /* ---------- TAX IMPACT (YEAR 1) ---------- */

  const annualInterest = base.schedule
    .slice(0, 12)
    .reduce((s, r) => s + r.interest, 0);

  const annualPrincipal = base.schedule
    .slice(0, 12)
    .reduce((s, r) => s + r.principal, 0);

  const tax = taxImpact(annualInterest, annualPrincipal);

  if (tax.warning) {
    verdict.innerText += ` Note: ${tax.warning}`;
  }

  /* ---------- YEAR-WISE AMORTIZATION ---------- */

  amortizationBody.innerHTML = "";
  const years = yearWiseSummary(opt.schedule);

  years.forEach(y => {
    amortizationBody.innerHTML += `
      <tr>
        <td>${y.year}</td>
        <td>${fmt(y.interest)}</td>
        <td>${fmt(y.principal)}</td>
        <td>${fmt(y.closingBalance)}</td>
      </tr>
    `;
  });
}

/* =========================================================
   SECTION 12 — EVENT BINDINGS
   ========================================================= */

const reductionModeEl = document.getElementById("reductionMode");

document.getElementById("calculateBtn").addEventListener("click", runFinalAnalysis);

document
  .getElementById("toggleAmortization")
  .addEventListener("click", () =>
    amortizationContainer.classList.toggle("hidden")
  );

/* =========================================================
   END OF FILE — FINAL VERSION
   ========================================================= */
