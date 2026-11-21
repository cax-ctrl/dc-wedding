'use strict';
/* Requests and manual-payment notices are not proof of funds.
 * "Gift Recorded" appears only when a trusted organiser marks a notice verified.
 */
(function(){
  const config=window.WEDDING_REGISTRY_CONFIG || {};
  const givingBase=String(config.givingApiBase||'').trim().replace(/\/$/,'');
  const ready=/^https:\/\/[^/]+/.test(givingBase);
  const sponsorDialog=document.getElementById('sponsor-dialog');
  const giftDialog=document.getElementById('gift-notice-dialog');
  if(!sponsorDialog || !giftDialog) return;
  const sponsorForm=document.getElementById('sponsor-form');
  const sponsorMessage=document.getElementById('sponsor-message');
  const sponsorResult=document.getElementById('sponsor-result');
  const sponsorPreview=document.getElementById('sponsor-logo-preview');
  const logoInput=document.getElementById('sponsor-logo');
  const sponsorImg=document.getElementById('sponsor-logo-image');
  const sponsorCurrency=document.getElementById('sponsor-currency');
  const sponsorInfo=document.getElementById('sponsor-payment-info');
  const sponsorSubmit=document.getElementById('sponsor-submit');
  const sponsorStatusNote=document.getElementById('sponsor-status-note');
  const giftForm=document.getElementById('gift-notice-form');
  const giftMessage=document.getElementById('gift-notice-message');
  const giftResult=document.getElementById('gift-notice-result');
  const statusButton=document.getElementById('gift-status-refresh');
  const giftSubmit=document.getElementById('gift-notice-submit');
  let previewUrl=null;
  let lastGift=null;
  let tracking=null;
  const accounts=config.bankAccounts||{};

  function esc(x) {
    return String(x).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function showModal(dialog){
    if(!dialog.open) dialog.showModal();
  }
  function resetPreview(){
    if(previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl=null;
    sponsorImg.removeAttribute('src');
    sponsorPreview.hidden=true;
  }
  document.getElementById('sponsor-open')?.addEventListener('click',function(){
    sponsorForm.hidden=false;
    sponsorResult.hidden=true;
    sponsorMessage.textContent='';
    showModal(sponsorDialog);
  });
  for(const dlg of [sponsorDialog,giftDialog]){
    dlg.querySelectorAll('[data-close-giving]').forEach(btn=>btn.addEventListener('click',()=>dlg.close()));
    dlg.addEventListener('click',event=>{if(event.target===dlg)dlg.close();});
  }
  document.getElementById('sponsor-remove-logo').addEventListener('click',function(){
    logoInput.value='';
    resetPreview();
  });
  logoInput.addEventListener('change',function(){
    resetPreview();
    const file=logoInput.files?.[0];
    if(!file)return;
    if(file.size>2*1024*1024 || !['image/png','image/jpeg','image/webp'].includes(file.type)){
      logoInput.value='';
      sponsorMessage.textContent='Choose a PNG, JPG or WebP image under 2 MB.';
      return;
    }
    previewUrl=URL.createObjectURL(file);
    sponsorImg.src=previewUrl;
    sponsorPreview.hidden=false;
    sponsorMessage.textContent='';
  });
  sponsorDialog.addEventListener('close',resetPreview);

  function rowsMarkup(rows){
    return rows.filter(pair=>Array.isArray(pair)&&pair.length===2).map(pair=>
      '<div><dt>'+esc(pair[0])+'</dt><dd>'+esc(pair[1])+'</dd></div>'
    ).join('');
  }
  function renderSponsorPayment(){
    const currency=sponsorCurrency.value;
    const method=sponsorForm.querySelector('input[name="sponsorMethod"]:checked')?.value||'bank';
    const account=accounts[currency];
    const isNaira=currency==='NGN';
    const quoteNote='<p class="giving-warning">The package costs ₦10,000,000. The '+esc(currency)+' equivalent must be agreed with the organisers before payment. No exchange rate or foreign-currency amount has been quoted.</p>';
    if(method==='bank' && isNaira && account?.accountName && Array.isArray(account.domestic)){
      const pairs=[['Account name',account.accountName],...account.domestic];
      sponsorInfo.innerHTML=
        '<p class="giving-payment-title">Bank transfer · ₦10,000,000</p>'+
        '<dl class="giving-bank-list">'+rowsMarkup(pairs)+'</dl>'+
        '<p class="giving-help">Use your sponsor name as the payment reference. A transfer must be verified before sponsorship is confirmed.</p>'+
        '<button type="button" id="sponsor-copy-bank" class="giving-copy">Copy bank details</button>';
      document.getElementById('sponsor-copy-bank').addEventListener('click',async function(){
        const txt=pairs.map(row=>row[0]+': '+row[1]).join('\n')+
          '\nAmount: NGN 10,000,000\nPurpose: Wedding sponsorship\nSponsor: '+document.getElementById('sponsor-name').value.trim();
        try{await navigator.clipboard.writeText(txt);sponsorMessage.textContent='Bank details copied. Payment is not yet recorded.';}
        catch(_){sponsorMessage.textContent='Please select and copy the visible details.';}
      });
    } else if(method==='bank'){
      sponsorInfo.innerHTML=quoteNote+
        '<p class="giving-help">The '+esc(currency)+' bank account can be shared with you after the amount and payment arrangements have been confirmed. Please submit a sponsorship request first.</p>';
    } else if(method==='alipay'){
      sponsorInfo.innerHTML=quoteNote+
        '<p class="giving-help">Alipay can be discussed for CNY settlement once the equivalent is agreed. The wedding-gift QR is not presented as a confirmed corporate sponsorship receiver.</p>';
    } else {
      const label=method==='paypal'?'PayPal':'Stripe';
      sponsorInfo.innerHTML=(isNaira
        ? '<p class="giving-help">'+label+' checkout is not yet connected for this ₦10,000,000 package.</p>'
        : quoteNote+'<p class="giving-help">'+label+' checkout is not yet connected.</p>');
    }
  }
  sponsorCurrency.addEventListener('change',renderSponsorPayment);
  sponsorForm.querySelectorAll('input[name="sponsorMethod"]').forEach(input=>input.addEventListener('change',renderSponsorPayment));
  sponsorStatusNote.textContent=ready
    ? 'Submit the request for review. Approval and payment confirmation are separate.'
    : 'The private sponsorship register is not yet connected. You can copy an enquiry and send it to the organisers.';
  sponsorSubmit.textContent=ready?'Submit sponsorship request':'Copy sponsorship enquiry';
  renderSponsorPayment();

  sponsorForm.addEventListener('submit',async function(event){
    event.preventDefault();
    if(!sponsorForm.reportValidity())return;
    const name=document.getElementById('sponsor-name').value.trim();
    const email=document.getElementById('sponsor-email').value.trim();
    const logo=logoInput.files?.[0];
    const method=sponsorForm.querySelector('input[name="sponsorMethod"]:checked')?.value||'bank';
    if(name.length<2 || email.length<5) {sponsorMessage.textContent='Please enter your name and a valid contact email.';return;}
    if(logo && (logo.size>2*1024*1024 || !['image/png','image/jpeg','image/webp'].includes(logo.type))){
      sponsorMessage.textContent='Please use a PNG, JPG or WebP image under 2 MB.';return;
    }
    if(!ready){
      const summary='Deborah & Caleb — Sponsorship enquiry\nSponsor: '+name+
        '\nEmail: '+email+'\nPackage: NGN 10,000,000\nPreferred currency: '+sponsorCurrency.value+
        '\nPreferred method: '+method+'\nLogo: '+(logo?'Selected; please attach separately':'Not supplied')+
        '\nStatus: Enquiry only; not a payment or confirmed sponsorship';
      try{
        await navigator.clipboard.writeText(summary);
        sponsorMessage.textContent='Enquiry copied. Please send it to the organisers. It has not been submitted or recorded online.'+
          (logo?' Attach your logo separately.':'');
      } catch(_){
        sponsorMessage.textContent='Online submissions are not connected yet. Please contact the organisers directly.';
      }
      return;
    }
    sponsorSubmit.disabled=true;
    sponsorMessage.textContent='Submitting request…';
    try{
      const form=new FormData();
      form.set('sponsorName',name);
      form.set('email',email);
      form.set('packageAmountNGN','10000000');
      form.set('preferredCurrency',sponsorCurrency.value);
      form.set('preferredMethod',method);
      form.set('consent','yes');
      if(logo) form.set('logo',logo,logo.name);
      const response=await fetch(givingBase+'/api/sponsors/request',{method:'POST',body:form,cache:'no-store'});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok || payload.accepted!==true)throw Error(payload.error||'The request could not be submitted.');
      sponsorForm.hidden=true;
      sponsorResult.hidden=false;
      document.getElementById('sponsor-result-reference').textContent='Reference: '+String(payload.requestId||'');
      sponsorResult.focus();
      sponsorMessage.textContent='';
    }catch(error){sponsorMessage.textContent=error.message||'Unable to submit. Please try again.';}
    finally{sponsorSubmit.disabled=false;}
  });

  document.addEventListener('dc:gift-transfer-notice',function(event){
    const gift=event.detail||{};
    if(!gift.giftName||!gift.currency||!gift.method||!(Number(gift.amount)>0))return;
    lastGift={
      giftId:String(gift.giftId||'custom-gift'),giftName:String(gift.giftName).slice(0,120),
      amount:Number(gift.amount),currency:String(gift.currency),method:String(gift.method)
    };
    giftForm.reset();
    giftForm.hidden=false;
    giftResult.hidden=true;
    giftMessage.textContent='';
    tracking=null;
    document.getElementById('gift-notice-selection').textContent=
      lastGift.giftName+' · '+lastGift.amount.toLocaleString()+' '+lastGift.currency+' · '+(lastGift.method==='alipay'?'Alipay':'Bank transfer');
    giftSubmit.textContent=ready?'Send payment notice':'Copy payment notice';
    showModal(giftDialog);
  });
  giftForm.addEventListener('submit',async function(event){
    event.preventDefault();
    if(!lastGift || !giftForm.reportValidity())return;
    const sender=document.getElementById('gift-sender-name').value.trim();
    const email=document.getElementById('gift-sender-contact').value.trim();
    const ref=document.getElementById('gift-transfer-reference').value.trim();
    if(sender.length<2 || email.length<5){giftMessage.textContent='Enter your name and email.';return;}
    if(!ready){
      const summary='Deborah & Caleb — Payment notice (unverified)\nGift: '+lastGift.giftName+
        '\nAmount: '+lastGift.amount+' '+lastGift.currency+'\nMethod: '+lastGift.method+
        '\nFrom: '+sender+'\nContact: '+email+'\nTransfer reference: '+(ref||'Not supplied')+
        '\nNOT a payment receipt';
      try{await navigator.clipboard.writeText(summary);
        giftMessage.textContent='Notice copied. Please send it to the organisers. Nothing has been submitted or verified on this website.';
      }catch(_){giftMessage.textContent='Online notices are not connected yet. Contact the organisers after making your transfer.';}
      return;
    }
    giftSubmit.disabled=true;
    giftMessage.textContent='Sending payment notice…';
    try{
      const response=await fetch(givingBase+'/api/gifts/notice',{
        method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
        body:JSON.stringify({...lastGift,senderName:sender,contactEmail:email,transferReference:ref})
      });
      const payload=await response.json().catch(()=>({}));
      if(!response.ok || payload.accepted!==true)throw Error(payload.error||'Could not send the notice.');
      tracking={id:payload.noticeId,token:payload.accessToken};
      giftForm.hidden=true;
      giftResult.hidden=false;
      document.getElementById('gift-notice-result-heading').textContent='Gift notice received';
      document.getElementById('gift-notice-result-description').textContent=
        'Thank you. We have recorded your payment notice, not confirmed receipt of funds. We will mark the gift as recorded only after verification.';
      document.getElementById('gift-notice-result-reference').textContent='Notice reference: '+payload.noticeId;
      statusButton.hidden=false;
      giftResult.focus();
      giftMessage.textContent='';
    }catch(error){giftMessage.textContent=error.message||'Unable to send the notice.';}
    finally{giftSubmit.disabled=false;}
  });
  statusButton.addEventListener('click',async function(){
    if(!tracking || !ready)return;
    statusButton.disabled=true;
    try{
      const r=await fetch(givingBase+'/api/gifts/status',{
        method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
        body:JSON.stringify({id:tracking.id,token:tracking.token})
      });
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw Error('Status could not be checked.');
      const header=document.getElementById('gift-notice-result-heading');
      const desc=document.getElementById('gift-notice-result-description');
      if(data.status==='verified'){
        header.textContent='Gift Recorded';
        desc.textContent='The organisers have verified receipt of your gift. Thank you for celebrating with us.';
        statusButton.hidden=true;
      }else if(data.status==='rejected'){
        header.textContent='Unable to verify gift';
        desc.textContent='We could not match the reported payment. Please contact the organisers with your transfer reference.';
        statusButton.hidden=true;
      }else{
        header.textContent='Verification pending';
        desc.textContent='Your notice is recorded, but receipt of funds has not yet been confirmed.';
      }
    }catch(_){document.getElementById('gift-notice-result-description').textContent='Could not check the current status. Please try again.';}
    finally{statusButton.disabled=false;}
  });
})();