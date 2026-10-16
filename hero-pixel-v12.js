/* Projeto Ascensao 0.12 - HERÓI: animação por quadros consistentes.
 * Pixel-art vetorial rasterizada uma vez. 3 idle, 4 walk, 5 swing.
 * Todos usam MESMA anatomia, ponto de apoio e proporções.
 * Somente substitui o render do hero; não mexe na IA nem no combate.
 */
(function(root){
'use strict';
const motion=root.AscensionMotion;if(!motion)return;
if(new URLSearchParams(root.location?.search||'').get('hero')==='old')return;
const fallback=motion.hero;
const FW=172,FH=130,OX=86,OY=116;
const palettes={
 ink:'#121824',outline:'#253044',shadow:'#101a2b',armor:'#536d86',steel:'#a6bac0',shine:'#e4e6d6',light:'#f8eccb',
 gold:'#d4a869',goldDark:'#84613f',blue:'#294b65',blueDark:'#1e324c',blueLite:'#7395a5',
 cape:'#802c43',capeD:'#4c2338',capeHi:'#bd5864',scarf:'#d78966',
 hair:'#2b2535',skin:'#d4a17f',skinHi:'#f0c7a0',skinD:'#815e5b',
 pant:'#233342',leather:'#432c31',boot:'#292635',bootHi:'#60504e'
};
const C=palettes;const cache=new Map();let frames=0;
function poly(c,pts,fill,edge){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(edge){c.lineWidth=2;c.strokeStyle=edge;c.stroke()}c.fillStyle=fill;c.fill()}
function path(c,pts,color,w=2){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.strokeStyle=color;c.lineWidth=w;c.lineCap='square';c.lineJoin='miter';c.stroke()}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function joint(c,ax,ay,bx,by,w,color,outline=C.ink){
 const dx=bx-ax,dy=by-ay,l=Math.max(1,Math.hypot(dx,dy)),nx=-dy/l,ny=dx/l;
 poly(c,[[ax+nx*(w+2)/2,ay+ny*(w+2)/2],[bx+nx*(w+2)/2,by+ny*(w+2)/2],[bx-nx*(w+2)/2,by-ny*(w+2)/2],[ax-nx*(w+2)/2,ay-ny*(w+2)/2]],outline);
 poly(c,[[ax+nx*w/2,ay+ny*w/2],[bx+nx*w/2,by+ny*w/2],[bx-nx*w/2,by-ny*w/2],[ax-nx*w/2,ay-ny*w/2]],color);
}
function sword(c,hx,hy,angle){
 const vx=Math.cos(angle),vy=Math.sin(angle),nx=-vy,ny=vx;
 // punho liga a luva ao guarda-mão; lâmina de metal sem VFX embutido
 path(c,[[hx-9*vx,hy-9*vy],[hx+8*vx,hy+8*vy]],C.ink,8);
 path(c,[[hx-9*vx,hy-9*vy],[hx+8*vx,hy+8*vy]],C.leather,5);
 for(let i=-5;i<=2;i+=3)path(c,[[hx+i*vx-2*nx,hy+i*vy-2*ny],[hx+i*vx+2*nx,hy+i*vy+2*ny]],C.goldDark,1);
 path(c,[[hx-9*nx,hy-9*ny],[hx+9*nx,hy+9*ny]],C.ink,7);
 path(c,[[hx-8*nx,hy-8*ny],[hx+8*nx,hy+8*ny]],C.gold,4);
 const rootX=hx+8*vx,rootY=hy+8*vy;
 const tipX=rootX+41*vx,tipY=rootY+41*vy;
 poly(c,[[rootX+5*nx,rootY+5*ny],[rootX+33*vx+3*nx,rootY+33*vy+3*ny],[tipX,tipY],[rootX+33*vx-3*nx,rootY+33*vy-3*ny],[rootX-5*nx,rootY-5*ny]],C.ink);
 poly(c,[[rootX+3*nx,rootY+3*ny],[rootX+35*vx+2*nx,rootY+35*vy+2*ny],[tipX-2*vx,tipY-2*vy],[rootX+35*vx-2*nx,rootY+35*vy-2*ny],[rootX-3*nx,rootY-3*ny]],C.steel);
 path(c,[[rootX+1*nx,rootY+1*ny],[rootX+35*vx+1*nx,rootY+35*vy+1*ny]],C.shine,2);
}
function boot(c,x,y,side){
 poly(c,[[x-7,y-11],[x+5,y-11],[x+9,y-5],[x+9,y+1],[x-8,y+1],[x-11,y-3]],C.boot,C.ink);
 rect(c,x-7,y-9,9,3,C.bootHi);rect(c,x-10,y,18,2,C.ink);
 rect(c,x+side*4,y-6,3,2,C.goldDark)
}
function leg(c,hipX,heelX,heelY,front){
 const kx=Math.round((hipX+heelX)/2+(front?-2:3)),ky=-16+(front?-1:0);
 joint(c,hipX,-30,kx,ky,13,C.pant);joint(c,kx,ky,heelX,heelY-6,12,C.blueDark);
 poly(c,[[hipX-6,-32],[hipX+7,-31],[kx+6,ky+1],[kx-6,ky+3]],front?C.blue:C.pant);
 path(c,[[hipX-3,-28],[kx-2,ky-3]],C.blueLite,2);
 boot(c,heelX,heelY,front?1:-1)
}
function cape(c,pose,back){
 const sway=pose.sway||0,tail=pose.tail||0;
 poly(c,[[-20,-73],[18,-74],[22,-54],[24+sway,-29],[19+sway+tail,-2],[6+sway,-9],[-2+sway,-5],[-19+sway,-1],[-23+sway,-28],[-23,-49]],C.capeD,C.ink);
 poly(c,[[-19,-69],[15,-71],[20,-48],[19+sway,-22],[14+sway+tail,-7],[7+sway,-12],[-5+sway,-10],[-17+sway,-7],[-18+sway,-24]],C.cape);
 poly(c,[[-18,-70],[-12,-71],[-12,-23],[-16+sway,-10],[-19+sway,-9]],C.capeHi);
 path(c,[[13,-66],[17,-45],[15+sway,-19]],'#ad4c60',2);
 if(back){path(c,[[-7,-59],[0,-65],[7,-59],[0,-44],[-7,-59]],C.gold,2);rect(c,-1,-58,2,13,C.goldDark)}
}
function body(c,back,pose){
 const shift=pose.tilt||0;
 c.save();c.translate(shift,pose.bodyUp||0);
 if(!back){
  poly(c,[[-20,-69],[-11,-78],[11,-78],[22,-68],[20,-35],[10,-29],[-10,-29],[-21,-40]],C.blueDark,C.ink);
  poly(c,[[-16,-67],[-9,-75],[9,-75],[17,-67],[16,-40],[6,-31],[-10,-34],[-17,-43]],C.armor);
  poly(c,[[-14,-67],[-9,-73],[5,-73],[-1,-63],[-5,-48],[-12,-47]],C.blueLite);
  poly(c,[[-2,-72],[10,-72],[14,-63],[8,-55],[0,-58]],C.steel);
  path(c,[[-11,-47],[0,-43],[10,-47]],C.ink,3);
  poly(c,[[-10,-46],[9,-46],[12,-39],[6,-34],[-8,-34]],C.blue,C.ink);
  path(c,[[-12,-40],[12,-40]],C.leather,6);rect(c,-3,-43,7,6,C.gold);rect(c,-1,-42,3,4,C.light);
  poly(c,[[-6,-64],[0,-69],[6,-64],[0,-56]],C.gold,C.goldDark);rect(c,-1,-65,3,6,C.light);
 }else{
  poly(c,[[-19,-72],[-10,-77],[12,-77],[20,-67],[17,-42],[10,-31],[-10,-31],[-18,-42]],C.cape,C.ink);
  path(c,[[-14,-66],[0,-70],[14,-66]],C.capeHi,4);
  path(c,[[-10,-45],[10,-45]],C.goldDark,3);
 }
 c.restore()
}
function head(c,back,pose){
 const h=pose.head||0;c.save();c.translate(pose.tilt||0,h+(pose.bodyUp||0));
 rect(c,-7,-83,14,8,C.skinD);
 poly(c,[[-11,-96],[-7,-102],[7,-102],[12,-96],[11,-86],[5,-79],[-5,-79],[-11,-86]],C.skin,C.ink);
 if(back){
  poly(c,[[-12,-98],[-8,-106],[5,-107],[12,-100],[13,-83],[6,-77],[-8,-80],[-14,-87]],C.hair,C.ink);
  poly(c,[[-11,-102],[-4,-109],[5,-108],[10,-101],[2,-100],[-2,-95],[-12,-95]],'#473744');
  rect(c,-11,-91,4,8,C.capeD);rect(c,8,-91,4,8,C.capeD)
 }else{
  poly(c,[[-13,-93],[-11,-104],[-3,-109],[8,-106],[13,-99],[13,-92],[7,-96],[1,-96],[-6,-94],[-10,-88]],C.hair,C.ink);
  poly(c,[[-11,-100],[-4,-107],[5,-106],[10,-101],[3,-101],[-1,-97],[-9,-97]],'#5a4650');
  rect(c,-6,-88,3,2,C.ink);rect(c,5,-88,3,2,C.ink);
  rect(c,-4,-82,9,2,C.skinHi);rect(c,3,-84,3,2,C.skinD);
  rect(c,-12,-91,3,6,C.skinD);rect(c,10,-91,3,6,C.skinD)
 }
 poly(c,[[-11,-79],[0,-75],[10,-80],[13,-73],[8,-68],[-10,-69],[-14,-76]],C.scarf,C.capeD);
 path(c,[[-9,-77],[1,-74],[8,-77]],'#edb18a',2);
 c.restore()
}
function hand(c,hx,hy){poly(c,[[hx-5,hy-5],[hx+5,hy-5],[hx+6,hy+4],[hx+1,hy+7],[hx-5,hy+4]],C.leather,C.ink);rect(c,hx-2,hy-5,4,3,C.goldDark)}
function arms(c,back,pose){
 const bodyUp=pose.bodyUp||0,tilt=pose.tilt||0;
 // braço distante esquerdo
 const lX=-24+(pose.leftX||0),lY=-43+(pose.leftY||0)+bodyUp;
 joint(c,-18+tilt,-68+bodyUp,-23+tilt,-55+bodyUp,14,C.blueDark);
 joint(c,-23+tilt,-55+bodyUp,lX,lY,11,C.armor);
 poly(c,[[-26+tilt,-70+bodyUp],[-16+tilt,-75+bodyUp],[-10+tilt,-66+bodyUp],[-14+tilt,-56+bodyUp],[-25+tilt,-57+bodyUp],[-29+tilt,-65+bodyUp]],C.steel,C.ink);
 rect(c,-25+tilt,-66+bodyUp,4,4,C.shine);hand(c,lX,lY);
 const hx=pose.hx,hy=pose.hy+bodyUp;
 // direito articulado em dois segmentos, sempre na mesma anatomia
 const elbowX=24+tilt+(hx-27)*.24,elbowY=-54+bodyUp+(hy+44)*.35;
 joint(c,18+tilt,-67+bodyUp,elbowX,elbowY,15,C.armor);
 poly(c,[[11+tilt,-72+bodyUp],[21+tilt,-77+bodyUp],[31+tilt,-70+bodyUp],[29+tilt,-59+bodyUp],[21+tilt,-57+bodyUp],[13+tilt,-62+bodyUp]],C.steel,C.ink);
 path(c,[[20+tilt,-73+bodyUp],[26+tilt,-70+bodyUp]],C.shine,3);
 joint(c,elbowX,elbowY,hx,hy,11,C.blue);
 path(c,[[elbowX+1,elbowY-3],[hx+1,hy-3]],C.blueLite,2);
 hand(c,hx,hy);
}
const idle=[
 {hx:28,hy:-41,angle:.88,sway:0,bodyUp:0,head:0,tail:0},
 {hx:28,hy:-42,angle:.88,sway:1,bodyUp:-1,head:-1,tail:0},
 {hx:29,hy:-42,angle:.88,sway:1,bodyUp:-1,head:0,tail:1}
];
const run=[
 {hx:29,hy:-48,angle:.66,sway:-7,tail:-4,bodyUp:-1,tilt:3,lx:-18,rx:13,ly:0,ry:-12,leftX:6,leftY:4,head:0},
 {hx:26,hy:-50,angle:.52,sway:-10,tail:-6,bodyUp:-3,tilt:5,lx:-11,rx:17,ly:-7,ry:0,leftX:2,leftY:-5,head:-1},
 {hx:28,hy:-48,angle:.65,sway:-7,tail:-4,bodyUp:-1,tilt:3,lx:-10,rx:18,ly:-12,ry:0,leftX:-3,leftY:-2,head:0},
 {hx:25,hy:-50,angle:.52,sway:-10,tail:-5,bodyUp:-3,tilt:5,lx:-17,rx:11,ly:0,ry:-7,leftX:3,leftY:5,head:-1}
];
const strike=[
 {hx:21,hy:-57,angle:-1.4,sway:-5,tilt:-5,bodyUp:1,leftX:-3,leftY:5,lx:-11,rx:11,ly:0,ry:-4},
 {hx:27,hy:-67,angle:-.9,sway:-6,tilt:-7,bodyUp:-3,leftX:-5,leftY:5,lx:-15,rx:13,ly:0,ry:-3},
 {hx:37,hy:-55,angle:-.10,sway:5,tilt:4,bodyUp:-2,leftX:-6,leftY:-4,lx:-16,rx:15,ly:0,ry:-4},
 {hx:38,hy:-35,angle:.99,sway:7,tilt:8,bodyUp:2,leftX:3,leftY:-5,lx:-16,rx:18,ly:0,ry:-2},
 {hx:28,hy:-40,angle:.86,sway:2,tilt:2,bodyUp:0,leftX:1,leftY:0,lx:-12,rx:10,ly:0,ry:-1}
];
function build(type,index,back){
 const c=document.createElement('canvas');c.width=FW;c.height=FH;
 const g=c.getContext('2d',{alpha:true});g.imageSmoothingEnabled=false;
 g.translate(OX,OY);
 const pose=(type==='idle'?idle:type==='run'?run:strike)[index];
 cape(g,pose,back);
 // Proteção da perna distante antes do tronco; na corrida os pés alternam suporte.
 leg(g,-9,pose.lx??-10,pose.ly??0,false);
 leg(g,8,pose.rx??9,pose.ry??0,true);
 body(g,back,pose);head(g,back,pose);
 arms(g,back,pose);
 sword(g,pose.hx,pose.hy+(pose.bodyUp||0),pose.angle);
 frames++;return c
}
function sprite(type,i,back){const key=type+':'+i+':'+Number(back);if(!cache.has(key))cache.set(key,build(type,i,back));return cache.get(key)}
function hero(c,p,t,g){
 const moving=(p.motion||0)>.18,active=(p.attackPulse||0)>0,back=[5,6,7].includes(p.direction);
 let type='idle',i=0;
 if(active){type='strike';const progress=Math.max(0,Math.min(.999,1-p.attackPulse/.36));i=progress<.18?0:progress<.33?1:progress<.56?2:progress<.79?3:4}
 else if(moving){type='run';i=(Math.floor((p.move||0)*4/(Math.PI*2))%4+4)%4}
 else {i=Math.floor(t*3)%3}
 const canvas=sprite(type,i,back);
 if(!canvas){fallback(c,p,t,g);return}
 c.save();c.translate(Math.round(p.x),Math.round(p.y));
 c.scale(p.face===-1?-1:1,1);
 c.imageSmoothingEnabled=false;
 c.drawImage(canvas,-OX,-OY);
 c.restore()
}
motion.hero=hero;
root.AscensionHeroFrames={version:'v12',states:{idle:3,run:4,strike:5},drawn:()=>frames,ready:true};
})(window);