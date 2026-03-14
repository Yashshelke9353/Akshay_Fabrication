// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════
async function doLogin() {
  const pwd = document.getElementById('loginPwd').value;
  const res  = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pwd}) });
  const data = await res.json();
  if (data.success) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display  = 'block';
    initAdmin();
  } else {
    document.getElementById('loginMsg').innerHTML = '<div class="alert alert-error">❌ ' + (data.error || 'चुकीचा password!') + '</div>';
    document.getElementById('loginPwd').value = '';
    document.getElementById('loginPwd').focus();
  }
}

async function doLogout() {
  await fetch('/api/logout', {method:'POST'});
  document.getElementById('adminPanel').style.display  = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPwd').value = '';
}

async function initAdmin() {
  await loadSettings();
  await Promise.all([loadMaterials(), loadWorks()]);
  loadDashboard();
  // Set today's date in billing form
  document.getElementById('billDate').value = new Date().toISOString().split('T')[0];
  // Init one billing row
  if (billItems.length === 0) addBillRow();
}

// Auto-check session on page load
window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('loginPwd').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
  const res  = await fetch('/api/check-auth');
  const data = await res.json();
  if (data.logged_in) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display  = 'block';
    initAdmin();
  } else {
    setTimeout(() => document.getElementById('loginPwd').focus(), 100);
  }
});

// ════════════════════════════════════════
//  SECTIONS
// ════════════════════════════════════════
function showSection(name, btn) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + name).style.display = 'block';
  if (btn) btn.classList.add('active');
  if (name === 'dashboard')    loadDashboard();
  if (name === 'billing')      { if (_materials.length === 0) loadMaterials(); if (_works.length === 0) loadWorks(); }
  if (name === 'bills')        loadBills();
  if (name === 'customers')    loadCustomers();
  if (name === 'materials')    loadMaterials();
  if (name === 'works')        loadWorks();
  if (name === 'gallery-admin') loadGalleryAdmin();
  if (name === 'settings')     loadSettingsForm();
}

// ════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════
async function loadDashboard() {
  const data = await apiFetch('/api/dashboard');
  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-card-icon">📅</div>
      <div class="stat-card-val">${formatCurrency(data.today_income)}</div>
      <div class="stat-card-label">आजचे उत्पन्न</div>
      <div class="stat-card-glow" style="background:#e65c00;"></div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon">💰</div>
      <div class="stat-card-val">${formatCurrency(data.total_income)}</div>
      <div class="stat-card-label">एकूण उत्पन्न</div>
      <div class="stat-card-glow" style="background:#27ae60;"></div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon">🧾</div>
      <div class="stat-card-val">${data.total_bills}</div>
      <div class="stat-card-label">एकूण बिले</div>
      <div class="stat-card-glow" style="background:#3498db;"></div>
    </div>
    <div class="stat-card">
      <div class="stat-card-icon">👥</div>
      <div class="stat-card-val">${data.total_customers}</div>
      <div class="stat-card-label">एकूण ग्राहक</div>
      <div class="stat-card-glow" style="background:#9b59b6;"></div>
    </div>`;

  document.getElementById('recentBills').innerHTML = data.recent_bills.length
    ? data.recent_bills.map(b => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--card-border);">
        <div><div style="font-family:'Rajdhani';font-weight:700;color:var(--white);">${b.cust_name}</div><div style="color:var(--text-muted);font-size:12px;">${b.bill_no} | ${formatDate(b.bill_date)}</div></div>
        <div style="font-family:'Rajdhani';font-weight:700;color:var(--accent);">${formatCurrency(b.total)}</div>
      </div>`).join('')
    : '<p style="color:var(--text-muted);padding:20px 0;">अजून बिले नाहीत</p>';

  document.getElementById('recentCustomers').innerHTML = data.recent_customers.length
    ? data.recent_customers.map(c => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--card-border);">
        <div><div style="font-family:'Rajdhani';font-weight:700;color:var(--white);">${c.name}</div><div style="color:var(--text-muted);font-size:12px;">${c.phone || '—'}</div></div>
        ${c.phone ? `<a href="https://wa.me/91${c.phone}" target="_blank" style="color:#25d366;font-size:20px;">💬</a>` : ''}
      </div>`).join('')
    : '<p style="color:var(--text-muted);padding:20px 0;">अजून ग्राहक नाहीत</p>';
}

// ════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════
let _settings = {};

async function loadSettings() {
  _settings = await apiFetch('/api/settings');
  return _settings;
}

async function loadSettingsForm() {
  await loadSettings();
  document.getElementById('setShopName').value  = _settings.shop_name  || '';
  document.getElementById('setOwnerName').value = _settings.owner_name || '';
  document.getElementById('setMobile').value    = _settings.mobile     || '';
  document.getElementById('setWhatsapp').value  = _settings.whatsapp   || '';
  document.getElementById('setAddress').value   = _settings.address    || '';
  document.getElementById('setGst').value       = _settings.gst_no     || '';
}

async function saveSettings() {
  const data = {
    shop_name:  document.getElementById('setShopName').value.trim(),
    owner_name: document.getElementById('setOwnerName').value.trim(),
    mobile:     document.getElementById('setMobile').value.trim(),
    whatsapp:   document.getElementById('setWhatsapp').value.trim(),
    address:    document.getElementById('setAddress').value.trim(),
    gst_no:     document.getElementById('setGst').value.trim(),
  };
  await apiFetch('/api/settings', 'POST', data);
  _settings = {..._settings, ...data};
  showToast('Settings सेव्ह झाले! ✅');
}

async function changePassword() {
  const np = document.getElementById('newPwd').value;
  const cp = document.getElementById('confirmPwd').value;
  if (!np) { document.getElementById('pwdMsg').innerHTML = '<div class="alert alert-error">Password टाका!</div>'; return; }
  if (np !== cp) { document.getElementById('pwdMsg').innerHTML = '<div class="alert alert-error">Passwords जुळत नाहीत!</div>'; return; }
  await apiFetch('/api/settings/password', 'POST', {password: np});
  document.getElementById('pwdMsg').innerHTML = '<div class="alert alert-success">✅ Password बदलला!</div>';
  document.getElementById('newPwd').value = '';
  document.getElementById('confirmPwd').value = '';
}

// ════════════════════════════════════════
//  MATERIALS
// ════════════════════════════════════════
let _materials = [];

// Work types (काम प्रकार)
let _works = [];
let currentWorkId = null;
let currentWorkIds = [];
let workComponents = [];
let deletedWorkComponentIds = [];

async function loadMaterials() {
  _materials = await apiFetch('/api/materials');
  document.getElementById('materialsBody').innerHTML = _materials.length
    ? _materials.map((m, i) => `
      <tr>
        <td style="color:var(--text-muted);">${i+1}</td>
        <td style="font-weight:600;color:var(--white);">${m.name}</td>
        <td>${m.unit}</td>
        <td>${m.length || ''}</td>
        <td>${m.girth || ''}</td>
        <td style="color:var(--accent);font-family:'Rajdhani';font-weight:700;">${formatCurrency(m.price)}</td>
        <td><div style="display:flex;gap:6px;">
          <button class="act-btn act-edit" onclick="editMaterial(${m.id})">✏ Edit</button>
          <button class="act-btn act-del" onclick="deleteMaterial(${m.id})">🗑</button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px;">साहित्य नाही</td></tr>';
}

function openMatModal(mat) {
  document.getElementById('matEditId').value = mat ? mat.id : '';
  document.getElementById('matName').value   = mat ? mat.name : '';
  document.getElementById('matUnit').value   = mat ? mat.unit : 'kg';
  document.getElementById('matLength').value = mat ? mat.length : '';
  document.getElementById('matGirth').value  = mat ? mat.girth  : '';
  document.getElementById('matPrice').value  = mat ? mat.price : '';
  document.getElementById('matModalTitle').textContent = mat ? 'साहित्य Edit करा' : 'नवीन साहित्य';
  openModal('matModal');
}

function editMaterial(id) {
  const m = _materials.find(x => x.id === id);
  if (m) openMatModal(m);
}

async function saveMaterial() {
  const id    = document.getElementById('matEditId').value;
  const name  = document.getElementById('matName').value.trim();
  const unit  = document.getElementById('matUnit').value;
  const price  = parseFloat(document.getElementById('matPrice').value) || 0;
  const length = parseFloat(document.getElementById('matLength').value) || 0;
  const girth  = parseFloat(document.getElementById('matGirth').value) || 0;
  if (!name) { showToast('नाव भरा!', 'error'); return; }
  const payload = {name, unit, price, length, girth};
  if (id) {
    await apiFetch('/api/materials/' + id, 'PUT', payload);
    showToast('साहित्य अपडेट झाले ✅');
  } else {
    await apiFetch('/api/materials', 'POST', payload);
    showToast('साहित्य जोडले ✅');
  }
  closeModal('matModal');
  loadMaterials();
}

async function deleteMaterial(id) {
  if (!confirm('हे साहित्य काढायचे का?')) return;
  await apiFetch('/api/materials/' + id, 'DELETE');
  showToast('साहित्य काढले');
  loadMaterials();
}

// ════════════════════════════════════════
//  WORK TYPES (काम प्रकार)
// ════════════════════════════════════════

async function loadWorks() {
  _works = await apiFetch('/api/works');
  renderWorkRows();
  populateWorkSelect();
}

function populateWorkSelect() {
  const container = document.getElementById('billWorkList');
  if (!container) return;

  if (_works.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">कोणतेही काम प्रकार उपलब्ध नाहीत.</p>';
    return;
  }

  container.innerHTML = _works.map(w => `
    <label class="work-checkbox">
      <input type="checkbox" value="${w.id}" onchange="onWorkToggle(${w.id}, this.checked)">
      <span class="work-name">${w.name}</span>
    </label>
  `).join('');
}

function onWorkToggle(workId, checked) {
  workId = parseInt(workId);
  if (checked) {
    // Add component items for this work
    const work = _works.find(w => w.id === workId);
    if (!work) return;
    currentWorkIds.push(workId);

    const workItems = (work.components || []).map(c => ({
      id: Date.now() + Math.random(),
      sourceWorkId: workId,
      material_id: c.material_id,
      matName: c.name,
      qty: c.qty || 1,
      unit: c.unit || '',
      price: c.price || 0,
    }));

    billItems.push(...workItems);
  } else {
    // Remove all items that came from this work
    currentWorkIds = currentWorkIds.filter(id => id !== workId);
    billItems = billItems.filter(i => i.sourceWorkId !== workId);
  }

  currentWorkId = currentWorkIds.length ? currentWorkIds[0] : null;
  if (billItems.length === 0) addBillRow();
  renderBillRows();
  calcBill();
}

function renderWorkRows() {
  document.getElementById('worksBody').innerHTML = _works.length
    ? _works.map((w, i) => `
      <tr>
        <td style="color:var(--text-muted);">${i+1}</td>
        <td style="font-weight:600;color:var(--white);">${w.name}</td>
        <td style="color:var(--text-muted);font-size:13px;">${(w.components||[]).map(c=>c.name).join(', ') || '—'}</td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="act-btn act-edit" onclick="openWorkModal(${w.id})">✏ Edit</button>
          <button class="act-btn act-del" onclick="deleteWork(${w.id})">🗑</button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:30px;">कोणतीही काम प्रकार नाहीत</td></tr>';
}

function openWorkModal(work) {
  deletedWorkComponentIds = [];
  if (work) {
    currentWorkId = work.id;
    document.getElementById('workName').value = work.name || '';
    workComponents = (work.components || []).map(c => ({...c, _uid: Date.now() + Math.random(), _isNew: false}));
    document.getElementById('workModalTitle').textContent = 'काम edit करा';
  } else {
    currentWorkId = null;
    document.getElementById('workName').value = '';
    workComponents = [];
    document.getElementById('workModalTitle').textContent = 'नवीन काम जोडा';
  }
  if (workComponents.length === 0) addWorkComponentRow();
  renderWorkComponentRows();
  openModal('workModal');
}

function addWorkComponentRow() {
  workComponents.push({
    _uid: Date.now() + Math.random(),
    _isNew: true,
    id: null,
    material_id: null,
    name: '',
    qty: 1,
    unit: '',
    price: 0,
  });
  renderWorkComponentRows();
}

function renderWorkComponentRows() {
  const mats = _materials;
  const opts = mats.map(m => `<option value="${m.id}" data-name="${m.name}" data-unit="${m.unit}" data-price="${m.price}">${m.name} (${m.unit}) — ₹${m.price}</option>`).join('');
  document.getElementById('workComponentsBody').innerHTML = workComponents.map((c, idx) => `
    <tr>
      <td style="min-width:180px;">
        <select onchange="onWorkCompSelect(this,'${c._uid}')" style="margin-bottom:4px;">
          <option value="">-- निवडा --</option>${opts}
        </select>
        <input type="text" placeholder="साहित्य नाव" value="${esc(c.name)}" oninput="updateWorkComponent('${c._uid}','name',this.value)" style="margin-top:4px;width:100%;background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);" />
      </td>
      <td><input type="number" value="${c.qty||1}" min="0.01" step="0.01" oninput="updateWorkComponent('${c._uid}','qty',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);width:80px;"></td>
      <td><input type="text" value="${esc(c.unit||'')}" placeholder="युनिट" oninput="updateWorkComponent('${c._uid}','unit',this.value)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);width:70px;"></td>
      <td><input type="number" value="${c.price||0}" min="0" oninput="updateWorkComponent('${c._uid}','price',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);width:90px;"></td>
      <td><button onclick="removeWorkComponent('${c._uid}')" style="background:rgba(231,76,60,0.2);border:1px solid #e74c3c;color:#e74c3c;border-radius:6px;padding:5px 9px;cursor:pointer;">✕</button></td>
    </tr>`).join('');
}

function onWorkCompSelect(sel, compUid) {
  const opt = sel.options[sel.selectedIndex];
  if (!opt.value) return;
  updateWorkComponent(compUid, 'material_id', parseInt(opt.value));
  updateWorkComponent(compUid, 'name', opt.dataset.name);
  updateWorkComponent(compUid, 'unit', opt.dataset.unit);
  updateWorkComponent(compUid, 'price', parseFloat(opt.dataset.price)||0);
  renderWorkComponentRows();
}

function updateWorkComponent(uid, key, val) {
  const comp = workComponents.find(c => String(c._uid) === String(uid));
  if (comp) comp[key] = val;
}

function removeWorkComponent(uid) {
  const comp = workComponents.find(c => String(c._uid) === String(uid));
  if (comp && comp.id) {
    deletedWorkComponentIds.push(comp.id);
  }
  workComponents = workComponents.filter(c => String(c._uid) !== String(uid));
  renderWorkComponentRows();
}

async function saveWork() {
  const name = document.getElementById('workName').value.trim();
  if (!name) { showToast('कामाचे नाव भरा!', 'error'); return; }

  let work;
  if (currentWorkId) {
    work = await apiFetch('/api/works/' + currentWorkId, 'PUT', {name});
  } else {
    work = await apiFetch('/api/works', 'POST', {name});
    currentWorkId = work.id;
  }

  // Delete removed components
  for (const cid of deletedWorkComponentIds) {
    await apiFetch(`/api/works/${currentWorkId}/components/${cid}`, 'DELETE');
  }

  // Save/Update components
  for (const comp of workComponents) {
    const payload = {
      material_id: comp.material_id,
      name: comp.name,
      qty: comp.qty,
      unit: comp.unit,
      price: comp.price,
    };
    if (comp.id && !comp._isNew) {
      await apiFetch(`/api/works/${currentWorkId}/components/${comp.id}`, 'PUT', payload);
    } else {
      await apiFetch(`/api/works/${currentWorkId}/components`, 'POST', payload);
    }
  }

  showToast('काम सेव्ह झाले ✅');
  closeModal('workModal');
  loadWorks();
}

async function deleteWork(id) {
  if (!confirm('हे काम काढायचे का?')) return;
  await apiFetch('/api/works/' + id, 'DELETE');
  showToast('काम काढले');
  loadWorks();
}

// ════════════════════════════════════════
//  CUSTOMERS
// ════════════════════════════════════════
async function loadCustomers() {
  const q = document.getElementById('custSearch')?.value || '';
  const data = await apiFetch('/api/customers?q=' + encodeURIComponent(q));
  document.getElementById('customersBody').innerHTML = data.length
    ? data.map((c, i) => `
      <tr>
        <td style="color:var(--text-muted);">${i+1}</td>
        <td><div style="font-weight:600;color:var(--white);">${c.name}</div>${c.note ? `<div style="font-size:12px;color:var(--text-muted);">${c.note}</div>` : ''}</td>
        <td>${c.phone || '—'}</td>
        <td style="color:var(--text-muted);">${c.address || '—'}</td>
        <td><span class="badge badge-warning">${c.bill_count} बिले</span><div style="font-size:12px;color:var(--accent);font-family:'Rajdhani';font-weight:700;">${formatCurrency(c.total_spent)}</div></td>
        <td><div style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="act-btn act-edit" onclick="editCustomer(${c.id},'${esc(c.name)}','${esc(c.phone)}','${esc(c.address)}','${esc(c.note)}')">✏ Edit</button>
          ${c.phone ? `<a href="https://wa.me/91${c.phone}" target="_blank" class="act-btn act-wa">💬</a>` : ''}
          ${c.phone ? `<a href="tel:${c.phone}" class="act-btn" style="background:rgba(39,174,96,0.12);border-color:#27ae60;color:#2ecc71;">📞</a>` : ''}
          <button class="act-btn act-del" onclick="deleteCustomer(${c.id})">🗑</button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px;">ग्राहक नाहीत</td></tr>';
}

function openCustModal() {
  document.getElementById('custEditId').value = '';
  document.getElementById('custName').value   = '';
  document.getElementById('custPhone').value  = '';
  document.getElementById('custAddr').value   = '';
  document.getElementById('custNote').value   = '';
  document.getElementById('custModalTitle').textContent = 'नवीन ग्राहक';
  openModal('custModal');
}

function editCustomer(id, name, phone, address, note) {
  document.getElementById('custEditId').value = id;
  document.getElementById('custName').value   = name || '';
  document.getElementById('custPhone').value  = phone || '';
  document.getElementById('custAddr').value   = address || '';
  document.getElementById('custNote').value   = note || '';
  document.getElementById('custModalTitle').textContent = 'ग्राहक Edit करा';
  openModal('custModal');
}

async function saveCustomer() {
  const id   = document.getElementById('custEditId').value;
  const name = document.getElementById('custName').value.trim();
  if (!name) { showToast('नाव भरा!', 'error'); return; }
  const body = {
    name,
    phone:   document.getElementById('custPhone').value.trim(),
    address: document.getElementById('custAddr').value.trim(),
    note:    document.getElementById('custNote').value.trim(),
  };
  if (id) { await apiFetch('/api/customers/' + id, 'PUT', body); showToast('ग्राहक अपडेट ✅'); }
  else    { await apiFetch('/api/customers', 'POST', body);       showToast('ग्राहक जोडला ✅'); }
  closeModal('custModal');
  loadCustomers();
}

async function deleteCustomer(id) {
  if (!confirm('हा ग्राहक काढायचा का?')) return;
  await apiFetch('/api/customers/' + id, 'DELETE');
  showToast('ग्राहक काढला');
  loadCustomers();
}

// ════════════════════════════════════════
//  BILLING
// ════════════════════════════════════════
let billItems = [];

function addBillRow() {
  billItems.push({id: Date.now(), material_id: null, matName:'', qty:1, unit:'', length:0, girth:0, price:0});
  renderBillRows();
}

function renderBillRows() {
  const mats = _materials;
  document.getElementById('billItemsBody').innerHTML = billItems.map(item => {
    const opts = mats.map(m => `<option value="${m.id}" data-price="${m.price}" data-unit="${m.unit}" data-length="${m.length||0}" data-girth="${m.girth||0}" style="background:#1a1a2e;" ${item.material_id==m.id ? 'selected' : ''}>${m.name} (${m.unit}) — ₹${m.price}</option>`).join('');
    return `
      <tr>
        <td style="min-width:200px;">
          <select class="mat-select" onchange="onBillMatSelect(this,'${item.id}')">
            <option value="">-- निवडा --</option>${opts}
          </select>
          <input class="mat-input" type="text" placeholder="किंवा नाव टाका" value="${esc(item.matName)}" oninput="updateBillItem('${item.id}','matName',this.value)">
        </td>
        <td><input type="number" value="${item.qty}" min="0.01" step="0.01" oninput="updateBillItem('${item.id}','qty',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;color:var(--white);width:80px;font-size:15px;"></td>
        <td><input type="text" value="${esc(item.unit)}" placeholder="kg" oninput="updateBillItem('${item.id}','unit',this.value)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;color:var(--white);width:70px;font-size:15px;"></td>
        <td><input type="number" value="${item.length||''}" min="0" step="0.01" placeholder="लांबी" oninput="updateBillItem('${item.id}','length',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;color:var(--white);width:80px;font-size:15px;"></td>
        <td><input type="number" value="${item.girth||''}" min="0" step="0.01" placeholder="वृंदी" oninput="updateBillItem('${item.id}','girth',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;color:var(--white);width:80px;font-size:15px;"></td>
        <td><input type="number" value="${item.price}" min="0" oninput="updateBillItem('${item.id}','price',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px;color:var(--white);width:100px;font-size:15px;"></td>
        <td style="color:var(--accent);font-family:'Rajdhani';font-weight:700;">${formatCurrency(item.qty*item.price)}</td>
        <td><button onclick="removeBillItem('${item.id}')" style="background:rgba(231,76,60,0.2);border:1px solid #e74c3c;color:#e74c3c;border-radius:6px;padding:6px 10px;cursor:pointer;">✕</button></td>
      </tr>`;
  }).join('');
}

function onBillMatSelect(sel, itemId) {
  const opt = sel.options[sel.selectedIndex];
  if (!opt.value) return;
  const namePart = opt.text.split(' (')[0];
  updateBillItem(itemId, 'material_id', parseInt(opt.value));
  updateBillItem(itemId, 'matName', namePart);
  updateBillItem(itemId, 'price', parseFloat(opt.dataset.price)||0);
  updateBillItem(itemId, 'unit', opt.dataset.unit||'');
  updateBillItem(itemId, 'length', parseFloat(opt.dataset.length)||0);
  updateBillItem(itemId, 'girth', parseFloat(opt.dataset.girth)||0);
  renderBillRows(); calcBill();
}

function updateBillItem(id, key, val) {
  const item = billItems.find(i => String(i.id) === String(id));
  if (item) { item[key] = val; calcBill(); }
}

function removeBillItem(id) {
  billItems = billItems.filter(i => String(i.id) !== String(id));
  renderBillRows(); calcBill();
}

function calcBill() {
  const matSum  = billItems.reduce((s,i) => s + i.qty*i.price, 0);
  const labour  = parseFloat(document.getElementById('billLabour')?.value) || 0;
  const discount= parseFloat(document.getElementById('billDiscount')?.value) || 0;
  const total   = matSum + labour - discount;
  document.getElementById('matTotal').textContent    = formatCurrency(matSum);
  document.getElementById('labourTotal').textContent = formatCurrency(labour);
  document.getElementById('discountTotal').textContent = '-' + formatCurrency(discount);
  document.getElementById('grandTotal').textContent  = formatCurrency(total);
}

function getBillFormData() {
  const matSum  = billItems.reduce((s,i) => s + i.qty*i.price, 0);
  const labour  = parseFloat(document.getElementById('billLabour').value) || 0;
  const discount= parseFloat(document.getElementById('billDiscount').value) || 0;
  const advance = parseFloat(document.getElementById('billAdvance').value) || 0;
  const workNames = _works
    .filter(w => currentWorkIds.includes(w.id))
    .map(w => w.name)
    .join(', ');

  return {
    work_id:    currentWorkId,
    work_name:  workNames,
    cust_name:  document.getElementById('billCustName').value.trim(),
    cust_phone: document.getElementById('billCustPhone').value.trim(),
    cust_addr:  document.getElementById('billCustAddr').value.trim(),
    bill_date:  document.getElementById('billDate').value,
    items:      billItems.filter(i => i.matName),
    labour, discount, advance, mat_sum: matSum,
    total: matSum + labour - discount,
  };
}

async function saveBill() {
  const data = getBillFormData();
  if (!data.cust_name) { showToast('ग्राहकाचे नाव भरा!', 'error'); return; }
  const bill = await apiFetch('/api/bills', 'POST', data);
  showToast('बिल सेव्ह झाले! 🎉');
  // Reset form
  billItems = [];
  currentWorkId = null;
  currentWorkIds = [];
  const container = document.getElementById('billWorkList');
  if (container) {
    container.querySelectorAll('input[type=checkbox]').forEach(chk => chk.checked = false);
  }
  document.getElementById('billCustName').value = '';
  document.getElementById('billCustPhone').value = '';
  document.getElementById('billCustAddr').value = '';
  document.getElementById('billLabour').value = 0;
  document.getElementById('billDiscount').value = 0;
  document.getElementById('billAdvance').value = 0;
  addBillRow(); calcBill();
  setTimeout(() => showSection('bills', document.querySelectorAll('.side-btn')[2]), 800);
}

function previewBill() {
  const data = getBillFormData();
  if (!data.cust_name) { showToast('ग्राहकाचे नाव भरा!', 'error'); return; }
  const fakeBill = {...data, bill_no:'PREVIEW', bill_date: data.bill_date || new Date().toISOString().split('T')[0]};
  openBillPreview(fakeBill);
}

function printCurrentBill() {
  const data = getBillFormData();
  if (!data.cust_name) { showToast('ग्राहकाचे नाव भरा!', 'error'); return; }
  const fakeBill = {...data, bill_no:'DRAFT', bill_date: data.bill_date || new Date().toISOString().split('T')[0]};
  openPrintWindow(fakeBill, false);
}

function whatsappCurrentBill() {
  const data = getBillFormData();
  if (!data.cust_name) { showToast('ग्राहकाचे नाव भरा!', 'error'); return; }
  const fakeBill = {...data, bill_no:'DRAFT', bill_date: data.bill_date || new Date().toISOString().split('T')[0]};
  shareBillWhatsApp(fakeBill);
}

// ════════════════════════════════════════
//  BILLS LIST
// ════════════════════════════════════════
async function loadBills() {
  const q = document.getElementById('billSearch')?.value || '';
  const bills = await apiFetch('/api/bills?q=' + encodeURIComponent(q));
  document.getElementById('allBillsBody').innerHTML = bills.length
    ? bills.map((b, i) => `
      <tr>
        <td style="color:var(--text-muted);font-size:13px;">${i+1}<br><span style="font-size:11px;">${b.bill_no}</span></td>
        <td><div style="font-family:'Rajdhani';font-weight:700;color:var(--white);">${b.cust_name}</div></td>
        <td style="color:var(--text-muted);">${b.cust_phone || '—'}</td>
        <td style="color:var(--text-muted);font-size:13px;">${formatDate(b.bill_date)}</td>
        <td style="color:var(--accent);font-family:'Rajdhani';font-weight:700;font-size:16px;">${formatCurrency(b.total)}</td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            <button class="act-btn act-view"  onclick="viewSavedBill(${b.id})">👁 पाहा</button>
            <button class="act-btn act-edit"  onclick="openEditBill(${b.id})">✏ Edit</button>
            <button class="act-btn act-print" onclick="printSavedBill(${b.id})">🖨 प्रिंट</button>
            <button class="act-btn act-pdf"   onclick="downloadSavedPDF(${b.id})">📄 PDF</button>
            <button class="act-btn act-wa"    onclick="whatsappSavedBill(${b.id})">💬 Share</button>
            <button class="act-btn act-del"   onclick="deleteBill(${b.id})">🗑</button>
          </div>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">अजून बिले नाहीत</td></tr>';
}

async function viewSavedBill(id) {
  const bill = await apiFetch('/api/bills/' + id);
  const html = getBillHTML(bill);
  document.getElementById('viewBillActions').innerHTML = `
    <button class="btn-secondary" style="font-size:13px;padding:8px 14px;" onclick="printSavedBill(${id})">🖨 प्रिंट</button>
    <button class="btn-secondary" style="font-size:13px;padding:8px 14px;" onclick="downloadSavedPDF(${id})">📄 PDF</button>
    <button class="btn-whatsapp"  style="font-size:13px;padding:8px 14px;" onclick="whatsappSavedBill(${id})">💬 WhatsApp</button>`;
  document.getElementById('billIframe').srcdoc = html;
  openModal('viewBillModal');
}

async function printSavedBill(id) {
  const bill = await apiFetch('/api/bills/' + id);
  openPrintWindow(bill, false);
}

async function downloadSavedPDF(id) {
  const bill = await apiFetch('/api/bills/' + id);
  openPrintWindow(bill, true);
  showToast('Print > Save as PDF करा 📄');
}

async function whatsappSavedBill(id) {
  const bill = await apiFetch('/api/bills/' + id);
  shareBillWhatsApp(bill);
}

async function deleteBill(id) {
  if (!confirm('हे बिल कायमचे काढायचे का?')) return;
  await apiFetch('/api/bills/' + id, 'DELETE');
  showToast('बिल काढले');
  loadBills();
}

// ────── EDIT BILL ──────
let editItems = [];

async function openEditBill(id) {
  const bill = await apiFetch('/api/bills/' + id);
  document.getElementById('ebId').value      = id;
  document.getElementById('ebName').value    = bill.cust_name  || '';
  document.getElementById('ebPhone').value   = bill.cust_phone || '';
  document.getElementById('ebAddr').value    = bill.cust_addr  || '';
  document.getElementById('ebDate').value    = bill.bill_date  || '';
  document.getElementById('ebLabour').value  = bill.labour     || 0;
  document.getElementById('ebDiscount').value= bill.discount   || 0;
  document.getElementById('ebAdvance').value = bill.advance    || 0;
  editItems = (bill.items || []).map(i => ({...i, _id: Date.now() + Math.random()}));
  if (editItems.length === 0) editItems.push({_id: Date.now(), matName:'', qty:1, unit:'', price:0});
  renderEditRows(); calcEditBill();
  openModal('editBillModal');
}

function addEditRow() {
  editItems.push({_id: Date.now(), matName:'', qty:1, unit:'', length:0, girth:0, price:0});
  renderEditRows();
}

function renderEditRows() {
  const mats = _materials;
  const opts = mats.map(m => `<option value="${m.id}" data-price="${m.price}" data-unit="${m.unit}" data-length="${m.length||0}" data-girth="${m.girth||0}" style="background:#1a1a2e;">${m.name} (${m.unit}) — ₹${m.price}</option>`).join('');
  document.getElementById('editItemsBody').innerHTML = editItems.map(item => `
    <tr>
      <td style="min-width:180px;">
        <select class="mat-select" onchange="onEditMatSelect(this,'${item._id}')" style="margin-bottom:4px;">
          <option value="">-- निवडा --</option>${opts}
        </select>
        <input class="mat-input" type="text" placeholder="नाव" value="${esc(item.matName)}" oninput="updateEditItem('${item._id}','matName',this.value)">
      </td>
      <td><input type="number" value="${item.qty||1}" min="0.01" step="0.01" oninput="updateEditItem('${item._id}','qty',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);width:75px;"></td>
      <td><input type="text" value="${esc(item.unit||'')}" placeholder="kg" oninput="updateEditItem('${item._id}','unit',this.value)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);width:65px;"></td>
      <td><input type="number" value="${item.length||''}" min="0" step="0.01" placeholder="लांबी" oninput="updateEditItem('${item._id}','length',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);width:80px;"></td>
      <td><input type="number" value="${item.girth||''}" min="0" step="0.01" placeholder="वृंदी" oninput="updateEditItem('${item._id}','girth',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);width:80px;"></td>
      <td><input type="number" value="${item.price||0}" min="0" oninput="updateEditItem('${item._id}','price',parseFloat(this.value)||0)" style="background:#0f0f1a;border:1px solid rgba(255,255,255,0.12);border-radius:7px;padding:7px;color:var(--white);width:90px;"></td>
      <td style="color:var(--accent);font-family:'Rajdhani';font-weight:700;">${formatCurrency((item.qty||1)*(item.price||0))}</td>
      <td><button onclick="removeEditItem('${item._id}')" style="background:rgba(231,76,60,0.2);border:1px solid #e74c3c;color:#e74c3c;border-radius:6px;padding:5px 9px;cursor:pointer;">✕</button></td>
    </tr>`).join('');
}

function onEditMatSelect(sel, _id) {
  const opt = sel.options[sel.selectedIndex];
  if (!opt.value) return;
  updateEditItem(_id, 'matName', opt.text.split(' (')[0]);
  updateEditItem(_id, 'price', parseFloat(opt.dataset.price)||0);
  updateEditItem(_id, 'unit', opt.dataset.unit||'');
  updateEditItem(_id, 'length', parseFloat(opt.dataset.length)||0);
  updateEditItem(_id, 'girth', parseFloat(opt.dataset.girth)||0);
  renderEditRows(); calcEditBill();
}

function updateEditItem(_id, key, val) {
  const item = editItems.find(i => String(i._id) === String(_id));
  if (item) { item[key] = val; calcEditBill(); }
}

function removeEditItem(_id) {
  editItems = editItems.filter(i => String(i._id) !== String(_id));
  renderEditRows(); calcEditBill();
}

function calcEditBill() {
  const matSum  = editItems.reduce((s,i) => s + (i.qty||0)*(i.price||0), 0);
  const labour  = parseFloat(document.getElementById('ebLabour')?.value)||0;
  const discount= parseFloat(document.getElementById('ebDiscount')?.value)||0;
  const total   = matSum + labour - discount;
  document.getElementById('ebTotal').textContent = formatCurrency(total);
}

async function saveEditedBill() {
  const id   = document.getElementById('ebId').value;
  const name = document.getElementById('ebName').value.trim();
  if (!name) { showToast('ग्राहकाचे नाव भरा!', 'error'); return; }
  const items    = editItems.filter(i => i.matName);
  const labour   = parseFloat(document.getElementById('ebLabour').value)||0;
  const discount = parseFloat(document.getElementById('ebDiscount').value)||0;
  const advance  = parseFloat(document.getElementById('ebAdvance').value)||0;
  const matSum   = items.reduce((s,i) => s + (i.qty||0)*(i.price||0), 0);
  await apiFetch('/api/bills/' + id, 'PUT', {
    cust_name: name,
    cust_phone: document.getElementById('ebPhone').value.trim(),
    cust_addr:  document.getElementById('ebAddr').value.trim(),
    bill_date:  document.getElementById('ebDate').value,
    items, labour, discount, advance, mat_sum: matSum,
    total: matSum + labour - discount,
  });
  closeModal('editBillModal');
  loadBills();
  showToast('बिल अपडेट झाले ✅');
}

// ════════════════════════════════════════
//  GALLERY ADMIN
// ════════════════════════════════════════
async function loadGalleryAdmin() {
  const items = await apiFetch('/api/gallery');
  const icons = {gate:'🚪', shed:'🏗', grill:'🔩', railing:'🛗'};
  document.getElementById('galList').innerHTML = items.length
    ? items.map(item => `
      <div style="background:rgba(255,255,255,0.04);border:1px solid var(--card-border);border-radius:10px;padding:15px;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">${icons[item.category]||'🔧'}</div>
        <div style="font-weight:600;color:var(--white);margin-bottom:4px;">${item.title}</div>
        <div style="color:var(--text-muted);font-size:12px;margin-bottom:10px;">${item.description||''}</div>
        <button onclick="deleteGallery(${item.id})" style="background:rgba(231,76,60,0.2);border:1px solid #e74c3c;color:#e74c3c;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;width:100%;">🗑 काढा</button>
      </div>`).join('')
    : '<p style="color:var(--text-muted);">अजून items नाहीत</p>';
}

async function addGallery() {
  const title = document.getElementById('galTitle').value.trim();
  if (!title) { showToast('Title भरा!', 'error'); return; }
  await apiFetch('/api/gallery', 'POST', {
    title, category: document.getElementById('galCat').value,
    description: document.getElementById('galDesc').value.trim()
  });
  showToast('Gallery मध्ये जोडले ✅');
  document.getElementById('galTitle').value = '';
  document.getElementById('galDesc').value  = '';
  loadGalleryAdmin();
}

async function deleteGallery(id) {
  if (!confirm('हा item काढायचा का?')) return;
  await apiFetch('/api/gallery/' + id, 'DELETE');
  showToast('Item काढला');
  loadGalleryAdmin();
}

// ════════════════════════════════════════
//  BILL HTML (Print / PDF)
// ════════════════════════════════════════
function getBillHTML(bill) {
  const s = _settings;
  const logoSrc = window.location.origin + '/static/logo/logo.png';
  const items = (bill.items || []).filter(i => i.matName && i.qty > 0);
  const matSum = items.reduce((s,i) => s + i.qty*i.price, 0);

  const rows = items.map((item, idx) => `
    <tr style="background:${idx%2===0?'#ffffff':'#fff8f4'};">
      <td style="padding:10px 12px;text-align:center;color:#888;font-size:13px;border-bottom:1px solid #f0e8e0;">${idx+1}</td>
      <td style="padding:10px 12px;color:#1a1a1a;font-size:15px;font-weight:600;border-bottom:1px solid #f0e8e0;">${item.matName}</td>
      <td style="padding:10px 12px;text-align:center;color:#333;border-bottom:1px solid #f0e8e0;">${item.qty}</td>
      <td style="padding:10px 12px;text-align:center;color:#555;border-bottom:1px solid #f0e8e0;">${item.unit||'—'}</td>
      <td style="padding:10px 12px;text-align:center;color:#555;border-bottom:1px solid #f0e8e0;">${item.length ? Number(item.length).toFixed(2) : '—'}</td>
      <td style="padding:10px 12px;text-align:center;color:#555;border-bottom:1px solid #f0e8e0;">${item.girth ? Number(item.girth).toFixed(2) : '—'}</td>
      <td style="padding:10px 12px;text-align:right;color:#555;border-bottom:1px solid #f0e8e0;">₹${Number(item.price).toLocaleString('en-IN')}</td>
      <td style="padding:10px 12px;text-align:right;color:#c44e00;font-weight:700;border-bottom:1px solid #f0e8e0;">₹${Number(item.qty*item.price).toLocaleString('en-IN')}</td>
    </tr>`).join('');

  const total   = (bill.total   != null) ? bill.total   : matSum + (bill.labour||0) - (bill.discount||0);
  const billDate = bill.bill_date || bill.date || '';

  return `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Marathi&family=Baloo+2:wght@700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#f0f0f0;font-family:'Tiro Devanagari Marathi',serif;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}
.wrap{background:white;max-width:740px;margin:15px auto;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,.15);}
.hdr{background:linear-gradient(135deg,#bf4500,#e65c00,#f97316)!important;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.hdr-top{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 16px;}
.logo{width:54px;height:54px;background:rgba(255,255,255,.2)!important;border-radius:12px;
  display:flex;align-items:center;justify-content:center;font-size:28px;
  border:2px solid rgba(255,255,255,.4);flex-shrink:0;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.shop-name{font-family:'Baloo 2',sans-serif;font-size:24px;font-weight:800;color:#fff!important;line-height:1.1;}
.shop-sub{font-size:11px;color:rgba(255,255,255,.75)!important;letter-spacing:1px;text-transform:uppercase;margin-top:3px;}
.shop-owner{font-size:12px;color:rgba(255,255,255,.85)!important;margin-top:5px;}
.badge{background:rgba(255,255,255,.2)!important;border:1.5px solid rgba(255,255,255,.4);
  border-radius:10px;padding:10px 14px;text-align:center;flex-shrink:0;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.badge-lbl{font-size:10px;color:rgba(255,255,255,.75)!important;letter-spacing:1px;text-transform:uppercase;}
.badge-num{font-family:'Baloo 2',sans-serif;font-size:17px;font-weight:800;color:#fff!important;}
.badge-dt{font-size:11px;color:rgba(255,255,255,.8)!important;margin-top:2px;}
.hdr-contact{background:rgba(0,0,0,.18)!important;padding:8px 28px;display:flex;gap:25px;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.hc{color:rgba(255,255,255,.9)!important;font-size:12px;}
.info-bar{display:flex;background:#fff4ed!important;border-bottom:2px solid #ffd4b3;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.bib{flex:1;padding:11px 16px;border-right:1px solid #ffd4b3;}
.bib:last-child{border-right:none;}
.bib-lbl{font-size:10px;color:#999!important;text-transform:uppercase;letter-spacing:.7px;margin-bottom:3px;}
.bib-val{font-family:'Baloo 2',sans-serif;font-size:14px;font-weight:700;color:#1a1a1a!important;}
.cust{padding:14px 28px;background:#fffaf6!important;border-bottom:1px solid #f0e8e0;display:flex;align-items:flex-start;gap:14px;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.cust-icon{width:40px;height:40px;background:linear-gradient(135deg,#e65c00,#f97316)!important;
  border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.cust-name{font-family:'Baloo 2',sans-serif;font-size:19px;font-weight:700;color:#1a1a1a!important;}
.cust-det{font-size:12px;color:#666!important;margin-top:2px;}
.tbl-section{padding:0 28px;}
.tbl-title{font-family:'Baloo 2',sans-serif;font-size:12px;font-weight:700;
  color:#e65c00!important;text-transform:uppercase;letter-spacing:1px;padding:12px 0 7px;}
table{width:100%;border-collapse:collapse;}
thead tr{background:linear-gradient(135deg,#e65c00,#f97316)!important;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
thead th{padding:10px 12px;font-family:'Baloo 2',sans-serif;font-size:11px;font-weight:700;
  color:#fff!important;text-transform:uppercase;}
thead th:last-child{text-align:right;}
thead th:nth-child(3),thead th:nth-child(4),thead th:nth-child(5){text-align:center;}
.sum-wrap{display:flex;justify-content:flex-end;padding:16px 28px;border-top:2px solid #f0e8e0;}
.sum-box{width:275px;}
.sum-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f5ede6;font-size:13px;color:#555!important;}
.sum-row:last-child{border-bottom:none;}
.sum-total{background:linear-gradient(135deg,#e65c00,#f97316)!important;padding:12px 14px;
  border-radius:10px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.sum-total span{color:#fff!important;font-family:'Baloo 2',sans-serif;font-size:17px;font-weight:800;}
.sig{display:flex;justify-content:space-between;padding:20px 38px 16px;border-top:2px dashed #f0dfd0;margin:0 28px;}
.sig-box{text-align:center;width:140px;}
.sig-line{border-bottom:1.5px solid #bbb;margin-bottom:7px;height:32px;}
.sig-lbl{font-size:11px;color:#888!important;}
.sig-nm{font-size:12px;color:#555!important;font-weight:600;margin-top:2px;}
.ftr{background:linear-gradient(135deg,#1a1a2e,#2d2d4e)!important;padding:12px 28px;
  display:flex;align-items:center;justify-content:space-between;margin-top:14px;
  -webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
.ftr-thanks{font-family:'Baloo 2',sans-serif;font-size:14px;font-weight:700;color:#f97316!important;}
.ftr-contact{font-size:11px;color:rgba(255,255,255,.6)!important;}
@page{margin:8mm;size:A4;}
@media print{body{background:white!important;}.wrap{box-shadow:none;margin:0;max-width:100%;}}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div class="hdr-top" style="background:linear-gradient(135deg,#bf4500,#e65c00,#f97316)!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
      <div class="logo"><img src="${logoSrc}" alt="${s.shop_name||'Logo'}" style="width:100%;height:100%;border-radius:12px;object-fit:contain;" /></div>
      <div style="flex:1;padding:0 16px;">
        <div class="shop-name">${s.shop_name||'Akshay Fabrication Works'}</div>
        <div class="shop-sub">Fabrication &amp; Welding Works</div>
        <div class="shop-owner">मालक: ${s.owner_name||''}</div>
      </div>
      <div class="badge">
        <div class="badge-lbl">बिल क्र.</div>
        <div class="badge-num">${bill.bill_no||bill.billNo||'—'}</div>
        <div class="badge-dt">${formatDate(billDate)}</div>
      </div>
    </div>
    <div class="hdr-contact" style="background:rgba(0,0,0,.18)!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
      <div class="hc">📱 ${s.mobile||''}</div>
      <div class="hc">📍 ${s.address||''}</div>
    </div>
  </div>
  <div class="info-bar">
    <div class="bib"><div class="bib-lbl">📅 दिनांक</div><div class="bib-val">${formatDate(billDate)}</div></div>
    <div class="bib"><div class="bib-lbl">� काम</div><div class="bib-val">${bill.work_name || '—'}</div></div>
    <div class="bib"><div class="bib-lbl">�📦 Items</div><div class="bib-val">${items.length} प्रकार</div></div>
    <div class="bib"><div class="bib-lbl">💰 एकूण</div><div class="bib-val" style="color:#e65c00!important;">₹${Number(total).toLocaleString('en-IN')}</div></div>
  </div>
  <div class="cust">
    <div class="cust-icon">👤</div>
    <div>
      <div style="font-size:10px;color:#999!important;text-transform:uppercase;letter-spacing:.7px;margin-bottom:2px;">ग्राहक माहिती</div>
      <div class="cust-name">${bill.cust_name||''}</div>
      <div class="cust-det">${bill.cust_phone ? '📱 '+bill.cust_phone : ''} ${bill.cust_phone && bill.cust_addr ? ' | ' : ''} ${bill.cust_addr ? '📍 '+bill.cust_addr : ''}</div>
    </div>
  </div>
  <div class="tbl-section">
    <div class="tbl-title">📋 साहित्य यादी</div>
    <table>
      <thead><tr>
        <th style="width:38px;text-align:center;">अ.क्र.</th>
        <th style="text-align:left;">साहित्याचे नाव</th>
        <th style="text-align:center;">प्रमाण</th>
        <th style="text-align:center;">युनिट</th>
        <th style="text-align:center;">लांबी</th>
        <th style="text-align:center;">वृंदी</th>
        <th style="text-align:right;">दर (₹)</th>
        <th style="text-align:right;">एकूण (₹)</th>
      </tr></thead>
      <tbody>${rows||'<tr><td colspan="8" style="padding:16px;text-align:center;color:#aaa;">कोणतेही साहित्य नाही</td></tr>'}</tbody>
    </table>
  </div>
  <div class="sum-wrap">
    <div class="sum-box">
      <div class="sum-row"><span>साहित्य एकूण</span><span>₹${Number(matSum).toLocaleString('en-IN')}</span></div>
      ${bill.labour > 0 ? `<div class="sum-row"><span>🔧 मजुरी</span><span>₹${Number(bill.labour).toLocaleString('en-IN')}</span></div>` : ''}
      ${bill.discount > 0 ? `<div class="sum-row"><span style="color:#c0392b!important;">🎁 Discount</span><span style="color:#c0392b!important;">−₹${Number(bill.discount).toLocaleString('en-IN')}</span></div>` : ''}
      ${bill.advance > 0 ? `<div class="sum-row"><span style="color:#27ae60!important;">✅ Advance</span><span style="color:#27ae60!important;">−₹${Number(bill.advance).toLocaleString('en-IN')}</span></div>` : ''}
      <div class="sum-total"><span>💰 एकूण रक्कम</span><span>₹${Number(total).toLocaleString('en-IN')}</span></div>
    </div>
  </div>
  <div class="sig">
    <div class="sig-box"><div class="sig-line"></div><div class="sig-lbl">ग्राहक सही</div><div class="sig-nm">${bill.cust_name||''}</div></div>
    <div style="align-self:flex-end;color:#ddd;font-size:18px;">✦</div>
    <div class="sig-box"><div class="sig-line"></div><div class="sig-lbl">अधिकृत सही</div><div class="sig-nm">${s.shop_name||''}</div></div>
  </div>
  <div class="ftr">
    <div class="ftr-thanks">धन्यवाद! आपल्या विश्वासाबद्दल आभारी आहोत 🙏</div>
    <div class="ftr-contact">${s.mobile||''}</div>
  </div>
</div></body></html>`;
}

function openBillPreview(bill) {
  document.getElementById('viewBillActions').innerHTML = '';
  document.getElementById('billIframe').srcdoc = getBillHTML(bill);
  openModal('viewBillModal');
}

function openPrintWindow(bill, delay) {
  const html = getBillHTML(bill);
  const w = window.open('', '_blank');
  if (!w) { showToast('Popup blocked! Browser मध्ये allow करा.', 'error'); return; }
  const s1 = '<scr'+'ipt>', s2 = '<\/scr'+'ipt>';
  const printCSS = '<style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}</style>';
  const js = delay ? 'window.onload=function(){setTimeout(function(){window.print();},800);}' : 'window.onload=function(){window.print();}';
  w.document.write(html.replace('</head>', printCSS + '</head>').replace('</body></html>', s1+js+s2+'</body></html>'));
  w.document.close();
}

function shareBillWhatsApp(bill) {
  const s   = _settings;
  const num = bill.cust_phone || bill.custPhone;
  if (!num) { showToast('मोबाईल नंबर नाही!', 'error'); return; }
  const items = (bill.items||[]).filter(i => i.matName);
  const total = bill.total != null ? bill.total : items.reduce((s,i)=>s+i.qty*i.price,0) + (bill.labour||0) - (bill.discount||0);
  const msg = `🏭 *${s.shop_name}*\n📋 बिल: *${bill.bill_no||bill.billNo||'—'}*\n� काम: *${bill.work_name||''}*\n�👤 *${bill.cust_name||bill.custName}*\n📅 ${formatDate(bill.bill_date||bill.date||'')}\n\n━━━━━━━━━━\n📦 *साहित्य:*\n${items.map((i,n)=>`${n+1}. ${i.matName} — ${i.qty} ${i.unit} × ₹${i.price} = *₹${Number(i.qty*i.price).toLocaleString('en-IN')}*`).join('\n')}\n━━━━━━━━━━\n💰 एकूण: *₹${Number(total).toLocaleString('en-IN')}*${bill.advance>0?`\n✅ Advance: ₹${Number(bill.advance).toLocaleString('en-IN')}`:''}\n\nधन्यवाद 🙏\n_${s.shop_name} | 📱 ${s.mobile}_`;
  window.open('https://wa.me/91' + num + '?text=' + encodeURIComponent(msg), '_blank');
  setTimeout(() => {
    if (confirm('WhatsApp message पाठवला! 🎉\nPDF पण download करायचे का?')) openPrintWindow(bill, true);
  }, 700);
}

// ════════════════════════════════════════
//  MODALS & UTILS
// ════════════════════════════════════════
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Close on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');
});

async function apiFetch(url, method='GET', body=null) {
  const opts = { method, headers:{'Content-Type':'application/json'} };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) { const err = await res.json().catch(()=>({error:'Error'})); showToast(err.error||'Error', 'error'); throw new Error(err.error); }
  return res.json();
}

function esc(s) { return String(s||'').replace(/'/g,"&#39;").replace(/"/g,'&quot;'); }

// Ensure materials are loaded when switching to billing
document.querySelector('.side-btn').parentElement.querySelectorAll('.side-btn').forEach((btn, i) => {
  if (i === 1) { // Billing button
    const orig = btn.onclick;
    btn.addEventListener('click', async () => {
      if (_materials.length === 0) _materials = await apiFetch('/api/materials');
      renderBillRows();
    });
  }
});
