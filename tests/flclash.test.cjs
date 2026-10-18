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
  assert.deepEqual(ai.proxies, input.proxies.map(proxy => proxy.name));
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
  assert.ok(config.rules.indexOf('RULE-SET,AI,AI') < config.rules.indexOf('RULE-SET,GitHub,GitHub'));
  assert.ok(config.rules.indexOf('RULE-SET,GitHub,GitHub') < config.rules.indexOf('RULE-SET,Microsoft,Microsoft'));
});

test('TUN parameters remain the upstream baseline during the user trial', () => {
  assert.deepEqual(generate(input).tun, {
    enable: true, device: 'FlClash', stack: 'gvisor',
    'dns-hijack': ['0.0.0.0:53'], 'auto-route': true,
    'auto-detect-interface': false, 'strict-route': true, mtu: 1280,
    'inet4-address': ['172.19.0.1/30'], 'auto-redirect': false,
    'disable-icmp-forwarding': true,
  });
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

test('every business selector and catch-all offers all airport basic groups', () => {
  const original = generate(input);
  const config = generate(airportInput());
  const names = ['AI', 'YouTube', 'Google', 'GitHub', 'Netflix', 'Spotify', 'Steam', 'Telegram', 'TikTok', 'Apple', 'Microsoft', '网络检测', '一键代理'];
  for (const name of names) {
    const group = config['proxy-groups'].find(item => item.name === name);
    const previous = original['proxy-groups'].find(item => item.name === name);
    assert.deepEqual(group.proxies, [...previous.proxies, '测试机场', '自动选择', '故障转移']);
  }
  assertAcyclic(config);
});

test('airport names are dynamic and do not introduce duplicate options', () => {
  for (const name of ['测试机场', '另一个订阅']) {
    const config = generate(airportInput(name));
    const ai = config['proxy-groups'].find(group => group.name === 'AI');
    assert.ok(ai.proxies.includes(name));
    assert.equal(new Set(ai.proxies).size, ai.proxies.length);
    assertAcyclic(config);
  }
});

test('an airport group pointing to a business group cannot be offered back', () => {
  const fixture = airportInput();
  fixture.proxies.push({ name: '节点 C', type: 'ss' });
  fixture['proxy-groups'][0].proxies.push('节点 C', 'YouTube');
  const config = generate(fixture);
  assert.ok(config['proxy-groups'].some(group => group.name === '测试机场'));
  for (const name of ['AI', 'YouTube', 'Google', '一键代理']) {
    assert.ok(!config['proxy-groups'].find(group => group.name === name).proxies.includes('测试机场'));
  }
  assertAcyclic(config);
});
