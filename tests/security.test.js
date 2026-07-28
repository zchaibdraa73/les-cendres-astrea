const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const saveSystem=require("../state-system.js");

const root=path.join(__dirname,"..");

test("les sauvegardes SHA-256 détectent toute modification",async()=>{
  const {sha256}=await import("@noble/hashes/sha2.js");
  const {bytesToHex}=await import("@noble/hashes/utils.js");
  const digest=value=>bytesToHex(sha256(new TextEncoder().encode(value)));
  saveSystem.setIntegrity({digest});
  const raw=saveSystem.serialize({version:28,classId:"bastion",level:7});
  const envelope=JSON.parse(raw);
  assert.equal(envelope.algorithm,"SHA-256");
  assert.equal(envelope.checksum.length,64);
  assert.equal(saveSystem.safeParse(raw).level,7);
  envelope.payload.level=30;
  assert.equal(saveSystem.safeParse(JSON.stringify(envelope)),null);
  saveSystem.setIntegrity();
});

test("les anciennes sauvegardes sûres restent compatibles",()=>{
  saveSystem.setIntegrity({digest:()=>"a".repeat(64)});
  const legacy=JSON.stringify({version:28,classId:"arcaniste",level:4});
  assert.equal(saveSystem.safeParse(legacy).level,4);
  saveSystem.setIntegrity();
});

test("les charges injectables et la pollution de prototype sont bloquées",()=>{
  assert.equal(saveSystem.safeParse(JSON.stringify({version:28,classId:"bastion",nemesis:{name:"<img src=x onerror=alert(1)>"}})),null);
  assert.equal(saveSystem.safeParse('{"version":28,"classId":"bastion","__proto__":{"admin":true}}'),null);
});

test("les politiques navigateur interdisent les capacités inutiles",()=>{
  const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
  const headers=fs.readFileSync(path.join(root,"public","_headers"),"utf8");
  assert.match(index,/Content-Security-Policy/);
  assert.match(index,/object-src 'none'/);
  assert.match(headers,/frame-ancestors 'none'/);
  assert.match(headers,/X-Content-Type-Options: nosniff/);
  assert.match(headers,/Permissions-Policy: camera=\(\), microphone=\(\)/);
});

test("le générateur SRI produit des empreintes SHA-384",async()=>{
  const {injectSri,sriFor}=await import("../scripts/build-integrity.mjs");
  const integrity=sriFor(Buffer.from("console.log('ok')"));
  const result=injectSri('<script type="module" src="./assets/app.js"></script>',{"assets/app.js":integrity});
  assert.match(integrity,/^sha384-[A-Za-z0-9+/]+={0,2}$/u);
  assert.equal(result.secured,1);
  assert.ok(result.html.includes(`integrity="${integrity}"`));
  assert.match(result.html,/crossorigin="anonymous"/u);
});

test("tous les rendus HTML dynamiques passent par le filtre dédié",()=>{
  const source=fs.readFileSync(path.join(root,"game.js"),"utf8");
  assert.match(source,/DOMPurify\.sanitize/u);
  assert.doesNotMatch(source,/\.innerHTML\s*=\s*`/u);
});
