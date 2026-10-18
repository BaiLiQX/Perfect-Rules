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
