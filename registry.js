'use strict';
/* Deborah & Caleb — a single, straightforward contribution journey. */
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
    {id:'home-decor',title:'Home Furnishings & Décor',kind:'fund',group:'home',description:'Thoughtful pieces to make wherever we settle warm and welcoming.',image:'https://images.unsplash.com/photo-1767963758785-b9def36c13e3?auto=format&fit=crop&w=800&q=82'},
    {id:'kitchen',title:'Our Kitchen Essentials',kind:'fund',group:'home',description:'Everyday essentials for meals and moments around our table.',image:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=82'},
    {id:'memories',title:'Wedding Memories & Photo Album',kind:'fund',group:'home',description:'A beautiful way to preserve the story of our wedding.',image:'https://images.unsplash.com/photo-1677658288237-2fff291a34f0?auto=format&fit=crop&w=800&q=82'},
    {id:'luggage',title:'Matching Travel Luggage',kind:'physical',group:'travel',description:'A durable luggage set for the many adventures ahead.',image:'https://images.unsplash.com/photo-1740470077240-e0ff892c21a5?auto=format&fit=crop&w=800&q=82',amazonQuery:'matching carry on luggage suitcase set'},
    {id:'kindles',title:'Kindle E-Readers for Two',kind:'physical',group:'travel',description:'For shared reading, travel and quiet evenings together.',image:'https://images.unsplash.com/photo-1543443807-7f734bdb8c82?auto=format&fit=crop&w=800&q=82',amazonQuery:'Kindle Paperwhite e reader'},
    {id:'photo-frame',title:'Digital Photo Frame',kind:'physical',group:'home',description:'A frame for our favourite memories with family and friends.',image:'https://images.unsplash.com/photo-1765210866964-5e89d82a8eb9?auto=format&fit=crop&w=800&q=82',amazonQuery:'digital picture frame wifi'},
    {id:'bedding',title:'Premium Bedding Collection',kind:'physical',group:'home',description:'Comfortable, timeless bedding for our future home.',image:'https://images.unsplash.com/photo-1601276174812-63280a55656e?auto=format&fit=crop&w=800&q=82',amazonQuery:'luxury cotton bedding duvet cover set'},
    {id:'coffee',title:'Coffee & Tea Station',kind:'physical',group:'home',description:'A coffee maker and tea essentials for slow mornings together.',image:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=82',amazonQuery:'coffee machine kettle tea station'}
  ];

  const cfg = window.WEDDING_REGISTRY_CONFIG || {};
  const apiBase = String(cfg.apiBase || '').trim().replace(/\/$/, '');
  const paymentBase = String(cfg.paymentApiBase || '').trim().replace(/\/$/, '');
  const enabledPayments = Array.isArray(cfg.enabledPaymentMethods) ? cfg.enabledPaymentMethods : [];
  const bankAccounts = cfg.bankAccounts && typeof cfg.bankAccounts === 'object' ? cfg.bankAccounts : {};
  const currentStatus = Object.create(null);
  let activeFilter = 'all';
  const statusLine = document.getElementById('registry-status-line');
  const title = document.getElementById('registry-dialog-title');
  const intro = document.getElementById('registry-dialog-intro');
  const body = document.getElementById('registry-dialog-body');
  const message = document.getElementById('registry-dialog-message');
  const symbols = {USD:'$',GBP:'£',NGN:'₦'};

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }
  function amazonUrl(query) {
    return 'https://www.amazon.co.uk/s?k=' + encodeURIComponent(query);
  }
  function badge(item) {
    const status = currentStatus[item.id];
    if (item.kind !== 'physical' || !['reserved','purchased'].includes(status)) return '';
    return '<span class="registry-tag is-' + status + '">' + (status === 'reserved' ? 'Reserved' : 'Purchased') + '</span>';
  }
  function visibleItems() {
    return items.filter(function (item) {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'fund') return item.kind === 'fund';
      return item.group === activeFilter;
    });
  }
  function renderCards() {
    const selected = visibleItems();
    grid.innerHTML = selected.map(function (item) {
      return '<article class="registry-card">' +
        '<div class="registry-image-wrap"><img loading="lazy" decoding="async" src="' + item.image + '" alt="" onerror="this.style.opacity=0">' + badge(item) + '</div>' +
        '<div class="registry-card-content"><h3>' + escapeHTML(item.title) + '</h3>' +
        '<p class="registry-card-description">' + escapeHTML(item.description) + '</p>' +
        '<button class="registry-action-primary" type="button" data-id="' + item.id + '">Contribute</button>' +
        '</div></article>';
    }).join('');
    statusLine.textContent = selected.length + ' gift' + (selected.length===1 ? '' : 's');
    panel.querySelectorAll('.registry-filter').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter));
    });
  }
  function notify(text, error) {
    message.textContent = text || '';
    message.style.color = error ? '#8b4e41' : '#4c6549';
  }
  function openModal(item, mode) {
    notify('');
    title.textContent = item ? item.title : mode === 'contact' ? 'Delivery address' : 'A gift of your choice';
    intro.textContent = item ? item.description : mode === 'contact'
      ? 'A note about sending a physical gift.' : 'Choose the amount and payment method that suit you.';
    if (mode === 'contact') renderContact();
    else if (item && item.amazonQuery) renderItemChoices(item);
    else renderTransfer(item, 'bank');
    if (!dialog.open) dialog.showModal();
  }
  function renderContact() {
    title.textContent = 'Delivery address';
    intro.textContent = 'A note about sending a physical gift.';
    const email = String(cfg.contactEmail || '').trim();
    const whatsapp = String(cfg.contactWhatsApp || '').replace(/[^\d]/g,'');
    body.innerHTML =
      '<p class="registry-dialog-note">We have not confirmed a delivery country or address. Before ordering a physical gift, please contact us to arrange delivery.</p>' +
      (email ? '<p class="registry-dialog-actions"><a class="primary" href="mailto:' + encodeURIComponent(email) + '?subject=Deborah%20%26%20Caleb%20%E2%80%94%20Gift%20delivery">Email us</a></p>' : '') +
      (whatsapp ? '<p class="registry-dialog-actions"><a class="secondary" href="https://wa.me/' + whatsapp + '?text=Hello%2C%20I%20would%20like%20to%20arrange%20a%20wedding%20gift%20delivery." target="_blank" rel="noopener noreferrer">Contact on WhatsApp</a></p>' : '') +
      (!email && !whatsapp ? '<p class="registry-dialog-note">Please contact the person who shared your wedding invitation to request our delivery details.</p>' : '');
  }
  function renderItemChoices(item) {
    const status = currentStatus[item.id];
    const itemUnavailable = ['reserved','purchased'].includes(status);
    body.innerHTML =
      '<p class="registry-step-label">Choose how you would like to give</p>' +
      '<div class="registry-choice-row">' +
      (itemUnavailable ?
        '<span class="registry-choice-muted">This item is ' + status + '. Please consider contributing its equivalent value instead.</span>' :
        '<a class="registry-choice" href="' + amazonUrl(item.amazonQuery) + '" target="_blank" rel="noopener noreferrer"><strong>Browse Amazon</strong><span>Explore suggested items ↗</span></a>') +
      '<button type="button" id="registry-choose-transfer" class="registry-choice"><strong>Transfer</strong><span>Give an equivalent value</span></button>' +
      '</div>' +
      '<p class="registry-dialog-note">Amazon opens in a new tab. Please contact us for the delivery address before placing an order.</p>' +
      '<button type="button" id="registry-choice-contact" class="registry-inline-link">Contact us for delivery address</button>';
    document.getElementById('registry-choose-transfer').addEventListener('click',function () {renderTransfer(item,'bank');});
    document.getElementById('registry-choice-contact').addEventListener('click',renderContact);
  }
  function getConfiguredBank(currency) {
    const account = bankAccounts[currency];
    if (!account || !account.accountName || !account.bankName || !account.accountNumber) return null;
    return account;
  }
  function renderTransfer(item, initialMethod) {
    body.innerHTML =
      '<form id="registry-contribution-form">' +
      '<div class="registry-form-heading"><span class="registry-step-label">Gift amount</span>' +
      (item && item.amazonQuery ? '<button class="registry-inline-link" type="button" id="registry-back-to-choices">← Gift options</button>' : '') +
      '</div>' +
      '<div class="registry-amount-row">' +
      '<label class="registry-field registry-currency-field" for="registry-currency"><span>Currency</span><select id="registry-currency" name="currency"><option value="USD">$ USD</option><option value="GBP">£ GBP</option><option value="NGN">₦ NGN</option></select></label>' +
      '<label class="registry-field registry-value-field" for="registry-amount"><span>Amount</span><span class="registry-amount-input"><span id="registry-amount-symbol" aria-hidden="true">$</span><input type="number" id="registry-amount" name="amount" min="0.01" step="0.01" inputmode="decimal" autocomplete="off" placeholder="0.00" required></span></label>' +
      '</div>' +
      '<fieldset class="registry-methods"><legend class="registry-step-label">Payment option</legend>' +
      '<label><input type="radio" name="payment-method" value="bank"><span>Bank transfer</span></label>' +
      '<label><input type="radio" name="payment-method" value="paypal"><span>PayPal</span></label>' +
      '<label><input type="radio" name="payment-method" value="stripe"><span>Stripe</span></label>' +
      '</fieldset>' +
      '<div id="registry-method-information" class="registry-method-information" aria-live="polite"></div>' +
      '<div class="registry-dialog-actions" id="registry-checkout-actions"></div>' +
      '</form>';
    const form = document.getElementById('registry-contribution-form');
    const currency = document.getElementById('registry-currency');
    const amount = document.getElementById('registry-amount');
    const methodInfo = document.getElementById('registry-method-information');
    const actions = document.getElementById('registry-checkout-actions');
    const currentMethod = form.querySelector('input[value="' + initialMethod + '"]');
    if (currentMethod) currentMethod.checked = true;
    if (item && item.amazonQuery) {
      document.getElementById('registry-back-to-choices').addEventListener('click',function(){renderItemChoices(item);});
    }
    function updateMethod() {
      const selectedCurrency = currency.value;
      const chosenMethod = form.querySelector('input[name="payment-method"]:checked')?.value || 'bank';
      document.getElementById('registry-amount-symbol').textContent = symbols[selectedCurrency];
      const acct = getConfiguredBank(selectedCurrency);
      if (chosenMethod === 'bank') {
        if (acct) {
          const rows = [['Account name', acct.accountName],['Bank',acct.bankName],['Account number',acct.accountNumber],
            ['Sort code',acct.sortCode],['IBAN',acct.iban],['SWIFT/BIC',acct.swift]]
            .filter(function (row){return typeof row[1] === 'string' && row[1].trim();});
          methodInfo.innerHTML = '<dl class="registry-bank-details">' +
            rows.map(function(row){return '<div><dt>' + escapeHTML(row[0]) + '</dt><dd>' + escapeHTML(row[1]) + '</dd></div>';}).join('') + '</dl>' +
            '<p class="registry-dialog-note">Use your name as the transfer reference and contact us to confirm your gift.</p>';
          actions.innerHTML = '<button type="button" class="primary" id="registry-copy-bank">Copy bank details</button>';
          document.getElementById('registry-copy-bank').addEventListener('click',async function () {
            const giftAmount = Number(amount.value);
            const details = rows.map(function(row){return row[0]+': '+row[1];}).join('\n') +
              (Number.isFinite(giftAmount) && giftAmount > 0 ? '\nGift amount: '+symbols[selectedCurrency]+giftAmount+' '+selectedCurrency : '') +
              '\nGift: ' + (item ? item.title : 'A gift of your choice');
            try {
              await navigator.clipboard.writeText(details);
              notify('Bank details copied.');
            } catch (_) { notify('Select and copy the displayed bank details.',true); }
          });
        } else {
          methodInfo.innerHTML = '<p class="registry-dialog-note">Bank details for ' + selectedCurrency + ' will be provided once confirmed. Please contact us before transferring.</p>';
          actions.innerHTML = '<button class="secondary" type="button" id="registry-bank-contact">Contact us</button>';
          document.getElementById('registry-bank-contact').addEventListener('click',renderContact);
        }
      } else {
        const ready = Boolean(paymentBase && enabledPayments.includes(chosenMethod));
        const label = chosenMethod === 'paypal' ? 'PayPal' : 'Stripe';
        methodInfo.innerHTML = '<p class="registry-dialog-note">' +
          (ready ? 'You will be directed to ' + label + ' to complete a secure payment.' :
            label + ' payments are not yet available. You can choose another payment option.') + '</p>';
        actions.innerHTML = '<button type="submit" class="primary"' + (!ready ? ' disabled' : '') +
          '>Continue with ' + label + '</button>';
      }
    }
    currency.addEventListener('change',updateMethod);
    form.querySelectorAll('input[name="payment-method"]').forEach(function(control) {control.addEventListener('change',updateMethod);});
    form.addEventListener('submit',async function(event) {
      event.preventDefault();
      const method = form.querySelector('input[name="payment-method"]:checked')?.value;
      if (!['paypal','stripe'].includes(method) || !paymentBase || !enabledPayments.includes(method)) return;
      const value = Number(amount.value);
      if (!Number.isFinite(value) || value <= 0) {notify('Enter a valid gift amount.',true);amount.focus();return;}
      const button = actions.querySelector('button[type=submit]');
      if (button) button.disabled = true;
      notify('Opening secure checkout…');
      try {
        const response = await fetch(paymentBase + '/api/registry/checkout',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({itemId:item?.id||'open-gift',currency:currency.value,amount:value,paymentMethod:method})
        });
        const result = await response.json();
        const url = new URL(result.checkoutUrl);
        if (!response.ok || url.protocol !== 'https:') throw new Error('Secure checkout is unavailable.');
        location.assign(url.href);
      } catch (_) {
        notify('Secure checkout is unavailable. Please choose another option.',true);
        if (button) button.disabled = false;
      }
    });
    updateMethod();
  }
  async function refreshStatuses() {
    if (!apiBase) return;
    try {
      const response = await fetch(apiBase+'/api/registry',{headers:{'Accept':'application/json'},cache:'no-store'});
      if (!response.ok) return;
      const payload = await response.json();
      if (!Array.isArray(payload.items)) return;
      payload.items.forEach(function(item) {
        if (item && typeof item.id === 'string' && ['available','reserved','purchased'].includes(item.status))
          currentStatus[item.id] = item.status;
      });
      renderCards();
    } catch (_) { /* Registry still displays without availability metadata. */ }
  }

  grid.addEventListener('click',function(event) {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    const item = items.find(function(value){return value.id === button.dataset.id;});
    if (item) openModal(item,'item');
  });
  panel.querySelectorAll('.registry-filter').forEach(function(button) {
    button.addEventListener('click',function(){activeFilter=button.dataset.filter;renderCards();});
  });
  document.getElementById('registry-other-gift').addEventListener('click',function(){openModal(null,'gift');});
  document.getElementById('registry-bank-transfer').addEventListener('click',function(){openModal(null,'bank');});
  document.getElementById('registry-contact').addEventListener('click',function(){openModal(null,'contact');});
  document.getElementById('registry-contact-footer').addEventListener('click',function(){openModal(null,'contact');});
  document.getElementById('registry-dialog-close').addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('click',function(event){if(event.target === dialog) dialog.close();});

  renderCards();
  if (apiBase) {refreshStatuses();setInterval(function(){if(!document.hidden) refreshStatuses();},30000);}
})();