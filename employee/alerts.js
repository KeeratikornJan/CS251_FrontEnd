const alertList = document.getElementById('alertList');

function severityClass(severity) {
  const s = (severity || '').toUpperCase();
  if (s === 'HIGH')   return 'high';
  if (s === 'MEDIUM') return 'medium';
  if (s === 'LOW')    return 'low';
  return 'info';
}

function severityIcon(severity) {
  const s = (severity || '').toUpperCase();
  if (s === 'HIGH')   return '<i class="fa-solid fa-triangle-exclamation"></i>';
  if (s === 'MEDIUM') return '<i class="fa-regular fa-clock"></i>';
  if (s === 'LOW')    return '<i class="fa-solid fa-circle-info"></i>';
  return '<i class="fa-solid fa-truck-medical"></i>';
}

function buildDetailText(a) {
  const lines = [`ประเภท: ${a.type || '—'}`, `ระดับความสำคัญ: ${a.severity || '—'}`];
  if (a.meta) {
    Object.entries(a.meta).forEach(([k, v]) => lines.push(`${k}: ${v}`));
  }
  return lines.join('\n');
}

function renderAlerts(alerts) {
  if (!alerts || alerts.length === 0) {
    alertList.innerHTML = '<div class="empty-state">ไม่มีการแจ้งเตือนในขณะนี้</div>';
    return;
  }

  alertList.innerHTML = alerts.map((a, i) => {
    const cls  = severityClass(a.severity);
    const icon = severityIcon(a.severity);
    const dateStr = a.date ? formatThaiDate(a.date) : 'เข้านี้';
    return `<div class="alert-card ${cls}">
      <div class="alert-stripe"></div>
      <div class="alert-body">
        <div class="alert-header">
          <div class="alert-title">${icon} ${a.title || ''}</div>
          <span class="alert-date">${dateStr}</span>
        </div>
        <div class="alert-msg">${a.message || ''}</div>
        <button class="detail-btn" type="button" data-idx="${i}">ดูรายละเอียด</button>
      </div>
    </div>`;
  }).join('');

  alertList.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = alerts[parseInt(btn.dataset.idx)];
      alert(`${a.title}\n\n${a.message}\n\n${buildDetailText(a)}`);
    });
  });
}

async function loadAlerts() {
  try {
    const alerts = await apiGet('/api/alerts');
    renderAlerts(alerts);
  } catch (err) {
    alertList.innerHTML = `<div class="empty-state">เกิดข้อผิดพลาด: ${err.message}</div>`;
  }
}

loadAlerts();
