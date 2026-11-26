'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  matchCycle,
  contactGate,
  pairGate,
  buildConfig,
  makeNormalizer,
  truthy,
  toNumber,
} = require('../scripts/match_rules.js');

// --- fixtures (synthetic — no real people) ---------------------------------

const CONFIG_ROWS = [
  { key: 'industry_aliases', value: '{"health tech":"healthtech","ai/ml":"ai","fin-tech":"fintech"}' },
  { key: 'max_deals_per_digest', value: '2' },
];

function investor(overrides) {
  return Object.assign(
    {
      contact_id: 'C-0001',
      email: 'alice@example.com',
      first_name: 'Alice',
      last_name: 'Angel',
      role_type: 'investor',
      geography: 'dc, mid-atlantic',
      investing_stage_pref: 'pre_seed, seed',
      industries: 'fintech, healthtech',
      founder_type_interests: '',
      min_check: '',
      max_check: '',
      do_not_contact: '',
      unsubscribed_deals: '',
    },
    overrides
  );
}

function deal(overrides) {
  return Object.assign(
    {
      deal_id: 'D-0001',
      company_name: 'Acme Ledger',
      stage: 'seed',
      raise_amount: '1500000',
      industries: 'FinTech',
      geography: 'DC',
      founder_type_tags: '',
      include_in_next_send: 'TRUE',
    },
    overrides
  );
}

function run(contacts, deals, logRows = [], configRows = CONFIG_ROWS) {
  return matchCycle(contacts, deals, logRows, configRows);
}

// --- helpers ----------------------------------------------------------------

test('truthy handles sheet-style values', () => {
  for (const v of ['TRUE', 'true', 'Yes', '1', 'x', true]) assert.equal(truthy(v), true, String(v));
  for (const v of ['', 'FALSE', 'no', '0', null, undefined]) assert.equal(truthy(v), false, String(v));
});

test('toNumber strips currency formatting', () => {
  assert.equal(toNumber('$1,500,000'), 1500000);
  assert.equal(toNumber(' 250000 '), 250000);
  assert.equal(toNumber(''), null);
  assert.equal(toNumber('n/a'), null);
});

// --- contact gates ----------------------------------------------------------

test('non-investors, missing email, opt-outs are excluded with reasons', () => {
  const deals = [deal()];
  const result = run(
    [
      investor({ contact_id: 'C-1', role_type: 'Founder' }),
      investor({ contact_id: 'C-2', email: '  ' }),
      investor({ contact_id: 'C-3', do_not_contact: 'TRUE' }),
      investor({ contact_id: 'C-4', unsubscribed_deals: 'x' }),
      investor({ contact_id: 'C-5' }),
    ],
    deals
  );
  assert.equal(result.recipients.length, 1);
  assert.equal(result.recipients[0].contact_id, 'C-5');
  assert.equal(result.excluded.not_investor, 1);
  assert.equal(result.excluded.no_email, 1);
  assert.equal(result.excluded.do_not_contact, 1);
  assert.equal(result.excluded.unsubscribed, 1);
});

// --- pair gates -------------------------------------------------------------

test('stage gate: pref list must contain deal stage; blank or "any" passes', () => {
  const d = [deal({ stage: 'series_a' })];
  assert.equal(run([investor()], d).recipients.length, 0); // pre_seed/seed investor
  assert.equal(run([investor({ investing_stage_pref: 'any' })], d).recipients.length, 1);
  assert.equal(run([investor({ investing_stage_pref: '' })], d).recipients.length, 1);
  assert.equal(run([investor({ investing_stage_pref: 'seed, Series_A' })], d).recipients.length, 1);
});

test('industry gate: needs overlap; blank investor list is a generalist', () => {
  const d = [deal({ industries: 'climate' })];
  assert.equal(run([investor()], d).recipients.length, 0);
  assert.equal(run([investor({ industries: '' })], d).recipients.length, 1);
});

test('industry aliases normalize both sides', () => {
  const d = [deal({ industries: 'Health Tech' })]; // alias -> healthtech
  const result = run([investor({ industries: 'HealthTech' })], d);
  assert.equal(result.recipients.length, 1);
  assert.match(result.recipients[0].deals[0].match_reasons, /healthtech/);
});

test('geography gate: overlap required only when both sides set it', () => {
  assert.equal(run([investor({ geography: 'nyc' })], [deal({ geography: 'DC' })]).recipients.length, 0);
  assert.equal(run([investor({ geography: '' })], [deal({ geography: 'DC' })]).recipients.length, 1);
  assert.equal(run([investor({ geography: 'nyc' })], [deal({ geography: '' })]).recipients.length, 1);
  const off = [{ key: 'enforce_geography', value: 'FALSE' }, ...CONFIG_ROWS];
  assert.equal(run([investor({ geography: 'nyc' })], [deal({ geography: 'DC' })], [], off).recipients.length, 1);
});

test('founder-type gate only fires when both sides are tagged', () => {
  const tagged = deal({ founder_type_tags: 'technical, repeat' });
  assert.equal(run([investor({ founder_type_interests: 'first_time' })], [tagged]).recipients.length, 0);
  assert.equal(run([investor({ founder_type_interests: 'repeat' })], [tagged]).recipients.length, 1);
  assert.equal(run([investor({ founder_type_interests: '' })], [tagged]).recipients.length, 1);
  assert.equal(run([investor({ founder_type_interests: 'first_time' })], [deal()]).recipients.length, 1);
});

test('raise band: deal raise must fall inside investor min/max when set', () => {
  const d = [deal({ raise_amount: '$1,500,000' })];
  assert.equal(run([investor({ min_check: '2000000' })], d).recipients.length, 0);
  assert.equal(run([investor({ max_check: '1000000' })], d).recipients.length, 0);
  assert.equal(run([investor({ min_check: '500000', max_check: '3000000' })], d).recipients.length, 1);
  assert.equal(run([investor()], [deal({ raise_amount: '' })]).recipients.length, 1); // no raise = no gate
});

test('already-sent exclusion reads SENT and APPROVED log rows, ignores others', () => {
  const log = [
    { deal_id: 'D-0001', contact_id: 'C-0001', status: 'SENT' },
    { deal_id: 'D-0002', contact_id: 'C-0001', status: 'REJECTED' },
  ];
  const deals = [deal(), deal({ deal_id: 'D-0002', company_name: 'Beta Health', industries: 'healthtech' })];
  const result = run([investor()], deals, log);
  assert.equal(result.recipients.length, 1);
  assert.deepEqual(result.recipients[0].deals.map(x => x.deal_id), ['D-0002']);
  assert.equal(result.excluded.already_sent, 1);
});

// --- cycle behavior ---------------------------------------------------------

test('only flagged deals participate', () => {
  const deals = [deal(), deal({ deal_id: 'D-0002', include_in_next_send: '' })];
  const result = run([investor()], deals);
  assert.equal(result.summary.flagged_deals, 1);
  assert.equal(result.recipients[0].deals.length, 1);
});

test('digest is capped at max_deals_per_digest', () => {
  const deals = ['D-1', 'D-2', 'D-3'].map(id => deal({ deal_id: id }));
  const result = run([investor()], deals); // cap of 2 in CONFIG_ROWS
  assert.equal(result.recipients[0].deals.length, 2);
  assert.equal(result.excluded.over_digest_cap, 1);
});

test('summary counts recipients and pairs', () => {
  const deals = [deal(), deal({ deal_id: 'D-0002', industries: 'healthtech' })];
  const result = run([investor(), investor({ contact_id: 'C-0002', email: 'bob@example.com', industries: 'climate' })], deals);
  assert.equal(result.summary.recipients, 1);
  assert.equal(result.summary.pairs, 2);
});

test('defaults survive an empty or malformed Config tab', () => {
  const config = buildConfig([{ key: 'industry_aliases', value: '{not json' }]);
  const normalize = makeNormalizer(config);
  assert.equal(normalize('FinTech'), 'fintech'); // still cleans, just no aliasing
  assert.equal(run([investor()], [deal()], [], []).recipients.length, 1);
});
