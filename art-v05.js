/* Projeto Ascensão — Arte orgânica 0.5: ilustrações em canvas, sem dependências externas */
(function(root){
'use strict';
const TAU=Math.PI*2;
const cache={};
const palette={
  steel:['#e2e5db','#718d98','#27394b'],
  gold:['#fff2bb','#d6ad65','#795a33'],
  obsidian:['#728393','#30394a','#141b2d']
};
function G(c,x,y,r,colors){let g=c.createRadialGradient(x-r*.23,y-r*.3,1,x,y,r);for(let i=0;i<colors.length;i++)g.addColorStop(i/(colors.length-1),colors[i]);return g}
function L(c,x1,y1,x2,y2,colors){let g=c.createLinearGradient(x1,y1,x2,y2);for(let i=0;i<colors.length;i++)g.addColorStop(i/(colors.length-1),colors[i]);return g}
function smooth(c,points,fill,outline,width=1.4){const n=points.length;if(n<3)return;c.beginPath();let last=points[n-1],first=points[0];c.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);for(let i=0;i<n;i++){let p=points[i],next=points[(i+1)%n];c.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2)}c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(outline){c.lineJoin='round';c.strokeStyle=outline;c.lineWidth=width;c.stroke()}}
function vein(c,pts,color,width=1.5){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++){let p=pts[i];if(p.length===4)c.quadraticCurveTo(p[0],p[1],p[2],p[3]);else c.lineTo(p[0],p[1])}c.lineWidth=width;c.lineCap='round';c.strokeStyle=color;c.stroke()}
function orb(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,r,r,0,0,TAU);c.fill()}
function light(c,x,y,r,color){let g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function bristle(c,x,y,dx,dy,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y+dy);c.stroke()}
function rng(seed){let s=seed;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
function etch(c,seed,count,x1,y1,x2,y2,colors){let R=rng(seed);for(let i=0;i<count;i++){let x=x1+R()*(x2-x1),y=y1+R()*(y2-y1),d=R()*4+1;bristle(c,x,y,d*.2,-d,colors[(R()*colors.length)|0],.4+R()*.65)}}
function drawHero(c,frame){
 const v=frame?.9:-.9;
 c.lineJoin='round';c.lineCap='round';
 // Underscape: painted torn blue cloak with soft irregular silhouette
 light(c,0,-14,62,'#6ca7dc24');
 smooth(c,[[-14,-29],[-23,-23],[-29,-9],[-38+v,17],[-31,35],[-17,28],[-11,39],[-4,29],[5,37],[15,25],[28,32],[27,13],[20,-12],[13,-28]],L(c,-15,-35,22,38,['#5b7e9c','#293d64','#192746']), '#091523',2.5);
 smooth(c,[[-16,-16],[-26,0],[-28,20],[-17,22],[-10,29],[-10,14],[-5,-9]],L(c,-22,-16,-7,29,['#7896b8','#304a73','#172946']),null);
 smooth(c,[[10,-14],[23,-5],[24,21],[17,24],[11,32],[5,20]],L(c,4,-14,24,35,['#627e98','#314668','#142339']),null);
 for(let i=0;i<8;i++)bristle(c,-25+i*6,19+i%2*3,1,5,'#b1b8b62b',.8);
 // Boots and greaves have rounded profiles, buckles and leather
 smooth(c,[[-17,5],[-8,5],[-4,21],[-6,31],[-18,31],[-18,20]],L(c,-17,0,-5,29,['#738496','#35495b','#172639']),'#0b1628',2);
 smooth(c,[[5,7],[16,8],[20,26],[17,31],[6,30],[4,19]],L(c,4,8,20,31,['#879aa8','#3b4d5d','#192635']),'#0b1628',2);
 smooth(c,[[-18,28],[-6,27],[-4,34],[-12,36],[-22,33]],'#394b55','#9bb1b94e',1.1);
 smooth(c,[[6,28],[19,28],[23,34],[12,37],[3,33]],'#3a4c56','#9bb1b94e',1.1);
 // Leather tunic with curved breastplate, straps
 smooth(c,[[-15,-24],[-6,-29],[9,-28],[17,-19],[17,3],[10,17],[-8,15],[-18,1]],L(c,-18,-23,20,19,['#24394c','#7b909f','#3b5068','#1a293e']),'#16263d',2.6);
 smooth(c,[[-12,-20],[0,-26],[12,-20],[11,-4],[5,9],[-7,7],[-15,-7]],L(c,-10,-24,16,14,['#d7dcda','#8ca7b3','#3c6275','#2b4659']),'#1c3045',1.8);
 smooth(c,[[-5,-18],[3,-20],[8,-12],[3,4],[-3,8],[-9,-8]],L(c,-7,-20,10,9,['#e9e5d8','#7897a4','#455e70']),'#5b8290',.9);
 vein(c,[[-12,-12],[-6,-5],[4,3],[11,-7]],'#e8f0ee8a',1.1);
 vein(c,[[-13,1],[-4,11],[9,12],[14,3]],'#121e31aa',2.5);
 smooth(c,[[-18,-2],[-8,-1],[12,-4],[17,2],[14,8],[-11,9],[-18,4]],L(c,-18,0,17,6,['#80613e','#d8ad69','#6d4d34']),'#1c2130',1.3);
 smooth(c,[[-3,-1],[5,-1],[6,7],[-4,7]],L(c,-3,0,6,7,['#fff5ca','#d7aa5d','#634c2f']), '#f7dda3',1);
 orb(c,1,3,2,'#e2bd75');
 // Rounded pauldrons, forearms with individual reflective highlights
 smooth(c,[[-23,-27],[-15,-33],[-7,-28],[-8,-17],[-17,-11],[-28,-16]],L(c,-25,-31,-9,-10,['#eff1e6','#8aa5ae','#3f5b6b']),'#203344',2);
 smooth(c,[[8,-29],[17,-34],[26,-25],[28,-16],[18,-13],[8,-18]],L(c,8,-34,27,-14,['#f6ecd1','#a5b6bd','#456275']),'#203344',2);
 vein(c,[[-21,-22],[-15,-28],[-11,-24]],'#f8f7edb4',1);
 vein(c,[[12,-26],[18,-28],[23,-19]],'#fff3d7a1',1);
 smooth(c,[[-25,-14],[-15,-13],[-14,1],[-21,10],[-29,1]],L(c,-26,-16,-16,11,['#bdc9c9','#4d6679','#2a3d50']),'#192b3a',1.6);
 smooth(c,[[18,-12],[28,-12],[29,1],[21,10],[16,2]],L(c,18,-15,30,11,['#d2cfba','#788d96','#354960']),'#192b3a',1.6);
 smooth(c,[[-26,3],[-19,5],[-18,13],[-23,18],[-30,12]],'#4d6172','#26364a',1.5);
 smooth(c,[[21,4],[27,4],[30,13],[24,18],[20,12]],'#acb9b5','#41546a',1.5);
 // Neck, expressive hood and protective helmet with softened contours
 smooth(c,[[-13,-34],[-12,-44],[-5,-52],[7,-53],[16,-44],[15,-33],[7,-28],[-7,-28]],L(c,-9,-54,16,-28,['#b4c5ce','#536b80','#263954']),'#19283a',2.2);
 smooth(c,[[-9,-40],[-6,-47],[3,-50],[12,-44],[12,-35],[7,-30],[-7,-31]],L(c,-10,-45,13,-30,['#142136','#0b1729','#2f4558']),'#8aa4af',1);
 smooth(c,[[-16,-43],[-9,-54],[0,-59],[10,-55],[17,-43],[12,-39],[0,-42],[-12,-39]],L(c,-10,-56,15,-42,['#f0e8d4','#849fad','#355368']),'#334e62',1.9);
 smooth(c,[[-2,-54],[0,-66],[4,-54],[1,-39]],L(c,-2,-62,5,-39,['#fff5bf','#cc994f','#775d38']),'#554c42',1);
 smooth(c,[[-13,-38],[-4,-41],[6,-41],[14,-36],[11,-31],[-11,-31]],'#37495c','#889da9',1);
 // Face slit with luminous ice-blue eyes; avoid dots as the visual silhouette
 vein(c,[[-8,-37],[-4,-39],[0,-37]],'#a1f4f4',1.8);vein(c,[[2,-37],[7,-39],[10,-37]],'#a1f4f4',1.8);
 light(c,0,-38,14,'#5de7ed32');
 // Cape clasp and leather straps
 vein(c,[[-13,-27],[-4,-21],[8,-14]],'#4e3e34',3);
 orb(c,-10,-25,3,'#e9c17c');orb(c,9,-21,2,'#d2a76b');
 // Ornate curved sword, separate pommel, grip, and sharpened glowing blade
 smooth(c,[[24,13],[29,12],[35,-16],[32,-38],[36,-51],[41,-35],[40,-9],[31,18]],L(c,30,-48,42,14,['#f9ffff','#c6e4e9','#7997b0']),'#34495a',1.4);
 vein(c,[[36,-43],[35,-15],[29,11]],'#ffffffb0',1.1);
 smooth(c,[[21,10],[42,7],[43,12],[21,15]],L(c,20,7,43,15,['#f4d99c','#b4874c','#674d31']),'#58422a',1);
 vein(c,[[28,14],[26,22]],'#6e4d35',4);orb(c,25,23,3,'#e2ba6f');
 // Detail sparks, directional cloth seams and speckled brushwork
 etch(c,311+frame*7,44,-24,-27,25,21,['#ffffff20','#0d203022','#c9dce42b']);
}
function drawWraith(c,frame){
 const w=frame?3:-3;c.lineCap='round';light(c,0,-10,60,'#80bce227');
 // smoke tendrils are ribbonlike, not disconnected geometric limbs
 smooth(c,[[-17,-21],[-26,-10],[-30+w,4],[-22,25],[-14,19],[-12,32],[0,23],[10,31],[14,19],[26,25],[28+w,0],[21,-16]],L(c,-18,-29,25,29,['#b3c2cd','#637c96','#283c5b','#17263e']),'#17263b',1.8);
 smooth(c,[[-14,-26],[-23,-14],[-18,4],[-10,14],[-1,25],[6,5],[15,-19],[9,-30]],L(c,-17,-26,12,20,['#647e99','#253755','#111d35']),null);
 smooth(c,[[-12,-30],[-8,-42],[1,-46],[13,-38],[16,-25],[12,-13],[-11,-12]],L(c,-9,-45,16,-13,['#d6d8c4','#66798b','#34465b']),'#1d3145',1.7);
 smooth(c,[[-9,-33],[-5,-39],[4,-41],[11,-34],[9,-19],[-11,-18]],'#101a2b','#45576c',1.3);
 // Hollow skull shape and eyes with stretched angled shapes
 smooth(c,[[-8,-29],[0,-33],[9,-27],[8,-20],[2,-17],[-5,-20]],'#b5bbbc','#465b6d',1.2);
 smooth(c,[[-9,-27],[-1,-26],[-3,-22],[-9,-23]],'#f17b80');
 smooth(c,[[3,-26],[10,-28],[9,-23],[4,-22]],'#ef6972');
 light(c,0,-26,26,'#f2517452');
 vein(c,[[-2,-19],[0,-15],[3,-19]],'#263445',1.4);
 smooth(c,[[-20,-10],[-34,-2],[-30,12],[-23,13],[-18,6]],'#7f95a6','#34475d',1.3);
 smooth(c,[[19,-10],[32,-2],[29,13],[22,13],[17,6]],'#8da3b1','#35465e',1.3);
 for(let k=-1;k<=1;k++){let off=k*3;vein(c,[[-28+off,10],[-36+off,17],[-32+off,23]],'#b5c1c5',1.8);vein(c,[[28+off,10],[35+off,17],[31+off,24]],'#bec9c9',1.8)}
 for(let k=0;k<8;k++){let y=3+k*3;vein(c,[[-11,y],[-6+Math.sin(k)*3,y+7]],'#a5b7d120',.8)}
 etch(c,21+frame*17,26,-18,-15,18,24,['#dae9e017','#9ab3c51c']);
}
function drawHound(c,frame){
 let f=frame?2:-2;light(c,0,0,57,'#ec7a3630');
 // Beast face is canine, with ears and long muzzle; forelimbs and back legs.
 smooth(c,[[-25,10],[-30,0],[-19,-18],[-9,-29],[13,-24],[26,-9],[30,12],[20,24],[-16,25]],L(c,-20,-27,24,28,['#b88463','#714339','#442b3b','#201f31']),'#2c2530',2.2);
 smooth(c,[[-19,-11],[-34,-37],[-20,-47],[-7,-28]],L(c,-31,-44,-9,-16,['#e3aa73','#9a573f','#462937']),'#432739',1.7);
 smooth(c,[[17,-13],[33,-39],[20,-47],[6,-26]],L(c,15,-45,34,-19,['#daa574','#87513d','#452936']),'#432739',1.7);
 smooth(c,[[-23,-35],[-28,-39],[-18,-39],[-14,-31]],'#412636');
 smooth(c,[[20,-33],[25,-40],[18,-40],[13,-31]],'#422638');
 smooth(c,[[-20,-21],[-14,-31],[0,-33],[14,-27],[19,-18],[12,-5],[-9,-4]],L(c,-18,-29,15,-2,['#b47854','#7e493e','#352739']),'#583940',1.4);
 smooth(c,[[-13,-17],[-1,-24],[12,-18],[16,-9],[11,0],[2,8],[-9,1]],L(c,-8,-22,13,8,['#d4a17b','#915f4d','#4b3640']),'#513640',1.5);
 // Snout and jaws organic with sharp silhouette
 smooth(c,[[-8,-12],[1,-16],[10,-11],[9,-3],[4,2],[-5,1]],'#d6a07e','#5b433b',1.2);
 smooth(c,[[-5,-5],[6,-5],[4,2],[0,5],[-6,0]],'#2d202d');
 smooth(c,[[-2,-5],[3,-5],[2,-2],[-1,-2]],'#141823');
 for(let i=-1;i<=1;i++){let x=i*6;vein(c,[[x,-2],[x+2,4]],'#f9dec1',1.5)}
 smooth(c,[[-17,-20],[-9,-23],[-4,-17],[-8,-14],[-16,-14]],'#ffad58');
 smooth(c,[[6,-18],[14,-23],[19,-19],[16,-14],[8,-13]],'#ffb261');
 light(c,-11,-18,15,'#ffb55c72');light(c,13,-18,15,'#ffb55c72');
 smooth(c,[[-22,4],[-29,13+f],[-35,23],[-24,25],[-15,15]],'#845443','#392935',1.4);
 smooth(c,[[18,4],[28,12-f],[35,24],[25,25],[15,15]],'#a06c50','#442b34',1.4);
 for(let i=0;i<3;i++){let q=i*4;vein(c,[[-32+q,24],[-34+q,30]],'#ecd4ad',1.7);vein(c,[[31-q,24],[34-q,30]],'#ecd4ad',1.7)}
 smooth(c,[[-13,15],[-21,24],[-15,31],[-6,24]],'#5d3a38','#352a36',1);
 smooth(c,[[13,15],[22,24],[17,31],[6,24]],'#67463e','#352a36',1);
 etch(c,41+frame*9,25,-20,-18,20,24,['#ffca9d22','#271c252d']);
}
function drawSentinel(c,frame){
 light(c,0,-8,67,'#78d9b52a');
 // Ancient living stone, asymmetrical eroded joints with moss
 smooth(c,[[-16,-30],[-26,-17],[-32,8],[-21,23],[-4,30],[19,23],[28,7],[23,-23],[7,-35]],L(c,-20,-35,26,28,['#9bada7','#526a6d','#273b49','#172a39']),'#18303a',2.4);
 smooth(c,[[-17,-29],[-12,-38],[-1,-44],[16,-37],[21,-27],[13,-17],[-16,-17]],L(c,-17,-43,18,-18,['#b1b5a7','#6f8783','#304e51']),'#29434a',1.8);
 smooth(c,[[-22,-16],[-11,-22],[2,-16],[15,-23],[25,-8],[19,10],[2,18],[-17,12]],L(c,-20,-20,20,20,['#abc2ad','#5c7773','#2b454d']),'#29434a',2);
 smooth(c,[[-8,-14],[3,-21],[13,-11],[6,5],[-5,10],[-14,-1]],'#395d5d','#8ca8a0',1.5);
 smooth(c,[[-6,-7],[0,-16],[8,-9],[6,5],[-4,6]],L(c,-2,-16,6,6,['#e4f9c9','#78d4c0','#1d7f86']),'#9cebd0',1.5);
 vein(c,[[-23,-5],[-10,1],[-4,13],[9,14]],'#182f39',2.2);
 vein(c,[[12,-24],[8,-12],[18,-6]],'#cfe4bd83',1.6);
 smooth(c,[[-30,-21],[-40,-9],[-36,9],[-28,19],[-16,9],[-19,-14]],'#718985','#314d50',2);
 smooth(c,[[25,-21],[40,-9],[39,8],[30,22],[17,10],[17,-13]],'#698280','#314b52',2);
 smooth(c,[[-33,10],[-39,20],[-30,26],[-20,18]],'#9ba99a','#455d5e',1.8);
 smooth(c,[[32,10],[41,20],[33,26],[21,18]],'#849b8e','#445d5e',1.8);
 smooth(c,[[-17,18],[-20,31],[-12,37],[1,31],[2,20]],'#6d817d','#2b434d',2);
 smooth(c,[[17,18],[20,31],[12,37],[-1,31],[-2,20]],'#81948b','#2b434d',2);
 smooth(c,[[-10,-31],[-2,-34],[-1,-27],[-10,-25]],'#162f37');
 smooth(c,[[4,-32],[11,-35],[12,-27],[4,-26]],'#173137');
 orb(c,-6,-29,2.5,'#aaffdf');orb(c,8,-30,2.5,'#aaffdf');
 // Moss trails and scratches are painterly rather than squares
 for(let i=0;i<16;i++){let x=-24+i*3.1,y=-24+Math.sin(i*2)*5;vein(c,[[x,y],[x+2,y-3]],i%3?'#638c68a0':'#a6c78580',1.5)}
 etch(c,301+frame*15,46,-30,-28,30,31,['#d3dbbb1c','#112e352b','#638a6d55']);
}
function drawBoss(c,frame){
 let f=frame?3:-3;light(c,0,-16,111,'#c66fff35');
 // Massive cloak with flowing spectral tendrils
 smooth(c,[[-35,-36],[-55,-23],[-60,1],[-70+f,35],[-55,44],[-45,29],[-33,58],[-15,42],[0,63],[17,44],[39,59],[45,27],[58,42],[64,-5],[46,-36]],L(c,-45,-63,39,56,['#7e648f','#432c5b','#1b1b3e','#281b38']),'#231630',2.5);
 smooth(c,[[-44,-29],[-50,9],[-45,34],[-25,42],[-20,18],[-26,-23]],L(c,-43,-26,-19,42,['#947a9e','#402751','#211b38']),null);
 smooth(c,[[35,-30],[51,8],[49,37],[28,46],[20,15],[27,-24]],L(c,20,-24,52,45,['#886d92','#3a2752','#211b3d']),null);
 // Horns organic, bent like curved antlers
 smooth(c,[[-23,-65],[-42,-86],[-46,-115],[-59,-101],[-54,-74],[-38,-52]],L(c,-53,-109,-29,-49,['#e8d7c1','#8a8494','#4d4c65']),'#423650',2.2);
 smooth(c,[[20,-64],[40,-88],[41,-111],[56,-98],[53,-72],[37,-48]],L(c,31,-110,55,-50,['#eee0c4','#8c879c','#4a4762']),'#423650',2.2);
 vein(c,[[-54,-101],[-48,-75],[-37,-56]],'#fcf3e6a1',1.6);
 vein(c,[[53,-96],[47,-76],[35,-53]],'#fcf3e6a1',1.6);
 // Heavy shoulders curve around frame; weathered engraved armor
 smooth(c,[[-42,-57],[-27,-70],[-10,-62],[-4,-40],[-19,-21],[-42,-24],[-54,-38]],L(c,-47,-64,-10,-27,['#c1b9b0','#687f94','#303d60']),'#26314c',2.5);
 smooth(c,[[42,-57],[27,-70],[10,-62],[4,-40],[19,-21],[42,-24],[54,-38]],L(c,9,-69,56,-25,['#c9bca9','#72859b','#323b5c']),'#26314c',2.5);
 smooth(c,[[-23,-53],[-12,-59],[14,-60],[27,-50],[29,7],[15,42],[-12,40],[-31,8]],L(c,-24,-53,30,38,['#a4a9b2','#62798b','#394862','#212b48']),'#1b2841',3);
 smooth(c,[[-18,-49],[-1,-55],[20,-44],[19,-11],[6,21],[-17,12]],L(c,-11,-54,23,20,['#d1c2ab','#8a9fac','#3e5574']),'#32415b',1.8);
 // Bright central fractured soul gem
 smooth(c,[[-11,-33],[3,-52],[16,-31],[12,-6],[1,16],[-13,-5]],L(c,-8,-49,17,20,['#fff2cf','#dfaa83','#a25b9c','#59336d']),'#e7cfb2',2);
 smooth(c,[[-3,-32],[3,-43],[11,-31],[4,-12],[-2,-11]],'#ffdaec','#f2eced',1);
 light(c,3,-25,26,'#f5a9f288');
 // Face is a skull hidden behind natural layered helm
 smooth(c,[[-24,-68],[-15,-82],[1,-88],[17,-81],[26,-65],[18,-44],[1,-36],[-17,-44]],L(c,-23,-86,26,-37,['#e3e1d1','#71879d','#34425e']),'#283852',2.4);
 smooth(c,[[-16,-65],[-10,-73],[0,-78],[14,-71],[18,-58],[9,-44],[-10,-44]],'#15213a','#8191a0',1.5);
 smooth(c,[[-12,-60],[-3,-66],[2,-60],[0,-54],[-9,-53]],'#ffa5e8');
 smooth(c,[[5,-61],[15,-67],[16,-56],[7,-53]],'#ffa5e8');
 light(c,0,-59,35,'#e98bff67');
 smooth(c,[[-5,-43],[0,-47],[7,-43],[5,-36],[-4,-36]],'#6b7d8d','#2c3a51',1);
 // Huge gloved arms, claw fingers, ragged shoulder tips
 smooth(c,[[-47,-41],[-61,-25],[-63,-3],[-52,18],[-35,10],[-31,-28]],L(c,-58,-39,-34,18,['#bac1bc','#64788f','#34405b']),'#27304d',2.3);
 smooth(c,[[47,-41],[61,-25],[64,-3],[52,18],[35,10],[31,-28]],L(c,38,-41,59,18,['#bec2c0','#687d8e','#37445a']),'#27304d',2.3);
 for(let i=0;i<3;i++){let x=-48-i*4;vein(c,[[x,14],[x-5,29+i*2]],'#aab5c0',2.3);let xx=48+i*4;vein(c,[[xx,14],[xx+6,27+i*3]],'#c0bccc',2.3)}
 // Stone boots through mantle
 smooth(c,[[-25,32],[-29,48],[-10,53],[-4,41]],'#5e6d7a','#2a3654',1.7);
 smooth(c,[[24,32],[29,48],[10,53],[4,41]],'#667581','#2a3654',1.7);
 etch(c,601+frame*13,73,-45,-65,45,43,['#eee9d824','#09162a28','#d7bdeb25']);
}

function drawProp(c,o,t){
 c.save();c.translate(o.x,o.y);c.rotate(o.rot||0);let s=o.s||1;c.scale(s,s);let seed=Math.floor((o.variant||.2)*1000);
 if(o.type==='rubble'){
  c.fillStyle='#07101892';c.beginPath();c.ellipse(1,15,42,13,0,0,TAU);c.fill();
  smooth(c,[[-41,11],[-39,-1],[-29,-19],[-10,-23],[6,-13],[7,3],[-2,15],[-18,19]],L(c,-27,-23,5,18,['#89978c','#516368','#273e4a']),'#152832',1.5);
  smooth(c,[[2,14],[1,-9],[17,-17],[34,-9],[39,5],[33,18],[16,21]],L(c,4,-14,37,20,['#839289','#4e646b','#253943']),'#142732',1.5);
  vein(c,[[-31,-9],[-13,-16],[3,-7]],'#cfdbbc65',1.2);
  vein(c,[[9,2],[23,-10],[34,-5]],'#b7c4bc4f',1);
  vein(c,[[-22,5],[-14,11],[-7,6]],'#182e34',1.5);
  for(let i=0;i<6;i++){let x=-33+i*12;orb(c,x,12+(i%2)*4,1.4,'#7c9d6f');vein(c,[[x,11],[x+3,6]],'#719772a0',1)}
 }
 if(o.type==='fern'){
  c.fillStyle='#071a1da0';c.beginPath();c.ellipse(0,10,31,8,0,0,TAU);c.fill();
  const R=rng(seed+8);
  for(let i=0;i<9;i++){
   const a=i*TAU/9+o.rot*.2,r=17+R()*16;
   let tx=Math.cos(a)*r,ty=Math.sin(a)*r;
   vein(c,[[0,6],[tx*.45,-3+ty*.35,tx,ty]],'#456b4d',2);
   for(let j=1;j<5;j++){const f=j/5,x=tx*f,y=ty*f+5,sp=(1-f)*7+2;
     let side=i%2?1:-1;
     smooth(c,[[x,y],[x+Math.cos(a+side*.9)*sp*2,y+Math.sin(a+side*.9)*sp*2-2],[x+Math.cos(a)*sp*1.8,y+Math.sin(a)*sp*1.8],[x+Math.cos(a-side*.9)*sp,y+Math.sin(a-side*.9)*sp+1]],L(c,x-8,y-8,x+8,y+8,['#93b482','#567c61','#2b5a50']),null);
   }
  }
  for(let i=0;i<4;i++)orb(c,R()*14-7,R()*10-2,1.5,'#a2bc7a');
 }
 if(o.type==='column'){
  c.fillStyle='#030913ad';c.beginPath();c.ellipse(4,19,45,17,.08,0,TAU);c.fill();
  smooth(c,[[-26,-1],[-31,-9],[-22,-20],[14,-24],[31,-14],[33,6],[23,22],[-24,19]],L(c,-24,-22,29,21,['#abb0a1','#6b807c','#344953']),'#182932',2.5);
  smooth(c,[[-24,-21],[-19,-32],[-11,-38],[9,-42],[23,-36],[28,-23],[19,-11],[-17,-12]],L(c,-19,-42,27,-11,['#d0cfb5','#81938c','#3d555b']),'#283b46',1.8);
  smooth(c,[[-19,-29],[-8,-33],[8,-32],[20,-28],[14,-19],[-13,-19]],'#4b6367','#b0b6a36b',1);
  vein(c,[[-8,-19],[-11,-2],[-2,9]],'#243944',2.6);
  vein(c,[[14,-15],[12,-1],[24,6]],'#a9b3a26e',1);
  for(let i=0;i<7;i++){let x=-25+i*8,y=6+Math.sin(i*3+seed)*9;vein(c,[[x,y],[x-2,y-7]],'#517c5e9f',1.5);orb(c,x,y,2,'#648961')}
 }
 if(o.type==='crystal'){
  c.fillStyle='#04121dac';c.beginPath();c.ellipse(0,17,35,12,0,0,TAU);c.fill();light(c,0,0,45,'#45d9e636');
  smooth(c,[[-17,12],[-13,-4],[-2,-28],[13,-16],[19,9],[9,23],[-10,22]],L(c,-10,-28,18,23,['#b8f4ef','#429fb7','#1b526f','#1b344b']),'#64cfe2',1.8);
  smooth(c,[[-13,-5],[-2,-28],[2,-5],[-1,16],[-10,21]],'#3a91a9','#b4f9ed9e',1);
  smooth(c,[[2,-5],[13,-16],[19,9],[9,23],[-1,16]],'#246681','#8bdbde9c',1);
  smooth(c,[[-30,13],[-24,-11],[-17,13],[-21,22]],'#266a88','#83d4d7',1);
  vein(c,[[-3,-17],[-5,0],[-1,9]],'#dbfffbb8',1.7);
  light(c,0,-15,18,'#bbffff5a');
 }
 if(o.type==='torch'){
  c.fillStyle='#051019ac';c.beginPath();c.ellipse(0,16,28,10,0,0,TAU);c.fill();
  smooth(c,[[-16,8],[-19,3],[-10,-4],[13,-5],[19,8],[12,19],[-8,19]],L(c,-16,-5,19,18,['#a9aaa0','#626f72','#344655']),'#263642',2);
  vein(c,[[-8,9],[3,10],[13,7]],'#bbc2b166',1);
  smooth(c,[[-5,3],[-6,-23],[-4,-27],[5,-27],[7,-21],[5,3]],L(c,-5,-26,7,4,['#ac8657','#4f473f','#32363f']),'#242a32',1.5);
  smooth(c,[[-13,-29],[-10,-36],[10,-37],[14,-29],[8,-24],[-8,-24]],'#8b6c4e','#e1b77a',1.3);
  let f=Math.sin(t*9+o.x*.1)*3;
  light(c,0,-40,47,'#ffac4540');
  smooth(c,[[-7,-32],[-10+f,-44],[-4+f,-54],[1,-67+f],[6,-52],[11-f,-44],[6,-31]],L(c,-4,-66,4,-31,['#fff5ad','#ffb65d','#d6552e']),'#f4a95182',.8);
  smooth(c,[[-3,-34],[-4,-47],[1,-57+f],[5,-42],[3,-34]],'#fff3a9');
 }
 c.restore();
}

const DRAW={hero:drawHero,wraith:drawWraith,hound:drawHound,sentinel:drawSentinel,boss:drawBoss};
const SCALE={hero:1,wraith:.82,hound:.83,sentinel:.93,boss:1.10};
function getSprite(name,frame=0){let key=name+frame;if(cache[key])return cache[key];let size=name==='boss'?240:160;let a=document.createElement('canvas');a.width=a.height=size*2;let c=a.getContext('2d');c.scale(2,2);c.translate(size/2,size/2);c.lineCap='round';c.lineJoin='round';DRAW[name](c,frame);return cache[key]=a}
function softAura(c,x,y,size,color){let g=c.createRadialGradient(x,y,0,x,y,size);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-size,y-size,size*2,size*2)}
function drawHeroLive(c,p,t,game){
 const walk=Math.sin(p.move),bob=Math.sin(t*2)*1.1+walk*1.4,s=1;
 c.save();c.translate(p.x,p.y);
 c.fillStyle='#030b14a5';c.beginPath();c.ellipse(0,21,23,8,0,0,TAU);c.fill();
 if(game){let elemental=game.lightning>0?'#cde7ff2a':game.fire>0?'#f4a44d26':game.ice>0?'#7ff1ff2b':'#e8c67a17';softAura(c,0,-9,62,elemental)}
 c.scale(p.face||1,1);c.translate(0,bob);
 let a=getSprite('hero',Math.sin(p.move)>.2?1:0);c.drawImage(a,-80,-80,160,160);
 if(game&&p.attackPulse>0){let power=p.attackPulse,al=Math.min(1,power/.25);c.save();c.globalAlpha=al;c.rotate(-.3+(.25-power)*4);c.strokeStyle=game.fire>0?'#ffc37a':game.ice>0?'#a5eeff':'#fff4b4';c.lineWidth=2+game.blade*.25;c.shadowColor=c.strokeStyle;c.shadowBlur=14;c.beginPath();c.arc(0,-6,38,-1.38,-.17);c.stroke();c.globalAlpha*=.4;c.beginPath();c.arc(0,-6,43,-1.52,-.12);c.stroke();c.restore()}
 c.restore();
}
function drawEnemyLive(c,e,t,crowd=0){
 c.save();c.translate(e.x,e.y);c.fillStyle='#060c17ba';c.beginPath();c.ellipse(0,e.r*.88,e.r*1.25,e.r*.38,0,0,TAU);c.fill();
 let bob=Math.sin(e.phase)*(e.kind==='wraith'?5:e.kind==='boss'?2.8:1.2);
 if(e.kind==='wraith'&&crowd<45)softAura(c,0,-8,41,'#6e99df20');
 if(e.kind==='boss')softAura(c,0,-30,95,'#b55de83d');
 if(e.kind==='hound'&&crowd<28)softAura(c,0,0,48,'#d6783c12');
 if(e.kind==='sentinel'&&crowd<45)softAura(c,0,0,43,'#77e4b019');
 c.scale(e.face||1,1);
 const name=e.kind in DRAW?e.kind:'wraith',size=name==='boss'?240:160,scale=SCALE[name],pulse=e.flash>0?1.045:1;
 c.scale(scale*pulse,scale*pulse);c.translate(0,bob);
 let frame=Math.sin(e.phase)>.05?1:0;
 let a=getSprite(name,frame);
 c.drawImage(a,-size/2,-size/2,size,size);
 if(e.burn>0){c.globalAlpha=.63+Math.sin(t*16)*.2;softAura(c,0,-8,42,'#ff9d3c61');c.globalAlpha=1}
 if(e.slow>0){c.strokeStyle='#8ceaff9d';c.lineWidth=2.2;c.beginPath();c.ellipse(0,4,24,32,0,0,TAU);c.stroke()}
 if(e.flash>0){c.globalAlpha=Math.min(.42,e.flash*3);c.fillStyle='#fff2cc';c.beginPath();c.ellipse(0,-6,e.r*.9,e.r*1.2,0,0,TAU);c.fill()}
 c.restore();
 if(e.kind==='boss'){c.fillStyle='#06101abf';c.fillRect(e.x-49,e.y-e.r-78,98,8);c.fillStyle='#d99bce';c.fillRect(e.x-49,e.y-e.r-78,98*Math.max(0,e.hp/e.maxHp),8)}
}
root.AscensionArt={drawHero:drawHeroLive,drawEnemy:drawEnemyLive,drawProp:drawProp,prewarm:function(){for(let name of Object.keys(DRAW))for(let frame=0;frame<2;frame++)getSprite(name,frame)}};
})(window);
