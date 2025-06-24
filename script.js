let users = [];
let rankingCriteria = [];

function startManual() {
  document.getElementById('startOptions').style.display = 'none';
  document.getElementById('setupSection').style.display = 'block';
}


function generateRankingCriteriaInputs() {
  const count = parseInt(document.getElementById('rankingCriteriaCount').value);
  const form = document.getElementById('rankingCriteriaForm');
  form.innerHTML = '';

  if (isNaN(count) || count < 1) {
    alert('Please enter a valid number of ranking criteria.');
    return;
  }

  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'rankingCriteria-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = `Ranking Criteria ${i + 1} Name`;
    nameInput.required = true;
    nameInput.classList.add('rankingCriteria-name');

    const weightInput = document.createElement('input');
    weightInput.type = 'number';
    weightInput.placeholder = `Weight`;
    weightInput.required = true;
    weightInput.classList.add('rankingCriteria-weight');

    row.appendChild(nameInput);
    row.appendChild(weightInput);
    form.appendChild(row);
  }

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm Ranking Criteria';
  confirmBtn.type = 'button';
  confirmBtn.onclick = setupRankingForm;
  form.appendChild(confirmBtn);
}


function setupRankingForm() {
  document.getElementById('rankingCriteriaForm').style.display = 'none';
  const nameInputs = document.querySelectorAll('.rankingCriteria-name');
  const weightInputs = document.querySelectorAll('.rankingCriteria-weight');

  rankingCriteria = [];

  for (let i = 0; i < nameInputs.length; i++) {
    const name = nameInputs[i].value.trim();
    const weight = parseFloat(weightInputs[i].value);

    if (!name || isNaN(weight)) {
      alert('Please fill in valid rankingCriteria names and weights.');
      return;
    }

    rankingCriteria.push({ name, weight });
  }

  // Show form for entering user data
  document.getElementById('rankingForm').style.display = 'block';

  const rankingsContainer = document.getElementById('rankingsContainer');
  rankingsContainer.innerHTML = '';

  rankingCriteria.forEach((rankingCriteria, index) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = `Ranking for ${rankingCriteria.name}`;
    input.required = true;
    input.dataset.index = index;
    rankingsContainer.appendChild(input);
  });
}

function handleAddPlayer() {
  const name = document.getElementById('name').value.trim();
  const rankingInputs = document.querySelectorAll('#rankingsContainer input');
  const rankings = Array.from(rankingInputs).map(input => parseFloat(input.value));

  if (rankings.length !== rankingCriteria.length || rankings.some(isNaN)) {
    alert('Please enter valid rankings for all rankingCriteria.');
    return;
  }

  const total = rankings.reduce((sum, val, i) => sum + val * rankingCriteria[i].weight, 0);
  users.push({ name, rankings, total });

  users.sort((a, b) => b.total - a.total);
  renderResults();

  document.getElementById('rankingForm').reset();
  document.getElementById('rankedResults').style.display = 'block';
  document.getElementById('exportBtn').style.display = 'block';
}


function renderResults() {
  const resultsList = document.getElementById('resultsList');
  resultsList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = `${user.name} — Total Score: ${user.total.toFixed(2)}`;
    resultsList.appendChild(li);
  });
  document.getElementById('rankedResults').style.display = 'block';
  document.getElementById('exportBtn').style.display = 'block';
}

function exportToExcel() {
  if (users.length === 0) {
    alert("No data to export.");
    return;
  }

  const header = ['Name', ...rankingCriteria.map(a => a.name), 'Total Score'];

  const data = users.map(user => {
    return [
      user.name,
      ...user.rankings,
      user.total.toFixed(2)
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rankings");

  XLSX.writeFile(workbook, "./rankings.xlsx");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("importInput").addEventListener("change", handleImport);
});

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2) {
      alert("The file doesn't contain enough data.");
      return;
    }

    const headers = rows[0];
    if (headers.length < 2) {
      alert("The Excel sheet must have a name column and at least one ranking criteria.");
      return;
    }

    const criteriaHeaders = headers.slice(1);
    rankingCriteria = criteriaHeaders.map(name => ({ name: name.trim(), weight: 1 }));

    users = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0]) continue;

      const name = row[0].toString().trim();
      const rankings = row.slice(1).map(value => parseFloat(value));

      if (rankings.length !== rankingCriteria.length || rankings.some(isNaN)) {
        alert(`Invalid data in row ${i + 1}.`);
        return;
      }

      const total = rankings.reduce(
        (sum, val, idx) => sum + val * rankingCriteria[idx].weight,
        0
      );

      users.push({ name, rankings, total });
    }

    users.sort((a, b) => b.total - a.total);

    document.getElementById('startOptions').style.display = 'none';
    document.getElementById('rankingForm').style.display = 'none';

    showWeightInputs();
  };

  reader.readAsArrayBuffer(file);
}

function showWeightInputs() {
  const container = document.getElementById('weightsForm');
  container.innerHTML = ''; // Clear existing inputs
  document.getElementById('weightInputsContainer').style.display = 'block';

  rankingCriteria.forEach((criteria, index) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('rankingCriteria-row');

    const label = document.createElement('label');
    label.textContent = `${criteria.name}:`;
    label.setAttribute('for', `weight-${index}`);
    label.style.width = '150px';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '0.1';
    input.required = true;
    input.value = criteria.weight;
    input.dataset.index = index;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  });
}

function applyWeights() {
  //document.getElementById('weightsForm').style.display = 'block'
  const inputs = document.querySelectorAll('#weightsForm input');

  for (const input of inputs) {
    if (input.value.trim() === '') {
      alert('Please enter a weight for all criteria.');
      input.focus();
      return;
    }
  }
  inputs.forEach(input => {
    const index = parseInt(input.dataset.index);
    const weight = parseFloat(input.value);

    if (!isNaN(weight)) {
      rankingCriteria[index].weight = weight;
    }
  });

  // Recalculate totals
  users.forEach(user => {
    user.total = user.rankings.reduce(
      (sum, val, idx) => sum + val * rankingCriteria[idx].weight,
      0
    );
  });

  users.sort((a, b) => b.total - a.total);
  renderResults();
}

