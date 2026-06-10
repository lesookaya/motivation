const salesPlanInput = document.querySelector("#salesPlan");
const newRequestsPerDayInput = document.querySelector("#newRequestsPerDay");
const averageCheckInput = document.querySelector("#averageCheck");
const funnelTable = document.querySelector("#funnelTable");
const bonusTable = document.querySelector("#bonusTable");
const calculationTable = document.querySelector("#calculationTable");
const addFunnelRowButton = document.querySelector("#addFunnelRow");
const addCalculationRowButton = document.querySelector("#addCalculationRow");

function toNumber(value) {
  const normalizedValue = String(value).replace(",", ".").replace("%", "").trim();
  const number = Number(normalizedValue);

  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return Math.round(value).toLocaleString("ru-RU");
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return `${Math.round(value)}%`;
}

function parsePercent(value) {
  return toNumber(value);
}

function getFunnelConversionPercent(index) {
  const conversionCells = Array.from(funnelTable.querySelectorAll(".conversion"));

  return parsePercent(conversionCells[index]?.textContent || "0");
}

function getBonusRanges() {
  return Array.from(bonusTable.querySelectorAll("tbody tr")).map((row) => {
    const inputs = row.querySelectorAll("input");
    const from = parsePercent(inputs[0]?.value || "0");
    const rawTo = String(inputs[1]?.value || "").toLowerCase();
    const to = rawTo.includes("выше") ? Infinity : parsePercent(rawTo);
    const percent = parsePercent(inputs[2]?.value || "0");

    return { from, to, percent };
  });
}

function getManagerPercent(planPercent) {
  const range = getBonusRanges().find((item) => planPercent >= item.from && planPercent <= item.to);

  return range ? range.percent : 0;
}

function updateFunnelConversions() {
  const rows = Array.from(funnelTable.querySelectorAll("tbody tr"));

  rows.forEach((row, index) => {
    const conversionCell = row.querySelector(".conversion");
    const currentValue = Number(row.querySelector(".funnel-value").value);

    if (index === 0) {
      conversionCell.textContent = "-";
      return;
    }

    const previousValue = Number(rows[index - 1].querySelector(".funnel-value").value);
    const conversion = previousValue > 0 ? (currentValue / previousValue) * 100 : NaN;

    conversionCell.textContent = formatPercent(conversion);
  });
}

function createCalculationRow() {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td data-field="leads"></td>
    <td data-field="answered"></td>
    <td data-field="qualified"></td>
    <td data-field="meetingSet"></td>
    <td data-field="meetingDone"></td>
    <td data-field="deals"></td>
    <td data-field="sales"></td>
    <td data-field="planPercent"></td>
    <td data-field="managerPercent"></td>
    <td data-field="premium"></td>
  `;

  return row;
}

function updateCalculationTable() {
  const rows = Array.from(calculationTable.querySelectorAll("tbody tr"));
  const newRequestsPerDay = Number(newRequestsPerDayInput.value) || 0;
  const averageCheck = Number(averageCheckInput.value) || 0;
  const salesPlan = Number(salesPlanInput.value) || 0;

  const answeredConversion = getFunnelConversionPercent(1) / 100;
  const qualifiedConversion = getFunnelConversionPercent(2) / 100;
  const meetingSetConversion = getFunnelConversionPercent(3) / 100;
  const meetingDoneConversion = getFunnelConversionPercent(4) / 100;
  const dealsConversion = getFunnelConversionPercent(5) / 100;

  rows.forEach((row, index) => {
    const leads = newRequestsPerDay * (index + 1);
    const answered = leads * answeredConversion;
    const qualified = answered * qualifiedConversion;
    const meetingSet = qualified * meetingSetConversion;
    const meetingDone = meetingSet * meetingDoneConversion;
    const deals = meetingDone * dealsConversion;
    const sales = deals * averageCheck;
    const planPercent = salesPlan > 0 ? (sales / salesPlan) * 100 : 0;
    const managerPercent = getManagerPercent(planPercent);
    const premium = sales * (managerPercent / 100);

    row.querySelector('[data-field="leads"]').textContent = formatNumber(leads);
    row.querySelector('[data-field="answered"]').textContent = formatNumber(answered);
    row.querySelector('[data-field="qualified"]').textContent = formatNumber(qualified);
    row.querySelector('[data-field="meetingSet"]').textContent = formatNumber(meetingSet);
    row.querySelector('[data-field="meetingDone"]').textContent = formatNumber(meetingDone);
    row.querySelector('[data-field="deals"]').textContent = formatNumber(deals);
    row.querySelector('[data-field="sales"]').textContent = formatNumber(sales);
    row.querySelector('[data-field="planPercent"]').textContent = formatPercent(planPercent);
    row.querySelector('[data-field="managerPercent"]').textContent = formatPercent(managerPercent);
    row.querySelector('[data-field="premium"]').textContent = formatNumber(premium);
  });
}

function updateAllCalculations() {
  updateFunnelConversions();
  updateCalculationTable();
}

function addFunnelRow() {
  const tbody = funnelTable.querySelector("tbody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="text" value="Новая стадия"></td>
    <td><input class="funnel-value" type="number" min="0" step="1"></td>
    <td class="conversion">-</td>
    <td><button class="icon-button remove-row" type="button" aria-label="Удалить строку">x</button></td>
  `;

  tbody.append(row);
  updateAllCalculations();
}

function removeFunnelRow(button) {
  const rows = funnelTable.querySelectorAll("tbody tr");

  if (rows.length <= 1) {
    return;
  }

  button.closest("tr").remove();
  updateAllCalculations();
}

function addCalculationRow() {
  calculationTable.querySelector("tbody").append(createCalculationRow());
  updateCalculationTable();
}

document.addEventListener("input", updateAllCalculations);

funnelTable.addEventListener("click", (event) => {
  if (event.target.classList.contains("remove-row")) {
    removeFunnelRow(event.target);
  }
});

addFunnelRowButton.addEventListener("click", addFunnelRow);
addCalculationRowButton.addEventListener("click", addCalculationRow);
updateAllCalculations();
