const salesPlanInput = document.querySelector("#salesPlan");
const workDaysInput = document.querySelector("#workDays");
const newRequestsPerDayInput = document.querySelector("#newRequestsPerDay");
const processedRequestsInput = document.querySelector("#processedRequests");
const monthlyMeetingsInput = document.querySelector("#monthlyMeetings");
const averageCheckInput = document.querySelector("#averageCheck");
const funnelTable = document.querySelector("#funnelTable");
const bonusTable = document.querySelector("#bonusTable");
const calculationTable = document.querySelector("#calculationTable");
const addFunnelRowButton = document.querySelector("#addFunnelRow");
const addCalculationRowButton = document.querySelector("#addCalculationRow");
const saveDataButton = document.querySelector("#saveData");
const saveStatus = document.querySelector("#saveStatus");
const STORAGE_KEY = "premiumCalculatorData";

function toNumber(value) {
  const normalizedValue = String(value)
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace("%", "")
    .trim();
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

function formatInputMoney(value) {
  const number = toNumber(value);

  return number ? Math.round(number).toLocaleString("ru-RU") : "";
}

function formatMoneyInputs() {
  document.querySelectorAll(".money-input").forEach((input) => {
    input.value = formatInputMoney(input.value);
  });
}

function parsePercent(value) {
  return toNumber(value);
}

function getFunnelConversionPercent(index) {
  const conversionCells = Array.from(funnelTable.querySelectorAll(".conversion"));

  return parsePercent(conversionCells[index]?.textContent || "0");
}

function getFunnelConversion(index) {
  return getFunnelConversionPercent(index) / 100;
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

function calculateThroughFunnel(startValue, lastConversionIndex) {
  let result = Math.round(startValue);

  for (let index = 1; index <= lastConversionIndex; index += 1) {
    result = Math.round(result * getFunnelConversion(index));
  }

  return result;
}

function updateNorms() {
  const workDays = Number(workDaysInput.value) || 0;
  const newRequestsPerDay = Number(newRequestsPerDayInput.value) || 0;
  const processedRequests = Math.round(workDays * newRequestsPerDay);
  const monthlyMeetings = calculateThroughFunnel(processedRequests, 4);

  processedRequestsInput.value = formatNumber(processedRequests);
  monthlyMeetingsInput.value = formatNumber(monthlyMeetings);
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

function createFunnelRow(stage = "Новая стадия", value = "") {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="text"></td>
    <td><input class="funnel-value" type="number" min="0" step="1"></td>
    <td class="conversion">-</td>
    <td><button class="icon-button remove-row" type="button" aria-label="Удалить строку">x</button></td>
  `;

  const inputs = row.querySelectorAll("input");
  inputs[0].value = stage;
  inputs[1].value = value;

  return row;
}

function updateCalculationTable() {
  const rows = Array.from(calculationTable.querySelectorAll("tbody tr"));
  const newRequestsPerDay = Number(newRequestsPerDayInput.value) || 0;
  const averageCheck = toNumber(averageCheckInput.value);
  const salesPlan = toNumber(salesPlanInput.value);

  const answeredConversion = getFunnelConversion(1);
  const qualifiedConversion = getFunnelConversion(2);
  const meetingSetConversion = getFunnelConversion(3);
  const meetingDoneConversion = getFunnelConversion(4);
  const dealsConversion = getFunnelConversion(5);

  rows.forEach((row, index) => {
    const leads = Math.round(newRequestsPerDay * (index + 1));
    const answered = Math.round(leads * answeredConversion);
    const qualified = Math.round(answered * qualifiedConversion);
    const meetingSet = Math.round(qualified * meetingSetConversion);
    const meetingDone = Math.round(meetingSet * meetingDoneConversion);
    const deals = Math.round(meetingDone * dealsConversion);
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
  updateNorms();
  updateCalculationTable();
}

function addFunnelRow() {
  const tbody = funnelTable.querySelector("tbody");

  tbody.append(createFunnelRow());
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

function saveData() {
  const data = {
    inputs: Array.from(document.querySelectorAll("input")).map((input) => input.value),
    funnelRows: Array.from(funnelTable.querySelectorAll("tbody tr")).map((row) => {
      const inputs = row.querySelectorAll("input");

      return {
        stage: inputs[0]?.value || "",
        value: inputs[1]?.value || "",
      };
    }),
    calculationRowCount: calculationTable.querySelectorAll("tbody tr").length,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  saveStatus.textContent = "Сохранено";
  window.setTimeout(() => {
    saveStatus.textContent = "";
  }, 2000);
}

function restoreData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return;
  }

  let data;

  try {
    data = JSON.parse(savedData);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const funnelBody = funnelTable.querySelector("tbody");
  const calculationBody = calculationTable.querySelector("tbody");

  if (Array.isArray(data.funnelRows) && data.funnelRows.length) {
    funnelBody.innerHTML = "";

    data.funnelRows.forEach((item) => {
      funnelBody.append(createFunnelRow(item.stage, item.value));
    });
  }

  if (data.calculationRowCount) {
    calculationBody.innerHTML = "";

    for (let index = 0; index < data.calculationRowCount; index += 1) {
      calculationBody.append(createCalculationRow());
    }
  }

  if (Array.isArray(data.inputs)) {
    document.querySelectorAll("input").forEach((input, index) => {
      if (!input.readOnly && data.inputs[index] !== undefined) {
        input.value = data.inputs[index];
      }
    });
  }
}

document.addEventListener("input", (event) => {
  if (event.target.classList.contains("money-input")) {
    event.target.value = formatInputMoney(event.target.value);
  }

  updateAllCalculations();
});

funnelTable.addEventListener("click", (event) => {
  if (event.target.classList.contains("remove-row")) {
    removeFunnelRow(event.target);
  }
});

addFunnelRowButton.addEventListener("click", addFunnelRow);
addCalculationRowButton.addEventListener("click", addCalculationRow);
saveDataButton.addEventListener("click", saveData);
restoreData();
formatMoneyInputs();
updateAllCalculations();
