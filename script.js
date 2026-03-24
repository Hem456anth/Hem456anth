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

  for (let year = 1; year <= yearsToProject; year += 1) {
    const emiThisYear = year <= loanTenureYears ? annualEmi : 0;
    const buyCost = emiThisYear + annualMaintenance;

    cumBuy += buyCost;
    cumRent += rentYearly;

    if (breakEvenYear === null && cumBuy <= cumRent) {
      breakEvenYear = year;
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
  };
}

function renderResult(inputs, result) {
  summaryList.innerHTML = '';

  const city = citySelect.value;
  const { downPayment, annualEmi, annualMaintenance, breakEvenYear, cumBuy, cumRent } = result;

  if (breakEvenYear) {
    breakEvenText.textContent = `In ${city}, buying breaks even in about year ${breakEvenYear}. If you plan to stay longer than ${breakEvenYear} years, buying starts looking financially better.`;
  } else {
    breakEvenText.textContent = `In ${city}, renting stays cheaper for the next 30 years with these assumptions. Buying may still make sense for lifestyle reasons.`;
  }

  const items = [
    `Estimated down payment: ${formatINR(downPayment)}`,
    `Yearly EMI outflow: ${formatINR(annualEmi)} (for ${inputs.loanTenureYears} years)`,
    `Yearly maintenance: ${formatINR(annualMaintenance)}`,
    `30-year buy outflow: ${formatINR(cumBuy)}`,
    `30-year rent outflow: ${formatINR(cumRent)}`,
  ];

  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    summaryList.appendChild(li);
  });
}

Object.keys(cityScenarios).forEach((cityName) => {
  const option = document.createElement('option');
  option.value = cityName;
  option.textContent = cityName;
  citySelect.appendChild(option);
});

citySelect.addEventListener('change', () => {
  fillFields(cityScenarios[citySelect.value]);
});

calculateBtn.addEventListener('click', () => {
  const inputs = readInputs();
  const result = calculateBreakEven(inputs);
  renderResult(inputs, result);
});

citySelect.value = 'Hyderabad';
fillFields(cityScenarios.Hyderabad);
