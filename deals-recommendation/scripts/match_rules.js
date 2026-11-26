'use strict';

/**
 * District Angels — deal/investor matching (conditional rules, no scoring).
 *
 * Runs in two places, unchanged:
 *   1. An n8n Code node — paste this whole file, then the driver snippet at the
 *      bottom of this file (see N8N DRIVER) as the last lines of the node.
 *   2. Plain Node.js for tests: `node --test` from the repo root.
 *
 * Zero dependencies. All values arrive as strings from Google Sheets.
 */

// Config keys the Config tab may override. Values are strings, as in the Sheet.
const DEFAULT_CONFIG = {
  enforce_geography: 'TRUE',
  enforce_founder_type: 'TRUE',
  enforce_raise_band: 'TRUE',
  // JSON object in one Config cell, e.g. {"health tech":"healthtech","ai/ml":"ai"}
  industry_aliases: '{}',
  max_deals_per_digest: '5',
};

// Log statuses that count as "this contact already got this deal".
const ALREADY_SENT_STATUSES = ['sent', 'approved'];

function truthy(value) {
  if (typeof value === 'boolean') return value;
  const s = String(value == null ? '' : value).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'x' || s === 'checked';
}

function toNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  const n = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// "FinTech " / "fin-tech" / "fin_tech" all become "fin tech" before aliasing.
function cleanTerm(value) {
  return String(value == null ? '' : value)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
}

function buildConfig(configRows) {
  const config = Object.assign({}, DEFAULT_CONFIG);
  for (const row of configRows || []) {
    const key = cleanTerm(row.key).replace(/ /g, '_');
    if (key) config[key] = row.value == null ? '' : String(row.value);
  }
  return config;
}

function makeNormalizer(config) {
  let raw = {};
  try {
    raw = JSON.parse(config.industry_aliases || '{}');
  } catch (err) {
    raw = {}; // a malformed alias map must never break a send cycle
  }
  const aliases = {};
  for (const key of Object.keys(raw)) aliases[cleanTerm(key)] = cleanTerm(raw[key]);
  return term => {
    const t = cleanTerm(term);
    return aliases[t] || t;
  };
}

function splitList(value, normalize) {
  return String(value == null ? '' : value)
    .split(/[,;\n]/)
    .map(normalize)
    .filter(Boolean);
}

function overlap(listA, listB) {
  const set = new Set(listA);
  return listB.filter(item => set.has(item));
}

/**
 * Contact-level gates (independent of any deal).
 * Returns null when the contact is eligible, otherwise a reason string.
 */
function contactGate(contact, normalize) {
  if (normalize(contact.role_type) !== 'investor') return 'not_investor';
  const email = String(contact.email || '').trim();
  if (!email || !email.includes('@')) return 'no_email';
  if (truthy(contact.do_not_contact)) return 'do_not_contact';
  if (truthy(contact.unsubscribed_deals)) return 'unsubscribed';
  return null;
}

/**
 * Pair-level gates for one (contact, deal).
 * Returns { ok: true, reasons: [...] } with human-readable match reasons,
 * or { ok: false, reason: '<gate name>' }.
 */
function pairGate(contact, deal, config, normalize, alreadySentKeys) {
  const reasons = [];

  if (alreadySentKeys.has(`${deal.deal_id}|${contact.contact_id}`)) {
    return { ok: false, reason: 'already_sent' };
  }

  // Stage: investor's list must contain the deal stage. Blank or "any" = all stages.
  const stages = splitList(contact.investing_stage_pref, normalize);
  const dealStage = normalize(deal.stage);
  if (stages.length && !stages.includes('any')) {
    if (!dealStage || !stages.includes(dealStage)) return { ok: false, reason: 'stage' };
    reasons.push(`stage: ${dealStage}`);
  }

  // Industry: at least one overlap. Blank investor list = generalist, passes.
  const wants = splitList(contact.industries, normalize);
  const has = splitList(deal.industries, normalize);
  if (wants.length && has.length) {
    const common = overlap(wants, has);
    if (!common.length) return { ok: false, reason: 'industry' };
    reasons.push(`industry: ${common.join(', ')}`);
  }

  // Geography: blank on either side = anywhere.
  if (truthy(config.enforce_geography)) {
    const contactGeo = splitList(contact.geography, normalize);
    const dealGeo = splitList(deal.geography, normalize);
    if (contactGeo.length && dealGeo.length) {
      const common = overlap(contactGeo, dealGeo);
      if (!common.length) return { ok: false, reason: 'geography' };
      reasons.push(`geo: ${common.join(', ')}`);
    }
  }

  // Founder type: only enforced when BOTH sides tagged something.
  if (truthy(config.enforce_founder_type)) {
    const interests = splitList(contact.founder_type_interests, normalize);
    const tags = splitList(deal.founder_type_tags, normalize);
    if (interests.length && tags.length) {
      const common = overlap(interests, tags);
      if (!common.length) return { ok: false, reason: 'founder_type' };
      reasons.push(`founder: ${common.join(', ')}`);
    }
  }

  // Raise band: if the investor set a min/max raise they play in, the deal's
  // raise must fall inside it. Missing numbers on either side = no gate.
  if (truthy(config.enforce_raise_band)) {
    const raise = toNumber(deal.raise_amount);
    const min = toNumber(contact.min_check);
    const max = toNumber(contact.max_check);
    if (raise != null) {
      if (min != null && raise < min) return { ok: false, reason: 'raise_band' };
      if (max != null && raise > max) return { ok: false, reason: 'raise_band' };
    }
  }

  return { ok: true, reasons };
}

/**
 * Main entry point.
 * @param {Array<Object>} contacts   rows from the Contacts tab
 * @param {Array<Object>} deals      rows from the Deals tab (all rows OK; flag is re-checked)
 * @param {Array<Object>} logRows    rows from the Distribution_Log tab
 * @param {Array<Object>} configRows rows from the Config tab ({key, value})
 * @returns {{recipients: Array, excluded: Object, summary: Object}}
 */
function matchCycle(contacts, deals, logRows, configRows) {
  const config = buildConfig(configRows);
  const normalize = makeNormalizer(config);
  const maxDeals = toNumber(config.max_deals_per_digest) || 5;

  const flaggedDeals = (deals || []).filter(
    d => truthy(d.include_in_next_send) && String(d.deal_id || '').trim()
  );

  const alreadySentKeys = new Set();
  for (const row of logRows || []) {
    if (ALREADY_SENT_STATUSES.includes(cleanTerm(row.status))) {
      alreadySentKeys.add(`${row.deal_id}|${row.contact_id}`);
    }
  }

  const excluded = {}; // reason -> count (contact-level counts contacts, pair-level counts pairs)
  const bump = reason => {
    excluded[reason] = (excluded[reason] || 0) + 1;
  };

  const recipients = [];
  for (const contact of contacts || []) {
    const contactReason = contactGate(contact, normalize);
    if (contactReason) {
      bump(contactReason);
      continue;
    }

    const matchedDeals = [];
    for (const deal of flaggedDeals) {
      const result = pairGate(contact, deal, config, normalize, alreadySentKeys);
      if (!result.ok) {
        bump(result.reason);
        continue;
      }
      matchedDeals.push({
        deal_id: deal.deal_id,
        company_name: deal.company_name,
        match_reasons: result.reasons.join('; ') || 'generalist match',
      });
    }

    if (!matchedDeals.length) continue;
    if (matchedDeals.length > maxDeals) {
      bump('over_digest_cap');
      matchedDeals.length = maxDeals;
    }

    recipients.push({
      contact_id: contact.contact_id,
      email: String(contact.email).trim(),
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      can_help_with: contact.can_help_with || '',
      deals: matchedDeals,
    });
  }

  return {
    recipients,
    excluded,
    summary: {
      flagged_deals: flaggedDeals.length,
      contacts_considered: (contacts || []).length,
      recipients: recipients.length,
      pairs: recipients.reduce((n, r) => n + r.deals.length, 0),
    },
  };
}

/* ---------------------------------------------------------------------------
 * N8N DRIVER — inside the "Match Investors" Code node, keep everything above
 * as-is and finish the node with these lines (uncommented):
 *
 * const contacts   = $('Read Contacts').all().map(i => i.json);
 * const deals      = $('Read Deals').all().map(i => i.json);
 * const logRows    = $('Read Log').all().map(i => i.json);
 * const configRows = $('Read Config').all().map(i => i.json);
 * return [{ json: matchCycle(contacts, deals, logRows, configRows) }];
 * ------------------------------------------------------------------------- */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    matchCycle,
    contactGate,
    pairGate,
    buildConfig,
    makeNormalizer,
    splitList,
    truthy,
    toNumber,
    cleanTerm,
  };
}
