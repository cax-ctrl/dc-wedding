// Public display details for gifts. Do not place login credentials, API secrets
// or private guest data here. Transfer recipients were supplied by the organisers;
// all visitors should verify the beneficiary shown by their bank before sending.
window.WEDDING_REGISTRY_CONFIG = {
  apiBase: '',
  paymentApiBase: '',
  givingApiBase: '', // Private payment notices and sponsorship requests, when deployed
  enabledPaymentMethods: [], // Online PayPal/Stripe checkout remains inactive.
  bankAccounts: {
    EUR: {
      accountName: 'Hubx Limited',
      domesticLabel: 'From SEPA (domestic)',
      domestic: [['IBAN','BE57 9059 5062 2235']],
      internationalLabel: 'From outside SEPA (SWIFT)',
      international: [['IBAN','BE57 9059 5062 2235'],['SWIFT/BIC','TRWIBEB1XXX']]
    },
    GBP: {
      accountName: 'Hubx Limited',
      domesticLabel: 'From the UK (domestic)',
      domestic: [['Account number','55890690'],['Sort code','60-84-64']],
      internationalLabel: 'From outside the UK (SWIFT)',
      international: [['IBAN','GB16 TRWI 6084 6455 8906 90'],['SWIFT/BIC','TRWIGB2LXXX']]
    },
    USD: {
      accountName: 'Hubx Limited',
      domesticLabel: 'From the US (domestic)',
      domestic: [['Account type','Checking'],['Routing number (wire and ACH)','101019628'],['Account number','217052942259']],
      internationalLabel: 'From outside the US (SWIFT)',
      international: [['Account number','217052942259'],['SWIFT/BIC','TRWIUS35XXX']]
    },
    NGN: {
      accountName: 'HubX Limited-DC Event',
      domesticLabel: 'Nigerian bank transfer',
      domestic: [['Bank','Kuda MFB'],['Account number','3004635414']],
      international: []
    }
  },
  alipayTransfer: {
    phone: '17706907896',
    qrPath: './assets/dc-alipay-qr.svg',
    qrUrl: 'https://qr.alipay.com/fkx16160op2eqnlfh8nyb90',
    recipientLabel: 'Personal Alipay account supplied by the couple'
  },
  contactEmail: '',
  contactWhatsApp: ''
};
