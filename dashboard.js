const STOCK_THRESHOLD_LOW = 10;
const STOCK_THRESHOLD_WARN = 20;

async function loadStats() {
  try {
    const stats = await apiGet('/api/dashboard/stats');
    document.getElementById('statDonors').textContent    = stats.activeDonors   ?? '—';
    document.getElementById('statBags').textContent      = stats.availableBags  ?? '—';
    document.getElementById('statExpiring').textContent  = stats.expiringSoon   ?? '—';
    document.getElementById('statDispensed').textContent = stats.dispensedToday ?? '—';
  } catch {
    // leave dashes
  }
}

async function loadBloodStock() {
  const tbody = document.getElementById('stockTableBody');
  try {
    const rows = await apiGet('/api/dashboard/blood-stock');
    if (!rows || rows.length === 0) {
      tbody.innerHTML = '<tr><td class="empty-state" colspan="3">ไม่มีข้อมูลสต็อกเลือด</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => {
      const count = r.count ?? 0;
      let cls, label;
      if (count === 0) { cls = 'critical'; label = 'ขาดแคลนด่วน'; }
      else if (count < STOCK_THRESHOLD_LOW)  { cls = 'critical'; label = 'ขาดแคลนด่วน'; }
      else if (count < STOCK_THRESHOLD_WARN) { cls = 'watch';    label = 'เฝ้าระวัง'; }
      else                                   { cls = 'ok';       label = 'ปกติ'; }
      const rh = r.rhFactor === '+' ? 'positive' : 'negative';
      return `<tr>
        <td>${r.bloodGroup} ${rh}</td>
        <td>${count}</td>
        <td><span class="stock-status ${cls}">${label}</span></td>
      </tr>`;
    }).join('');
  } catch {
    tbody.innerHTML = '<tr><td class="empty-state" colspan="3">ไม่สามารถโหลดข้อมูลได้</td></tr>';
  }
}

async function loadAlerts() {
  const list = document.getElementById('alertList');
  try {
    const alerts = await apiGet('/api/alerts');
    if (!alerts || alerts.length === 0) {
      list.innerHTML = '<div class="empty-state">ไม่มีการแจ้งเตือนในขณะนี้</div>';
      return;
    }
    list.innerHTML = alerts.slice(0, 5).map(a => {
      const sev = (a.severity || 'LOW').toLowerCase();
      const cls = sev === 'high' ? 'high' : sev === 'medium' ? 'medium' : 'low';
      return `<div class="alert-card ${cls}">
        <div class="alert-card-title">${a.title || ''}</div>
        <div class="alert-card-msg">${a.message || ''}</div>
      </div>`;
    }).join('');
  } catch {
    list.innerHTML = '<div class="empty-state">ไม่สามารถโหลดการแจ้งเตือนได้</div>';
  }
}

loadStats();
loadBloodStock();
loadAlerts();
