const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let deck = [];
let realDeck = [];


let musics = [
  new Audio("mus/menu.ogg"),
  new Audio("mus/battle.ogg"),
]
musics[0].loop = true;
musics[1].loop = true;
musics[0].play();

let save = {};
let diffstring = "normal";
// get save from localstorage
let getSave = () => {
  let saveString = localStorage.getItem("ata-save");
  if (saveString) {
    save =JSON.parse( atob(saveString));
  }
}
getSave();

let doSave = () => {
  save = {
    deck: realDeck,
    health: health,
    map: map,
    hard: hard,
    gambler: gambler,
    diffstring: diffstring,
  }
  localStorage.setItem("ata-save", btoa(JSON.stringify(save)));
}

let mapMusicVolume = 0;
let targetMapMusicVolume = 1;

let selupcard = 0;

let hard = false;
let gambler = false;

let energy = 3;
let health = 69;

let enemy = {};
let turn = 0;
let discard = [];

let playerStatuses = [];
let targetStatuses = [];
let gold = 99;

let timeInPhase = 0;

let cardDrops = [];

let hand = [];
let deckScroll = 0;

function shuffle(array) {
  let curId = array.length;
  // There remain elements to shuffle
  while (0 !== curId) {
    // Pick a remaining element
    let randId = Math.floor(Math.random() * curId);
    curId -= 1;
    // Swap it with the current element.
    let tmp = array[curId];
    array[curId] = array[randId];
    array[randId] = tmp;
  }
  return array;
}

let cards = [
  {
    name: "Punch",
    cost: 1,
    costUpgraded: 1,
    description: "Deal {0} dmg",
    action: ["attack"],
    val: [7],
    valUpgraded: [10],
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Block",
    cost: 1,
    costUpgraded: 1,
    description: "Block {0} dmg",
    action: ["block"],
    val: [4],
    valUpgraded: [6],
    useSound: new Audio("mus/shield.wav")
  },
  {
    name: "Bop",
    cost: 1,
    costUpgraded: 1,
    description: "Deal {0} dmg",
    action: ["attack"],
    val: [3],
    valUpgraded: [5],
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Bash",
    cost: 2,
    costUpgraded: 2,
    description: "Deal {0} dmg\nInflict {1} weak",
    action: ["attack","weak"],
    val: [7,2],
    valUpgraded: [8,3],
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Bish Bash",
    cost: 3,
    costUpgraded: 3,
    description: "Deal {0} dmg\nInflict {1} weak",
    action: ["attack","weak"],
    val: [15,4],
    valUpgraded: [23,4],
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Iron Wave",
    cost: 1,
    costUpgraded: 1,
    description: "Deal {0} dmg\nBlock {1} dmg",
    action: ["attack","block"],
    val: [4,3],
    valUpgraded: [6,4],
    useSound: new Audio("mus/shield.wav")
  },
  {
    name: "Grappling Hook",
    cost: 2,
    costUpgraded: 2,
    description: "Use enemy's action\nStun {1} card{1s}\nDestroy this",
    action: ["grapple","stun"],
    val: [0,1],
    valUpgraded: [0,2],
    useSound: new Audio("mus/grapple.ogg"),
    exhaust: true,
  },
  {
    name: "Goop",
    cost: 1,
    costUpgraded: 1,
    description: "Inflict {0} poison",
    action: ["poison"],
    val: [3],
    valUpgraded: [4],
    useSound: new Audio("mus/goop.wav")
  },
  {
    name: "Super Goop",
    cost: 2,
    costUpgraded: 2,
    description: "Inflict {0} poison",
    action: ["poison"],
    val: [5],
    valUpgraded: [7],
    useSound: new Audio("mus/goop.wav")
  },
  {
    name: "Rage",
    cost: 0,
    costUpgraded: 0,
    description: "Gain {0} energy",
    action: ["energy"],
    val: [1],
    valUpgraded: [2],
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Meditate",
    cost: 2,
    costUpgraded: 2,
    description: "Heal {0} hp\nBlock {1} dmg",
    action: ["heal","block"],
    val: [4,4],
    valUpgraded: [6,6],
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Gun",
    cost: 3,
    costUpgraded: 3,
    description: "Deal {0} dmg",
    action: ["attack"],
    val: [999],
    valUpgraded: [999999],
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Pole Vault",
    cost: 1,
    costUpgraded: 1,
    description: "Deal {0} dmg\nDraw {1} card{1s}",
    action: ["attack","draw"],
    val: [5,1],
    valUpgraded: [8,2],
    useSound: new Audio("mus/grapple.ogg")
  },
  {
    name: "Morb",
    cost: 1,
    costUpgraded: 1,
    description: "Drain {0} hp",
    action: ["drain"],
    val: [4],
    valUpgraded: [6],
    useSound: new Audio("mus/goop.wav")
  },
  {
    name: "Ledge",
    cost: 1,
    costUpgraded: 1,
    description: "Gain {1} {0}{1s}",
    action: ["addCardToHand","null"],
    val: ["Shank",2],
    valUpgraded: ["Shank+",2],
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Shank",
    cost: 0,
    costUpgraded: 0,
    description: "Deal {0} dmg\nDestroy this",
    action: ["attack","shankshit"],
    val: [4,0],
    valUpgraded: [6,0],
    exhaust: true,
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Sacrifice",
    cost: 0,
    costUpgraded: 0,
    description: "Draw {0} card{0s}\nGain {1} energy\nLose {2} hp\nDestroy this",
    action: ["draw","energy","losehp"],
    val: [3,3,3],
    valUpgraded: [6,6,6],
    exhaust: true,
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Sword Hit",
    cost: 1,
    costUpgraded: 1,
    description: "Do {0} dmg",
    action: ["attack"],
    val: [9],
    valUpgraded: [12],
    useSound: new Audio("mus/shield.wav")
  },
  {
    name: "Healing Potion",
    cost: 1,
    costUpgraded: 1,
    description: "Heal {0} hp",
    action: ["heal"],
    val: [5],
    valUpgraded: [5],
    useSound: new Audio("mus/goop.wav")
  },
  {
    name: "Toxic Slash",
    cost: 1,
    costUpgraded: 1,
    description: "Deal {0} dmg\nInflict {1} poison",
    action: ["attack","poison"],
    val: [4,2],
    valUpgraded: [5,2],
    useSound: new Audio("mus/goop.wav")
  },
  {
    name: "Regooperate",
    cost: 1,
    costUpgraded: 1,
    description: "Shanks inflict {0}\npoison on use\nDestroy this",
    action: ["regooperate"],
    val: [1],
    valUpgraded: [2],
    exhaust: true,
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Superledge",
    cost: 1,
    costUpgraded: 1,
    description: "Gain {0} Shank{0s}\nevery turn\nDestroy this",
    action: ["superledge"],
    val: [1],
    valUpgraded: [2],
    useSound: new Audio("mus/hey.ogg"),
    exhaust: true
  },
  {
    name: "Light Slash",
    cost: 0,
    costUpgraded: 0,
    description: "Do {0} dmg\nDraw {1} card",
    action: ["attack","draw"],
    val: [3,1],
    valUpgraded: [6,1],
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Mental Gymnastics",
    cost: 0,
    costUpgraded: 0,
    description: "Block {0} dmg\nDestroy this",
    action: ["block"],
    val: [7],
    valUpgraded: [11],
    exhaust: true,
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Backflip",
    cost: 1,
    costUpgraded: 1,
    description: "Block {0} dmg\nDraw {1} card{1s}",
    action: ["block","draw"],
    val: [4,2],
    valUpgraded: [7,2],
    useSound: new Audio("mus/grapple.ogg")
  },
  {
    name: "Double Punch",
    cost: 1,
    costUpgraded: 1,
    description: "Deal {0} dmg, then\nDeal {1} dmg",
    action: ["attack","attack"],
    val: [4,5],
    valUpgraded: [5,6],
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Ultima Shank",
    cost: 2,
    costUpgraded: 2,
    description: "Discard your hand\nConvert it into {0}s",
    action: ["converthand"],
    val: ["Shank"],
    valUpgraded: ["Shank+"],
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Reshank",
    cost: 1,
    costUpgraded: 0,
    description: "Draw a card when\nyou use a Shank\nDestroy this",
    action: ["reshank"],
    val: [1],
    valUpgraded: [1],
    exhaust: true,
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Loud Yelling",
    cost: 1,
    costUpgraded: 0,
    description: "Gain {0} Strength",
    action: ["strength"],
    val: [2],
    valUpgraded: [3],
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Perfect Punch",
    cost: 2,
    costUpgraded: 1,
    description: "Deal {0} dmg for\neach card that has\nPunch in the name\n(does {perfect} dmg)",
    action: ["perfectpunch"],
    val: [3],
    valUpgraded: [3],
    useSound: new Audio("mus/dmg.ogg")
  },
  {
    name: "Spin Slash",
    cost: 1,
    costUpgraded: 1,
    description: "Gain {0} Strength\nDeal {1} dmg\nBlock {2} dmg",
    action: ["strength","attack","block"],
    val: [1,1,1],
    valUpgraded: [1,2,2],
    useSound: new Audio("mus/grapple.ogg")
  },
  {
    name: "Gambler's Glove",
    cost: 1,
    costUpgraded: 1,
    description: "Block {0} dmg\nGet {1} random card{1s}\nDestroy this",
    action: ["block","gamble"],
    val: [2,1],
    valUpgraded: [3,2],
    exhaust: true,
    useSound: new Audio("mus/grapple.ogg")
  },
  {
    name: "Apparatus",
    cost: 2,
    costUpgraded: 2,
    description: "{0}x to poison\nDestroy this",
    action: ["poisonmult"],
    val: [2],
    valUpgraded: [3],
    exhaust: true,
    useSound: new Audio("mus/goop.wav")
  },
  {
    name: "Dropkick",
    cost: 1,
    costUpgraded: 1,
    description: "Do {0} dmg, if enemy\nis Weak, draw {1} card{1s}\nand gain {2} energy",
    action: ["attack","dropkickdraw","dropkickenergy"],
    val: [7,1,1],
    valUpgraded: [11,1,1],
    useSound: new Audio("mus/hey.ogg")
  },
  {
    name: "Intimidate",
    cost: 1,
    costUpgraded: 0,
    description: "Inflict {0} weak\nDestroy this",
    action: ["weak"],
    val: [3],
    valUpgraded: [3],
    useSound: new Audio("mus/hey.ogg"),
    exhaust: true
  },
  {
    name: "All In",
    cost: 1,
    costUpgraded: 0,
    description: "Convert hand into\nrandom cards",
    action: ["gamblehand"],
    val: [0],
    valUpgraded: [0],
    useSound: new Audio("mus/hey.ogg"),
  },
  {
    name: "Violent Coughing",
    cost: 1,
    costUpgraded: 1,
    description: "Inflict {0} poison\nLose {1} hp",
    action: ["poison","losehp"],
    val: [4,3],
    valUpgraded: [6,3],
    useSound: new Audio("mus/goop.wav")
  },
  {
    name: "Dynamite",
    cost: 2,
    costUpgraded: 2,
    description: "In {0} turns,\ndo 40 dmg\n(Doesn't stack!)\nDestroy this",
    action: ["dynamite"],
    val: [4],
    valUpgraded: [3],
    useSound: new Audio("mus/grapple.ogg"),
    exhaust: true
  },
  {
    name: "Pickaxe",
    cost: 1,
    costUpgraded: 1,
    description: "Do {0} dmg",
    action: ["attack"],
    val: [1],
    valUpgraded: [2],
    useSound: new Audio("mus/dmg.ogg"),
    exhaust: true
  },
  {
    name: "Cursed Apparatus",
    cost: 1,
    costUpgraded: 1,
    description: "{0}x to poison\nGain {1} poison",
    action: ["poisonmult","selfpoison"],
    val: [1.5,4],
    valUpgraded: [2.5,4],
    useSound: new Audio("mus/dmg.ogg"),
    exhaust: true
  },
  {
    name: "Sell Air",
    cost: 1,
    costUpgraded: 1,
    description: "Gain {0} gold",
    action: ["gaingold"],
    val: [3],
    valUpgraded: [6],
    useSound: new Audio("mus/grapple.ogg"),
  },
  {
    name: "Buy Air",
    cost: 0,
    costUpgraded: 0,
    description: "Spend {0} gold to\ninflict {1} poison\nand stun {2} card{2s}",
    action: ["buyair","null","null"],
    val: [6,5,2],
    valUpgraded: [6,6,3],
    useSound: new Audio("mus/grapple.ogg"),
  },
]

let allEnemies = [
  {
    name: "Gublin",
    health: 35,
    moves: ["Bop","Block"],
    rarity: "normal",
  },
  {
    name: "Gublin Leader",
    health: 65,
    moves: ["Sword Hit","Healing Potion","Iron Wave"],
    rarity: "elite",
  },
  {
    name: "Gublin King",
    health: 150,
    moves: ["Bash","Iron Wave"],
    rarity: "boss",
  },
  {
    name: "Slimer",
    health: 45,
    moves: ["Goop"],
    rarity: "normal",
  },
  {
    name: "Super Slimer",
    health: 80,
    moves: ["Goop","Goop","Goop","Apparatus"],
    rarity: "elite",
  },
  {
    name: "Skelly Ton",
    health: 100,
    moves: ["Grappling Hook","Block"],
    rarity: "elite",
  },
  {
    name: "Jones",
    health: 120,
    moves: ["Meditate","Meditate","Meditate","Meditate","Meditate","Gun"],
    rarity: "boss",
  },
  {
    name: "Miner",
    health: 90,
    moves: ["Dynamite","Pickaxe","Pickaxe","Pickaxe"],
    rarity: "elite",
  },
  {
    name: "Busyness Man",
    health: 145,
    moves: ["Sell Air","Sell Air","Buy Air"],
    rarity: "boss",
  },
]

let arrowsHeld = {
  left: false,
  right: false,
  up: false,
  down: false,
}

let drawCard = (x,y,name,cost,stunned)=>{
  let upgraded = false;
  if (name=="+" || name=="") return;
  if (name.indexOf("+") !== -1) {
    upgraded = true;
    name = name.replace("+","");
  }
  let card = cards.find(c=>c.name === name);
  if (upgraded) name = name + "+";
  let vals = card.val;
  if (upgraded) vals = card.valUpgraded;
  ctx.fillStyle = "black";
  ctx.fillRect(x+5,y+5,140,170);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "white";
  ctx.strokeRect(x,y,150,180);
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText(name, x+150/2, y+40, 140);
  ctx.font = "15px Arial";
  for (line in card.description.split("\n")) {
    let lineText = card.description.split("\n")[line];
    for (val in vals) {
      lineText = lineText
        .replace("{"+val+"}",vals[val])
        .replace("{"+val+"s}",vals[val] === 1 ? "" : "s")
        .replace("{perfect}",realDeck.filter(x=>x.indexOf("Punch") !== -1).length*vals[val]);
    }
    ctx.fillText(lineText, x+150/2, y+70+line*15, 140);
  }
  ctx.fillStyle = "orange";
  ctx.font = "20px Arial";
  let realCost = card.cost;
  if (upgraded) realCost = card.costUpgraded;
  if (cost) ctx.fillText("Cost: "+realCost, x+150/2, y+140, 140);
  ctx.textAlign = "left";
  if (stunned) {
    ctx.drawImage(document.getElementById("stunned"),x-5,y-5);
  }
}
let getCard = (name) => {
  name = name.replace("+","");
  return cards.find(c=>c.name === name);
}
let getEnemyFromRarity = (rarity) => {
  let enemies = allEnemies.filter(e=>e.rarity === rarity);
  return enemies[Math.floor(Math.random()*enemies.length)];
}
let gameDrawCard = (delay)=>{
  // draw card from deck
  setTimeout(()=>{
  if (deck.length == 0) {
    if (discard.length > 0) {
      deck = discard;
      discard = [];
      // shuffle deck
      deck = shuffle(deck);
    } else {
      // take 1 damage you stupid doofus
      health -= 1;
      new Audio("mus/dmg.ogg").play();
      return;
    }
  }
  let card = deck.shift();
  if (hand.length < 10) {
    hand.push(card);
  } else {
    discard.push(card);
  }
}, delay);
}
let addStatus = (fighter,status,value) => {
  let statusArr = playerStatuses;
  if (fighter === "target") statusArr = targetStatuses;
  console.log(statusArr);
  if (statusArr.find(s=>s[0] === status) === undefined) {
    statusArr.push([status,value]);
  } else {
    statusArr[statusArr.indexOf(statusArr.find(s=>s[0] === status))][1] += value;
  }
}

let takeDamage = (fighter, dmg) => {
  if (fighter === "self") {
    let damageRemaining = dmg;
    console.log(playerStatuses.map(s=>s[0]));
    // strength
    if (targetStatuses.map(s=>s[0]).indexOf("strength") !== -1) {
      damageRemaining += targetStatuses[targetStatuses.indexOf(targetStatuses.find(s=>s[0] === "strength"))][1];
      damageRemaining = Math.floor(damageRemaining);
    }
    // if we are weak
    if (playerStatuses.map(s=>s[0]).indexOf("weak") !== -1) {
      damageRemaining *= 1.5;
      damageRemaining = Math.floor(damageRemaining);
    }
    // reduce block first
    if (playerStatuses.map(s=>s[0]).indexOf("block") !== -1) {
      console.log("blocking");
      let block = playerStatuses.find(s=>s[0] == "block");
      if (block[1] > damageRemaining) {
        playerStatuses[playerStatuses.indexOf(playerStatuses.find(s=>s[0] == "block"))][1] -= damageRemaining;
        return 0;
      } else {
        damageRemaining -= block[1];
        playerStatuses.splice(playerStatuses.indexOf(playerStatuses.find(s=>s[0] == "block")),1);
      }
    }
    // reduce health
    health -= damageRemaining;
    return damageRemaining;
  } else {
    let damageRemaining = dmg;
    // if we are weak
    if (playerStatuses.map(s=>s[0]).indexOf("strength") !== -1) {
      damageRemaining += playerStatuses[playerStatuses.indexOf(playerStatuses.find(s=>s[0] === "strength"))][1];
      damageRemaining = Math.floor(damageRemaining);
    }
    if (targetStatuses.map(s=>s[0]).indexOf("weak") !== -1) {
      damageRemaining *= 1.5;
      damageRemaining = Math.floor(damageRemaining);
    }
    // reduce block first
    if (targetStatuses.map(s=>s[0]).indexOf("block") !== -1) {
      let block = targetStatuses.find(s=>s[0] == "block");
      if (block[1] > damageRemaining) {
        targetStatuses[targetStatuses.indexOf(targetStatuses.find(s=>s[0] == "block"))][1] -= damageRemaining;
        return 0;
      } else {
        damageRemaining -= block[1];
        targetStatuses.splice(targetStatuses.indexOf(targetStatuses.find(s=>s[0] == "block")),1);
      }
    }
    // reduce health
    enemy.health -= damageRemaining;
    return damageRemaining;

  }
}

let useCard = (fighter, name, preventRecursion) => {
  console.log(fighter,name,preventRecursion)
  // check if upgraded
  let upgraded = false;
  console.log(fighter,name);
  if (name.indexOf("+") !== -1) {
    upgraded = true;
    name = name.replace("+","");
  }
  let card = getCard(name);
  // play card usesound
  card.useSound.currentTime = 0;
  card.useSound.play();

  let vals = card.val;
  if (upgraded) vals = card.valUpgraded;

  // activate actions
  for (action in card.action) {
    switch (card.action[action]) {
      case "attack":
        console.log("attack for "+vals[action]);
        takeDamage(fighter === "self" ? "target" : "self", vals[action]);
        break;
      case "block":
        console.log("block for "+vals[action]);
        addStatus(fighter,"block",vals[action]);
        console.log(playerStatuses);
        break;
      case "grapple":
        if (preventRecursion) break;
        console.log("grappling hook mechanic");
        if (fighter == "self") {
          // use enemy's card
          useCard("self",enemy.moves[turn%enemy.moves.length],true);
        } else {
          // use card on top of deck
          if (deck.length > 0) {
            console.log("deck card");
            useCard("target",deck[0],true);
          } else {
            // use card on top of discard
            console.log("dis card");
            useCard("target",discard[0],true);
          }
        }
        break;
      case "stun":
        console.log("stun for "+vals[action]);
        addStatus(fighter === "self" ? "target" : "self","stun",vals[action]);
        if (fighter == "target" && deck.length === 0) {
          deck.push(discard.shift()); // this is so grapple hook uses the card it stuns
        }
        break;
      case "weak":
        console.log("weak for "+vals[action]);
        addStatus(fighter === "self" ? "target" : "self","weak",vals[action]);
        break;
      case "poison":
        console.log("poison for "+vals[action]);
        addStatus(fighter === "self" ? "target" : "self","poison",vals[action]);
        break;
      case "energy":
        console.log("energy for "+vals[action]);
        if (fighter == "self") {
          // use enemy's card
          energy+=vals[action];
        }
        break;
      case "heal":
        console.log("heal for "+vals[action]);
        if (fighter == "self") {
          health+=vals[action];
          if (health > 69) health = 69;
        } else {
          enemy.health+=vals[action];
          if (enemy.health > enemy.maxhp) enemy.health = enemy.maxhp;
        }
        break;
      case "drain":
        console.log("drain for "+vals[action]);
        if (fighter == "self") {
          health+=takeDamage("target", vals[action]);
          if (health > 69) health = 69;
        } else {
          enemy.health+=takeDamage("self", vals[action]);
          if (enemy.health > enemy.maxhp) enemy.health = enemy.maxhp;
        }
        break;
      case "addCardToHand":
        console.log(`adding ${vals[(action-0)+1]} ${vals[action]} to hand`);
        if (fighter == "self") {
          for (let i = 0; i < vals[(action-0)+1]; i++) {
            setTimeout(function(q){
              console.log(q);
              if (hand.length < 10) {
                hand.push(q);
              } else {
                discard.push(q);
              }
            }.bind(null,vals[action]),i*250)
          }
        } else {
          for (let i = 0; i < vals[(action-0)+1]; i++) {
            setTimeout(function(q){
              useCard("target",q,false);
            }.bind(null,vals[action]),i*100)
          }
        }
        break;
      case "draw":
        console.log("drawing "+vals[action]+" cards");
        if (fighter == "self") {
          for (let i = 0; i < vals[action]; i++) {
            gameDrawCard(i*100); 
          }
        }
        break;
      case "losehp":
        console.log("losing "+vals[action]+" hp");
        if (fighter == "self") {
          health-=vals[action];
          if (health < 0) health = 0;
        } else {
          enemy.health-=vals[action];
        }
        break;
      case "regooperate":
        console.log("regooperating for "+vals[action]);
        addStatus(fighter,"regooperate",vals[action]);
        break;
      case "reshank":
        console.log("reshanking for "+vals[action]);
        addStatus(fighter,"reshank",vals[action]);
        break;
      case "shankshit":
        // get regooperate value
        let regooperate = 0;
        let reshank = 0;
        if (fighter == "self") {
          if (playerStatuses.map(s=>s[0]).indexOf("regooperate") !== -1)
            regooperate = playerStatuses.find(s=>s[0] == "regooperate")[1];
          if (playerStatuses.map(s=>s[0]).indexOf("reshank") !== -1)
          reshank = playerStatuses.find(s=>s[0] == "reshank")[1];
        }
        else {
          if (enemyStatuses.map(s=>s[0]).indexOf("regooperate") !== -1)
            regooperate = enemyStatuses.find(s=>s[0] == "regooperate")[1];
        }
        // inflict poison equal to regooperate value
        if (regooperate > 0) addStatus(fighter === "self" ? "target" : "self","poison",regooperate);
        if (reshank > 0) {
          // draw cards equal to reshank value
          for (let i = 0; i < reshank; i++) {
            gameDrawCard(i*100); 
          }
        }
        break;
      case "superledge":
        addStatus(fighter,"superledge",vals[action]);
        break;
      case "converthand":
        console.log("converting hand into "+vals[action]);
        if (fighter == "self") {
          for (let i = 0; i < hand.length; i++) {
            setTimeout(function(a,b){
              discard.push(hand[a]);
              hand[a] = b;
            }.bind(null,i,vals[action]),i*50)
          }
        }
        break;
      case "strength":
        addStatus(fighter,"strength",vals[action]);
        break;
      case "perfectpunch":
        // do damage for each punch card in realdeck
        let damage = 0;
        if (fighter == "self") damage = realDeck.filter(c=>c.indexOf("Punch") != -1).length;
        else damage = 1;

        console.log("perfect punch for "+damage*vals[action]);
        takeDamage(fighter === "self" ? "target" : "self", damage*vals[action]);
        break;
      case "gamble":
        console.log("gamble for "+vals[action]);
        if (fighter == "self") {
          for (let i = 0; i < vals[action]; i++) {
            setTimeout(function(){
              // get a random droppable card
              let card = droppableCards[Math.floor(Math.random()*droppableCards.length)];

              if (hand.length < 10) {
                hand.push(card);
              } else {
                discard.push(card);
              }
            }.bind(null),i*250)
          }
        }
        break;
      case "poisonmult":
        // get amt of poison
        let poison = 0;
        if (fighter == "self") {
          if (targetStatuses.map(s=>s[0]).indexOf("poison") !== -1)
            poison = targetStatuses.find(s=>s[0] == "poison")[1];
        }
        else {
          if (playerStatuses.map(s=>s[0]).indexOf("poison") !== -1)
            poison = playerStatuses.find(s=>s[0] == "poison")[1];
        }
        if (poison != 0) addStatus(fighter === "self" ? "target" : "self","poison",Math.floor((vals[action]-1)*poison));
        break;
      case "dropkickdraw":
        // get amt of poison
        var isWeak = false;
        if (fighter == "self") {
          if (targetStatuses.map(s=>s[0]).indexOf("weak") !== -1)
            isWeak = true;
        }
        if (isWeak) 
          for (let i = 0; i < vals[action]; i++) {
            gameDrawCard(i*100); 
          }
        break;
      case "dropkickenergy":
        // get amt of poison
        var isWeak = false;
        if (fighter == "self") {
          if (targetStatuses.map(s=>s[0]).indexOf("weak") !== -1)
            isWeak = true;
        }
        if (isWeak)
          energy += vals[action];
        break;
      case "gamblehand":
        console.log("converting hand into random cards");
        if (fighter == "self") {
          for (let i = 0; i < hand.length; i++) {
            let rcard = droppableCards[Math.floor(Math.random()*droppableCards.length)];
            setTimeout(function(a,b){
              hand[a] = b;
            }.bind(null,i,rcard),i*50)
          }
        }
        break;
      case "dynamite":
        console.log(`dynamite in ${vals[action]} turns`);
        let dynamite = 0;
        if (fighter == "self") {
          if (targetStatuses.map(s=>s[0]).indexOf("dynamite") !== -1)
            break;
        }
        else {
          if (playerStatuses.map(s=>s[0]).indexOf("dynamite") !== -1)
            break;
        }
        addStatus(fighter === "self" ? "target" : "self","dynamite",vals[action]);
        break;
      case "gaingold":
        console.log(`gaining ${vals[action]} gold`);
        if (fighter == "self") {
          gold += vals[action];
        }
        else {
          enemy.gold += vals[action];
        }
        break;
      case "buyair":
        console.log(`buying air for ${vals[action]}. ${vals[(action-0)+1]} poison and ${vals[(action-0)+2]} stun`);
        if (fighter == "self") {
          if (gold > vals[action]) {
            gold -= vals[action];
            addStatus("target","poison",vals[(action-0)+1]);
            addStatus("target","stun",vals[(action-0)+2]);
          };
        }
        else {
          if (enemy.gold > vals[action]) {
            enemy.gold -= vals[action];
            addStatus("self","poison",vals[(action-0)+1]);
            addStatus("self","stun",vals[(action-0)+2]);
          };
        }
        break;
    }
  }
}

realDeck.push("Punch");
realDeck.push("Punch");
realDeck.push("Punch");
realDeck.push("Punch");
realDeck.push("Punch");
realDeck.push("Block");
realDeck.push("Block");
realDeck.push("Block");
realDeck.push("Block");
realDeck.push("Morb");

let droppableCards = [
  "Bash",
  "Morb",
  "Goop",
  "Bish Bash",
  "Grappling Hook",
  "Pole Vault",
  "Ledge",
  "Toxic Slash",
  "Regooperate",
  "Superledge",
  "Light Slash",
  "Mental Gymnastics",
  "Backflip",
  "Double Punch",
  "Ultima Shank",
  "Reshank",
  "Loud Yelling",
  "Perfect Punch",
  "Apparatus",
  "Sacrifice",
  "Healing Potion",
  "Dropkick",
  "Intimidate",
  "All In",
  "Violent Coughing",
  "Dynamite",
  "Cursed Apparatus"
]

let shop = [];

let gameState = "menu";

let map = [];
map.push("combat");
for (i in Array(22).fill(0)) {
  let posses = ["combat","combat","combat","elite","rest"];//,"shop","shop","chest"];
  let random = Math.floor(Math.random() * posses.length);
  map.push(posses[random]);
}
map.push("rest");
map.push("boss");
map.push("win");

const update = ()=>{
  mapMusicVolume = (mapMusicVolume * 7 + targetMapMusicVolume) / 8;
  musics[0].volume = mapMusicVolume;
  musics[1].volume = 1-mapMusicVolume;
  if (gameState.indexOf("combat") !== -1 && enemy.health <= 0 && gameState != "combatDiscardHand" && gameState != "combat") {
    gameState = "combatDiscardHand";
    timeInPhase = 0;
  }
  if (gameState.indexOf("combat") !== -1 && health <= 0 && gameState != "combatDiscardHand" && gameState != "combat") {
    gameState = "combatDiscardHand";
    timeInPhase = 0;
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(document.getElementById("attic"),0,0,canvas.width,canvas.height)
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalAlpha = 1;
  if (gameState === "menu") {
    ctx.font = "50px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Annihilate the Attic", canvas.width/2 - ctx.measureText("Annihilate the Attic").width/2, canvas.height/2 - 5);
    ctx.font = "30px Arial";
    ctx.fillText("Space to start", canvas.width/2 - ctx.measureText("Space to start").width/2, canvas.height/2 + 35);
    ctx.fillText("H to start on Hard", canvas.width/2 - ctx.measureText("H to start on Hard").width/2, canvas.height/2 + 65);
    ctx.fillText("G to start on Gambler", canvas.width/2 - ctx.measureText("G to start on Gambler").width/2, canvas.height/2 + 115);
    ctx.fillText("M to start on True Morber", canvas.width/2 - ctx.measureText("M to start on True Morber").width/2, canvas.height/2 + 165);
    ctx.font = "20px Arial";
    ctx.fillText("Enemy cards upgraded, starting Morb is a Block", canvas.width/2 - ctx.measureText("Enemy cards upgraded, starting Morb is a Block").width/2, canvas.height/2 + 85);
    ctx.fillText("Start with 5 Gambler's Gloves, all cards are Gambler's Gloves", canvas.width/2 - ctx.measureText("Start with 5 Gambler's Gloves, all cards are Gambler's Gloves").width/2, canvas.height/2 + 135);
    ctx.fillText("Enemy cards upgraded, starting Morb is a Block, starting Punches are Morbs", canvas.width/2 - ctx.measureText("Enemy cards upgraded, starting Punches are Bops, starting Morb is a Block").width/2, canvas.height/2 + 185);
    if (Object.keys(save).length > 0) {
      ctx.font = "30px Arial";
      ctx.fillText("S to load game", 16, 46);
      ctx.font = "20px Arial";
      ctx.fillText("Floor " + (27 - save.map.length) + " " + save.diffstring, 16, 66);

    }
  } else if (gameState === "map") {
    ctx.font = "50px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Map", canvas.width/2 - ctx.measureText("Map").width/2, 55);
    ctx.font = "40px Arial";
    ctx.fillText("Your health: " + health + "/69", canvas.width/2 - ctx.measureText("Your health: " + health + "/69").width/2, canvas.height/4);
    ctx.font = "30px Arial";
    ctx.fillText(map.join(", "), 5, canvas.height/2 + 35);
    ctx.fillStyle = "red";
    ctx.fillText("You are here! (space to travel)", 5, canvas.height/2 - 35);
    ctx.fillText("v", 35, canvas.height/2 - 5);
    for (card in realDeck) {
      drawCard(25+card*160 - deckScroll, canvas.height - 205, realDeck[card], true, false);
    }
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Your Deck (" + realDeck.length + ")", canvas.width/2 - ctx.measureText("Your Deck (" + realDeck.length + ")").width/2, canvas.height - 235);
    ctx.font = "20px Arial";
    ctx.fillText("< and > to scroll", canvas.width/2 - ctx.measureText("< and > to scroll").width/2, canvas.height - 215);
    if (arrowsHeld.left) {
      deckScroll -= 5;
      if (deckScroll < 0) deckScroll = 0;
    }
    if (arrowsHeld.right) {
      deckScroll += 5;
      if (deckScroll > realDeck.length*160 - canvas.width + 45) deckScroll = realDeck.length*160 - canvas.width + 45;
    }
  } else if (gameState === "combat") {
    deck = [...realDeck];
    console.log(deck);
    discard = [];
    hand = [];
    playerStatuses = [];
    targetStatuses = [];
    
    // shuffle deck
    deck = shuffle(deck);

    gameDrawCard(100);
    gameDrawCard(200);
    gameDrawCard(300);
    gameDrawCard(400);
    gameDrawCard(500);

    // get random normal enemy
    enemy = {};
    console.log(enemy);
    Object.assign(enemy, getEnemyFromRarity("normal"));
    enemy.gold = Math.floor(Math.random()*7)+5;
    console.log(enemy);
    enemy.maxhp = enemy.health;

    targetMapMusicVolume = 0;
    musics[1].pause();
    musics[1].play();
    
    timeInPhase = 0;

    energy = 3;

    gameState = "combatPlayerTurn";
  } else if (gameState === "elite") {
    deck = [...realDeck];
    console.log(deck);
    discard = [];
    hand = [];
    playerStatuses = [];
    targetStatuses = [];
    
    // shuffle deck
    deck = shuffle(deck);

    gameDrawCard(100);
    gameDrawCard(200);
    gameDrawCard(300);
    gameDrawCard(400);
    gameDrawCard(500);

    // get random normal enemy
    enemy = {};
    console.log(enemy);
    Object.assign(enemy, getEnemyFromRarity("elite"));
    enemy.gold = Math.floor(Math.random()*17)+15;
    console.log(enemy);
    enemy.maxhp = enemy.health;

    targetMapMusicVolume = 0;
    musics[1].pause();
    musics[1].play();
    
    timeInPhase = 0;

    energy = 3;

    gameState = "combatPlayerTurn";
  } else if (gameState === "boss") {
    deck = [...realDeck];
    discard = [];
    hand = [];
    playerStatuses = [];
    targetStatuses = [];
    
    // shuffle deck
    deck = shuffle(deck);

    gameDrawCard(100);
    gameDrawCard(200);
    gameDrawCard(300);
    gameDrawCard(400);
    gameDrawCard(500);

    // get random normal enemy
    enemy = {};
    console.log(enemy);
    Object.assign(enemy, getEnemyFromRarity("boss"));
    enemy.gold = 1000;
    console.log(enemy);
    enemy.maxhp = enemy.health;
    
    targetMapMusicVolume = 0;
    musics[1].pause();
    musics[1].play();

    timeInPhase = 0;

    energy = 3;

    gameState = "combatPlayerTurn";
  } else if (gameState === "combatInitTurn") {

    gameDrawCard(100);
    gameDrawCard(200);
    gameDrawCard(300);
    gameDrawCard(400);
    gameDrawCard(500);

    timeInPhase = 0;

    gameState = "combatPlayerTurn";

    // clear enemy stun
    for (let i = 0; i < targetStatuses.length; i++) {
      if (targetStatuses[i][0] === "stun") {
        targetStatuses[i][1]--;
        if (targetStatuses[i][1] <= 0) {
          targetStatuses.splice(i,1);
          i--;
        }
        continue;
      }
      if (targetStatuses[i][0] === "weak") {
        // decrement
        targetStatuses[i][1]--;
        if (targetStatuses[i][1] <= 0) {
          targetStatuses.splice(i,1);
          i--;
          continue;
        }
      }
    }

    // superledge
    let superledge = 0;
    for (let i = 0; i < playerStatuses.length; i++) {
      if (playerStatuses[i][0] === "superledge") {
        superledge = playerStatuses[i][1];
        continue;
      }
    }
    if (superledge > 0) {
      // add 1 shank for each
      for (let i = 0; i < superledge; i++) {
        setTimeout(function(){
          if (hand.length < 10) {
            hand.push("Shank");
          } else {
            discard.push("Shank");
          }
        },500+i*250)
      } 
    }
    
    energy = 3;
  }
  if (gameState === "combatPlayerTurn") {
    if (timeInPhase == 0) {
      // apply poisons
      for (let i = 0; i < playerStatuses.length; i++) {
        if (playerStatuses[i][0] === "poison") {
          health -= playerStatuses[i][1];
          new Audio("./mus/goop.wav").play();
          playerStatuses[i][1]--;
          if (playerStatuses[i][1] <= 0) playerStatuses.splice(i, 1);
          break;
        }
      }
      for (let i = 0; i < playerStatuses.length; i++) {
        if (playerStatuses[i][0] === "dynamite") {
          new Audio("./mus/grapple.ogg").play();
          playerStatuses[i][1]--;
          if (playerStatuses[i][1] <= 0) {
            playerStatuses.splice(i, 1);
            new Audio("./mus/boom.mp3").play();
            takeDamage("self",40);
          }
          break;
        }
      }
    }
    timeInPhase += 1/60;
    if (hand.length > 5) {
      ctx.setTransform(0.75,0,0,0.75,canvas.width/12,canvas.height/4);
    }
    if (hand.length > 8) {
      ctx.setTransform(0.65,0,0,0.65,canvas.width/8,canvas.height*0.35);
    }
    // get amt of stun
    let stun = 0;
    for (let i = 0; i < playerStatuses.length; i++) {
      if (playerStatuses[i][0] === "stun") {
        stun += playerStatuses[i][1];
      }
    }
    for (card in hand) {
      drawCard(canvas.width/2 + (card - hand.length / 2) * 160, canvas.height - 205, hand[card], true, stun > card);
      let keyToPlay = (card-0)+1;
      if (keyToPlay == 10) keyToPlay = "0";
      ctx.fillText("Play ("+keyToPlay+")", canvas.width/2 + (card - hand.length / 2) * 160 + 80 - ctx.measureText("Play ("+keyToPlay+")").width/2, canvas.height - 215);
    }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "#00ff00";
    ctx.drawImage(document.getElementById("morbius"), canvas.width / 5-125, canvas.height / 3-75, 250, 250);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ff0000";
    let hpString = "HP: "+health+"/"+69;
    ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85);
    hpString = playerStatuses.map(status => status[0] + ": " + status[1]).join(", ");
    ctx.fillStyle = "white";
    ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85+250+40);
    ctx.fillStyle = "orange";
    hpString = 'Gold: '+gold;
    if (enemy.name === "Busyness Man" && realDeck.indexOf("Grappling Hook") != -1) ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85-20);
    // draw orange circle top right of player
    ctx.beginPath();
    ctx.arc(canvas.width / 5 + 75, canvas.height / 3 - 95, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "25px Arial";
    ctx.fillText(energy, canvas.width / 5 + 75 - ctx.measureText(energy).width/2, canvas.height / 3 - 85);
    hpString = "HP: "+enemy.health+"/"+enemy.maxhp;
    ctx.fillStyle = "#ff0000";
    ctx.font = "20px Arial";
    ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85);
    ctx.fillStyle = "orange";
    if (enemy.name === "Busyness Man") {
      hpString = 'Gold: '+enemy.gold;
      ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85-20);
    }
    hpString = targetStatuses.map(status => status[0] + ": " + status[1]).join(", ");
    ctx.fillStyle = "white";
    ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85+250+40);


    // draw enemy
    ctx.drawImage(document.getElementById("enemy-"+enemy.name), canvas.width - canvas.width / 4-125, canvas.height / 3-75, 250, 250);
    ctx.globalAlpha = 0.8;
    drawCard(canvas.width - canvas.width / 4+125+25, canvas.height / 3-75+35, enemy.moves[turn%enemy.moves.length]+(hard?"+":""),false,
      targetStatuses.map(x=>x[0]).indexOf("stun") != -1);
    ctx.globalAlpha = 1;

    // draw deck and discard size
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText("Deck (" + deck.length + ")", 200, canvas.height / 3 - 105);
    ctx.fillText("Discard (" + discard.length + ")", 200, canvas.height / 3 - 85);
    ctx.textAlign = "left";
    ctx.font = "50px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Player Turn", timeInPhase * canvas.width- ctx.measureText("Player Turn").width, canvas.height/2 - 30);

    ctx.font = "30px Arial";
    ctx.fillText("Push", canvas.width * (13 / 14) - ctx.measureText("Push").width / 2, canvas.height - 140);
    ctx.drawImage(document.getElementById("p"), canvas.width * (13 / 14) - 30, canvas.height - 130, 60, 60);
    ctx.fillText("to end turn", canvas.width * (13 / 14) - ctx.measureText("to end turn").width / 2, canvas.height - 40);

    ctx.font = "30px Arial";
    ctx.fillText("Turn "+(turn+1), 8, 38);

  } else if (gameState === "combatDiscardHand") {
    if (timeInPhase > 0.25) {
      if (hand.length === 0) {
        if (enemy.health <= 0) {
          gameState = "getCard";
          targetMapMusicVolume = 1;
          cardDrops = [];
          // add 3 random card drops
          for (let i = 0; i < 3; i++) {
            if (gambler) cardDrops.push("Gambler's Glove");
            else cardDrops.push(droppableCards[Math.floor(Math.random() * droppableCards.length)]);
          }
          console.log(cardDrops);
        }
        else if (health <= 0) gameState = "gameOver";
        else gameState = "combatEnemyTurn";
      }
      else discard.push(hand.pop());
      timeInPhase = 0;
    } else {
      timeInPhase+=1/60;
    }
    if (hand.length > 5) {
      ctx.setTransform(0.75,0,0,0.75,canvas.width/12,canvas.height/4);
    }
    if (hand.length > 8) {
      ctx.setTransform(0.65,0,0,0.65,canvas.width/8,canvas.height*0.35);
    }
    for (card in hand) {
      drawCard(canvas.width/2 + (card - hand.length / 2) * 160, canvas.height - 205, hand[card], true, false);
    }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "#00ff00";
    ctx.drawImage(document.getElementById("morbius"), canvas.width / 5-125, canvas.height / 3-75, 250, 250);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ff0000";
    let hpString = "HP: "+health+"/"+69;
    ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85);
    hpString = playerStatuses.map(status => status[0] + ": " + status[1]).join(", ");
    ctx.fillStyle = "white";
    ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85+250+40);
    ctx.fillStyle = "orange";
    hpString = 'Gold: '+gold;
    if (enemy.name === "Busyness Man" && realDeck.indexOf("Grappling Hook") != -1) ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85-20);
    // draw orange circle top right of player
    ctx.beginPath();
    ctx.arc(canvas.width / 5 + 75, canvas.height / 3 - 95, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "25px Arial";
    ctx.fillText(energy, canvas.width / 5 + 75 - ctx.measureText(energy).width/2, canvas.height / 3 - 85);
    hpString = "HP: "+enemy.health+"/"+enemy.maxhp;
    ctx.fillStyle = "#ff0000";
    ctx.font = "20px Arial";
    ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85);
    ctx.fillStyle = "orange";
    if (enemy.name === "Busyness Man") {
      hpString = 'Gold: '+enemy.gold;
      ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85-20);
    }
    hpString = targetStatuses.map(status => status[0] + ": " + status[1]).join(", ");
    ctx.fillStyle = "white";
    ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85+250+40);


    // draw enemy
    ctx.drawImage(document.getElementById("enemy-"+enemy.name), canvas.width - canvas.width / 4-125, canvas.height / 3-75, 250, 250);
    ctx.globalAlpha = 0.8;
    drawCard(canvas.width - canvas.width / 4+125+25, canvas.height / 3-75+35, enemy.moves[turn%enemy.moves.length]+(hard?"+":""),false,
      targetStatuses.map(x=>x[0]).indexOf("stun") != -1);
    ctx.globalAlpha = 1;

    // draw deck and discard size
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText("Deck (" + deck.length + ")", 200, canvas.height / 3 - 105);
    ctx.fillText("Discard (" + discard.length + ")", 200, canvas.height / 3 - 85);
    ctx.textAlign = "left";

    ctx.font = "30px Arial";
    ctx.fillText("Turn "+(turn+1), 8, 38);

  } else if (gameState === "combatEnemyTurn") {
    if (timeInPhase == 0) {
      // apply poisons
      for (let i = 0; i < targetStatuses.length; i++) {
        if (targetStatuses[i][0] === "poison") {
          enemy.health -= targetStatuses[i][1];
          targetStatuses[i][1]--;
          new Audio("./mus/goop.wav").play();
          if (targetStatuses[i][1] <= 0) targetStatuses.splice(i, 1);
          break;
        }
        
      }
      for (let i = 0; i < targetStatuses.length; i++) {
        if (targetStatuses[i][0] === "dynamite") {
          new Audio("./mus/grapple.ogg").play();
          targetStatuses[i][1]--;
          if (targetStatuses[i][1] <= 0) {
            targetStatuses.splice(i, 1);
            new Audio("./mus/boom.mp3").play();
            takeDamage("target",40);
          }
          break;
        }
      }
      // superledge
      let superledge = 0;
      for (let i = 0; i < targetStatuses.length; i++) {
        if (targetStatuses[i][0] === "superledge") {
          superledge = targetStatuses[i][1];
          continue;
        }
      }
      if (superledge > 0) {
        // add 1 shank for each
        for (let i = 0; i < superledge; i++) {
          setTimeout(function(){
            useCard("target","Shank",false)
          },100+i*100)
        } 
      }
      for (let i = 0; i < playerStatuses.length; i++) {
        if (playerStatuses[i][0] === "stun") {
          playerStatuses.splice(i,1);
          i--;
          continue;
        }
        if (playerStatuses[i][0] === "weak") {
          // decrement
          playerStatuses[i][1]--;
          if (playerStatuses[i][1] <= 0) {
            playerStatuses.splice(i,1);
            i--;
            continue;
          }
        }
      }
    }
    timeInPhase+=1/60;
    if (timeInPhase > 2.5) {
      gameState = "combatInitTurn";
      turn++;
    }
    if (timeInPhase > 1.5 && timeInPhase < 2) {
      timeInPhase += 0.5;
      console.log(targetStatuses.map(x=>x[0]))
      if (targetStatuses.map(x=>x[0]).indexOf("stun") == -1) useCard("target", enemy.moves[turn%enemy.moves.length]+(hard?"+":""), false)
    }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "#00ff00";
    ctx.drawImage(document.getElementById("morbius"), canvas.width / 5-125, canvas.height / 3-75, 250, 250);
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ff0000";
    let hpString = "HP: "+health+"/"+69;
    ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85);
    hpString = playerStatuses.map(status => status[0] + ": " + status[1]).join(", ");
    ctx.fillStyle = "white";
    ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85+250+40);
    ctx.fillStyle = "orange";
    hpString = 'Gold: '+gold;
    if (enemy.name === "Busyness Man" && realDeck.indexOf("Grappling Hook") != -1) ctx.fillText(hpString, canvas.width / 5 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85-20);
    // draw orange circle top right of player
    ctx.beginPath();
    ctx.arc(canvas.width / 5 + 75, canvas.height / 3 - 95, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "25px Arial";
    ctx.fillText(energy, canvas.width / 5 + 75 - ctx.measureText(energy).width/2, canvas.height / 3 - 85);
    hpString = "HP: "+enemy.health+"/"+enemy.maxhp;
    ctx.fillStyle = "#ff0000";
    ctx.font = "20px Arial";
    ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85);
    ctx.fillStyle = "orange";
    if (enemy.name === "Busyness Man") {
      hpString = 'Gold: '+enemy.gold;
      ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85-20);
    }
    hpString = targetStatuses.map(status => status[0] + ": " + status[1]).join(", ");
    ctx.fillStyle = "white";
    ctx.fillText(hpString, 3 * canvas.width / 4 - ctx.measureText(hpString).width/2, canvas.height / 3 - 85+250+40);


    // draw enemy
    ctx.drawImage(document.getElementById("enemy-"+enemy.name), canvas.width - canvas.width / 4-125, canvas.height / 3-75, 250, 250);
    ctx.globalAlpha = 0.8;
    if (timeInPhase <= 1.5) drawCard(canvas.width - canvas.width / 4+125+25, canvas.height / 3-75+35, enemy.moves[turn%enemy.moves.length]+(hard?"+":""),false,
      targetStatuses.map(x=>x[0]).indexOf("stun") != -1);
    ctx.globalAlpha = 1;

    // draw deck and discard size
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText("Deck (" + deck.length + ")", 200, canvas.height / 3 - 105);
    ctx.fillText("Discard (" + discard.length + ")", 200, canvas.height / 3 - 85);
    ctx.textAlign = "left";

    ctx.font = "50px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Enemy Turn", timeInPhase * canvas.width- ctx.measureText("Enemy Turn").width, canvas.height/2 - 30);

    ctx.font = "30px Arial";
    ctx.fillText("Turn "+(turn+1), 8, 38);
  } else if (gameState === "getCard") {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "white";
    ctx.font = "150px Arial";
    ctx.fillText("Congratulation", canvas.width / 2 - ctx.measureText("Congratulation").width/2, canvas.height / 2 - 150);
    ctx.font = "50px Arial";
    ctx.fillText("Select a card", canvas.width / 2 - ctx.measureText("Select a card").width/2, canvas.height / 2 - 50);
    for (card in cardDrops) {
      drawCard(canvas.width / 2 + (card - cardDrops.length / 2) * 200 + 40, canvas.height / 2 + 50, cardDrops[card], true);
    }
  } else if (gameState === "rest") {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "white";
    ctx.font = "80px Arial";
    ctx.fillText("It's restin' time", canvas.width / 2 - ctx.measureText("It's restin' time").width/2, canvas.height / 2 - 150);
    ctx.font = "50px Arial";
    ctx.fillText("Pick an option", canvas.width / 2 - ctx.measureText("Pick an option").width/2, canvas.height / 2 - 50);
    ctx.font = "40px Arial";
    ctx.fillText(`1. Heal 7 hp (${health} -> ${health >= 62 ? 69 : health+7})`, canvas.width / 2 - ctx.measureText(`1. Heal 7 hp (${health} -> ${health >= 62 ? 69 : health+7})`).width/2, canvas.height / 2 + 10);
    ctx.fillText("2. Upgrade a card", canvas.width / 2 - ctx.measureText("2. Upgrade a card").width/2, canvas.height / 2 + 50);
    ctx.fillText("3. Destroy a card", canvas.width / 2 - ctx.measureText("3. Destroy a card").width/2, canvas.height / 2 + 90);
  } else if (gameState === "upgrade") {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "white";
    ctx.font = "80px Arial";
    ctx.fillText("Upgrade", canvas.width / 2 - ctx.measureText("Upgrade").width/2, canvas.height / 2 - 250);
    ctx.font = "50px Arial";
    ctx.fillText("Pick a card", canvas.width / 2 - ctx.measureText("Pick a card").width/2, canvas.height / 2 - 175);
    ctx.font = "30px Arial";
    ctx.fillText("< > to select, space to pick", canvas.width / 2 - ctx.measureText("< > to select, space to pick").width/2, canvas.height / 2 - 145);
    for (card in realDeck) {
      drawCard(canvas.width/2+(card - selupcard-0.5)*160, canvas.height - 480, realDeck[card], true, false);
    }
    ctx.globalAlpha = 0.8;
    if (realDeck[selupcard].indexOf("+") == -1) drawCard(canvas.width/2-0.5*160, canvas.height - 280, realDeck[selupcard]+"+", true, false);
    ctx.globalAlpha = 1;
  } else if (gameState === "destroy") {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "white";
    ctx.font = "80px Arial";
    ctx.fillText("Destroy", canvas.width / 2 - ctx.measureText("Destroy").width/2, canvas.height / 2 - 150);
    ctx.font = "50px Arial";
    ctx.fillText("Pick a card", canvas.width / 2 - ctx.measureText("Pick a card").width/2, canvas.height / 2 - 75);
    ctx.font = "30px Arial";
    ctx.fillText("< > to select, space to delete", canvas.width / 2 - ctx.measureText("< > to select, space to delete").width/2, canvas.height / 2 - 45);
    for (card in realDeck) {
      drawCard(canvas.width/2+(card - selupcard-0.5)*160, canvas.height - 380, realDeck[card], true, false);
    }
  } else if (gameState === "win") {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "white";
    ctx.font = "160px Arial";
    ctx.fillText("You win good job", canvas.width / 2 - ctx.measureText("You win good job").width/2, canvas.height / 2 + 50);
    ctx.font = "80px Arial";
    ctx.fillText("Difficulty: "+diffstring, canvas.width / 2 - ctx.measureText("Difficulty: "+diffstring).width/2, canvas.height / 2 + 130);
    ctx.globalAlpha = 1;
    save = {};
    localStorage.removeItem("ata-save");
  } else if (gameState === "gameOver") {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "white";
    ctx.font = "100px Arial";
    ctx.fillText("Bozo detected ! !! ! ! ! !", canvas.width / 2 - ctx.measureText("Bozo detected ! !! ! ! ! !").width/2, canvas.height / 2 + 50);
    ctx.font = "80px Arial";
    ctx.fillText("Difficulty: "+diffstring, canvas.width / 2 - ctx.measureText("Difficulty: "+diffstring).width/2, canvas.height / 2 + 130);
    ctx.globalAlpha = 1;
    save = {};
    localStorage.removeItem("ata-save");
  }
}
setInterval(update, 1000/60);

document.addEventListener("keydown", (e)=>{
  switch (e.key) {
    case "ArrowLeft":
      arrowsHeld.left = true;
      break;
    case "ArrowRight":
      arrowsHeld.right = true;
      break;
    case "ArrowUp":
      arrowsHeld.up = true;
      break;
    case "ArrowDown":
      arrowsHeld.down = true;
      break;
  }
  if (gameState === "menu") {
    if (e.key === " ") {
      gameState = "map";
      deckScroll = 0;
      hard = false;
      gambler = false;
      diffstring = "Normal";
      doSave();
    } else if (e.key.toLowerCase() === "h") {
      gameState = "map";
      deckScroll = 0;
      hard = true;
      realDeck.pop();
      realDeck.push("Block");
      diffstring = "Hard";
      doSave();
    } else if (e.key.toLowerCase() === "g") {
      gameState = "map";
      deckScroll = 0;
      hard = false;
      gambler = true;
      diffstring = "Gambler";
      realDeck = ["Gambler's Glove","Gambler's Glove","Gambler's Glove","Gambler's Glove","Gambler's Glove"]
      doSave();
    } else if (e.key.toLowerCase() === "m") {
      gameState = "map";
      deckScroll = 0;
      hard = true;
      gambler = false;
      diffstring = "True Morber";
      realDeck = ["Morb","Morb","Morb","Morb","Morb","Block","Block","Block","Block","Block"]
      doSave();
    } else if (e.key.toLowerCase() === "s") {
      // load save game or someshit
      gameState = "map";
      deckScroll = 0;
      hard = save.hard;
      gambler = save.gambler;
      diffstring = save.diffstring;
      realDeck = save.deck;
      health = save.health;
      map = save.map;

    }
  } else if (gameState === "map") {
    if (e.key === " ") {
      turn = 0;
      gameState = map[0];
    }
  } else if (gameState === "combatPlayerTurn") {
    if (e.key === "p") {
      gameState = "combatDiscardHand";
      timeInPhase = 0;
    }
    console.log(e.keyCode);
    if (e.keyCode >= 49 && e.keyCode <= 58 && timeInPhase > 0.5) {
      let numPressed = e.keyCode - 48;
      // get amt of stun
      let stun = 0;
      for (let i = 0; i < playerStatuses.length; i++) {
        if (playerStatuses[i][0] === "stun") {
          stun += playerStatuses[i][1];
        }
      }
      if (numPressed <= hand.length && numPressed != 0) {
        let card = hand[numPressed-1];
        // check if we can afford it
        let cardCost = getCard(card).cost;
        if (card.indexOf("+") != -1) cardCost = getCard(card).costUpgraded;
        let cardExhaust = getCard(card).exhaust;
        if (cardCost <= energy && stun < numPressed) {
          // play card
          hand.splice(numPressed-1, 1);
          energy -= cardCost;
          useCard("self", card);
          if (!cardExhaust) discard.push(card);
        }
      }
    }
  } else if (gameState === "getCard") {
    if (e.key === "1") {
      realDeck.push(cardDrops[0]);
      gameState = "map";
      map.shift();
      doSave();
    } else if (e.key === "2") {
      realDeck.push(cardDrops[1]);
      gameState = "map";
      map.shift();
      doSave();
    } else if (e.key === "3") {
      realDeck.push(cardDrops[2]);
      gameState = "map";
      map.shift();
      doSave();
    }
  } else if (gameState === "rest") {
    if (e.key === "1") {
      health += 7;
      if (health > 69) health = 69;
      gameState = "map";
      map.shift();
      doSave();
    } else if (e.key === "2") {
      gameState = "upgrade";
      selupcard = 0;
    } else if (e.key === "3") {
      gameState = "destroy";
      selupcard = 0;
    }
  } else if (gameState === "upgrade") {
    if (e.key === "Escape") {
      gameState = "rest";
    } else if (e.key === "ArrowLeft") {
      selupcard--;
      if (selupcard < 0) selupcard = realDeck.length - 1;
    } else if (e.key === "ArrowRight") {
      selupcard++;
      if (selupcard >= realDeck.length) selupcard = 0;
    } else if (e.key === " ") {
      if (realDeck[selupcard].indexOf("+") == -1) {
        realDeck[selupcard] += "+";
        gameState = "map";
        map.shift();
        doSave();
      }
    }
  } else if (gameState === "destroy") {
    if (e.key === "Escape") {
      gameState = "rest";
    } else if (e.key === "ArrowLeft") {
      selupcard--;
      if (selupcard < 0) selupcard = realDeck.length - 1;
    } else if (e.key === "ArrowRight") {
      selupcard++;
      if (selupcard >= realDeck.length) selupcard = 0;
    } else if (e.key === " ") {
      realDeck.splice(selupcard, 1);
      gameState = "map";
      map.shift();
      doSave();
    }
  }
});
document.addEventListener("keyup", (e)=>{
  switch (e.key) {
    case "ArrowLeft":
      arrowsHeld.left = false;
      break;
    case "ArrowRight":
      arrowsHeld.right = false;
      break;
    case "ArrowUp":
      arrowsHeld.up = false;
      break;
    case "ArrowDown":
      arrowsHeld.down = false;
      break;
  }
});