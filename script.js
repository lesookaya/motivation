const STORAGE_KEY = "salary_calculator_v1";

function formatMoney(value) {
    return Number(value).toLocaleString("ru-RU") + " ₽";
}

function calculate() {

    const rows =
        document.querySelectorAll("#kpiTable tbody tr");

    let totalWeight = 0;
    let weightedScore = 0;

    rows.forEach(row => {

        const plan =
            Number(row.cells[1].querySelector("input").value) || 0;

        const fact =
            Number(row.cells[2].querySelector("input").value) || 0;

        const weight =
            Number(row.cells[3].querySelector("input").value) || 0;

        const percent =
            plan > 0
                ? (fact / plan) * 100
                : 0;

        row.querySelector(".achievement").innerText =
            percent.toFixed(1) + "%";

        totalWeight += weight;
        weightedScore += percent * weight;
    });

    const finalKPI =
        totalWeight > 0
            ? weightedScore / totalWeight
            : 0;

    const salary =
        Number(document.getElementById("salary").value) || 0;

    const maxBonus =
        Number(document.getElementById("maxBonus").value) || 0;

    const bonus =
        maxBonus * (finalKPI / 100);

    const totalSalary =
        salary + bonus;

    document.getElementById("kpiResult").innerText =
        finalKPI.toFixed(1) + "%";

    document.getElementById("bonusResult").innerText =
        formatMoney(Math.round(bonus));

    document.getElementById("salaryResult").innerText =
        formatMoney(Math.round(totalSalary));

    validateWeights(totalWeight);
}

function validateWeights(sum) {

    const warning =
        document.getElementById("weightsWarning");

    if (!warning) return;

    if (sum !== 100) {

        warning.innerHTML =
            `⚠ Сумма весов сейчас ${sum}%.
            Рекомендуется 100%.`;

    } else {

        warning.innerHTML =
            "✅ Веса заполнены корректно";
    }
}

function addRow() {

    const tbody =
        document.querySelector("#kpiTable tbody");

    const row =
        document.createElement("tr");

    row.innerHTML = `
        <td><input value="Новый KPI"></td>
        <td><input type="number" value="100"></td>
        <td><input type="number" value="0"></td>
        <td><input type="number" value="10"></td>
        <td class="achievement">0%</td>
        <td>
            <button class="delete-btn" onclick="deleteRow(this)">
                ✕
            </button>
        </td>
    `;

    tbody.appendChild(row);

    attachEvents();

    calculate();
}

function deleteRow(button) {

    button.closest("tr").remove();

    calculate();
}

function attachEvents() {

    document
        .querySelectorAll("input")
        .forEach(input => {

            input.removeEventListener(
                "input",
                calculate
            );

            input.addEventListener(
                "input",
                calculate
            );
        });
}

function saveSettings() {

    const data = {
        salary:
            document.getElementById("salary").value,

        maxBonus:
            document.getElementById("maxBonus").value,

        table:
            document.querySelector("#kpiTable tbody").innerHTML
    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );

    alert("Настройки сохранены");
}

function loadSettings() {

    const raw =
        localStorage.getItem(STORAGE_KEY);

    if (!raw) return;

    const data =
        JSON.parse(raw);

    document.getElementById("salary").value =
        data.salary;

    document.getElementById("maxBonus").value =
        data.maxBonus;

    document.querySelector("#kpiTable tbody").innerHTML =
        data.table;
}

function resetSettings() {

    if (
        !confirm(
            "Удалить сохраненные настройки?"
        )
    ) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);

    location.reload();
}

window.addEventListener("DOMContentLoaded", () => {

    loadSettings();

    attachEvents();

    calculate();
});
