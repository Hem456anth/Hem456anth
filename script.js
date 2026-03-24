const CURRENT_YEAR = 2026;

const cityScenarios = {
  Hyderabad: {
    homePrice: 9000000,
    monthlyRent: 26000,
    downPaymentPct: 20,
    emiRate: 8.5,
    loanTenureYears: 20,
    rentInflation: 7,
    maintenancePct: 1.3,
    salaryGrowth: 11,
    startingSalary: 900000,
  },
  Bengaluru: {
    homePrice: 13000000,
    monthlyRent: 42000,
    downPaymentPct: 20,
    emiRate: 8.7,
    loanTenureYears: 20,
    rentInflation: 8,
    maintenancePct: 1.5,
    salaryGrowth: 12,
    startingSalary: 1200000,
  },
  Visakhapatnam: {
    homePrice: 6500000,
    monthlyRent: 18000,
    downPaymentPct: 18,
    emiRate: 8.3,
    loanTenureYears: 20,
    rentInflation: 6,
    maintenancePct: 1.1,
    salaryGrowth: 10,
    startingSalary: 700000,
  },
};

const citySelect = document.getElementById('city');
const breakEvenText = document.getElementById('breakEvenText');
const summaryList = document.getElementById('summaryList');
const calculateBtn = document.getElementById('calculateBtn');
const previewBody = document.getElementById('previewBody');

const fieldIds = [
  'homePrice',
  'monthlyRent',
  'downPaymentPct',
  'emiRate',
  'loanTenureYears',
  'rentInflation',
  'maintenancePct',
  'salaryGrowth',
  'startingSalary',
];

function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value) {
  return `${value.toFixed(1)}%`;
}

function yearlyEmi(principal, annualRate, tenureYears) {
  const monthlyRate = annualRate / 12 / 100;
  const months = tenureYears * 12;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return emi * 12;
}

function fillFields(config) {
  fieldIds.forEach((id) => {
    document.getElementById(id).value = config[id];
  });
}

function readInputs() {
  const values = {};
  fieldIds.forEach((id) => {
    values[id] = Number(document.getElementById(id).value);
  });
  return values;
}

function calculateBreakEven(inputs) {
  const {
    homePrice,
    monthlyRent,
    downPaymentPct,
    emiRate,
    loanTenureYears,
    rentInflation,
    maintenancePct,
    salaryGrowth,
    startingSalary,
  } = inputs;

  const downPayment = (homePrice * downPaymentPct) / 100;
  const principal = homePrice - downPayment;
  const annualEmi = yearlyEmi(principal, emiRate, loanTenureYears);
  const annualMaintenance = (homePrice * maintenancePct) / 100;

  let cumBuy = downPayment;
  let cumRent = 0;
  let salary = startingSalary;
  let rentYearly = monthlyRent * 12;

  let breakEvenYear = null;
  const yearsToProject = 30;
  const preview = [];

  for (let year = 1; year <= yearsToProject; year += 1) {
    const emiThisYear = year <= loanTenureYears ? annualEmi : 0;
    const buyCost = emiThisYear + annualMaintenance;

    cumBuy += buyCost;
    cumRent += rentYearly;

    if (breakEvenYear === null && cumBuy <= cumRent) {
      breakEvenYear = year;
    }

    if (year <= 10) {
      preview.push({
        year,
        salary,
        buyBurden: (buyCost / salary) * 100,
        rentBurden: (rentYearly / salary) * 100,
      });
    }

    salary *= 1 + salaryGrowth / 100;
    rentYearly *= 1 + rentInflation / 100;
  }

  return {
    downPayment,
    annualEmi,
    annualMaintenance,
    breakEvenYear,
    cumBuy,
    cumRent,
    preview,
  };
}

function renderPreview(preview) {
  previewBody.innerHTML = '';
  preview.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.year}</td>
      <td>${formatINR(row.salary)}</td>
      <td>${formatPct(row.buyBurden)}</td>
      <td>${formatPct(row.rentBurden)}</td>
    `;
    previewBody.appendChild(tr);
  });
}

function renderResult(inputs, result) {
  summaryList.innerHTML = '';

  const city = citySelect.value;
  const { downPayment, annualEmi, annualMaintenance, breakEvenYear, cumBuy, cumRent, preview } =
    result;

  if (breakEvenYear) {
    const calendarYear = CURRENT_YEAR + breakEvenYear;
    breakEvenText.textContent = `For ${city}, buying breaks even in about ${breakEvenYear} years (around ${calendarYear}). If you'll stay beyond that, buying is likely cheaper with these assumptions.`;
  } else {
    breakEvenText.textContent = `For ${city}, renting remains cheaper through 2056 (30-year horizon) under these assumptions.`;
  }

  const finalPreview = preview[preview.length - 1];
  const items = [
    `Estimated down payment: ${formatINR(downPayment)}`,
    `Yearly EMI outflow: ${formatINR(annualEmi)} for ${inputs.loanTenureYears} years`,
    `Yearly maintenance: ${formatINR(annualMaintenance)}`,
    `Year 10 affordability: buy ${formatPct(finalPreview.buyBurden)} of salary vs rent ${formatPct(finalPreview.rentBurden)} of salary`,
    `30-year buy outflow: ${formatINR(cumBuy)}`,
    `30-year rent outflow: ${formatINR(cumRent)}`,
  ];

  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    summaryList.appendChild(li);
  });

  renderPreview(preview);
}

Object.keys(cityScenarios).forEach((cityName) => {
  const option = document.createElement('option');
  option.value = cityName;
  option.textContent = cityName;
  citySelect.appendChild(option);
});

citySelect.addEventListener('change', () => {
  fillFields(cityScenarios[citySelect.value]);
  renderResult(readInputs(), calculateBreakEven(readInputs()));
});

calculateBtn.addEventListener('click', () => {
  const inputs = readInputs();
  const result = calculateBreakEven(inputs);
  renderResult(inputs, result);
});

citySelect.value = 'Hyderabad';
fillFields(cityScenarios.Hyderabad);
renderResult(readInputs(), calculateBreakEven(readInputs()));
