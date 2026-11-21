-- Private financial notices and sponsorship requests.
-- The public website must never write a verified or paid state.
CREATE TABLE IF NOT EXISTS gift_notices (
  id TEXT PRIMARY KEY,
  access_hash TEXT NOT NULL,
  gift_id TEXT NOT NULL,
  gift_name TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  currency TEXT NOT NULL CHECK(currency IN ('NGN','GBP','USD','EUR','CNY')),
  amount TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('bank','alipay')),
  transfer_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sponsor_requests (
  id TEXT PRIMARY KEY,
  sponsor_name TEXT NOT NULL,
  email TEXT NOT NULL,
  package_amount_ngn INTEGER NOT NULL CHECK(package_amount_ngn=10000000),
  preferred_currency TEXT NOT NULL CHECK(preferred_currency IN ('NGN','GBP','USD','EUR','CNY')),
  preferred_method TEXT NOT NULL CHECK(preferred_method IN ('bank','paypal','stripe','alipay')),
  transfer_reference TEXT,
  logo_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','paid')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gift_notice_status ON gift_notices(status,created_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_request_status ON sponsor_requests(status,created_at);
