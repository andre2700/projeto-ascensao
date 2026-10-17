/* Ascensao 0.6 — personagens articulados: idle, deslocamento, golpe, dano */
(function(root){
'use strict';
const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function grad(c,x,y,x2,y2,stops){let g=c.createLinearGradient(x,y,x2,y2);for(let i=0;i<stops.length;i++)g.addColorStop(i/(stops.length-1),stops[i]);return g}
function radial(c,x,y,r,s){let g=c.createRadialGradient(x-r*.23,y-r*.3,0,x,y,r);for(let i=0;i<s.length;i++)g.addColorStop(i/(s.length-1),s[i]);return g}
function circle(c,x,y,r,col){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=col;c.fill()}
function ell(c,x,y,a,b,col,r=0){c.beginPath();c.ellipse(x,y,a,b,r,0,TAU);c.fillStyle=col;c.fill()}
function shape(c,coords,color,line='#0000',w=1.2){
 c.beginPath();let n=coords.length;let last=coords[n-1],first=coords[0];c.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
 for(let i=0;i<n;i++){let p=coords[i],q=coords[(i+1)%n];c.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2)}
 c.closePath();c.fillStyle=color;c.fill();if(line!=='#0000'){c.lineWidth=w;c.strokeStyle=line;c.stroke()}
}
function curve(c,a,b,cx,cy,color,w=2){c.beginPath();c.moveTo(a[0],a[1]);c.quadraticCurveTo(cx,cy,b[0],b[1]);c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.stroke()}
function bone(c,x1,y1,x2,y2,wide,color,edge,highlight){
 c.lineCap='round';c.lineJoin='round';
 c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=edge;c.lineWidth=wide+2;c.stroke();
 c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=wide;c.stroke();
 if(highlight){c.beginPath();c.moveTo(x1-wide*.24,y1-1);c.lineTo(x2-wide*.26,y2-2);c.strokeStyle=highlight;c.lineWidth=1.3;c.stroke()}
}
function highlight(c,x,y,r,col){c.save();c.shadowColor=col;c.shadowBlur=10;circle(c,x,y,r,col);c.restore()}
function shadow(c,x,y,rx=21,ry=7){ell(c,x,y,rx,ry,'#123c3190')}
function scarf(c,sway,breath){
 shape(c,[[-11,-23],[-23,-16],[-28+sway,4],[-34+sway*1.4,26],[-21+sway,26],[-11,17],[-4,30],[7,20],[19+sway,30],[24+sway*.6,-1],[13,-25]],grad(c,-17,-30,19,30,['#a0bee1','#3c6589','#1b456a','#24456c']),'#234463',1.6);
 curve(c,[-14,-16],[-18+sway,21],-28+sway,3,'#d0e0f247',1.1);
 curve(c,[10,-18],[13+sway,24],20+sway,0,'#b7d3e74d',1.1);
}
function legs(c,step,moving){
 for(let side of [-1,1]){
   const gait=Math.sin(step+(side===1?Math.PI:0))*moving;
   const lift=Math.max(0,-gait)*6,spread=gait*8;
   let hipX=side*8,hipY=7;
   let kneeX=side*10+spread*.58,kneeY=16+lift*.27;
   let footX=side*11+spread,footY=29-lift;
   bone(c,hipX,hipY,kneeX,kneeY,10,grad(c,hipX,hipY,footX,footY,['#677d86','#293f56']), '#20394d','#ccd5cb65');
   bone(c,kneeX,kneeY,footX,footY-3,9,grad(c,kneeX,kneeY,footX,footY,['#758e96','#344b60']), '#1a3545','#b7d8d14d');
   shape(c,[[footX-7,footY-2],[footX+4,footY-5],[footX+10,footY+2],[footX+7,footY+6],[footX-8,footY+5]],'#405562','#1c303d',1.7);
   curve(c,[footX-5,footY],[footX+7,footY+1],footX,footY-2,'#b8b9ad80',.8);
 }
}
function sword(c,ang,charge,fire,ice,shock,slash){
 c.save();c.translate(21,-15);c.rotate(ang);
 bone(c,0,1,3,-10,7,'#745436','#352c2f','#cda76f');
 shape(c,[[-11,-12],[9,-14],[13,-10],[-12,-8]],'#f2c979','#9c753e',1);
 shape(c,[[-3,-13],[-5,-23],[-2,-55],[4,-65],[9,-24],[5,-12]],grad(c,-5,-45,9,-6,['#f8fffd','#cedee0','#83a5b0','#4a768f']),'#a7b9bc',1.3);
 curve(c,[1,-57],[2,-16],2,-35,'#fffde9a8',1.3);
 let elem=fire?'#ffad61':ice?'#8befff':shock?'#e1ecff':'#fff1b5';
 if(charge>0){c.save();c.globalAlpha=charge;c.shadowColor=elem;c.shadowBlur=19;curve(c,[2,-52],[2,-16],2,-38,elem,4);c.restore()}
 c.restore();
 if(slash>0){c.save();c.globalAlpha=slash*.88;c.strokeStyle=elem;c.shadowColor=elem;c.shadowBlur=14;c.lineWidth=3+slash*4;c.lineCap='round';c.beginPath();c.arc(0,-16,49,-1.5+ang*.35,.25+ang*.3);c.stroke();c.lineWidth=1.5;c.globalAlpha=slash*.4;c.beginPath();c.arc(0,-16,56,-1.7+ang*.33,.48+ang*.3);c.stroke();c.restore()}
}
// Herói exclusivamente ilustrado; sem desenho geométrico alternativo.
function hero(){return}

function wraith(c,e,t){
 const phase=e.phase||t*4,sw=Math.sin(phase),flo=Math.sin(phase*.76)*4,attack=(e.attackT||0);
 c.save();c.translate(e.x,e.y);shadow(c,0,16,17,6);c.scale(e.face||1,1);c.translate(0,flo-4);
 let sway=sw*5,up=Math.sin(phase*1.2)*3;
 // spectral cloak licks the ground and billows with five cloth tassels
 shape(c,[[-18,-25],[-28+sway*.7,-10],[-27+sway,9],[-21+sway,19],[-12+sway,12],[-5+sway*.5,24],[3,12],[11+sway*.5,23],[20+sway,10],[27+sway,17],[25+sway*.5,-12],[18,-28]],grad(c,-20,-33,20,25,['#c5dbd5','#8195ae','#566887','#274363']),'#36526a',1.4);
 shape(c,[[-13,-29],[-25,-12],[-18,13],[-8,21],[0,-4]],'#536d8c6b');
 shape(c,[[12,-30],[22,-10],[18,16],[9,21],[4,-4]],'#37527382');
 let arm=sw*6+attack*11;
 bone(c,-16,-13,-25-arm,-2-up,9,'#7c99ad','#3e5778','#bfcfce75');
 bone(c,16,-13,25+arm,3+up,9,'#7291a3','#3e5778','#cfdfcf66');
 for(let h of [-1,1])for(let j=0;j<3;j++){let x=h*(26+arm+3*j),y=7+up+j*3;curve(c,[h*(25+arm),2+up],[x,y+8],h*(26+arm+j),y+2,'#acc2c2',1.3)}
 shape(c,[[-14,-25],[-11,-39],[-2,-47],[9,-43],[17,-28],[10,-14],[-11,-13]],grad(c,-10,-45,16,-13,['#c6cfcd','#889fac','#536784']),'#324d6b',1.4);
 shape(c,[[-11,-30],[-5,-38],[5,-39],[11,-30],[8,-18],[-9,-17]],'#182b46','#8093a4',1);
 shape(c,[[-9,-29],[-1,-33],[-4,-24],[-8,-23]],'#ff8888');
 shape(c,[[1,-32],[9,-29],[8,-23],[3,-23]],'#ff7776');
 c.restore();
}
function hound(c,e,t){
 let ph=e.phase||t*9,cycle=Math.sin(ph),bob=Math.sin(ph*2)*2;
 c.save();c.translate(e.x,e.y);shadow(c,0,18,24,7);c.scale(e.face||1,1);
 // behind legs run out of phase, feet actually change positions
 for(let h of [-1,1]){let s=Math.sin(ph+(h<0?0:Math.PI));bone(c,h*12,4,h*17+s*6,19-Math.max(0,s)*5,8,'#835548','#3b333d','#af806966');bone(c,h*17+s*6,19-Math.max(0,s)*5,h*19+s*11,27-Math.max(0,s)*8,7,'#9b6c52','#523d45','#d3a27e70')}
 c.translate(0,-bob);
 // tail with elastic curve
 curve(c,[13,4],[28+Math.sin(ph*.7)*8,-11],28,-1-Math.cos(ph)*5,'#874d3e',9);
 curve(c,[15,-2],[30+Math.sin(ph*.7)*8,-18],28,-9-Math.cos(ph)*5,'#bb8c63',3);
 shape(c,[[-24,-11],[-19,-27],[-5,-32],[12,-26],[26,-10],[20,13],[0,19],[-21,10]],grad(c,-25,-33,24,23,['#c79a6d','#845447','#53384a','#44313e']),'#513745',1.7);
 // jagged fur tufts dynamically sway without polygonal rigidity
 for(let i=0;i<5;i++){let x=-19+i*8;shape(c,[[x-5,-21],[x+Math.sin(ph+i)*3,-32-(i%2)*5],[x+8,-21]],'#a87457','#664141',.7)}
 // lifted forelegs alternating
 for(let h of [-1,1]){let g=Math.sin(ph+(h<0?Math.PI:0));bone(c,h*15,0,h*23+g*9,16-Math.max(0,g)*5,9,'#ab7555','#503e44','#dbb08680');bone(c,h*23+g*9,16-Math.max(0,g)*5,h*25+g*14,25-Math.max(0,g)*10,6,'#d29a71','#5c4643','#ebc7a47d')}
 // broad neck, moving ears, tongue and jaw
 c.save();c.translate(-10,-22);c.rotate(cycle*.035);
 shape(c,[[-11,1],[-17,-24],[-8,-35],[0,-23],[10,-37],[20,-24],[16,1],[4,14]],grad(c,-14,-35,18,13,['#cba17a','#9e684f','#68413f']),'#643f45',1.5);
 shape(c,[[-15,-22],[-18,-38],[-5,-31]],'#dfac75','#734844',1);
 shape(c,[[9,-29],[21,-42],[20,-21]],'#db9f67','#734844',1);
 shape(c,[[-8,-11],[2,-18],[13,-10],[13,6],[0,11],[-10,5]],'#a97458','#62403d',1);
 shape(c,[[-5,-7],[4,-7],[3,-1],[-3,0]],'#402e36');
 shape(c,[[-8,-14],[-1,-18],[1,-14],[-3,-11]],'#ffc36e');
 shape(c,[[5,-16],[14,-18],[14,-12],[7,-11]],'#ffc36e');
 shape(c,[[-5,4],[6,4],[2,11],[-2,11]],'#dfaa88');
 c.restore();c.restore();
}
function sentinel(c,e,t){
 const ph=e.phase||t*3,walk=Math.sin(ph),sway=Math.sin(ph*.6)*.04;
 c.save();c.translate(e.x,e.y);shadow(c,0,25,25,10);
 // alternating heavy stone boot lift; settle violently every step
 for(let side of [-1,1]){let gait=Math.sin(ph+(side===-1?0:Math.PI)),lift=Math.max(0,gait)*6;
 shape(c,[[side*5,3],[side*19,5],[side*19+gait*6,24-lift],[side*8+gait*6,27-lift],[side*5,17]],grad(c,side*5,3,side*19,27,['#9caba0','#425b5d','#31494b']),'#354b4d',1.7)}
 c.translate(0,Math.cos(ph*2)*1.5);c.rotate(sway);
 bone(c,-18,-22,-28-walk*4,3,17,'#5f7775','#263e43','#a8b4a266');
 bone(c,18,-22,28+walk*4,3,17,'#718980','#263e43','#bac5ac66');
 shape(c,[[-27,-26],[-18,-38],[-1,-41],[19,-34],[28,-21],[22,9],[9,25],[-14,21],[-29,6]],grad(c,-22,-41,23,21,['#c8c9ad','#8a9f94','#4e7373','#304f58']),'#2b4b4b',2);
 shape(c,[[-15,-20],[-6,-28],[11,-24],[20,-14],[17,7],[1,16],[-13,5]],'#486c6c','#a9bbab',1.5);
 shape(c,[[-6,-18],[4,-28],[12,-16],[7,2],[-5,8],[-12,-4]],grad(c,-4,-28,10,8,['#dbf6c7','#7bd6bd','#378587']),'#b7ddc0',1);
 shape(c,[[-12,-33],[-7,-47],[1,-50],[15,-39],[16,-27],[7,-23],[-10,-24]],grad(c,-10,-48,15,-24,['#d2cdb6','#829e98','#4b7278']),'#39545d',1.3);
 shape(c,[[-10,-34],[-2,-36],[-2,-30],[-10,-29]],'#bbffcf');
 shape(c,[[4,-36],[12,-38],[13,-31],[5,-30]],'#bbffcf');
 for(let i=0;i<7;i++){let x=-23+i*6;curve(c,[x,-18+Math.sin(i)*3],[x+2,-25],x+3,-23,'#87ac71',1.2)}
 c.restore();
}
function boss(c,e,t){
 const ph=e.phase||t*2,roll=Math.sin(ph)*.06,reach=Math.sin(ph*.65)*11;
 c.save();c.translate(e.x,e.y);shadow(c,0,41,54,16);c.scale(e.face||1,1);
 c.translate(0,Math.sin(ph*.6)*3);c.rotate(roll);
 shape(c,[[-37,-55],[-53,-37],[-56,-1],[-65+reach*.3,35],[-46,55],[-27,38],[-10,62],[6,39],[23,60],[48,42],[63,19],[51,-32],[30,-56]],grad(c,-32,-70,44,57,['#b9a5bd','#755d87','#432e67','#222845']),'#352346',2);
 // moving massive arms, held towards hero while approaching
 bone(c,-31,-30,-52-reach,6+reach*.3,23,'#8292a0','#39405a','#ded5c477');
 bone(c,31,-30,52+reach,5-reach*.3,23,'#8292a0','#39405a','#ded5c477');
 for(let s of [-1,1]){shape(c,[[s*51,6],[s*68,13],[s*66,27],[s*48,24]],'#a6acb3','#303e55',1.6)}
 shape(c,[[-31,-43],[-22,-61],[2,-66],[24,-55],[33,-31],[30,22],[10,41],[-13,39],[-34,17]],grad(c,-31,-66,30,42,['#ddd4c2','#8794aa','#43536e','#282b4d']),'#33334f',2);
 shape(c,[[-17,-28],[-5,-44],[11,-36],[20,-16],[12,18],[-7,24],[-20,-2]],'#53617d','#94a1b7',1.5);
 shape(c,[[-9,-24],[2,-47],[17,-22],[10,12],[-1,21],[-13,-6]],grad(c,0,-43,9,21,['#fff6d6','#e9a2db','#9742a4','#392e63']),'#f3d4da',1.5);
 // arms horns are curved and have small natural notches
 shape(c,[[-23,-67],[-41,-85],[-51,-118],[-60,-112],[-59,-89],[-42,-54]],grad(c,-60,-115,-27,-50,['#f3e3c9','#b1a3a2','#645e79']),'#57485f',2);
 shape(c,[[23,-67],[41,-85],[51,-118],[60,-112],[59,-89],[42,-54]],grad(c,27,-115,60,-50,['#eee2c9','#b1a5a4','#655d7a']),'#57485f',2);
 shape(c,[[-23,-60],[-15,-83],[2,-93],[18,-82],[25,-56],[17,-38],[-16,-39]],grad(c,-14,-92,20,-41,['#e3dbc7','#8998aa','#3d4968']),'#354263',1.8);
 shape(c,[[-17,-65],[-7,-75],[9,-75],[18,-62],[9,-45],[-9,-45]],'#1b2540','#70849d',1.6);
 shape(c,[[-13,-58],[-2,-66],[-4,-55],[-11,-51]],'#ff91e2');
 shape(c,[[3,-64],[16,-59],[14,-51],[5,-54]],'#ff91e2');
 c.restore();
}
root.AscensionMotion={hero,wraith,hound,sentinel,boss,drawEnemy(c,e,t){(this[e.kind]||wraith)(c,e,t)}};
})(window);
