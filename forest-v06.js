/* Ascensão 0.6 — Bosque da Aurora: fase diurna original em tons esmeralda */
(function(root){
'use strict';
const TAU=Math.PI*2;
function rand(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
function path(c,p,fill,edge){c.beginPath();let n=p.length,x=p[n-1],a=p[0];c.moveTo((x[0]+a[0])/2,(x[1]+a[1])/2);for(let i=0;i<n;i++){let a=p[i],b=p[(i+1)%n];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2)}c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(edge){c.strokeStyle=edge;c.lineWidth=1.3;c.stroke()}}
function ell(c,x,y,rx,ry,fill,angle=0){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fillStyle=fill;c.fill()}
function grad(c,x,y,x2,y2,colors){let g=c.createLinearGradient(x,y,x2,y2);for(let i=0;i<colors.length;i++)g.addColorStop(i/(colors.length-1),colors[i]);return g}
function light(c,x,y,r,color){let g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function twig(c,x,y,h,col,w=2){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-3,y-h*.65,x+h*.13,y-h);c.lineWidth=w;c.lineCap='round';c.strokeStyle=col;c.stroke()}
function grass(c,x,y,h,shade,bend=0){
 c.lineCap='round';c.strokeStyle=shade;c.lineWidth=1.7;
 for(let i=-1;i<=1;i++){let sx=x+i*3,sh=h*(i===0?1:.72);c.beginPath();c.moveTo(sx,y);c.quadraticCurveTo(sx+(bend+i)*4,y-sh*.56,sx+(bend+i)*5,y-sh);c.stroke()}
}
function leaf(c,x,y,dx,dy,fill){c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));path(c,[[0,0],[dx>0?11:8,-4],[18,0],[9,5]],fill);c.restore()}
function floorTile(seed){
 let tile=document.createElement('canvas');tile.width=tile.height=640;let c=tile.getContext('2d'),R=rand(seed);
 const wrap=(x,y,r,draw)=>{
   const xs=[0],ys=[0];if(x<r)xs.push(640);if(x>640-r)xs.push(-640);
   if(y<r)ys.push(640);if(y>640-r)ys.push(-640);
   for(let dx of xs)for(let dy of ys)draw(x+dx,y+dy);
 };
 c.fillStyle='#729d71';c.fillRect(0,0,640,640);
 // Estas manchas ultrapassam as bordas de forma periódica. Sem cortes em quadrícula.
 for(let i=0;i<190;i++){let x=R()*640,y=R()*640,rx=28+R()*85,ry=11+R()*47,rot=R()*TAU,tone=R()<.52?'#5a925f2a':'#caaf7d20';
  wrap(x,y,120,(px,py)=>ell(c,px,py,rx,ry,tone,rot))}
 for(let i=0;i<3800;i++){let x=R()*640,y=R()*640,rr=.4+R()*2,tone=R();
  let color=tone<.25?'#d0c89a49':tone<.5?'#2c6f5360':tone<.77?'#c8da9a4c':'#83b88a51',rot=R()*TAU;
  wrap(x,y,4,(px,py)=>ell(c,px,py,rr,rr*.55,color,rot))}
 for(let i=0;i<310;i++){let x=R()*640,y=R()*640,h=2+R()*7,tone=R()<.5?'#34775c4f':'#decc8254',bend=R()*2-1;
  wrap(x,y,12,(px,py)=>grass(c,px,py,h,tone,bend))}
 for(let i=0;i<22;i++){let x=R()*640,y=R()*640,rr=4+R()*13,ry=2+R()*5,rot=R()*TAU;
  wrap(x,y,19,(px,py)=>ell(c,px,py,rr,ry,'#305d4270',rot))}
 for(let i=0;i<40;i++){let x=R()*640,y=R()*640,color=R()<.65?'#f7efc7':'#ffdf9d';
  wrap(x,y,6,(px,py)=>{ell(c,px,py,2.8,1.3,color);ell(c,px+2,py-1,1.6,1,'#e09c5f')})}
 return tile;
}
function clearing(c,x,y,r,t){
 c.save();c.translate(x,y);
 const g=c.createRadialGradient(0,0,20,0,0,r);g.addColorStop(0,'#bdd5a9e2');g.addColorStop(.54,'#9fbd90b6');g.addColorStop(1,'#99bb7a00');
 c.fillStyle=g;c.beginPath();c.ellipse(0,0,r,r*.86,0,0,TAU);c.fill();
 // abandoned botanical circle, much softer than old stone rune
 c.strokeStyle='#d9ceaa85';c.lineWidth=10;c.beginPath();c.ellipse(0,0,r*.59,r*.52,.04,.12,TAU-.12);c.stroke();
 c.strokeStyle='#f3e6bd93';c.lineWidth=2;c.beginPath();c.ellipse(0,0,r*.63,r*.56,0,0,TAU);c.stroke();
 for(let i=0;i<15;i++){let a=TAU*i/15,rx=Math.cos(a)*r*.59,ry=Math.sin(a)*r*.52;ell(c,rx,ry,4+Math.sin(i)*2,3,'#708e7a',a);ell(c,rx+2,ry-1,1.5,1,'#ddcf9c')}
 for(let i=0;i<8;i++){let a=i*TAU/8;let cx=Math.cos(a)*r*.38,cy=Math.sin(a)*r*.34;path(c,[[cx-4,cy-2],[cx,cy-11],[cx+4,cy-2],[cx,cy+6]],'#d1c89980','#647e5a88')}
 c.restore();
}
function prop(c,o,t){
 c.save();c.translate(o.x,o.y);c.rotate(o.rot||0);c.scale(o.s||1,o.s||1);
 const v=o.variant||0.3,w=Math.sin(t*1.2+o.x*.017+o.y*.013),type=o.type;
 if(type==='tree'){
  // tree is a detailed trunk and airy animated foliage rather than a geometric symbol
  ell(c,12,26,56,18,'#2b55435d',-.16);
  path(c,[[-14,19],[-11,-9],[-18,-33],[-8,-74],[2,-101],[14,-66],[10,-32],[20,-10],[14,20]],grad(c,-15,-92,17,22,['#ae9974','#705f50','#594f44','#493f38']),'#554b3f');
  path(c,[[-14,0],[-22,21],[-4,12],[9,14],[22,22],[12,2]],'#65513d');
  c.strokeStyle='#b9a07c6a';c.lineWidth=2;c.beginPath();c.moveTo(-8,13);c.bezierCurveTo(-13,-22,-4,-55,3,-89);c.stroke();
  c.strokeStyle='#3b6242';c.lineWidth=3;c.beginPath();c.moveTo(0,-45);c.quadraticCurveTo(16,-55,35,-67);c.stroke();
  c.beginPath();c.moveTo(-4,-59);c.quadraticCurveTo(-24,-67,-37,-86);c.stroke();
  // canopy painted in overlapping irregular ellipses / leaf clusters
  let colors=['#3f805d','#548d60','#639a62','#81ad67','#9fc57a','#367963','#75a871'];
  let R=rand(Math.floor(v*100000)+133);
  for(let i=0;i<36;i++){let a=R()*TAU,rad=Math.sqrt(R())*55;
   let cx=Math.cos(a)*rad+w*.5,cy=-112+Math.sin(a)*rad*.58;
   let rx=10+R()*22,ry=7+R()*13;
   ell(c,cx+7,cy+7,rx*1.04,ry,'#35634b65');
   ell(c,cx,cy,rx,ry,colors[Math.floor(R()*colors.length)],a*.4);
   if(i%4===0)ell(c,cx-4,cy-4,rx*.6,ry*.42,'#daea9770')}
  for(let i=0;i<16;i++){let x=(R()-.5)*90,y=-130+R()*57;path(c,[[x-4,y],[x,y-6],[x+5,y],[x,y+7]],i%2?'#bdd58b':'#78b775')}
 }
 else if(type==='fern'||type==='brush'){
  ell(c,0,8,28,8,'#35634468');
  for(let i=0;i<(type==='brush'?11:7);i++){let a=TAU*i/(type==='brush'?11:7),len=14+v*8+(i%3)*4;
   c.strokeStyle='#397850';c.lineWidth=2.2;c.beginPath();c.moveTo(0,5);c.quadraticCurveTo(Math.cos(a)*len*.3+w*2,-8,Math.cos(a)*len,Math.sin(a)*len*.65);c.stroke();
   for(let j=1;j<=4;j++){let f=j/5,cx=Math.cos(a)*len*f,cy=Math.sin(a)*len*.65*f-5*(1-f);
    leaf(c,cx,cy,7,3,j%2?'#90b46c':'#4c9561');leaf(c,cx-4,cy+1,-7,-2,j%2?'#6b9e67':'#4a8d63')}
  }
 }
 else if(type==='flower'){
  grass(c,0,11,18,'#31784b',w*.3);
  let col=v<.33?'#ffedba':v<.66?'#e6b9f6':'#ffdf8d',xx=w*2;
  for(let i=0;i<5;i++){let a=i*TAU/5;ell(c,xx+Math.cos(a)*4,-13+Math.sin(a)*4,3.4,4.3,col,a)}
  ell(c,xx,-13,2.5,2.5,'#f0a84f');
  if(v>.48){grass(c,-12,9,10,'#54944e',w);ell(c,-12+w*2,-1,3,3,'#f5e4ae')}
 }
 else if(type==='rock'||type==='rubble'||type==='column'){
  ell(c,6,18,33,10,'#335f4263');
  path(c,[[-28,12],[-24,-8],[-13,-19],[9,-22],[25,-10],[30,11],[15,22],[-19,20]],grad(c,-27,-22,30,24,['#d8d2af','#9da99b','#698583','#506d6d']),'#57726c');
  path(c,[[-24,-8],[-13,-18],[6,-17],[15,-7],[4,1],[-16,2]],'#bec4aa88');
  c.strokeStyle='#41665991';c.lineWidth=1.8;c.beginPath();c.moveTo(-20,2);c.lineTo(-11,12);c.lineTo(0,14);c.stroke();
  for(let j=0;j<5;j++){let x=-20+j*9;grass(c,x,15,6+(j%3)*2,'#478054',w*.4)}
 }
 else if(type==='mushroom'||type==='torch'){
  ell(c,3,12,27,9,'#2c5d3f55');
  c.fillStyle='#e7d8ba';c.fillRect(-5,-5,9,18);
  path(c,[[-20,-7],[-10,-18],[0,-23],[16,-15],[22,-5],[12,1],[-15,0]],grad(c,-16,-20,20,1,['#e6c691','#d5a06d','#9c7654']),'#855b52');
  for(let i=0;i<5;i++){let a=i*TAU/5;ell(c,Math.cos(a)*9, -12+Math.sin(a)*4,2.6,1.6,'#f9e8c4')}
  light(c,0,-10,37,'#f8df9b37');
 }
 else if(type==='crystal'){
  ell(c,0,15,25,9,'#2d634a60');light(c,0,-2,27,'#d2fbd24f');
  path(c,[[-12,13],[-11,-4],[-3,-20],[9,-17],[17,1],[10,19],[-4,20]],grad(c,-8,-20,11,17,['#f4ffe1','#9ed6bc','#5b9a91']),'#9ee5ba');
  path(c,[[-11,0],[-3,-20],[3,2],[-4,20]],'#b5f4d1ac');light(c,1,-13,16,'#e7fff88c');
 }
 else if(type==='log'){
  ell(c,0,12,40,10,'#35533d60');
  c.save();c.rotate(-.18+v*.22);
  path(c,[[-40,-2],[-33,-12],[28,-13],[42,-4],[40,7],[-29,9]],grad(c,-4,-14,0,12,['#b99b71','#6a5848','#514e3a']),'#534a3b');
  for(let i=0;i<5;i++){let x=-28+i*13;c.strokeStyle='#ddc79c62';c.lineWidth=1.5;c.beginPath();c.moveTo(x,-9);c.quadraticCurveTo(x+8,-2,x,5);c.stroke()}
  ell(c,39,1,7,10,'#c4a677');ell(c,39,1,4,6,'#846c53');
  c.restore();
 }
 c.restore();
}
function motes(c,camera,W,H,t){
 // subtle moving fireflies and pollen in world space, low-cost animated overlay
 c.save();const cx=camera.x,cy=camera.y;
 for(let i=0;i<18;i++){let bx=((i*263.37+Math.sin(t*.18+i)*19+cx*.13)%W+W)%W,by=((i*159.47-t*(3+i%4)+cy*.11)%H+H)%H;
 let alpha=.12+.19*Math.pow(Math.sin(t*.9+i),2);ell(c,cx-W/2+bx,cy-H/2+by,1+i%2,1+i%2,'rgba(255,247,187,'+alpha+')')}
 c.restore();
}
root.AscensionForest={floorTile,clearing,prop,motes};
})(window);
