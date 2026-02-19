export const ITEMS = {
  coins:{id:'coins',name:'Sun Coins',stackable:true,description:'Minted currency.',value:1},
  bronze_axe:{id:'bronze_axe',name:'Bronze Hatchet',stackable:false,description:'Woodcutting tool.',value:35,slot:'weapon'},
  bronze_pick:{id:'bronze_pick',name:'Bronze Pick',stackable:false,description:'Mining tool.',value:35,slot:'weapon'},
  bronze_rod:{id:'bronze_rod',name:'Bronze Rod',stackable:false,description:'Fishing tool.',value:35,slot:'weapon'},
  bronze_blade:{id:'bronze_blade',name:'Bronze Blade',stackable:false,description:'Simple combat weapon.',value:55,slot:'weapon'},
  logs:{id:'logs',name:'Timber Logs',stackable:true,description:'Fresh cut logs.',value:6},
  ore:{id:'ore',name:'Copper Ore Chunk',stackable:true,description:'Chunk of ore.',value:10},
  fish:{id:'fish',name:'Riverfish',stackable:true,description:'A common fish.',value:12}
};

export const NPC_TEMPLATES = {
  meadow_pecker:{id:'meadow_pecker',name:'Meadow Pecker',level:2,maxHp:6,attack:2,defence:1,strength:2,attackSpeed:1600,aggro:0,roam:4,loot:[{itemId:'coins',chance:0.7,min:1,max:6}]},
  bog_raider:{id:'bog_raider',name:'Bog Raider',level:6,maxHp:13,attack:5,defence:4,strength:5,attackSpeed:1900,aggro:6,roam:7,loot:[{itemId:'ore',chance:0.5,min:1,max:2},{itemId:'coins',chance:0.9,min:6,max:16}]}
};

export const SKILL_NAMES = ['Attack','Strength','Defence','Hitpoints','Mining','Woodcutting','Fishing'];
