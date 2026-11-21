'use strict';
/* Wedding registry — no fabricated payments or shared availability. */
(function () {
  const panel = document.getElementById('registry');
  const grid = document.getElementById('registry-grid');
  const dialog = document.getElementById('registry-dialog');
  if (!panel || !grid || !dialog) return;

  const items = [
    {id:'first-home',title:'Our First Home Fund',kind:'fund',group:'home',description:'Help us create a home together, wherever our journey takes us.',image:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=82'},
    {id:'honeymoon',title:'Honeymoon Experiences',kind:'fund',group:'travel',description:'A contribution towards memorable experiences on our honeymoon.',image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=82'},
    {id:'flights',title:'Flights & Future Adventures',kind:'fund',group:'travel',description:'Support the travels and new experiences we will share.',image:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=82'},
    {id:'date-nights',title:'Date Nights for Two',kind:'fund',group:'travel',description:'Help us make time for special evenings and shared memories.',image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=82'},
    {id:'home-decor',title:'Home Furnishings & Décor',kind:'fund',group:'home',description:'Thoughtful pieces to make wherever we settle warm and welcoming.',image:'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=82'},
    {id:'kitchen',title:'Our Kitchen Essentials',kind:'fund',group:'home',description:'Everyday essentials for meals and moments around our table.',image:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=82'},
    {id:'memories',title:'Wedding Memories & Photo Album',kind:'fund',group:'home',description:'A beautiful way to preserve the story of our wedding.',image:'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=82'},
    {id:'luggage',title:'Matching Travel Luggage',kind:'physical',group:'travel',description:'A durable luggage set for the many adventures ahead.',image:'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=800&q=82',amazonQuery:'matching carry on luggage suitcase set'},
    {id:'kindles',title:'Kindle E-Readers for Two',kind:'physical',group:'travel',description:'For shared reading, travel and quiet evenings together.',image:'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=82',amazonQuery:'Kindle Paperwhite e reader'},
    {id:'photo-frame',title:'Digital Photo Frame',kind:'physical',group:'home',description:'A frame for our favourite memories with family and friends.',image:'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=82',amazonQuery:'digital picture frame wifi'},
    {id:'bedding',title:'Premium Bedding Collection',kind:'physical',group:'home',description:'Comfortable, timeless bedding for our future home.',image:'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=82',amazonQuery:'luxury cotton bedding duvet cover set'},
    {id:'coffee',title:'Coffee & Tea Station',kind:'physical',group:'home',description:'A coffee maker and tea essentials for slow mornings together.',image:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=82',amazonQuery:'coffee machine kettle tea station'}
  ];

  const cfg = window.WEDDING_REGISTRY_CONFIG || {};
  const apiBase = String(cfg.apiBase || '').trim().replace(/\/$/, '');
  const paymentBase = String(cfg.paymentApiBase || '').trim().replace(/\/$/, '');
  const demo = new URLSearchParams(location.search).get('registryDemo') === '1';
  const demoKey = 'dc-registry-preview-v1';
  const actualStatus = {};
  let serverAvailable = Boolean(apiBase);
  let currentFilter = 'all';
  let selected = null;
  const statusNode = document.getElementById('registry-status-line');
  const modalTitle = document.getElementById('registry-dialog-title');
  const modalIntro = document.getElementById('registry-dialog-intro');
  const modalBody = document.getElementById('registry-dialog-body');
  const modalMessage = document.getElementById('registry-dialog-message');

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }
  function getDemoStatuses() {
    if (!demo) return {};
    try {return JSON.parse(sessionStorage.getItem(demoKey) || '{}') || {};} catch (_) {return {};}
  }
  function setDemoStatus(id, status) {
    const all = getDemoStatuses();
    if (status === 'available') delete all[id]; else all[id] = status;
    try {sessionStorage.setItem(demoKey, JSON.stringify(all));} catch (_) {}
    render();
  }
  function getStatus(item) {
    if (item.kind === 'fund') return 'fund';
    if (demo) return getDemoStatuses()[item.id] || 'available';
    return actualStatus[item.id] || 'available';
  }
  function amazonUrl(query) {
    return 'https://www.amazon.co.uk/s?k=' + encodeURIComponent(query);
  }
  function visibleItems() {
    return items.filter(function (item) {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'fund') return item.kind === 'fund';
      return item.group === currentFilter;
    });
  }
  function render() {
    const chosen = visibleItems();
    grid.innerHTML = chosen.map(function (item) {
      const status = getStatus(item);
      const label = item.kind === 'fund' ? 'Flexible gift' : status === 'reserved' ? 'Reserved' : status === 'purchased' ? 'Purchased' : 'Gift idea';
      const hasAmazon = Boolean(item.amazonQuery);
      const amazon = hasAmazon ? '<a class="registry-action-secondary" href="' + amazonUrl(item.amazonQuery) + '" target="_blank" rel="noopener noreferrer" aria-label="Browse Amazon UK for ' + escapeHTML(item.title) + '">Browse Amazon ↗</a>' : '';
      const reserveButton = hasAmazon ? '<button type="button" class="registry-action-secondary" data-action="reserve" data-id="' + item.id + '"' + (status !== 'available' ? ' disabled' : '') + '>' + (status === 'reserved' ? 'Reserved' : status === 'purchased' ? 'Purchased' : 'Reserve') + '</button>' : '';
      return '<article class="registry-card">' +
        '<div class="registry-image-wrap"><img loading="lazy" decoding="async" src="' + item.image + '" alt="" onerror="this.style.opacity=0" />' +
        '<span class="registry-tag ' + (status === 'reserved' || status === 'purchased' ? 'is-' + status : '') + '">' + label + '</span></div>' +
        '<div class="registry-card-content"><h3>' + escapeHTML(item.title) + '</h3>' +
        '<p class="registry-card-description">' + escapeHTML(item.description) + '</p>' +
        '<p class="registry-card-subline">' + (hasAmazon ? 'Give an amount or purchase later' : 'Give any amount you wish') + '</p>' +
        '<div class="registry-card-actions"><button type="button" class="registry-action-primary" data-action="contribute" data-id="' + item.id + '">Contribute</button>' +
        (hasAmazon ? amazon + reserveButton : '') +
        '</div></div></article>';
    }).join('');
    statusNode.textContent = chosen.length + ' thoughtful ' + (chosen.length === 1 ? 'gift' : 'gifts') + ' · Contributions are entirely optional.';
    panel.querySelectorAll('.registry-filter').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter));
    });
  }
  function notify(message, error) {
    modalMessage.textContent = message || '';
    modalMessage.style.color = error ? '#935345' : '#526a4a';
  }
  function showModal(item, mode) {
    selected = item || null;
    notify('');
    modalTitle.textContent = item ? item.title : 'Other ways to give';
    modalIntro.textContent = item ? item.description : 'A gift from the heart, in whatever way works for you.';
    if (mode === 'reserve') renderReservation(item);
    else if (mode === 'contribute') renderContribution(item);
    else if (mode === 'other') renderOther();
    if (!dialog.open) dialog.showModal();
  }
  function buildInput(label, type, id, attributes) {
    return '<label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '" ' + (attributes || '') + '>';
  }
  function renderContribution(item) {
    modalBody.innerHTML =
      '<p class="registry-dialog-note">Choose a contribution towards ' + escapeHTML(item ? item.title : 'our new chapter') + '. No amount is expected or required.</p>' +
      '<form id="registry-contribution-form">' +
      '<label for="registry-currency">Currency</label><select id="registry-currency"><option value="GBP">GBP — British pounds</option><option value="USD">USD — US dollars</option><option value="NGN">NGN — Nigerian naira</option></select>' +
      buildInput('Gift amount', 'number', 'registry-amount', 'min="1" step="0.01" inputmode="decimal" placeholder="Enter an amount" required') +
      '<div class="registry-dialog-actions"><button type="submit" class="primary"' + (!paymentBase ? ' disabled' : '') + '>Continue to secure payment</button></div>' +
      '</form>' +
      (item && item.amazonQuery ? '<p class="registry-dialog-note">Prefer to purchase the item? <a href="' + amazonUrl(item.amazonQuery) + '" target="_blank" rel="noopener noreferrer"><u>Browse Amazon UK ↗</u></a>. Delivery is not yet arranged.</p>' : '') +
      (!paymentBase ? '<p class="registry-dialog-note">Secure online contributions are not yet enabled. No payment can be taken here.</p>' : '');
    const form = document.getElementById('registry-contribution-form');
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!paymentBase) return;
      const amount = Number(document.getElementById('registry-amount').value);
      const currency = document.getElementById('registry-currency').value;
      if (!Number.isFinite(amount) || amount <= 0 || !['GBP','USD','NGN'].includes(currency)) {notify('Enter a valid amount and currency.', true);return;}
      const button = form.querySelector('button[type=submit]'); button.disabled = true;
      notify('Opening secure checkout…');
      try {
        const response = await fetch(paymentBase + '/api/registry/checkout', {
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({itemId:item ? item.id : 'open-gift',currency:currency,amount:amount})
        });
        const data = await response.json();
        if (!response.ok || !data.checkoutUrl || !/^https:\/\//.test(data.checkoutUrl)) throw new Error('Secure checkout is currently unavailable.');
        location.assign(data.checkoutUrl);
      } catch (error) {notify(error.message || 'Could not open checkout. Please try again later.', true);button.disabled=false;}
    });
  }
  function renderReservation(item) {
    if (!item || item.kind !== 'physical') return;
    const status = getStatus(item);
    if (status !== 'available') {
      modalBody.innerHTML = '<p class="registry-dialog-note">This item has already been ' + (status === 'purchased' ? 'purchased' : 'reserved') + '. You can still give a monetary contribution towards another gift.</p>';
      return;
    }
    const enabled = demo || (apiBase && serverAvailable);
    modalBody.innerHTML = '<p class="registry-dialog-note">Reserve this item only if you intend to purchase it. We have not chosen a delivery country, so please do not send a parcel yet.</p>' +
      (enabled ? '<form id="registry-reserve-form">' +
      (demo ? '<div class="registry-demo-alert">Preview only — this reservation is not shared with other guests.</div>' :
        buildInput('Your name', 'text', 'registry-guest-name', 'autocomplete="name" maxlength="100" required') +
        buildInput('Email address', 'email', 'registry-guest-email', 'autocomplete="email" maxlength="160" required')) +
      '<label><input type="checkbox" id="registry-intent" required style="width:auto;min-height:0;margin-right:8px">I intend to purchase this gift.</label>' +
      '<div class="registry-dialog-actions"><button type="submit" class="primary">Confirm reservation</button></div></form>' :
      '<p class="registry-dialog-note">Reservations will become available once the secure guest registry is connected.</p>') +
      '<div class="registry-dialog-actions"><a class="secondary" href="' + amazonUrl(item.amazonQuery) + '" target="_blank" rel="noopener noreferrer">Browse Amazon UK ↗</a></div>';
    const form = document.getElementById('registry-reserve-form');
    if (!form) return;
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const button = form.querySelector('button[type=submit]');
      button.disabled = true;
      if (demo) {
        setDemoStatus(item.id, 'reserved');
        renderDemoManager(item);
        notify('Reserved in this browser preview only. No guest reservation was made.');
        return;
      }
      try {
        const guestName = document.getElementById('registry-guest-name').value.trim();
        const guestEmail = document.getElementById('registry-guest-email').value.trim();
        if (!guestName || !guestEmail) throw new Error('Please enter your name and email.');
        const response = await fetch(apiBase + '/api/registry/reserve', {
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({itemId:item.id,name:guestName,email:guestEmail})
        });
        const data = await response.json().catch(function () {return {};});
        if (!response.ok) throw new Error(data.error || 'This gift may have been reserved by another guest.');
        if (data.reservationToken) {
          try {sessionStorage.setItem('dc-reservation-' + item.id, data.reservationToken);} catch (_) {}
        }
        actualStatus[item.id] = 'reserved';
        render();
        modalBody.innerHTML = '<p class="registry-dialog-note">Thank you. Your reservation has been recorded. Please check your email for any confirmation details from our organisers.</p>';
        notify('Gift reserved.');
      } catch (error) {
        notify(error.message || 'Unable to reserve. Please try again later.', true);
        button.disabled = false;
        refreshFromServer();
      }
    });
  }
  function renderDemoManager(item) {
    modalBody.innerHTML = '<div class="registry-demo-alert">Preview only — no shared reservation or payment has been made.</div>' +
      '<p class="registry-dialog-note">Test the reservation and purchase statuses for this gift.</p>' +
      '<div class="registry-dialog-actions"><button class="primary" type="button" id="registry-demo-purchase">Mark purchased</button>' +
      '<button class="secondary" type="button" id="registry-demo-release">Release gift</button></div>';
    document.getElementById('registry-demo-purchase').addEventListener('click', function () {
      setDemoStatus(item.id, 'purchased'); notify('Marked as purchased in this preview.');renderDemoManager(item);
    });
    document.getElementById('registry-demo-release').addEventListener('click', function () {
      setDemoStatus(item.id, 'available');notify('Made available in this preview.');renderReservation(item);
    });
  }
  function renderOther() {
    modalBody.innerHTML = '<p class="registry-dialog-note">We will make bank transfer and online gift options available here after the receiving accounts have been verified. Please do not send money to an account shared in an unofficial message.</p>' +
      '<div class="registry-dialog-actions"><button class="primary" type="button" id="registry-other-contribute"' + (!paymentBase ? ' disabled' : '') + '>Send a gift of your choice</button></div>';
    if (paymentBase) document.getElementById('registry-other-contribute').addEventListener('click', function () {renderContribution(null);});
  }
  async function refreshFromServer() {
    if (!apiBase || demo) return;
    try {
      const response = await fetch(apiBase + '/api/registry', {headers:{'Accept':'application/json'},cache:'no-store'});
      if (!response.ok) throw new Error('Could not load registry availability.');
      const data = await response.json();
      if (!data || !Array.isArray(data.items)) throw new Error('Invalid registry response.');
      data.items.forEach(function (entry) {
        if (entry && typeof entry.id === 'string' && ['available','reserved','purchased'].includes(entry.status)) {
          actualStatus[entry.id] = entry.status;
        }
      });
      serverAvailable = true;
      render();
    } catch (_) {
      serverAvailable = false;
      render();
      statusNode.textContent = 'Live reservation availability is temporarily unavailable. Please check back later.';
    }
  }

  grid.addEventListener('click', function (event) {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const item = items.find(function (gift) {return gift.id === action.dataset.id;});
    if (!item) return;
    if (action.dataset.action === 'reserve' && getStatus(item) !== 'available') return;
    showModal(item, action.dataset.action);
  });
  panel.querySelectorAll('.registry-filter').forEach(function (button) {
    button.addEventListener('click', function () {currentFilter = button.dataset.filter;render();});
  });
  document.getElementById('registry-other-gift').addEventListener('click', function () {showModal(null, 'contribute');});
  document.getElementById('registry-bank-transfer').addEventListener('click', function () {showModal(null, 'other');});
  document.getElementById('registry-online-payment').addEventListener('click', function () {showModal(null, 'other');});
  document.getElementById('registry-dialog-close').addEventListener('click', function () {dialog.close();});
  dialog.addEventListener('click', function (event) {if (event.target === dialog) dialog.close();});

  if (demo) {
    const notice = document.createElement('div');
    notice.className = 'registry-demo-alert';
    notice.textContent = 'Registry preview — reservation changes are visible only in this browser. No payments are processed.';
    document.getElementById('registry-grid').before(notice);
  }
  render();
  if (apiBase && !demo) {
    refreshFromServer();
    setInterval(function () {if (!document.hidden) refreshFromServer();}, 30000);
  }
})();