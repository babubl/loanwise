/*************************************************
 * INDIAN NUMBER FORMATTERS
 *************************************************/

function formatIndianNumber(num) {
  return num.toLocaleString("en-IN");
}

function numberToIndianWords(num) {
  if (!num || num === 0) return "";

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);

  let parts = [];

  if (crore > 0) parts.push(crore + " crore");
  if (lakh > 0) parts.push(lakh + " lakh");
  if (thousand > 0) parts.push(thousand + " thousand");

  return parts.join(" ");
}

function updateHelper(inputId, helperId) {
  const value = Number(document.getElementById(inputId).value || 0);
  const helper = document.getElementById(helperId);

  if (!helper) return;

  if (value > 0) {
    helper.innerText =
      "₹ " +
      formatIndianNumber(value) +
      (numberToIndianWords(value)
        ? " · " + numberToIndianWords(value)
        : "");
  } else {
    helper.innerText = "";
  }
}

/*************************************************
 * EMI & AMORTIZATION LOGIC
 *************************************************/

function calculateEMI(principal, annualRate, months) {
  const monthlyRate = annualRate / 12 / 100;

  const emi =
    (principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return { emi, monthlyRate };
}

function generateAmortization(
  principal,
  emi,
  monthlyRate,
  maxMonths,
  lumpSum,
  extraMonthly
) {
  let balance = principal - lumpSum;
  if (balance < 0) balance = 0;

  const schedule = [];

  for (let month = 1; month <= maxMonths && balance > 0; month++) {
    const interest = balance * monthlyRate;

    let principalPaid = emi - interest + extraMonthly;
    if (principalPaid > balance) principalPaid = balance;

    balance -= principalPaid;

    schedule.push({
      month,
      emi: emi + extraMonthly,
      principal: principalPaid,
      interest,
      balance: balance > 0 ? balance : 0
    });
  }

  return schedule;
}

function formatCurrency(val) {
  return "₹ " + formatIndianNumber(Math.round(val));
}

/*************************************************
 * MAIN CALCULATION HANDLER
 *************************************************/

document.getElementById("calculateBtn").addEventListener("click", function () {
  const principal = Number(document.getElementById("principal").value);
  const rate = Number(document.getElementById("rate").value);
  const tenureValue = Number(document.getElementById("tenureValue").value);
  const tenureUnit = document.getElementById("tenureUnit").value;

  const lumpSum = Number(document.getElementById("prepayment").value || 0);
  const extraMonthly = Number(
    document.getElementById("extraMonthly").value || 0
  );

  if (!principal || !rate || !tenureValue) {
    alert("Please enter valid loan details");
    return;
  }

  const totalMonths =
    tenureUnit === "years" ? tenureValue * 12 : tenureValue;

  const { emi, monthlyRate } = calculateEMI(
    principal,
    rate,
    totalMonths
  );

  const schedule = generateAmortization(
    principal,
    emi,
    monthlyRate,
    totalMonths,
    lumpSum,
    extraMonthly
  );

  /*************************************************
   * SUMMARY
   *************************************************/

  const totalPayment =
    schedule.reduce((sum, row) => sum + row.emi, 0) + lumpSum;

  const totalInterest = totalPayment - principal;

  const actualMonths = schedule.length;
  const years = Math.floor(actualMonths / 12);
  const months = actualMonths % 12;

  document.getElementById("emi").innerText = formatCurrency(emi);
  document.getElementById("totalInterest").innerText =
    formatCurrency(totalInterest);
  document.getElementById("totalPayment").innerText =
    formatCurrency(totalPayment);
  document.getElementById("loanDuration").innerText =
    years + " years " + months + " months";

  /*************************************************
   * AMORTIZATION TABLE
   *************************************************/

  const tbody = document.getElementById("amortizationBody");
  tbody.innerHTML = "";

  schedule.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${formatCurrency(row.emi)}</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    `;
    tbody.appendChild(tr);
  });
});

/*************************************************
 * INPUT HELPERS (LIVE FEEDBACK)
 *************************************************/

["principal", "prepayment", "extraMonthly"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    updateHelper(id, id + "Help");
  });
});

/*************************************************
 * AMORTIZATION TOGGLE
 *************************************************/

document
  .getElementById("toggleAmortization")
  .addEventListener("click", function () {
    const container = document.getElementById("amortizationContainer");
    container.classList.toggle("hidden");

    this.innerText = container.classList.contains("hidden")
      ? "View amortization schedule"
      : "Hide amortization schedule";
  });

/*************************************************
 * INITIAL HELPER RENDER
 *************************************************/

updateHelper("principal", "principalHelp");
updateHelper("prepayment", "prepaymentHelp");
updateHelper("extraMonthly", "extraMonthlyHelp");
