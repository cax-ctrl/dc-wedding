'use strict';
/* Wedding registry: one contribution action per gift, with no invented payment destinations. */
(function () {
  const panel = document.getElementById('registry');
  const grid = document.getElementById('registry-grid');
  const moreButton = document.getElementById('registry-show-more');
  const dialog = document.getElementById('registry-dialog');
  if (!panel || !grid || !dialog || !moreButton) return;
  const items = [
    {id:'first-home',title:'Our First Home Fund',kind:'fund',group:'home',description:'Help us create a home together, wherever our journey takes us.',image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',cta:'Contribute'},
    {id:'honeymoon',title:'Honeymoon Experiences',kind:'fund',group:'travel',description:'A contribution towards memorable experiences on our honeymoon.',image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=82',cta:'Contribute'},
    {id:'flights',title:'Flights & Future Adventures',kind:'fund',group:'travel',description:'Support the travels and new experiences we will share.',image:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=82',cta:'Contribute'},
    {id:'date-nights',title:'Date Nights for Two',kind:'fund',group:'travel',description:'Help us make time for special evenings and shared memories.',image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=82',cta:'Contribute'},
    {id:'home-decor',title:'Home Furnishings & Décor',kind:'fund',group:'home',description:'Thoughtful pieces to make wherever we settle warm and welcoming.',image:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',referenceUrl:'https://sourceaxisglobal.com/pricing',referenceLabel:'Explore SourceAxis',referenceNote:'SourceAxis publishes sourcing assessment fees and quotes project services separately; this is not a retail product catalogue.',cta:'Contribute'},
    {id:'kitchen',title:'Our Kitchen Essentials',kind:'physical',group:'home',description:'Everyday essentials for meals and moments around our table.',image:'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=82',referenceUrl:'https://sourceaxisglobal.com/pricing',referenceLabel:'Explore SourceAxis',referenceNote:'Explore sourcing assessment and pricing, rather than an immediate product purchase.',cta:'Gift this'},
    {id:'memories',title:'Wedding Memories & Photo Album',kind:'physical',group:'home',description:'A beautiful way to preserve the story of our wedding.',image:'https://images.unsplash.com/photo-1677658288237-2fff291a34f0?auto=format&fit=crop&w=800&q=82',amazonQuery:'wedding photo album personalised linen keepsake book',cta:'Gift this'},
    {id:'luggage',title:'Matching Travel Luggage',kind:'physical',group:'travel',description:'A durable luggage set for the many adventures ahead.',image:'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=900&q=80',amazonQuery:'matching carry on luggage suitcase set',cta:'Gift this'},
    {id:'cars',title:'A Car for Our Next Chapter',kind:'fund',group:'travel',description:'A contribution towards a vehicle for the road ahead.',image:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=82',referenceUrl:'https://jovicoworld.com/cars',referenceLabel:'Browse Cars',referenceNote:'Explore available cars and pre-orders with Jovico; prices and delivery arrangements depend on the chosen vehicle.',cta:'Contribute'},
    {id:'photo-frame',title:'Digital Photo Frame',kind:'physical',group:'home',description:'A frame for our favourite memories with family and friends.',image:'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',amazonQuery:'digital picture frame wifi',cta:'Gift this'},
    {id:'bedding',title:'Premium Bedding Collection',kind:'physical',group:'home',description:'Comfortable, timeless bedding for our future home.',image:'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',amazonQuery:'luxury cotton bedding duvet cover set',cta:'Gift this'},
    {id:'coffee',title:'Coffee & Tea Station',kind:'physical',group:'home',description:'A coffee maker and tea essentials for slow mornings together.',image:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=82',referenceUrl:'https://sourceaxisglobal.com/pricing',referenceLabel:'Explore SourceAxis',referenceNote:'SourceAxis provides sourcing assessment and scoped quotations, not a ready-to-buy appliance listing.',cta:'Gift this'},
    {id:'cpbiomed',title:'Reproductive Health Equipment',kind:'fund',group:'community',description:'A contribution towards reproductive-health equipment and supplies.',image:'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=82',referenceUrl:'https://cpbiomed.com/products/',referenceLabel:'Explore CP Biomed',referenceNote:'CP Biomed lists specialist assisted-reproduction equipment and laboratory supplies.',cta:'Contribute'},
    {id:'hubx',title:'Education & Career Support',kind:'fund',group:'community',description:'Support opportunities for learning and professional development.',image:'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',referenceUrl:'https://hubxconsulting.com/',referenceLabel:'Explore HubX',referenceNote:'Explore learning, career and professional-development pathways offered through HubX.',cta:'Contribute'},
    {id:'totalcare',title:'Maternal & Newborn Care',kind:'fund',group:'community',description:'A proposed donation towards healthcare for pregnant women and newborns.',image:'./assets/totalcare-transparent.webp',logo:true,donation:true,cta:'Contribute'}
  ];
  const cfg = window.WEDDING_REGISTRY_CONFIG || {};
  const apiBase = String(cfg.apiBase || '').trim().replace(/\/$/,'');
  const paymentBase = String(cfg.paymentApiBase || '').trim().replace(/\/$/,'');
  const enabledPayments = Array.isArray(cfg.enabledPaymentMethods) ? cfg.enabledPaymentMethods : [];
  const bankAccounts = cfg.bankAccounts && typeof cfg.bankAccounts === 'object' ? cfg.bankAccounts : {};
  const status = Object.create(null);
  let activeFilter = 'all';
  let expanded = false;
  const mobileLayout = window.matchMedia('(max-width:600px)');
  const statusLine = document.getElementById('registry-status-line');
  const modalTitle = document.getElementById('registry-dialog-title');
  const modalIntro = document.getElementById('registry-dialog-intro');
  const modalBody = document.getElementById('registry-dialog-body');
  const modalMessage = document.getElementById('registry-dialog-message');
  const symbol = {USD:'$',GBP:'£',NGN:'₦',EUR:'€',CNY:'¥'};

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }
  function reference(item) {
    if (item.referenceUrl) return {url:item.referenceUrl,label:item.referenceLabel || 'Explore options',note:item.referenceNote || ''};
    if (item.amazonQuery) return {url:'https://www.amazon.co.uk/s?k='+encodeURIComponent(item.amazonQuery),label:'Browse Amazon',note:'Browse suggested products. Please confirm the delivery address before ordering.'};
    return null;
  }
  function render() {
    const filtered = items.filter(function(item) {
      return activeFilter === 'all' || (activeFilter === 'fund' && item.kind === 'fund') || item.group === activeFilter;
    });
    const initialCount = mobileLayout.matches ? 4 : 6;
    const displayed = expanded ? filtered : filtered.slice(0,initialCount);
    grid.innerHTML = displayed.map(function(item) {
      const stage = status[item.id];
      const badge = item.kind === 'physical' && ['reserved','purchased'].includes(stage)
        ? '<span class="registry-tag is-'+stage+'">'+(stage==='reserved'?'Reserved':'Purchased')+'</span>' : '';
      return '<article class="registry-card">'+
        '<div class="registry-image-wrap'+(item.logo?' registry-logo-wrap':'')+'">'+
        '<img src="'+item.image+'" loading="lazy" decoding="async" alt="'+(item.logo?'TotalCare Medical logo':'')+'" onerror="this.style.opacity=0">'+badge+'</div>'+
        '<div class="registry-card-content"><h3>'+escapeHTML(item.title)+'</h3>'+
        '<p class="registry-card-description">'+escapeHTML(item.description)+'</p>'+
        '<button class="registry-action-primary" type="button" data-id="'+item.id+'">'+escapeHTML(item.cta || 'Contribute')+'</button>'+
        '</div></article>';
    }).join('');
    statusLine.textContent = 'Showing '+displayed.length+' of '+filtered.length+' gifts';
    const moreAvailable = filtered.length > initialCount;
    moreButton.hidden = !moreAvailable;
    moreButton.setAttribute('aria-expanded',String(expanded));
    moreButton.textContent = expanded ? 'Show less ↑' : 'See more gifts ('+(filtered.length-initialCount)+') ↓';
    panel.querySelectorAll('.registry-filter').forEach(function(button) {
      button.setAttribute('aria-pressed', String(button.dataset.filter===activeFilter));
      if(button.dataset.filter==='all')button.textContent='All gifts ('+items.length+')';
      if(button.dataset.filter==='fund')button.textContent='Funds & Causes ('+items.filter(function(item){return item.kind==='fund';}).length+')';
    });
  }
  function notify(text,error) {
    modalMessage.textContent = text || '';
    modalMessage.style.color = error ? '#985246' : '#526b50';
  }
  function contact(reason) {
    const payment = reason === 'payment';
    modalTitle.textContent = payment ? 'Payment details' : 'Delivery address';
    modalIntro.textContent = payment
      ? 'Please request verified payment details before transferring.'
      : 'Please contact us before arranging delivery of a physical gift.';
    const email = String(cfg.contactEmail || '').trim();
    const whatsapp = String(cfg.contactWhatsApp || '').replace(/[^\d]/g,'');
    modalBody.innerHTML =
      '<p class="registry-dialog-note">'+(payment
        ? 'Receiving details for this payment method have not yet been confirmed.'
        : 'Our delivery country and address have not yet been confirmed.')+'</p>'+
      (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '<div class="registry-dialog-actions"><a class="primary" href="mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(payment?'Wedding gift payment enquiry':'Wedding gift delivery')+'">Email us</a></div>' : '')+
      (whatsapp ? '<div class="registry-dialog-actions"><a class="secondary" href="https://wa.me/'+whatsapp+'" target="_blank" rel="noopener noreferrer">WhatsApp us</a></div>' : '')+
      (!email && !whatsapp ? '<p class="registry-dialog-note">Please contact the person who shared your invitation for '+(payment?'payment':'delivery')+' details.</p>' : '');
  }
  function options(item) {
    const ref = reference(item);
    if (!ref) {transfer(item,false);return;}
    modalTitle.textContent = item.title;
    modalIntro.textContent = item.description;
    const stage = status[item.id];
    const unavailable = item.kind==='physical' && ['reserved','purchased'].includes(stage);
    modalBody.innerHTML =
      '<p class="registry-step-label">Choose how you would like to give</p>'+
      '<div class="registry-choice-row">'+
      (unavailable ? '<span class="registry-choice-muted">This item is '+stage+'. You can still contribute its equivalent value.</span>' :
        '<a class="registry-choice" href="'+escapeHTML(ref.url)+'" target="_blank" rel="noopener noreferrer"><strong>'+escapeHTML(ref.label)+'</strong><span>Opens in a new tab ↗</span></a>')+
      '<button class="registry-choice" type="button" id="registry-transfer-choice"><strong>Transfer</strong><span>Contribute an amount</span></button></div>'+
      '<p class="registry-dialog-note">'+escapeHTML(ref.note)+'</p>'+
      (item.kind==='physical'?'<button type="button" class="registry-inline-link" id="registry-delivery-choice">Contact us for delivery address</button>':'');
    document.getElementById('registry-transfer-choice').addEventListener('click',function(){transfer(item,false);});
    const delivery=document.getElementById('registry-delivery-choice');
    if(delivery) delivery.addEventListener('click',contact);
  }
  function open(item,mode) {
    notify('');
    modalTitle.textContent = item ? item.title : mode==='contact'?'Delivery address':'Custom gift';
    modalIntro.textContent = item?item.description:mode==='contact'?'How to arrange delivery':'Tell us what your gift is for.';
    if(mode==='contact') contact();
    else if(item && reference(item)) options(item);
    else transfer(item,mode==='custom');
    if(!dialog.open) dialog.showModal();
  }
  function transfer(item,isCustom) {
    const ref=item?reference(item):null;
    modalTitle.textContent=item?item.title:'Custom gift';
    modalIntro.textContent=item?item.description:'Tell us what your gift is for and choose an amount.';
    modalBody.innerHTML =
      '<form id="registry-contribution-form">'+
      (isCustom?'<label class="registry-field registry-gift-name-field" for="registry-gift-name"><span>Gift name or purpose</span><input type="text" id="registry-gift-name" name="giftName" maxlength="120" placeholder="What is your gift for?" autocomplete="off" required></label>':'')+
      '<div class="registry-form-heading"><span class="registry-step-label">Gift amount</span>'+
      (ref?'<button class="registry-inline-link" type="button" id="registry-back-to-choices">← Gift options</button>':'')+'</div>'+
      '<div class="registry-amount-row">'+
      '<label class="registry-field registry-currency-field" for="registry-currency"><span>Currency</span><select id="registry-currency" name="currency"><option value="USD">$ USD</option><option value="GBP">£ GBP</option><option value="NGN">₦ NGN</option><option value="EUR">€ EUR</option><option value="CNY">¥ CNY</option></select></label>'+
      '<label class="registry-field registry-value-field" for="registry-amount"><span>Amount</span><span class="registry-amount-input"><span id="registry-amount-symbol" aria-hidden="true">$</span><input id="registry-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" inputmode="decimal" autocomplete="off" required></span></label>'+
      '</div>'+
      '<fieldset class="registry-methods"><legend class="registry-step-label">Payment option</legend>'+
      '<label><input type="radio" name="payment-method" value="bank" checked><span>Bank transfer</span></label>'+
      '<label><input type="radio" name="payment-method" value="paypal"><span>PayPal</span></label>'+
      '<label><input type="radio" name="payment-method" value="stripe"><span>Stripe</span></label>'+
      '<label><input type="radio" name="payment-method" value="alipay"><span>Alipay transfer</span></label>'+
      '</fieldset>'+
      '<div id="registry-method-information" class="registry-method-information" aria-live="polite"></div>'+
      '<div class="registry-dialog-actions" id="registry-checkout-actions"></div>'+
      '</form>';
    const form=document.getElementById('registry-contribution-form');
    const currency=document.getElementById('registry-currency');
    const amount=document.getElementById('registry-amount');
    const info=document.getElementById('registry-method-information');
    const actions=document.getElementById('registry-checkout-actions');
    const customName=isCustom?document.getElementById('registry-gift-name'):null;
    function giftPurpose() {return customName?customName.value.trim():item?item.title:'Custom gift';}
    function validate() {
      if(customName && (!giftPurpose() || giftPurpose().length>120)) {notify('Enter a gift name or purpose.',true);customName.focus();return false;}
      const value=Number(amount.value);
      if(!Number.isFinite(value) || value<=0) {notify('Enter a valid amount.',true);amount.focus();return false;}
      return true;
    }
    function allowPaymentNotice() {
      const button=document.createElement('button');
      button.type='button';
      button.className='registry-notice-link';
      button.textContent='I have sent a transfer →';
      button.addEventListener('click',function(){
        if(!validate())return;
        document.dispatchEvent(new CustomEvent('dc:gift-transfer-notice',{
          detail:{
            giftId:item?item.id:'custom-gift',
            giftName:giftPurpose(),
            amount:Number(amount.value),
            currency:currency.value,
            method:form.querySelector('input[name="payment-method"]:checked')?.value||'bank'
          }
        }));
        dialog.close();
      });
      actions.appendChild(button);
    }
    function installCopy(id,textFactory,confirmation) {
      const button=document.getElementById(id);
      if(!button)return;
      button.addEventListener('click',async function(){
        if(!validate())return;
        try{await navigator.clipboard.writeText(textFactory());notify(confirmation);}
        catch(_){notify('Please copy the displayed details manually.',true);}
      });
    }
    if(ref) document.getElementById('registry-back-to-choices').addEventListener('click',function(){options(item);});
    function refreshMethod() {
      const code=currency.value;
      const method=form.querySelector('input[name="payment-method"]:checked').value;
      document.getElementById('registry-amount-symbol').textContent=symbol[code];
      if(method==='bank') {
        const acct=bankAccounts[code];
        if(acct && acct.accountName && Array.isArray(acct.domestic) && acct.domestic.length) {
          const rows=[['Account name',acct.accountName]].concat(acct.domestic.map(function(row){return [(acct.domesticLabel||'Domestic')+' · '+row[0],row[1]];}),Array.isArray(acct.international)?acct.international.map(function(row){return [(acct.internationalLabel||'International')+' · '+row[0],row[1]];}):[]).filter(function(row){return typeof row[1]==='string' && row[1].trim();});
          info.innerHTML='<dl class="registry-bank-details">'+rows.map(function(row){return '<div><dt>'+escapeHTML(row[0])+'</dt><dd>'+escapeHTML(row[1])+'</dd></div>';}).join('')+'</dl><p class="registry-dialog-note">Choose the relevant domestic or international instructions and verify the recipient with your bank. Transfers are not automatically confirmed.</p>';
          actions.innerHTML='<button class="primary" id="registry-copy-bank" type="button">Copy bank details</button>';
          installCopy('registry-copy-bank',function(){return rows.map(function(row){return row[0]+': '+row[1];}).join('\n')+'\nAmount: '+symbol[code]+Number(amount.value)+' '+code+'\nGift: '+giftPurpose();},'Bank details copied.');
          allowPaymentNotice();
        } else {
          info.innerHTML='<p class="registry-dialog-note">No bank details are shown for '+code+'. For CNY, please choose Alipay transfer.</p>';
          actions.innerHTML='<button class="secondary" id="registry-bank-contact" type="button">Contact us</button>';
          document.getElementById('registry-bank-contact').addEventListener('click',function(){contact('payment');});
        }
      } else if(method==='alipay') {
        const account=cfg.alipayTransfer;
        const ready=account && /^\d{8,15}$/.test(String(account.phone||'')) && account.qrPath==='./assets/dc-alipay-qr.svg';
        if(code!=='CNY') {
          info.innerHTML='<p class="registry-dialog-note">Alipay transfers are in Chinese yuan. Select ¥ CNY to continue.</p>';
          actions.innerHTML='';
        } else if(ready) {
          info.innerHTML='<div class="registry-alipay-panel"><img class="registry-alipay-qr" src="./assets/dc-alipay-qr.svg" width="208" height="208" alt="Alipay payment QR code"><div class="registry-alipay-description"><strong>Scan with Alipay</strong><span>'+escapeHTML(account.recipientLabel||'Recipient provided by the couple')+'</span><span>Or add us on Alipay: <strong>'+escapeHTML(account.phone)+'</strong></span><a href="'+escapeHTML(account.qrUrl)+'" target="_blank" rel="noopener noreferrer">Open payment link ↗</a></div></div><p class="registry-dialog-note">Enter the selected amount and confirm the recipient shown by Alipay before sending. This personal QR is not a HubX Limited business bank account. Transfers are not automatically confirmed.</p>';
          actions.innerHTML='<button class="primary" id="registry-copy-alipay" type="button">Copy Alipay details</button>';
          installCopy('registry-copy-alipay',function(){return 'Alipay number: '+account.phone+'\nPayment link: '+account.qrUrl+'\nAmount: ¥'+Number(amount.value)+' CNY\nGift: '+giftPurpose();},'Alipay details copied.');
          allowPaymentNotice();
        } else {
          info.innerHTML='<p class="registry-dialog-note">Alipay receiving details are not yet available. Please contact us before transferring.</p>';
          actions.innerHTML='<button class="secondary" id="registry-alipay-contact" type="button">Contact us</button>';
          document.getElementById('registry-alipay-contact').addEventListener('click',function(){contact('payment');});
        }
      } else {
        const ready=Boolean(paymentBase && enabledPayments.includes(method));
        const name=method==='paypal'?'PayPal':'Stripe';
        info.innerHTML='<p class="registry-dialog-note">'+(ready?'Continue to secure '+name+' checkout.':name+' payment is not yet enabled. Please choose another method.')+'</p>';
        actions.innerHTML='<button class="primary" type="submit"'+(ready?'':' disabled')+'>Continue with '+name+'</button>';
      }
    }
    currency.addEventListener('change',function(){if(currency.value==='CNY' && form.querySelector('input[name="payment-method"]:checked')?.value==='bank') form.querySelector('input[value="alipay"]').checked=true; else if(currency.value!=='CNY' && form.querySelector('input[name="payment-method"]:checked')?.value==='alipay') form.querySelector('input[value="bank"]').checked=true; refreshMethod();});
    form.querySelectorAll('input[name="payment-method"]').forEach(function(radio){radio.addEventListener('change',refreshMethod);});
    form.addEventListener('submit',async function(event){
      event.preventDefault();
      const method=form.querySelector('input[name="payment-method"]:checked').value;
      if(!['paypal','stripe'].includes(method)||!paymentBase||!enabledPayments.includes(method)||!validate())return;
      const button=actions.querySelector('button[type="submit"]');
      if(button)button.disabled=true;
      notify('Opening secure checkout…');
      try{
        const response=await fetch(paymentBase+'/api/registry/checkout',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({itemId:item?item.id:'custom-gift',giftName:giftPurpose(),amount:Number(amount.value),currency:currency.value,paymentMethod:method})});
        if(!response.ok)throw Error('Payment unavailable.');
        const data=await response.json();
        const destination=new URL(data.checkoutUrl);
        if(destination.protocol!=='https:')throw Error('Invalid checkout URL.');
        location.assign(destination.href);
      }catch(_){notify('Secure checkout is not available. Please select another option.',true);if(button)button.disabled=false;}
    });
    refreshMethod();
  }
  async function refreshStatuses(){
    if(!apiBase)return;
    try{
      const response=await fetch(apiBase+'/api/registry',{headers:{Accept:'application/json'},cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      if(!Array.isArray(data.items))return;
      data.items.forEach(function(row){if(row && typeof row.id==='string' && ['reserved','purchased','available'].includes(row.status))status[row.id]=row.status;});
      render();
    }catch(_){}
  }
  grid.addEventListener('click',function(event){
    const button=event.target.closest('button[data-id]');
    if(!button)return;
    const item=items.find(function(row){return row.id===button.dataset.id;});
    if(item)open(item,'item');
  });
  panel.querySelectorAll('.registry-filter').forEach(function(button){
    button.addEventListener('click',function(){
      activeFilter=button.dataset.filter;
      expanded=false;
      render();
    });
  });
  moreButton.addEventListener('click',function(){
    const collapse = expanded;
    expanded = !expanded;
    render();
    if (collapse) {
      const y=panel.scrollTop + grid.getBoundingClientRect().top-panel.getBoundingClientRect().top - 16;
      panel.scrollTo({top:Math.max(0,y),behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    }
  });
  mobileLayout.addEventListener('change',function(){if(!expanded)render();});
  document.getElementById('registry-custom-gift').addEventListener('click',function(){open(null,'custom');});
  document.getElementById('registry-contact').addEventListener('click',function(){open(null,'contact');});
  document.getElementById('registry-contact-footer').addEventListener('click',function(){open(null,'contact');});
  document.getElementById('registry-dialog-close').addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('click',function(event){if(event.target===dialog)dialog.close();});
  render();
  if(apiBase){refreshStatuses();setInterval(function(){if(!document.hidden)refreshStatuses();},30000);}
})();