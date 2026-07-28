(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.MAP_SYSTEM=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  function generateRoute(seed,nodes,seededStep){
    const choices=["loot","encounter","loot","shrine","rest","encounter"];
    let cursor=seed>>>0;
    return nodes.map(node=>{
      if(!["random","r2random"].includes(node.type))return node.type;
      const result=seededStep(cursor);cursor=result[0];
      return choices[Math.floor(result[1]*choices.length)];
    });
  }
  function validateMap(nodes,meta){
    const errors=[];
    if(!Array.isArray(nodes)||!nodes.length)return ["Carte vide"];
    nodes.forEach((node,index)=>{
      if(!Number.isFinite(node.x)||!Number.isFinite(node.y))errors.push(`Coordonnées invalides au nœud ${index}`);
      if(node.x<0||node.x>100||node.y<0||node.y>100)errors.push(`Nœud ${index} hors limites`);
      if(!Array.isArray(node.edges)||!node.edges.length&&index!==meta.mainLast)errors.push(`Nœud ${index} sans connexion`);
      (node.edges||[]).forEach(target=>{
        if(!nodes[target])errors.push(`Connexion ${index} → ${target} inexistante`);
        else if(!nodes[target].edges.includes(index))errors.push(`Connexion ${index} ↔ ${target} non réciproque`);
      });
    });
    const visited=new Set([0]),queue=[0];while(queue.length){const index=queue.shift();for(const target of nodes[index].edges)if(!visited.has(target)){visited.add(target);queue.push(target)}}
    if(visited.size!==nodes.length)errors.push(`${nodes.length-visited.size} nœud(s) inaccessible(s)`);
    if(meta.mainLast>=nodes.length)errors.push("Boss principal hors carte");
    return errors;
  }
  return {generateRoute,validateMap};
});
