// Prints the Oradea game's anonymous event counts (worker/oradea.js writes them to Workers Analytics Engine).
//   CF_ACCOUNT_ID=… CF_EVENTS_TOKEN=… node tools/oradea/events.mjs [--days 7]
// The token: Cloudflare dashboard -> My Profile -> API Tokens -> Create, permission Account / Account Analytics / Read.
// Counts are sampled at high volume; SUM(_sample_interval) gives the real number.
const days = +(process.argv[process.argv.indexOf('--days') + 1] || 7) || 7;
const { CF_ACCOUNT_ID: acc, CF_EVENTS_TOKEN: token } = process.env;
if (!acc || !token) { console.error('set CF_ACCOUNT_ID and CF_EVENTS_TOKEN (see the header)'); process.exit(2); }
const T = 'oradea_drive_events', SINCE = `timestamp > NOW() - INTERVAL '${days}' DAY`, N = 'SUM(_sample_interval)';
const sql = async (q) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acc}/analytics_engine/sql`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: q });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return (await r.json()).data;
};
const table = (title, rows) => {
  console.log(`\n${title}`);
  if (!rows.length) return console.log('  (none)');
  for (const r of rows) console.log('  ' + Object.values(r).map((v) => String(v).padEnd(24)).join(''));
};
table(`Events, last ${days} days`, await sql(`SELECT blob1 AS event, ${N} AS n FROM ${T} WHERE ${SINCE} GROUP BY event ORDER BY n DESC`));
table('Game starts by device', await sql(`SELECT blob4 AS device, ${N} AS n, SUM(_sample_interval * double1) / SUM(_sample_interval) AS avg_load_ms FROM ${T} WHERE ${SINCE} AND blob1 = 'game_ready' GROUP BY device ORDER BY n DESC`));
table('Pages by mode and language', await sql(`SELECT blob6 AS mode, blob5 AS lang, ${N} AS n FROM ${T} WHERE ${SINCE} AND blob1 = 'page' GROUP BY mode, lang ORDER BY n DESC`));
table('Game starts per day', await sql(`SELECT toStartOfDay(timestamp) AS day, ${N} AS n FROM ${T} WHERE ${SINCE} AND blob1 = 'game_ready' GROUP BY day ORDER BY day`));
table('Sights found', await sql(`SELECT blob2 AS sight, ${N} AS n FROM ${T} WHERE ${SINCE} AND blob1 = 'sight_visited' GROUP BY sight ORDER BY n DESC LIMIT 20`));
table('Partner sites opened', await sql(`SELECT blob2 AS partner, blob3 AS via, ${N} AS n FROM ${T} WHERE ${SINCE} AND blob1 = 'partner_open' GROUP BY partner, via ORDER BY n DESC`));
table('Missions finished', await sql(`SELECT blob2 AS type, blob3 AS ok, ${N} AS n FROM ${T} WHERE ${SINCE} AND blob1 = 'mission_end' GROUP BY type, ok ORDER BY n DESC`));
table('Countries', await sql(`SELECT blob7 AS country, ${N} AS n FROM ${T} WHERE ${SINCE} AND blob1 = 'page' GROUP BY country ORDER BY n DESC LIMIT 10`));
