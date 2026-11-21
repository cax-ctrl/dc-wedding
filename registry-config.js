// Public registry settings. Do not add passwords, private guest data, or API keys.
// Enable a method only after its receiving account and server checkout are verified.
window.WEDDING_REGISTRY_CONFIG = {
  apiBase: '',
  paymentApiBase: '',
  enabledPaymentMethods: [], // e.g. ['paypal','stripe'] after verification
  bankAccounts: {},          // keyed by GBP, USD or NGN, verified public receiving details only
  contactEmail: '',
  contactWhatsApp: ''
};
