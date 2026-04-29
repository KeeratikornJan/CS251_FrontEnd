const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                     'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

let bloodChart = null;

// Populate year select
(function initSelects() {
  const now      = new Date();
  const yearSel  = document.getElementById('yearSel');
  const monthSel = document.getElementById('monthSel');

  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = String(y + 543);
    yearSel.appendChild(opt);
  }
  yearSel.value  = now.getFullYear();
  monthSel.value = now.getMonth() + 1;
})();

function getSelected() {
  return {
    month: parseInt(document.getElementById('monthSel').value),
    year:  parseInt(document.getElementById('yearSel').value)
  };
}

async function loadReport() {
  const { month, year } = getSelected();
  const thaiYear = year + 543;
  document.getElementById('monthYearLabel').textContent = `${THAI_MONTHS[month - 1]} ${thaiYear}`;

  await Promise.all([
    loadSummary(month, year),
    loadDonationAndChart(month, year),
    loadBloodGroupSummary()
  ]);
}

async function loadSummary(month, year) {
  try {
    const data = await apiGet(`/api/dashboard?month=${month}&year=${year}`);
    document.getElementById('totalIn').textContent   = data.totalVolumeIn   ?? '—';
    document.getElementById('totalUsed').textContent  = data.totalVolumeUsed ?? '—';
    document.getElementById('totalLost').textContent  = data.totalVolumeLost ?? '—';
  } catch {
    ['totalIn','totalUsed','totalLost'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
  }
}

async function loadDonationAndChart(month, year) {
  const tbody = document.getElementById('donationTableBody');
  try {
    // Fetch both donation rows and actual usage rows in parallel
    const [donationRows, usageRows] = await Promise.all([
      apiGet(`/api/reports/donations?month=${month}&year=${year}`),
      apiGet(`/api/reports/usage?month=${month}&year=${year}`)
    ]);

    if (!donationRows || donationRows.length === 0) {
      tbody.innerHTML = '<tr><td class="empty-state" colspan="5">ไม่มีข้อมูลในช่วงเวลานี้</td></tr>';
      updateChart([], []);
      return;
    }

    tbody.innerHTML = donationRows.map(r => `<tr>
      <td>${formatThaiDate(r.donationDate || r.date)}</td>
      <td>${r.bloodGroup || '—'}</td>
      <td>${r.donorCount ?? '—'}</td>
      <td>${r.totalVolume ?? '—'}</td>
      <td><span class="status-badge ok">ดำเนินการแล้ว</span></td>
    </tr>`).join('');

    buildChart(donationRows, usageRows || []);
  } catch {
    tbody.innerHTML = '<tr><td class="empty-state" colspan="5">ไม่สามารถโหลดข้อมูลได้</td></tr>';
    updateChart([], []);
  }
}

function buildChart(donationRows, usageRows) {
  // Aggregate inbound by date (sum volumes — multiple blood groups per day)
  const inMap = {};
  donationRows.forEach(r => {
    const d = String(r.donationDate || r.date || '').split('T')[0];
    if (!d) return;
    inMap[d] = (inMap[d] || 0) + (r.totalVolume ?? 0);
  });

  // Aggregate outbound (actual usage count) by date
  const outMap = {};
  usageRows.forEach(r => {
    const d = String(r.usageDate || '').split('T')[0];
    if (!d) return;
    outMap[d] = (outMap[d] || 0) + (r.totalUsed ?? 0);
  });

  // Union of all dates, sorted ascending
  const allDates = [...new Set([...Object.keys(inMap), ...Object.keys(outMap)])].sort();

  const labels   = allDates.map(d => formatThaiDate(d));
  const inData   = allDates.map(d => inMap[d]  || 0);
  const outData  = allDates.map(d => outMap[d] || 0);

  updateChart(labels, inData, outData);
}

function updateChart(labels, inData, outData = []) {
  const ctx = document.getElementById('bloodChart').getContext('2d');
  if (bloodChart) bloodChart.destroy();

  bloodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'ปริมาณเลือดรับเข้า (มล.)',
          data: inData,
          borderColor: '#ef3b3b',
          backgroundColor: 'rgba(239,59,59,.08)',
          tension: .4,
          fill: false,
          pointRadius: 4
        },
        {
          label: 'ปริมาณเลือดจ่ายออก (มล.)',
          data: outData,
          borderColor: '#2f3192',
          backgroundColor: 'rgba(47,49,146,.08)',
          tension: .4,
          fill: false,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Sarabun', size: 13 } } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { font: { family: 'Sarabun' } } },
        x: { ticks: { font: { family: 'Sarabun', size: 11 }, maxRotation: 45 } }
      }
    }
  });
}

async function loadBloodGroupSummary() {
  const tbody = document.getElementById('summaryTableBody');
  try {
    const bags = await apiGet('/api/blood/bags');
    if (!bags || bags.length === 0) {
      tbody.innerHTML = '<tr><td class="empty-state" colspan="4">ไม่มีข้อมูล</td></tr>';
      return;
    }

    const groups = {};
    bags.forEach(b => {
      // Exclude discarded (3) and expired (4) bags from counts entirely
      if (b.bagStatus === 3 || b.bagStatus === 4) return;

      const key = b.bloodGroup || 'Unknown';
      if (!groups[key]) groups[key] = { in: 0, out: 0 };
      groups[key].in++;
      // Only bags actually used (status 2) count as outbound
      if (b.bagStatus === 2) groups[key].out++;
    });

    const rows = Object.entries(groups).map(([bg, v]) => {
      const net = v.in - v.out;
      const netCls = net >= 0 ? 'net-positive' : 'net-negative';
      const sign = net >= 0 ? '+' : '';
      return `<tr>
        <td>${bg}</td>
        <td>${v.in}</td>
        <td>${v.out}</td>
        <td class="${netCls}">${sign}${net}</td>
      </tr>`;
    });

    const total = Object.values(groups).reduce((acc, v) => {
      acc.in  += v.in;
      acc.out += v.out;
      return acc;
    }, { in: 0, out: 0 });
    const totalNet = total.in - total.out;
    const totalCls = totalNet >= 0 ? 'net-positive' : 'net-negative';

    tbody.innerHTML = rows.join('') + `<tr style="font-weight:700;border-top:2px solid #ccc">
      <td>รวมทั้งหมด</td>
      <td>${total.in}</td>
      <td>${total.out}</td>
      <td class="${totalCls}">${totalNet >= 0 ? '+' : ''}${totalNet}</td>
    </tr>`;
  } catch {
    tbody.innerHTML = '<tr><td class="empty-state" colspan="4">ไม่สามารถโหลดข้อมูลได้</td></tr>';
  }
}

document.getElementById('refreshBtn').addEventListener('click', loadReport);

loadReport();
