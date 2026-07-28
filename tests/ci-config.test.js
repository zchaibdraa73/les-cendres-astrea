const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");

test("le workflow GitHub exécute la recette avec des permissions minimales",async()=>{
  const {parse}=await import("yaml");
  const workflow=parse(fs.readFileSync(path.join(root,".github","workflows","quality.yml"),"utf8"));
  assert.deepEqual(workflow.permissions,{contents:"read"});
  assert.equal(workflow.jobs.quality["timeout-minutes"],20);
  const steps=workflow.jobs.quality.steps;
  assert.ok(steps.some(step=>/^actions\/checkout@[a-f0-9]{40}$/u.test(step.uses)&&step.with["persist-credentials"]===false));
  assert.ok(steps.some(step=>/^actions\/setup-node@[a-f0-9]{40}$/u.test(step.uses)&&step.with.cache==="npm"));
  assert.ok(steps.some(step=>step.run==="npm ci --ignore-scripts"));
  assert.ok(steps.some(step=>step.run==="npx playwright install --with-deps chromium"));
  assert.ok(steps.some(step=>step.run==="npm run ci"));
  assert.ok(steps.some(step=>/^actions\/upload-artifact@[a-f0-9]{40}$/u.test(step.uses)));
});

test("Dependabot surveille npm et les actions GitHub chaque semaine",async()=>{
  const {parse}=await import("yaml");
  const config=parse(fs.readFileSync(path.join(root,".github","dependabot.yml"),"utf8"));
  assert.equal(config.version,2);
  assert.deepEqual(config.updates.map(update=>update["package-ecosystem"]),["npm","github-actions"]);
  config.updates.forEach(update=>assert.equal(update.schedule.interval,"weekly"));
});

test("les commandes CI et la politique de sécurité restent présentes",()=>{
  const packageJson=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
  const security=fs.readFileSync(path.join(root,"SECURITY.md"),"utf8");
  const entry=fs.readFileSync(path.join(root,"main.js"),"utf8");
  assert.equal(packageJson.scripts.ci,"npm run audit:dependencies && npm run check");
  assert.equal(packageJson.scripts["audit:dependencies"],"npm audit --audit-level=high");
  assert.match(security,/validation Zod/);
  assert.doesNotMatch(entry,/https?:\/\//);
});
