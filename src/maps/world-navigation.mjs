const regionDetails={
  1:{mainLast:28,optionalCount:10,name:"La Route des Cendres",chapter:"CHAPITRE I"},
  2:{mainLast:26,optionalCount:10,name:"Au-delà du Voile",chapter:"CHAPITRE II"},
  3:{mainLast:27,optionalCount:11,name:"Le Royaume sous la Cendre",chapter:"CHAPITRE III"},
  4:{mainLast:9,optionalCount:4,name:"Le Brasier Originel",chapter:"CHAPITRE IV"},
};

export function createWorldNavigation({mapSystem,maps}){
  const nodesFor=region=>maps[region]||maps[1];
  const detailsFor=region=>regionDetails[region]||regionDetails[1];
  const validate=()=>Object.entries(maps).flatMap(([region,nodes])=>mapSystem.validateMap(nodes,{mainLast:detailsFor(Number(region)).mainLast}));
  return {nodesFor,detailsFor,validate};
}

export {regionDetails};
