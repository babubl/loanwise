function calculateEMI(principal, annualRate, years) {
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  const emi =
    (principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return { emi, monthlyRate, months };
}

function generateAmortization(principal, emi, monthlyRate, months, prepayment) {
  let balance = principal - prepayment;
  if (balance < 0) balance = 0;

  const schedule = [];

  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = balance * monthlyRate;
    const principalPaid = emi - interest;
    balance -= principalPaid;

    schedule.push({
      month,
      emi,
      principalPaid,
      interest,
      balance: balance > 0 ? balance : 0
    });
  }

  return schedule;
}


function formatCurrency(value) {
  return "₹ " + Math.round(value).toLocaleString("en-IN");
}

document.getElementById("calculateBtn").addEventListener("click", function () {
  const principal = Number(document.getElementById("principal").value);
  const rate = Number(document.getElementById("rate").value);
  const tenure = Number(document.getElementById("tenure").value);
  const prepayment = Number(document.getElementById("prepayment").value || 0);


  if (!principal || !rate || !tenure) {
    alert("Please enter all values");
    return;
  }

  const { emi, monthlyRate, months } = calculateEMI(
    principal,
    rate,
    tenure
  );

  const actualMonths = schedule.length;
const totalPayment = emi * actualMonths + prepayment;
const totalInterest = totalPayment - principal;


  document.getElementById("emi").innerText = formatCurrency(emi);
  document.getElementById("totalInterest").innerText =
    formatCurrency(totalInterest);
  document.getElementById("totalPayment").innerText =
    formatCurrency(totalPayment);

  const schedule = generateAmortization(
  principal,
  emi,
  monthlyRate,
  months,
  prepayment
);


  const tbody = document.getElementById("amortizationBody");

  tbody.innerHTML = "";

  schedule.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.month}</td>
      <td>${formatCurrency(row.emi)}</td>
      <td>${formatCurrency(row.principalPaid)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    `;

    tbody.appendChild(tr);
  });
});
