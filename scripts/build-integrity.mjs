import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const dist=join(root,"dist");
const manifestPath=join(dist,"integrity.json");

export function sriFor(content){
  return `sha384-${createHash("sha384").update(content).digest("base64")}`;
}

function filesIn(directory){
  return readdirSync(directory).flatMap(name=>{
    const file=join(directory,name);
    return statSync(file).isDirectory()?filesIn(file):[file];
  });
}

function publicPath(file){
  return relative(dist,file).split(sep).join("/");
}

export function injectSri(html,lookup){
  let secured=0;
  const output=html.replace(/<(script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/giu,(tag,kind,url)=>{
    if(kind==="link"&&!/\brel="stylesheet"/iu.test(tag))return tag;
    const normalized=decodeURIComponent(url).replace(/^\.\//u,"").split(/[?#]/u)[0];
    const integrity=lookup[normalized];
    if(!integrity)return tag;
    secured++;
    const clean=tag.replace(/\s+integrity="[^"]*"/giu,"").replace(/\s+crossorigin(?:="[^"]*")?/giu,"");
    return clean.replace(/>$/u,` integrity="${integrity}" crossorigin="anonymous">`);
  });
  return {html:output,secured};
}

export function createManifest(){
  if(!existsSync(dist))throw new Error("Le dossier dist est absent. Lancez d'abord le build.");
  const files=filesIn(dist).filter(file=>![manifestPath,join(dist,"index.html")].includes(file));
  const entries=Object.fromEntries(files.sort().map(file=>{
    const content=readFileSync(file);
    return [publicPath(file),{integrity:sriFor(content),bytes:content.byteLength}];
  }));
  const lookup=Object.fromEntries(Object.entries(entries).map(([name,value])=>[name,value.integrity]));
  const indexPath=join(dist,"index.html");
  const injected=injectSri(readFileSync(indexPath,"utf8"),lookup);
  if(injected.secured<1)throw new Error("Aucune ressource JavaScript ou CSS n'a reçu d'attribut SRI.");
  writeFileSync(indexPath,injected.html);
  writeFileSync(manifestPath,`${JSON.stringify({version:1,algorithm:"SHA-384",files:entries},null,2)}\n`);
  return {files:Object.keys(entries).length,secured:injected.secured};
}

export function verifyManifest(){
  if(!existsSync(manifestPath))throw new Error("Le manifeste d'intégrité est absent.");
  const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
  if(manifest.version!==1||manifest.algorithm!=="SHA-384")throw new Error("Format du manifeste d'intégrité invalide.");
  for(const [name,entry] of Object.entries(manifest.files)){
    const file=join(dist,name);
    if(!existsSync(file)||sriFor(readFileSync(file))!==entry.integrity)throw new Error(`Empreinte invalide : ${name}`);
  }
  const index=readFileSync(join(dist,"index.html"),"utf8");
  const secured=(index.match(/\sintegrity="sha384-[^"]+"/gu)||[]).length;
  if(secured<1)throw new Error("Les attributs SRI sont absents de la page de production.");
  return {files:Object.keys(manifest.files).length,secured};
}

const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  const verify=process.argv.includes("--verify");
  const result=verify?verifyManifest():createManifest();
  console.log(`Intégrité ${verify?"vérifiée":"générée"} : ${result.files} fichiers, ${result.secured} ressources SRI.`);
}
