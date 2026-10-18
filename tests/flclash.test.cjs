const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../Clash/FlClash.js'), 'utf8');
function generate(input) {
  const context = vm.createContext({ input: structuredClone(input) });
  return JSON.parse(vm.runInContext(script + '\nJSON.stringify(main(input))', context, { timeout: 2000 }));
}
const input = {
  proxies: [
    { name: '剩余流量：测试', type: 'ss' },
    { name: '台湾节点 B', type: 'ss' },
    { name: '香港节点 A', type: 'ss' },
    { name: '未标地区节点', type: 'ss' },
    { name: '美国节点 C', type: 'ss' },
  ],
  'proxy-groups': [],
};

test('AI keeps every subscription option in order as a manual selector', () => {
  const config = generate(input);
  const ai = config['proxy-groups'].find(group => group.name === 'AI');
  assert.equal(ai.type, 'select');
  assert.deepEqual(ai.proxies, [...input.proxies.map(proxy => proxy.name), '外网通用']);
  assert.deepEqual(config.proxies, input.proxies);
});

test('FlClash providers and icons follow this fork', () => {
  const config = generate(input);
  assert.equal(Object.keys(config['rule-providers']).length, 12);
  for (const provider of Object.values(config['rule-providers'])) {
    assert.ok(provider.url.startsWith('https://cdn.jsdelivr.net/gh/BaiLiQX/Perfect-Rules@main/Clash/rules/'));
  }
  for (const group of config['proxy-groups']) {
    if (group.icon) assert.ok(group.icon.startsWith('https://cdn.jsdelivr.net/gh/BaiLiQX/Perfect-Rules@main/Clash/icons/'));
  }
});

test('foreign DNS uses a GeoSite policy and AI precedes broader services', () => {
  const config = generate(input);
  assert.ok(config.dns['nameserver-policy']['geosite:geolocation-!cn']);
  assert.equal(config.dns['nameserver-policy']['geolocation-!cn'], undefined);
  assert.ok(config.rules.indexOf('RULE-SET,AI,AI') < config.rules.indexOf('RULE-SET,Google,Google'));
  assert.ok(config.rules.indexOf('RULE-SET,AI,AI') < config.rules.indexOf('RULE-SET,GitHub,GitHub'));
  assert.ok(config.rules.indexOf('RULE-SET,GitHub,GitHub') < config.rules.indexOf('RULE-SET,Microsoft,Microsoft'));
});

test('system-proxy configuration omits TUN hijack and routes foreign DoH via general proxy', () => {
  const config = generate({ ...input, tun: { enable: true, 'dns-hijack': ['any:53'] } });
  assert.equal(config.tun, undefined);
  assert.equal(config.dns.listen, undefined);
  assert.equal(config.dns['fake-ip-range'], '198.18.0.1/16');
  const foreign = [
    'https://cloudflare-dns.com/dns-query#外网通用',
    'https://dns.google/dns-query#外网通用',
  ];
  assert.deepEqual(config.dns['nameserver-policy']['geosite:geolocation-!cn'], foreign);
  assert.deepEqual(config.dns.fallback, foreign);
  assert.deepEqual(config.dns['proxy-server-nameserver'], [
    'https://dns.alidns.com/dns-query',
    'https://doh.pub/dns-query',
  ]);
  assert.ok(config['proxy-groups'].some(group => group.name === '外网通用'));
});

function airportInput(name = '测试机场') {
  return {
    ...structuredClone(input),
    'proxy-groups': [
      { name, type: 'select', proxies: ['自动选择', '故障转移', ...input.proxies.map(proxy => proxy.name)] },
      { name: '自动选择', type: 'url-test', proxies: input.proxies.map(proxy => proxy.name) },
      { name: '故障转移', type: 'fallback', proxies: input.proxies.map(proxy => proxy.name) },
    ],
  };
}

function assertAcyclic(config) {
  const groups = new Map(config['proxy-groups'].map(group => [group.name, group]));
  const visited = new Set();
  const active = new Set();
  function visit(name) {
    if (!groups.has(name) || visited.has(name)) return;
    assert.ok(!active.has(name), `group reference cycle at ${name}`);
    active.add(name);
    for (const target of groups.get(name).proxies || []) visit(target);
    active.delete(name);
    visited.add(name);
  }
  for (const name of groups.keys()) visit(name);
}

test('every business selector offers the general selector and automatic airport groups', () => {
  const original = generate(input);
  const config = generate(airportInput());
  const names = ['AI', 'YouTube', 'Google', 'GitHub', 'Netflix', 'Spotify', 'Steam', 'Telegram', 'TikTok', 'Apple', 'Microsoft', '网络检测', '一键代理'];
  for (const name of names) {
    const group = config['proxy-groups'].find(item => item.name === name);
    const previous = original['proxy-groups'].find(item => item.name === name);
    assert.deepEqual(group.proxies, [...previous.proxies, '自动选择', '故障转移']);
    assert.ok(!group.proxies.includes('测试机场'));
  }
  assertAcyclic(config);
});

test('the general selector is independent of airport names and has no duplicates', () => {
  for (const name of ['测试机场', '另一个订阅']) {
    const config = generate(airportInput(name));
    const ai = config['proxy-groups'].find(group => group.name === 'AI');
    assert.ok(!ai.proxies.includes(name));
    assert.ok(ai.proxies.includes('外网通用'));
    assert.ok(config['proxy-groups'].some(group => group.name === name));
    assert.equal(new Set(ai.proxies).size, ai.proxies.length);
    assertAcyclic(config);
  }
});

test('an automatic airport group pointing to a business group cannot be offered back', () => {
  const fixture = airportInput();
  fixture.proxies.push({ name: '节点 C', type: 'ss' });
  fixture['proxy-groups'][0].proxies.push('节点 C');
  fixture['proxy-groups'][2].proxies.push('YouTube');
  const config = generate(fixture);
  assert.ok(config['proxy-groups'].some(group => group.name === '测试机场'));
  for (const name of ['AI', 'YouTube', 'Google', '一键代理']) {
    assert.ok(!config['proxy-groups'].find(group => group.name === name).proxies.includes('测试机场'));
    assert.ok(!config['proxy-groups'].find(group => group.name === name).proxies.includes('故障转移'));
  }
  assertAcyclic(config);
});

test('general selector shows auto-select, failover, regions, then the airport group (not raw nodes)', () => {
  const config = generate(airportInput());
  const general = config['proxy-groups'].find(group => group.name === '外网通用');
  const regions = config['proxy-groups'].filter(group => group.type === 'url-test' && group.name !== '自动选择');
  assert.equal(general.type, 'select');
  assert.deepEqual(general.proxies, ['自动选择', '故障转移', ...regions.map(group => group.name), '测试机场']);
  for (const region of regions) {
    assert.ok(region.proxies.every(name => input.proxies.some(proxy => proxy.name === name)));
  }
  assert.ok(general.proxies.every(name => !input.proxies.some(proxy => proxy.name === name)));
  assert.deepEqual(config['proxy-groups'].find(group => group.name === '测试机场').proxies,
    ['自动选择', '故障转移', ...input.proxies.map(proxy => proxy.name)]);
  assertAcyclic(config);
});

test('general selector retains regions but does not list raw nodes if no airport all-node group exists', () => {
  const config = generate(input);
  const general = config['proxy-groups'].find(group => group.name === '外网通用');
  const regions = config['proxy-groups'].filter(group => group.type === 'url-test');
  assert.deepEqual(general.proxies, regions.map(group => group.name));
  assert.ok(general.proxies.length > 0);
  assertAcyclic(config);
});

test('general selector skips airport groups that point back to itself or business groups', () => {
  const fixture = airportInput();
  fixture['proxy-groups'][0].proxies.push('外网通用');
  const config = generate(fixture);
  const general = config['proxy-groups'].find(group => group.name === '外网通用');
  assert.ok(!general.proxies.includes('测试机场'));
  assert.deepEqual(general.proxies.slice(0, 2), ['自动选择', '故障转移']);
  assertAcyclic(config);
});

test('multiple auto-select and failover groups are kept ahead of regional and airport selectors', () => {
  const fixture = airportInput();
  fixture['proxy-groups'].push(
    { name: '机场2 故障转移', type: 'fallback', proxies: input.proxies.map(proxy => proxy.name) },
    { name: '机场2 自动选择', type: 'url-test', proxies: input.proxies.map(proxy => proxy.name) },
  );
  const config = generate(fixture);
  const general = config['proxy-groups'].find(group => group.name === '外网通用');
  assert.deepEqual(general.proxies.slice(0, 4),
    ['自动选择', '机场2 自动选择', '故障转移', '机场2 故障转移']);
  assertAcyclic(config);
});

test('an existing general selector is rebuilt once and does not refer to itself', () => {
  const fixture = airportInput('外网通用');
  const config = generate(fixture);
  assert.equal(config['proxy-groups'].filter(group => group.name === '外网通用').length, 1);
  const once = generate(config);
  assert.deepEqual(once['proxy-groups'], config['proxy-groups']);
  assertAcyclic(once);
});

const aiRules = fs.readFileSync(path.join(__dirname, '../Clash/rules/ai.yaml'), 'utf8')
  .split(/\r?\n/).filter(line => /^\s+- /.test(line)).map(line => line.trim().slice(2));
function explicitAiMatch(host) {
  return aiRules.some(rule => {
    const [kind, value] = rule.split(',');
    return kind === 'DOMAIN' ? host === value
      : kind === 'DOMAIN-SUFFIX' && (host === value || host.endsWith('.' + value));
  });
}

test('Gemini web, mobile, AI Studio and NotebookLM work without GeoSite matches', () => {
  for (const host of [
    'gemini.google.com', 'gemini.google', 'gemini.gstatic.com', 'bard.google.com',
    'geminiweb-pa.clients.google.com', 'geminiweb-pa.clients6.google.com',
    'robinfrontend-pa.googleapis.com', 'generativelanguage.googleapis.com',
    'geller-pa.googleapis.com', 'labstailwind.pa.googleapis.com',
    'aistudio.google.com', 'makersuite.google.com', 'ai.google.dev',
    'alkalicore-pa.clients6.google.com', 'alkalimakersuite-pa.clients6.google.com',
    'webchannel-alkalimakersuite-pa.clients6.google.com',
    'notebooklm.google.com', 'notebooklm-pa.googleapis.com',
    'cloudaicompanion.googleapis.com', 'cloudcode-pa.googleapis.com',
  ]) assert.ok(explicitAiMatch(host), host);
});

test('core AI APIs and assets have explicit coverage while retaining the GeoSite umbrella', () => {
  for (const host of [
    'chatgpt.com', 'auth.openai.com', 'api.openai.com', 'cdn.oaistatic.com',
    'files.oaiusercontent.com', 'claude.ai', 'claude.com', 'api.anthropic.com',
    'claudeusercontent.com', 'api.x.ai', 'grok.com', 'api.perplexity.ai',
    'pplx.ai', 'openrouter.ai', 'api.githubcopilot.com', 'copilot.microsoft.com',
  ]) assert.ok(explicitAiMatch(host), host);
  assert.ok(aiRules.includes('GEOSITE,category-ai-!cn'));
  assert.equal(new Set(aiRules).size, aiRules.length);
});

test('AI exceptions preserve shared Google services and domain boundaries', () => {
  for (const host of [
    'www.google.com', 'accounts.google.com', 'oauth2.googleapis.com',
    'www.gstatic.com', 'fonts.gstatic.com', 'storage.googleapis.com',
    'youtube.com', 'github.com', 'login.microsoftonline.com', 'gemini.com',
    'gemini.google.com.evil.example', 'notgemini.google.com',
    'generativelanguage.googleapis.com.evil.example',
    'other.geminiweb-pa.clients6.google.com',
  ]) assert.ok(!explicitAiMatch(host), host);
});
