// Public configuration only. Never add private guest data, passwords or API credentials.
// Activate payment providers only after beneficiary details and webhooks are verified.
window.WEDDING_REGISTRY_CONFIG = {
  apiBase: '',
  paymentApiBase: '',
  enabledPaymentMethods: [], // 'paypal' and/or 'stripe', after secure checkout integration
  bankAccounts: {}, // verified public receiving details keyed by USD, GBP, NGN or CNY
  alipayTransfer: null, // after verification: { accountName: '', accountId: '' }
  contactEmail: '',
  contactWhatsApp: ''
};
