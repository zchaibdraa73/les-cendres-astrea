import { test, expect } from "@playwright/test";

function watchRuntimeErrors(page){
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{
    if(message.type()==="error")errors.push(message.text());
  });
  return ()=>expect(errors,"aucune erreur JavaScript ne doit être émise").toEqual([]);
}

async function startRun(page,{className="Le Bastion",seed="4",difficulty="Voyage"}={}){
  await page.goto("/");
  await page.getByRole("button",{name:"Nouvelle partie"}).click();
  await expect(page.locator("#class-select")).toBeVisible();
  await page.getByRole("button",{name:new RegExp(className)}).click();
  await page.locator("#run-seed").fill(seed);
  await page.locator("#difficulty-options button").filter({hasText:difficulty}).click();
  await page.getByRole("button",{name:"Embrasser cette voie"}).click();
  await expect(page.locator("#prologue")).toBeVisible();
  await page.getByRole("button",{name:"Passer le prologue"}).click();
  await expect(page.locator("#exploration")).toBeVisible();
  await page.waitForTimeout(350);
  const guideClose=page.getByRole("button",{name:"Compris"});
  if(await guideClose.isVisible())await guideClose.click();
}

test("le menu principal charge sans erreur et expose les parcours essentiels",async({page})=>{
  const assertNoRuntimeErrors=watchRuntimeErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Les Cendres d'Astréa"})).toBeVisible();
  for(const name of ["Nouvelle partie","Sanctuaire","Défis et Ascension","Sauvegardes","Options"]){
    await expect(page.getByRole("button",{name:new RegExp(name)})).toBeVisible();
  }
  await expect(page.locator("#error-banner")).toBeEmpty();
  assertNoRuntimeErrors();
});

test("une nouvelle partie déterministe atteint la carte et produit une sauvegarde valide",async({page})=>{
  const assertNoRuntimeErrors=watchRuntimeErrors(page);
  await startRun(page,{className:"L'Arcaniste",seed:"424242",difficulty:"Péril"});
  await expect(page.locator("#exploration .location strong")).toHaveText("La Route des Cendres");
  await expect(page.getByRole("button",{name:"Profil"})).toBeVisible();
  const envelope=await page.evaluate(()=>JSON.parse(localStorage.getItem("astrea-save-v3-slot-1")));
  expect(envelope).toMatchObject({integrityVersion:1,algorithm:"SHA-256",kind:"save"});
  expect(envelope.checksum).toMatch(/^[a-f0-9]{64}$/);
  const save=envelope.payload;
  expect(save).toMatchObject({version:28,classId:"arcaniste",seed:424242,currentRegion:1,level:1});
  expect(save.run.difficulty).toBe("peril");
  expect(save.route.length).toBeGreaterThan(20);
  assertNoRuntimeErrors();
});

test("les options d'accessibilité persistent après rechargement",async({page})=>{
  const assertNoRuntimeErrors=watchRuntimeErrors(page);
  await page.goto("/");
  await page.getByRole("button",{name:"Options"}).click();
  await page.locator("#setting-volume").fill("0.25");
  await page.locator("#setting-contrast").check();
  await page.locator("#setting-controls").selectOption("wasd");
  await page.reload();
  await page.getByRole("button",{name:"Options"}).click();
  await expect(page.locator("#setting-volume")).toHaveValue("0.25");
  await expect(page.locator("#setting-contrast")).toBeChecked();
  await expect(page.locator("#setting-controls")).toHaveValue("wasd");
  await expect(page.locator("body")).toHaveClass(/high-contrast/);
  assertNoRuntimeErrors();
});

test("une sauvegarde principale corrompue est restaurée depuis sa copie",async({page})=>{
  const assertNoRuntimeErrors=watchRuntimeErrors(page);
  await startRun(page,{seed:"98765"});
  await page.evaluate(()=>{
    const key="astrea-save-v3-slot-1";
    localStorage.setItem("astrea-save-v3-backup-1",localStorage.getItem(key));
    localStorage.setItem(key,'{"version":28,"classId":"intrus"}');
  });
  await page.reload();
  await page.getByRole("button",{name:/Continuer/}).click();
  await expect(page.locator("#exploration")).toBeVisible();
  await expect(page.locator("#toast")).toContainText("réparée depuis la copie de secours");
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem("astrea-save-v3-slot-1")).payload);
  expect(restored).toMatchObject({version:28,classId:"bastion",seed:98765});
  assertNoRuntimeErrors();
});

test("le joueur peut entrer en combat et effectuer un tour complet",async({page})=>{
  const assertNoRuntimeErrors=watchRuntimeErrors(page);
  await startRun(page,{seed:"4"});
  await page.getByRole("button",{name:/Présence hostile/}).click();
  await expect(page.locator("#combat")).toBeVisible();
  await expect(page.locator("#combat .location strong")).toHaveText("Rencontre sauvage");
  await page.waitForTimeout(250);
  const guideClose=page.getByRole("button",{name:"Compris"});
  if(await guideClose.isVisible())await guideClose.click();
  await page.locator('[data-combat="attack"]').click();
  await expect(page.locator("#combat-log")).toContainText("dégâts");
  await expect(page.locator("#turn-label")).toContainText("À VOTRE TOUR",{timeout:5000});
  await expect(page.locator("#battle-hp-label")).toContainText("PV");
  assertNoRuntimeErrors();
});
