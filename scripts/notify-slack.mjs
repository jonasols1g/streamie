#!/usr/bin/env node
// scripts/notify-slack.mjs
//
// Lettvekts Slack-varsling for agent-arbeidsflyten (se CLAUDE.md,
// "Agent-arbeidsflyt"). Brukes av hovedsamtalen og alle fire sub-agentene
// via ett enkelt Bash-kall: `node scripts/notify-slack.mjs <sender> "<melding>"`.
//
// Designmål: scriptet skal ALDRI blokkere eller forsinke agent-arbeidet.
// Mangler webhook-URL, er senderen ukjent, eller feiler nettverkskallet,
// logges det til stderr og scriptet avslutter uansett med exit 0.

const SENDERS = {
  orchestrator: { username: 'Orkestrator Ole', icon_emoji: ':control_knobs:' },
  'feature-planner': { username: 'Planlegger Pia', icon_emoji: ':compass:' },
  dev: { username: 'Utvikler Ulrik', icon_emoji: ':hammer_and_wrench:' },
  reviewer: { username: 'Gransker Guri', icon_emoji: ':mag:' },
  verifier: { username: 'Godkjenner Gunnar', icon_emoji: ':white_check_mark:' },
};

function skip(reason) {
  console.error(`[notify-slack] hoppet over varsling: ${reason}`);
  process.exit(0);
}

const [, , senderKey, message] = process.argv;

if (!senderKey || !message) {
  skip('mangler argumenter — bruk: node scripts/notify-slack.mjs <sender> "<melding>"');
}

const sender = SENDERS[senderKey];
if (!sender) {
  skip(`ukjent sender "${senderKey}" (gyldige: ${Object.keys(SENDERS).join(', ')})`);
}

const webhookUrl = process.env.SLACK_WEBHOOK_URL;
if (!webhookUrl) {
  skip('SLACK_WEBHOOK_URL er ikke satt (se .claude/settings.local.json)');
}

try {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: sender.username, icon_emoji: sender.icon_emoji, text: message }),
  });
  if (!res.ok) skip(`Slack svarte ${res.status} ${res.statusText}`);
} catch (err) {
  skip(`fetch feilet: ${err instanceof Error ? err.message : String(err)}`);
}
