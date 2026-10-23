/* Learning IFR — Simulateur de procédures (tour de piste)
   Le vol est scripté phase par phase ; l'élève touche les commandes au bon moment.
   Une planche = liste d'éléments (instruments et commandes) dessinés en SVG.
   Un scénario = liste de phases {id, name, leg, cue, dur, win, to:{agl,ias,vs,hdg,pos,pitch}, actions:[{c, set|check, label, why, say}]}. */
(function(){
const SIM={panels:{},registerPanel(p){this.panels[p.id]=p}};
LI.sim=SIM;

/* ---------- géométrie ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const D2R=Math.PI/180;
const pt=(cx,cy,r,a)=>[+(cx+r*Math.sin(a*D2R)).toFixed(2),+(cy-r*Math.cos(a*D2R)).toFixed(2)];
const arcP=(cx,cy,r,a,b)=>{const [x1,y1]=pt(cx,cy,r,a),[x2,y2]=pt(cx,cy,r,b);return `M${x1} ${y1}A${r} ${r} 0 ${b-a>180?1:0} 1 ${x2} ${y2}`};
const lin=(v,v0,v1,a0,a1)=>a0+(Math.max(v0,Math.min(v1,v))-v0)/(v1-v0)*(a1-a0);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
const angDiff=(a,b)=>((b-a+540)%360)-180;
const norm=a=>((a%360)+360)%360;
const tick=(cx,cy,r1,r2,a,w,c)=>{const [x1,y1]=pt(cx,cy,r1,a),[x2,y2]=pt(cx,cy,r2,a);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c||'#E8EDF1'}" stroke-width="${w||1.5}"/>`};
const txt=(x,y,s,sz,c,anchor,extra)=>`<text x="${x}" y="${y}" font-size="${sz||11}" fill="${c||'#E8EDF1'}" text-anchor="${anchor||'middle'}" dominant-baseline="central" ${extra||''}>${s}</text>`;
const bezel=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r+5}" fill="#0A0D10" stroke="#3A434C" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${r}" fill="#14181C"/>`;
const needle=(id,x,y,len,w,c)=>`<g id="${id}"><path d="M${x-w} ${y+len*.18} L${x} ${y-len} L${x+w} ${y+len*.18}Z" fill="${c||'#F4F6F8'}"/><circle cx="${x}" cy="${y}" r="${w+2}" fill="#2B3138"/></g>`;
const rot=(el,a,x,y)=>el&&el.setAttribute('transform',`rotate(${a.toFixed(2)} ${x} ${y})`);

/* ---------- éléments de planche ---------- */
const B={
asi(e){const {x,y,r}=e,a=v=>lin(v,e.min,e.max,20,340);let h=bezel(x,y,r);
 const band=(v0,v1,c,rr,w)=>`<path d="${arcP(x,y,rr,a(v0),a(v1))}" stroke="${c}" stroke-width="${w}" fill="none"/>`;
 h+=band(e.white[0],e.white[1],'#F4F6F8',r*.74,5)+band(e.green[0],e.green[1],'#2FB36B',r*.84,7)+band(e.yellow[0],e.yellow[1],'#F2C230',r*.84,7);
 h+=tick(x,y,r*.7,r*.95,a(e.red),3,'#E5483B');
 for(let v=e.min;v<=e.max;v+=10)h+=tick(x,y,r*(v%40===0?.82:.88),r*.95,a(v),v%40===0?2:1);
 for(let v=e.min;v<=e.max;v+=40){const [tx,ty]=pt(x,y,r*.62,a(v));h+=txt(tx,ty,v,r*.15)}
 h+=txt(x,y+r*.32,e.unit,r*.13,'#9AA7B2')+needle(e.z+'_n',x,y,r*.86,3);
 return{h,box:[x-r,y-r,2*r,2*r],bind:q=>({n:q(e.z+'_n')}),upd:(R,st)=>rot(R.n,a(st.ias),x,y)}},
ai(e){const {x,y,r}=e,k=r/26,id=e.z;let h=bezel(x,y,r);
 h+=`<clipPath id="${id}_c"><circle cx="${x}" cy="${y}" r="${r-1}"/></clipPath><g clip-path="url(#${id}_c)"><g id="${id}_h">
  <rect x="${x-3*r}" y="${y-3*r}" width="${6*r}" height="${3*r}" fill="#3D7FC8"/><rect x="${x-3*r}" y="${y}" width="${6*r}" height="${3*r}" fill="#7A4E26"/>
  <line x1="${x-3*r}" y1="${y}" x2="${x+3*r}" y2="${y}" stroke="#fff" stroke-width="2"/>`;
 for(const p of [-20,-15,-10,-5,5,10,15,20]){const w=p%10===0?r*.36:r*.18;h+=`<line x1="${x-w}" y1="${y-p*k}" x2="${x+w}" y2="${y-p*k}" stroke="#fff" stroke-width="1.5"/>`;if(p%10===0)h+=txt(x+w+10,y-p*k,Math.abs(p),r*.12,'#fff')}
 h+=`</g></g><g id="${id}_b"><path d="M${x} ${y-r*.86} l-7 12 h14z" fill="#F4F6F8"/></g>`;
 for(const b of [-60,-30,-20,-10,0,10,20,30,60])h+=tick(x,y,r*.88,r*(b%30===0?.99:.95),b,b===0?3:1.5);
 h+=`<path d="M${x-r*.55} ${y} h${r*.32} l${r*.08} ${r*.1} l${r*.08} -${r*.1} h${r*.32}" stroke="#F5A623" stroke-width="5" fill="none" stroke-linejoin="round"/><circle cx="${x}" cy="${y}" r="3" fill="#F5A623"/>`;
 return{h,box:[x-r,y-r,2*r,2*r],bind:q=>({h:q(id+'_h'),b:q(id+'_b')}),
  upd:(R,st)=>{R.h.setAttribute('transform',`rotate(${(-st.bank).toFixed(2)} ${x} ${y}) translate(0 ${(st.pitch*k).toFixed(2)})`);rot(R.b,-st.bank,x,y)}}},
alt(e){const {x,y,r}=e;let h=bezel(x,y,r);
 for(let i=0;i<50;i++)h+=tick(x,y,r*(i%5===0?.8:.88),r*.95,i*7.2,i%5===0?2:1);
 for(let i=0;i<10;i++){const [tx,ty]=pt(x,y,r*.66,i*36);h+=txt(tx,ty,i,r*.2)}
 h+=`<rect x="${x+r*.18}" y="${y+r*.12}" width="${r*.5}" height="${r*.2}" rx="2" fill="#000" stroke="#3A434C"/>`+txt(x+r*.43,y+r*.22,'<tspan id="'+e.z+'_q">1013</tspan>',r*.13);
 h+=txt(x,y-r*.3,'ALT',r*.12,'#9AA7B2')+txt(x-r*.38,y+r*.25,'FT',r*.1,'#9AA7B2');
 h+=`<g id="${e.z}_t"><path d="M${x-5} ${y+6} L${x} ${y-r*.5} L${x+5} ${y+6}Z" fill="#F4F6F8"/></g>`+needle(e.z+'_h',x,y,r*.86,2.2);
 return{h,box:[x-r,y-r,2*r,2*r],bind:q=>({h:q(e.z+'_h'),t:q(e.z+'_t'),q:q(e.z+'_q')}),
  upd:(R,st,S)=>{const al=S.elev+st.agl+((st.ctl.qnh||S.qnh)-S.qnh)*28;rot(R.h,(((al%1000)+1000)%1000)/1000*360,x,y);rot(R.t,al/10000*360,x,y);R.q.textContent=st.ctl.qnh||S.qnh}}},
tc(e){const {x,y,r}=e;let h=bezel(x,y,r);
 for(const a of [-90,90,-110,110])h+=tick(x,y,r*.78,r*.95,a,3);
 h+=txt(x-r*.62,y+r*.42,'G',r*.15)+txt(x+r*.62,y+r*.42,'D',r*.15)+txt(x,y-r*.42,'2 MIN',r*.12,'#9AA7B2');
 h+=`<g id="${e.z}_p"><path d="M${x-r*.7} ${y} h${r*.55} m${r*.3} 0 h${r*.55}" stroke="#F4F6F8" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${r*.12}" fill="#F4F6F8"/><path d="M${x} ${y-r*.12} v-${r*.16}" stroke="#F4F6F8" stroke-width="3"/></g>`;
 h+=`<rect x="${x-r*.45}" y="${y+r*.5}" width="${r*.9}" height="${r*.2}" rx="${r*.1}" fill="#E9E2C8"/><line x1="${x-r*.1}" y1="${y+r*.5}" x2="${x-r*.1}" y2="${y+r*.7}" stroke="#222"/><line x1="${x+r*.1}" y1="${y+r*.5}" x2="${x+r*.1}" y2="${y+r*.7}" stroke="#222"/><circle cx="${x}" cy="${y+r*.6}" r="${r*.085}" fill="#111"/>`;
 return{h,box:[x-r,y-r,2*r,2*r],bind:q=>({p:q(e.z+'_p')}),upd:(R,st)=>rot(R.p,clamp(st.turn??st.bank,-30,30)*.8,x,y)}},
dg(e){const {x,y,r}=e;let h=bezel(x,y,r)+`<g id="${e.z}_c">`;
 for(let a=0;a<360;a+=5)h+=tick(x,y,r*(a%10===0?.8:.86),r*.93,a,a%30===0?2:1);
 const L={0:'N',90:'E',180:'S',270:'O'};
 for(let a=0;a<360;a+=30){const [tx,ty]=pt(x,y,r*.66,a);h+=txt(tx,ty,L[a]||a/10,r*.17,L[a]?'#F2C230':'#E8EDF1','middle',`transform="rotate(${a} ${tx} ${ty})"`)}
 h+=`</g><path d="M${x} ${y-r*.97} l-6 -1 l6 14 l6 -14z" fill="#F5A623"/><path d="M${x} ${y-r*.3} v${r*.55} M${x-r*.28} ${y} h${r*.56} M${x-r*.12} ${y+r*.22} h${r*.24}" stroke="#F5A623" stroke-width="3.5"/>`;
 return{h,box:[x-r,y-r,2*r,2*r],bind:q=>({c:q(e.z+'_c')}),upd:(R,st)=>rot(R.c,-st.hdg,x,y)}},
vsi(e){const {x,y,r}=e,a=v=>-90+clamp(v,-2000,2000)/2000*170;let h=bezel(x,y,r);
 for(let v=-2000;v<=2000;v+=100)h+=tick(x,y,r*(v%500===0?.8:.88),r*.95,a(v),v%500===0?2:1);
 for(let v=-2000;v<=2000;v+=500){const [tx,ty]=pt(x,y,r*.64,a(v));h+=txt(tx,ty,Math.abs(v/100),r*.15)}
 h+=txt(x+r*.15,y-r*.32,'MONTÉE',r*.1,'#9AA7B2')+txt(x+r*.15,y+r*.32,'DESCENTE',r*.1,'#9AA7B2')+txt(x+r*.2,y,'×100 FT/MIN',r*.09,'#9AA7B2','start');
 h+=needle(e.z+'_n',x,y,r*.86,3);
 return{h,box:[x-r,y-r,2*r,2*r],bind:q=>({n:q(e.z+'_n')}),upd:(R,st)=>rot(R.n,a(st.vs),x,y)}},
tach(e){const {x,y,r}=e,a=v=>lin(v,0,3500,-135,135);let h=bezel(x,y,r);
 h+=`<path d="${arcP(x,y,r*.84,a(e.green[0]),a(e.green[1]))}" stroke="#2FB36B" stroke-width="7" fill="none"/>`+tick(x,y,r*.72,r*.95,a(e.red),3,'#E5483B');
 for(let v=0;v<=3500;v+=100)h+=tick(x,y,r*(v%500===0?.8:.88),r*.95,a(v),v%500===0?2:1);
 for(let v=0;v<=3500;v+=500){const [tx,ty]=pt(x,y,r*.62,a(v));h+=txt(tx,ty,v/100,r*.16)}
 h+=txt(x,y+r*.35,'TR/MIN ×100',r*.11,'#9AA7B2')+needle(e.z+'_n',x,y,r*.86,3);
 return{h,box:[x-r,y-r,2*r,2*r],bind:q=>({n:q(e.z+'_n')}),upd:(R,st)=>rot(R.n,a(st.rpm),x,y)}},
gauge(e){const {x,y,r}=e,a=v=>lin(v,0,1,-60,60);let h=bezel(x,y,r);
 h+=`<path d="${arcP(x,y+r*.25,r*.82,a(e.green[0]),a(e.green[1]))}" stroke="#2FB36B" stroke-width="5" fill="none"/>`;
 for(let v=0;v<=1.001;v+=.25)h+=tick(x,y+r*.25,r*.7,r*.92,a(v),1.5);
 h+=txt(x,y+r*.55,e.label,r*.24,'#9AA7B2')+needle(e.z+'_n',x,y+r*.25,r*.85,2);
 return{h,box:[x-r,y-r,2*r,2*r],bind:q=>({n:q(e.z+'_n')}),upd:(R,st)=>rot(R.n,a(e.val(st)),x,y+r*.25)}},
rocker(e){const {x,y}=e,w=42,hh=60;
 const h=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="6" fill="#0A0D10" stroke="#3A434C"/>
  <rect id="${e.z}_t" x="${x+5}" y="${y+5}" width="${w-10}" height="${hh/2-5}" rx="3"/><rect id="${e.z}_b" x="${x+5}" y="${y+hh/2}" width="${w-10}" height="${hh/2-5}" rx="3"/>
  ${txt(x+w/2,y+hh+13,e.label,11,'#C9D3DB')}`;
 return{h,box:[x-8,y-6,w+16,hh+28],bind:q=>({t:q(e.z+'_t'),b:q(e.z+'_b')}),
  upd:(R,st)=>{const on=!!st.ctl[e.z];R.t.setAttribute('fill',on?'#F5B13D':'#262C32');R.b.setAttribute('fill',on?'#1C2126':'#3A424A')}}},
throttle(e){const {x,y,h:H}=e,P={plein:0,palier:.3,approche:.62,reduit:1};
 const h=`<rect x="${x-9}" y="${y}" width="18" height="${H}" rx="9" fill="#0A0D10" stroke="#3A434C"/>
  ${txt(x+40,y+6,'PLEIN',9,'#9AA7B2','start')}${txt(x+40,y+H-4,'RÉDUIT',9,'#9AA7B2','start')}
  <g id="${e.z}_k"><rect x="${x-28}" y="${y-11}" width="56" height="22" rx="6" fill="#1D2024" stroke="#5C6670"/><rect x="${x-20}" y="${y-3}" width="40" height="6" rx="3" fill="#3A434C"/></g>
  ${txt(x,y+H+20,e.label,11,'#C9D3DB')}`;
 return{h,box:[x-34,y-16,68,H+44],bind:q=>({k:q(e.z+'_k'),p:1}),
  upd:(R,st)=>{const t=P[st.ctl[e.z]]??1;R.p+=(t-R.p)*.15;R.k.setAttribute('transform',`translate(0 ${(R.p*H).toFixed(1)})`)}}},
knob(e){const {x,y}=e;
 const h=`<circle cx="${x}" cy="${y}" r="10" fill="#0A0D10"/><rect id="${e.z}_s" x="${x-3}" y="${y}" width="6" height="0" fill="#9AA7B2"/>
  <g id="${e.z}_k"><circle cx="${x}" cy="${y}" r="17" fill="${e.color||'#D8DDE1'}" stroke="#0A0D10" stroke-width="2"/><circle cx="${x}" cy="${y}" r="7" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/></g>
  ${txt(x,y+36,e.label,10.5,'#C9D3DB')}${txt(x,y+49,'<tspan id="'+e.z+'_v"></tspan>',9.5,'#F5B13D')}`;
 return{h,box:[x-30,y-24,60,80],bind:q=>({k:q(e.z+'_k'),s:q(e.z+'_s'),v:q(e.z+'_v'),p:0}),
  upd:(R,st)=>{const t=st.ctl[e.z]===e.pulled?1:0;R.p+=(t-R.p)*.15;R.k.setAttribute('transform',`translate(0 ${(R.p*14).toFixed(1)})`);R.s.setAttribute('height',(R.p*14).toFixed(1));R.v.textContent=(e.states||{})[st.ctl[e.z]]||''}}},
flaps(e){const {x,y,h:H}=e,ys=[0,H/2,H];
 let h=`<rect x="${x-9}" y="${y}" width="18" height="${H}" rx="9" fill="#0A0D10" stroke="#3A434C"/>`;
 ['0','DÉC','ATT'].forEach((l,i)=>{h+=`<line x1="${x-16}" y1="${y+ys[i]}" x2="${x-11}" y2="${y+ys[i]}" stroke="#9AA7B2" stroke-width="2"/>`+txt(x-20,y+ys[i],l,9.5,'#9AA7B2','end')});
 h+=`<g id="${e.z}_k"><rect x="${x-10}" y="${y-13}" width="48" height="26" rx="5" fill="#2A3138" stroke="#5C6670"/><rect x="${x+2}" y="${y-5}" width="28" height="10" rx="3" fill="#C9302C"/></g>${txt(x+10,y+H+22,e.label,11,'#C9D3DB')}`;
 return{h,box:[x-46,y-18,92,H+48],bind:q=>({k:q(e.z+'_k'),p:0}),
  upd:(R,st)=>{const t=ys[st.ctl[e.z]]||0;R.p+=(t-R.p)*.15;R.k.setAttribute('transform',`translate(0 ${R.p.toFixed(1)})`)}}},
trim(e){const {x,y,w,h:H}=e;let r='';for(let i=-3;i<=H+3;i+=7)r+=`<line x1="${x+4}" y1="${y+i}" x2="${x+w-4}" y2="${y+i}" stroke="#4A535C" stroke-width="3"/>`;
 const h=`<clipPath id="${e.z}_c"><rect x="${x}" y="${y}" width="${w}" height="${H}" rx="8"/></clipPath><rect x="${x}" y="${y}" width="${w}" height="${H}" rx="8" fill="#1B1F23" stroke="#3A434C"/>
  <g clip-path="url(#${e.z}_c)"><g id="${e.z}_r">${r}</g></g>${txt(x+w/2,y+H+14,e.label,11,'#C9D3DB')}`;
 return{h,box:[x-8,y-8,w+16,H+30],bind:q=>({r:q(e.z+'_r')}),upd:(R,st)=>{const t=clamp((performance.now()-st.anim.trim)/600,0,1);R.r.setAttribute('transform',`translate(0 ${(t<1?Math.sin(t*Math.PI)*7:0).toFixed(1)})`)}}},
stick(e){const {x,y}=e;
 const h=`<ellipse cx="${x}" cy="${y+70}" rx="44" ry="14" fill="#0A0D10"/><g id="${e.z}_g"><path d="M${x-6} ${y+70} L${x-9} ${y+10} h18 L${x+6} ${y+70}z" fill="#2A3036"/>
  <rect x="${x-20}" y="${y-38}" width="40" height="58" rx="18" fill="#22272C" stroke="#4A535C" stroke-width="2"/><circle cx="${x}" cy="${y-24}" r="6" fill="#C9302C"/></g>${txt(x,y+98,e.label,11,'#C9D3DB')}`;
 return{h,box:[x-50,y-46,100,156],bind:q=>({g:q(e.z+'_g')}),upd:(R,st)=>{const t=clamp((performance.now()-st.anim.stick)/700,0,1);R.g.setAttribute('transform',`translate(0 ${(t<1?Math.sin(t*Math.PI)*10:0).toFixed(1)})`)}}},
radio(e){const {x,y,w,h:H}=e;
 const h=`<rect x="${x}" y="${y}" width="${w}" height="${H}" rx="5" fill="#0A0D10" stroke="#3A434C"/>${txt(x+10,y+14,'COM 1',9.5,'#9AA7B2','start')}
  ${txt(x+w-10,y+H/2+6,'<tspan id="'+e.z+'_f">'+e.freq+'</tspan>',19,'#5BE38E','end','font-weight="600"')}<rect id="${e.z}_tx" x="${x+10}" y="${y+H-20}" width="26" height="13" rx="2"/>${txt(x+23,y+H-13.5,'TX',8.5,'#0A0D10')}
  ${txt(x+w/2,y+H+13,e.label,11,'#C9D3DB')}`;
 return{h,box:[x-6,y-6,w+12,H+28],bind:q=>({tx:q(e.z+'_tx'),f:q(e.z+'_f')}),upd:(R,st)=>{R.tx.setAttribute('fill',performance.now()<st.anim.tx?'#F5B13D':'#262C32');if(st.ctl.freq)R.f.textContent=st.ctl.freq}}},
xpdr(e){const {x,y,w,h:H}=e;
 const h=`<rect x="${x}" y="${y}" width="${w}" height="${H}" rx="5" fill="#0A0D10" stroke="#3A434C"/>${txt(x+10,y+14,'XPDR',9.5,'#9AA7B2','start')}
  ${txt(x+w-60,y+H/2+6,e.code,19,'#5BE38E','end','font-weight="600"')}${txt(x+w-10,y+H/2+6,'<tspan id="'+e.z+'_m"></tspan>',13,'#F5B13D','end','font-weight="600"')}
  ${txt(x+w/2,y+H+13,e.label,11,'#C9D3DB')}`;
 return{h,box:[x-6,y-6,w+12,H+28],bind:q=>({m:q(e.z+'_m')}),upd:(R,st)=>R.m.textContent=st.ctl[e.z]}},
selector(e){const {x,y,r}=e;let h=`<circle cx="${x}" cy="${y}" r="${r}" fill="#0A0D10" stroke="#3A434C" stroke-width="2"/>`;
 for(const [k,a] of Object.entries(e.pos)){const [tx,ty]=pt(x,y,r+12,a);h+=txt(tx,ty,k,10,'#C9D3DB')}
 h+=`<g id="${e.z}_p"><path d="M${x} ${y-r*.85} L${x-6} ${y+r*.3} h12z" fill="#D8DDE1"/><circle cx="${x}" cy="${y}" r="${r*.3}" fill="#2A3036"/></g>${txt(x,y+r+26,e.label,10.5,'#C9D3DB')}`;
 return{h,box:[x-r-18,y-r-20,2*r+36,2*r+52],bind:q=>({p:q(e.z+'_p')}),upd:(R,st)=>rot(R.p,e.pos[st.ctl[e.z]]??0,x,y)}},
map(e){const {x,y,w,h:H}=e,wp=e.wp.map(([a,b])=>[x+a,y+b]);
 const poly=wp.map(p=>p.join(',')).join(' ');
 const h=`<rect x="${x}" y="${y}" width="${w}" height="${H}" rx="6" fill="#07131B" stroke="#3A434C" stroke-width="2"/>
  <rect x="${x+e.rwy[0]}" y="${y+e.rwy[1]-5}" width="${e.rwy[2]-e.rwy[0]}" height="10" fill="#5C6670"/>${txt(x+e.rwy[0]+10,y+e.rwy[1],e.qfuL,8,'#E8EDF1')}${txt(x+e.rwy[2]-10,y+e.rwy[1],e.qfuR,8,'#E8EDF1')}
  <polyline points="${poly}" fill="none" stroke="#F064B2" stroke-opacity=".55" stroke-width="2" stroke-dasharray="5 4"/>
  ${txt(x+8,y+12,'<tspan id="map_leg"></tspan>',10,'#5BE38E','start','font-weight="600"')}${txt(x+w-8,y+H-10,'<tspan id="map_el"></tspan>',9,'#9AA7B2','end')}
  <g id="map_ac"><path d="M0 -8 L6 6 L0 3 L-6 6Z" fill="#F4F6F8" stroke="#07131B"/></g>`;
 return{h,box:null,bind:q=>({ac:q('map_ac'),leg:q('map_leg'),el:q('map_el')}),
  upd:(R,st,S)=>{const n=wp.length-1,p=clamp(st.pos,0,n),i=Math.min(n-1,Math.floor(p)),f=p-i,A=wp[i],Bp=wp[i+1];
   const px=A[0]+(Bp[0]-A[0])*f,py=A[1]+(Bp[1]-A[1])*f,dir=Math.atan2(Bp[0]-A[0],-(Bp[1]-A[1]))/D2R;
   R.ac.setAttribute('transform',`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${dir.toFixed(0)})`);R.leg.textContent=S.leg;R.el.textContent='Terrain '+S.elev+' ft'}}},
label(e){return{h:txt(e.x,e.y,e.text,e.size||11,e.color||'#6F7C87',e.anchor||'middle','letter-spacing="1.5"'),box:null,bind:()=>({}),upd:()=>{}}}
};

/* ---------- style ---------- */
const css=`
.sim{display:flex;flex-direction:column;gap:12px}
.sim-bar{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between}
.sim-count{font-family:var(--f-mono);font-size:13px;color:var(--muted);display:flex;gap:12px;font-variant-numeric:tabular-nums}
.sim-count b{color:var(--ink)}
.sim-stage{position:relative;background:#1B2126;border-radius:12px;overflow:hidden;touch-action:manipulation;-webkit-user-select:none;user-select:none}
.sim-stage svg{display:block;width:100%;height:auto;max-height:calc(100svh - 120px);font-family:var(--f-mono)}
.sim-stage .zone{cursor:pointer}
.sim-stage .hit{fill:transparent}
.sim-stage .ring{fill:none;stroke:transparent;stroke-width:3;rx:10}
.sim-stage .ring.hint{stroke:#F064B2;animation:simpulse 1.1s ease-in-out infinite}
.sim-stage .ring.ok{stroke:#3DDC84;animation:simflash .7s ease-out forwards}
.sim-stage .ring.bad{stroke:#FF5A4E;animation:simflash .7s ease-out forwards}
@keyframes simpulse{50%{stroke-opacity:.25}}
@keyframes simflash{from{stroke-width:6;stroke-opacity:1}to{stroke-width:2;stroke-opacity:0}}
.sim-strip{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:8px;min-height:62px}
@media (max-width:640px){.sim-strip{grid-template-columns:1fr}}
.sim:fullscreen{background:var(--bg);padding:10px;overflow:auto}
.sim-cue{background:#07131B;color:#E8EDF1;border:1px solid #3A434C;border-left:3px solid #F064B2;border-radius:8px;padding:7px 12px;font-size:14px;line-height:1.35;min-width:0}
.sim-cue b{font-family:var(--f-display);font-size:1.1rem;letter-spacing:.02em;display:block}
.sim-cue .todo{color:#F7A8D3;font-size:12.5px;margin-top:2px}
.sim-toast{border-radius:8px;padding:7px 12px;font-size:14px;font-weight:600;transition:opacity .3s;opacity:0;min-width:0;border:1px solid transparent}
.sim-toast.show{opacity:1}
.sim-toast.ok{background:#14301F;color:#7BE3A8;border:1px solid #2F7A4F}
.sim-toast.bad{background:#3A1C19;color:#FFA59C;border:1px solid #8A3A33}
.sim-toast.miss{background:#3A2E12;color:#F5C56B;border:1px solid #7A5F22}
.sim-toast small{display:block;font-weight:400;font-size:12.5px;opacity:.9}
.sim-paused{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(7,19,27,.55);color:#fff;font-family:var(--f-display);font-size:2rem;letter-spacing:.05em}
.sim-rot{display:none;font-size:13px;color:var(--muted);margin:0}
@media (orientation:portrait) and (max-width:700px){.sim-rot{display:block}}
.seg{display:inline-flex;align-self:flex-start;border:1.5px solid var(--line);border-radius:999px;overflow:hidden}
.seg button{border:0;border-radius:0;padding:8px 14px;font-size:14px;background:var(--surface);color:var(--muted)}
.seg button[aria-pressed="true"]{background:var(--accent);color:#fff}
.opt{display:flex;flex-direction:column;gap:6px}
.opt .lbl{font-family:var(--f-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.debrief{display:flex;flex-direction:column;gap:0;border:1px solid var(--line);border-radius:10px;background:var(--surface);overflow:hidden}
.debrief .ph{padding:12px 14px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
.debrief .ph:first-child{border-top:0}
.debrief .ph h3{margin:0;font-size:15px}
.debrief ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.debrief li{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px;font-size:14px}
.debrief li .s{font-family:var(--f-mono);font-weight:600}
.debrief li.ok .s{color:var(--ok)} .debrief li.miss .s{color:var(--err)}
.debrief li .why{grid-column:2;color:var(--muted);font-size:13px}
.big{font-family:var(--f-display);font-weight:700;font-size:3rem;line-height:1}
.av-wrap{position:fixed;inset:0;z-index:50;background:rgba(7,19,27,.6);display:flex;align-items:flex-end;justify-content:center;padding:max(12px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px))}
@media (min-width:640px){.av-wrap{align-items:center}}
.av{background:var(--surface);color:var(--ink);border-radius:14px;border-top:3px solid var(--accent);width:min(560px,100%);max-height:100%;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px;box-shadow:0 12px 40px rgba(0,0,0,.35)}
.av h2{margin:0}
.av-s{border:1px solid var(--line);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:10px}
.av-h{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.av-st{font-family:var(--f-mono);font-size:12.5px;color:var(--muted);text-align:right}
.av-st.ok{color:var(--ok)} .av-st.bad{color:var(--err)}
.av-steps{margin:0;padding-left:1.3em;display:flex;flex-direction:column;gap:6px;font-size:14px}
.av-alert{margin:0;background:var(--err-soft);color:var(--err);border-radius:8px;padding:8px 12px;font-weight:600;font-size:14px}
.av-end{justify-content:space-between}
.sim-mic{font-family:var(--f-mono);font-size:12.5px;color:var(--muted);display:flex;gap:8px;align-items:center;min-width:0}
.sim-mic .dot{width:9px;height:9px;border-radius:50%;background:var(--line);flex:none}
.sim-mic.on .dot{background:#F064B2}
.sim-mic span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink)}
.sim-toast .atc{display:block;margin-top:4px;color:#9FD3FF;font-weight:500;font-size:13px}
.cs{font:600 1.1rem var(--f-mono);padding:8px 12px;border:1.5px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);width:10ch;text-transform:uppercase}
`;
let styled=false;function addStyle(){if(styled)return;styled=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s)}

/* ---------- voix : synthèse (consignes, radio) ---------- */
const SRC=window.SpeechRecognition||window.webkitSpeechRecognition;
const TTS={q:[],busy:false,until:0};
const ICAO={A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Fox',G:'Golf',H:'Hotel',I:'India',J:'Juliett',K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Québec',R:'Roméo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whisky',X:'X-ray',Y:'Yankee',Z:'Zoulou'};
const DIG=['zéro','un','deux','trois','quatre','cinq','six','sept','huit','neuf'];
function pickVoices(){if(!('speechSynthesis' in window))return;const v=speechSynthesis.getVoices().filter(x=>/^fr/i.test(x.lang));
 const fr=v.filter(x=>/fr-FR/i.test(x.lang));TTS.pilot=fr[0]||v[0]||null;TTS.atc=fr.find(x=>x!==TTS.pilot)||v.find(x=>x!==TTS.pilot)||TTS.pilot}
if('speechSynthesis' in window){pickVoices();speechSynthesis.addEventListener&&speechSynthesis.addEventListener('voiceschanged',pickVoices)}
function unlockTTS(){if(!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('.');u.volume=0;u.lang='fr-FR';speechSynthesis.speak(u)}catch(e){}pickVoices()}
function radioTts(t){return t.replace(/(\d+)[.,](\d+)/g,(m,a,b)=>a.split('').map(d=>DIG[d]).join(' ')+' décimale '+b.split('').map(d=>DIG[d]).join(' '))
 .replace(/\b(\d{2,4})\b(?!\s*(nœuds|personnes))/g,m=>m.split('').map(d=>DIG[d]).join(' '))}
function sayQ(text,who){if(MODE.sound!=='on'||!('speechSynthesis' in window)||!text)return;TTS.q.push({text:who==='instr'?text:radioTts(text),who});if(!TTS.busy)sayNext()}
function sayNext(){const it=TTS.q.shift();if(!it){TTS.busy=false;TTS.until=performance.now()+700;return}TTS.busy=true;
 const u=new SpeechSynthesisUtterance(it.text);u.lang='fr-FR';const v=it.who==='atc'?TTS.atc:TTS.pilot;if(v)u.voice=v;
 u.rate=it.who==='atc'?1.12:1.05;u.pitch=it.who==='atc'?.8:it.who==='instr'?1.1:1;
 let done=false;const fin=()=>{if(done)return;done=true;setTimeout(sayNext,it.who==='pilot'?500:200)};u.onend=fin;u.onerror=fin;
 try{speechSynthesis.speak(u)}catch(e){fin()}setTimeout(fin,2500+it.text.length*95)}
function hush(){TTS.q=[];TTS.busy=false;try{speechSynthesis.cancel()}catch(e){}}
const speakingNow=()=>TTS.busy||performance.now()<TTS.until;

/* ---------- fenêtre : son et micro ---------- */
const UA=navigator.userAgent||'';
const OS=/iPhone|iPad|iPod/.test(UA)||(/Macintosh/.test(UA)&&navigator.maxTouchPoints>1)?'ios':/Android/.test(UA)?'android':'desktop';
const STANDALONE=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const AVKEY='learning-ifr-av';
const HELP={
 ios:{
  sound:['Désactive le mode silencieux : bouton sur le côté de l\'iPhone (orange = silencieux).','Monte le volume pendant que l\'app parle.','Si toujours rien : Réglages › Accessibilité › Contenu énoncé › Voix › Français, puis télécharge une voix (Thomas ou Amélie).'],
  mic:['Dans Safari : touche « aA » dans la barre d\'adresse › Réglages du site web › Microphone › Autoriser.','Réglages › Applications › Safari › Microphone : « Demander » ou « Autoriser ».','Réglages › Confidentialité et sécurité › Reconnaissance vocale : active Safari.','Réglages › Confidentialité et sécurité › Microphone : active Safari s\'il apparaît.'],
  note:STANDALONE?'L\'app installée sur l\'écran d\'accueil utilise les réglages de Safari. Si la dictée reste muette, ouvre la même adresse dans Safari.':''},
 android:{
  sound:['Monte le volume « Multimédia » (pas celui de la sonnerie) pendant que l\'app parle.','Réglages › Système › Langues et saisie › Synthèse vocale : moteur Google, langue Français.','Dans ce même menu, installe les données vocales françaises si elles manquent.'],
  mic:['Touche le cadenas (ou ⓘ) à gauche de l\'adresse › Autorisations › Micro › Autoriser.','Ou : Chrome › ⋮ › Paramètres › Paramètres des sites › Micro : retire le blocage pour ce site.','Réglages Android › Applications › Chrome › Autorisations › Micro › Autoriser.'],
  note:STANDALONE?'L\'app installée utilise les autorisations de Chrome : appui long sur son icône › Infos sur l\'appli › Autorisations, ou les paramètres des sites de Chrome.':''},
 desktop:{
  sound:['Vérifie le volume et la sortie audio de l\'ordinateur.','Une voix française doit être installée dans le système.'],
  mic:['Clique sur le cadenas à gauche de l\'adresse › Microphone › Autoriser, puis recharge la page.','Vérifie aussi l\'accès au micro du navigateur dans les réglages de confidentialité du système.'],note:''}};
let avBox=null;
function avDialog(onDone,reason){
 addStyle();if(avBox)avBox.remove();const H=HELP[OS];
 const box=document.createElement('div');box.className='av-wrap';avBox=box;
 box.innerHTML=`<div class="av" role="dialog" aria-modal="true" aria-labelledby="avT">
  <h2 id="avT">Son et micro</h2>
  ${reason?`<p class="av-alert">${esc(reason)}</p>`:''}
  <p class="note">Une page web ne peut pas ouvrir les réglages du téléphone à ta place. Teste ici, et si ça bloque, suis le chemin indiqué.</p>
  <section class="av-s"><div class="av-h"><b>1. Voix de l'app</b><span class="av-st" id="avSnd">non testé</span></div>
   <div class="row"><button type="button" class="small" id="avPlay">Tester le son</button><button type="button" class="small" id="avYes" hidden>J'entends</button><button type="button" class="small" id="avNo" hidden>Rien entendu</button></div>
   <ol class="av-steps" id="avSndHelp" hidden>${H.sound.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>
  <section class="av-s"><div class="av-h"><b>2. Micro (commandes vocales)</b><span class="av-st" id="avMic">${SRC?'non testé':'indisponible'}</span></div>
   ${SRC?`<div class="row"><button type="button" class="small" id="avAsk">Autoriser le micro</button></div>`:`<p class="note">Ce navigateur ne fait pas la dictée. Utilise Chrome sur Android ou Safari sur iPhone, ou réponds en touchant la planche.</p>`}
   <ol class="av-steps" id="avMicHelp" hidden>${H.mic.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
   ${H.note?`<p class="note" id="avNote" hidden>${esc(H.note)}</p>`:''}</section>
  <div class="row av-end"><button type="button" class="primary" id="avGo">${onDone?'Continuer':'Fermer'}</button><button type="button" class="ghost small" id="avAll">Voir tous les réglages</button></div></div>`;
 document.body.appendChild(box);
 const $$=id=>box.querySelector('#'+id),set=(id,t,c)=>{const e=$$(id);e.textContent=t;e.className='av-st '+(c||'')};
 const fr=()=>('speechSynthesis' in window)?speechSynthesis.getVoices().some(v=>/^fr/i.test(v.lang)):false;
 $$('avPlay').onclick=()=>{
  if(!('speechSynthesis' in window)){set('avSnd','synthèse vocale absente','bad');$$('avSndHelp').hidden=false;return}
  try{speechSynthesis.cancel();pickVoices();const u=new SpeechSynthesisUtterance('Lasbordes Tour, test radio, un, deux, trois.');u.lang='fr-FR';if(TTS.pilot)u.voice=TTS.pilot;u.volume=1;speechSynthesis.speak(u)}catch(e){}
  set('avSnd',fr()?'lecture en cours…':'aucune voix française détectée',fr()?'':'bad');$$('avYes').hidden=false;$$('avNo').hidden=false};
 $$('avYes').onclick=()=>{set('avSnd','OK','ok');$$('avSndHelp').hidden=true;MODE.sound='on';saveAV({sound:'ok'})};
 $$('avNo').onclick=()=>{set('avSnd','à régler','bad');$$('avSndHelp').hidden=false};
 const micBad=()=>{set('avMic','bloqué','bad');$$('avMicHelp').hidden=false;$$('avNote')&&($$('avNote').hidden=false)};
 if(SRC){
  $$('avAsk').onclick=async()=>{
   if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){micBad();return}
   set('avMic','demande en cours…');
   try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());set('avMic','autorisé','ok');$$('avMicHelp').hidden=true;MODE.mic='on';saveAV({mic:'ok'})}
   catch(e){micBad()}};
  if(navigator.permissions&&navigator.permissions.query)navigator.permissions.query({name:'microphone'}).then(p=>{if(p.state==='granted')set('avMic','autorisé','ok');if(p.state==='denied')micBad()}).catch(()=>{});
 }
 $$('avAll').onclick=()=>{$$('avSndHelp').hidden=false;$$('avMicHelp')&&($$('avMicHelp').hidden=false);$$('avNote')&&($$('avNote').hidden=false)};
 const close=()=>{box.remove();avBox=null;try{localStorage.setItem('learning-ifr-sim',JSON.stringify(MODE))}catch(e){}};
 $$('avGo').onclick=()=>{close();onDone&&onDone()};
 box.addEventListener('pointerdown',e=>{if(e.target===box&&!onDone)close()});
 $$('avPlay').focus();
}
function saveAV(o){try{const v=JSON.parse(localStorage.getItem(AVKEY)||'{}');localStorage.setItem(AVKEY,JSON.stringify(Object.assign(v,o)))}catch(e){}}
function avChecked(){try{const v=JSON.parse(localStorage.getItem(AVKEY)||'{}');return(MODE.sound!=='on'||v.sound)&&(MODE.mic!=='on'||!SRC||v.mic)}catch(e){return true}}
SIM.avDialog=avDialog;

/* ---------- dictée des commandes ---------- */
const VOC=[ // ordre = priorité ; le texte reconnu est masqué au fur et à mesure
 ['fuelP',/pression (d'|d |de l')?(essence|carburant)/],['oilP',/pression (d'|d |de l')?huile|pressions?/],['oilT',/temp[ée]ratures? (d'|d |de l')?huile|temp[ée]ratures?/],
 ['tach',/compte[- ]?tours?|tours? moteur|r[ée]gime|tours? minute/],
 ['throttle',/pleins? gaz|gaz|r[ée]duc\w*|r[ée]dui\w*|puissance|manette|ralenti/],
 ['flaps',/volets?|cran/],['carb',/r[ée]chauf\w*|carbu(?!rant)\w*/],['mixture',/m[ée]lange|richesse|[ée]touffoir/],
 ['pump',/pompe/],['lights',/phares?/],['nav',/feux? de nav\w*|\bnav\b|feux? de position/],['strobe',/anti ?coll\w*|strobe|flash/],
 ['batt',/batterie/],['alt',/alternateur|g[ée]n[ée]ratrice/],['xpdr',/transpondeur|transpo\b|squawk|mode alt/],
 ['trim',/compens\w*|trim/],['stick',/rotation|cabr\w*|arrondi|manche|assiette/],
 ['brake',/frein\w*/],['altim',/altim[èe]tre|calage|qnh|cal[ée]/],['mags',/magn[ée]to\w*|d[ée]marr\w*|contact/],
 ['fuel',/robinet|r[ée]servoir|essence|carburant/],['asi',/an[ée]mom[èe]tre|badin|vitesse/],['dg',/conservateur|compas|cap\b/],['tc',/bille|aiguille/],['ai',/horizon/],['vsi',/vario\w*/],
 ['radio',/radio|annonce|collation\w*|lasbordes|\btour\b|atis|information|fox|\bf ?g\w*|pr[eê]t|vent arri[èe]re|finale|d[ée]gag\w*|roul\w*|align\w*|autoris\w*/]];
function parseVoice(t){let s=' '+t.toLowerCase().replace(/[’]/g,"'")+' ';const out=[];
 for(const [z,re] of VOC){const g=new RegExp(re.source,'g');let m;while((m=g.exec(s))){out.push({i:m.index,z});s=s.slice(0,m.index)+' '.repeat(m[0].length)+s.slice(m.index+m[0].length);g.lastIndex=m.index+m[0].length}}
 out.sort((a,b)=>a.i-b.i);const low=' '+t.toLowerCase()+' ';
 out.forEach((o,k)=>o.seg=low.slice(o.i,k+1<out.length?out[k+1].i:low.length));
 const seen=new Set();return out.filter(o=>{if(seen.has(o.z))return false;seen.add(o.z);return true}).map(o=>({z:o.z,q:qual(o.z,o.seg)}))}
/* intention exprimée à la voix : null si rien de précis */
const ONW=/\b(on|allum\w*|marche|en service|branch\w*)\b/,OFFW=/\b(off|coup\w*|[ée]tein\w*|hors service)\b/;
function qual(z,g){
 if(z==='throttle'){if(/plein/.test(g))return'plein';if(/r[ée]du|ralenti|mille|1000|palier|1700|1800|2250/.test(g))return'reduce';return null}
 if(z==='flaps'){if(/rentr|z[ée]ro|lisse|\b0\b/.test(g))return 0;if(/atterr|deux|2|second|plein|sorti/.test(g))return 2;if(/un cran|premier|d[ée]coll|\b1\b|\bun\b/.test(g))return 1;return null}
 if(z==='carb'){if(/chaud/.test(g))return'chaud';if(/froid/.test(g))return'froid';return null}
 if(z==='mixture'){if(/riche/.test(g))return'riche';if(/pauvre|[ée]touff|coup/.test(g))return'pauvre';return null}
 if(z==='brake'){if(/desserr|libre|l[âa]ch/.test(g))return'libre';if(/serr/.test(g))return'serré';return null}
 if(z==='xpdr'){if(/\balt\b|alpha|charlie|mode c/.test(g))return'ALT';if(/stby|stand ?by|attente|veille/.test(g))return'STBY';return null}
 if(['pump','lights','nav','strobe','batt','alt'].includes(z)){if(OFFW.test(g))return false;if(ONW.test(g))return true;return null}
 return null}
function qualOk(a,q){if(q==null||a.set===undefined)return true;if(a.c==='throttle')return q==='plein'?a.set==='plein':a.set!=='plein';return a.set===q}
SIM.parseVoice=parseVoice;

/* ---------- moteur ---------- */
let run=null;
SIM.stop=function(){if(!run)return;run.alive=false;hush();run.micStop&&run.micStop();cancelAnimationFrame(run.raf);try{run.lock&&run.lock.release()}catch(e){}run=null};
const MODE={mode:'guide',speed:1,sound:'on',mic:'off',cs:'F-GLIF'};
try{Object.assign(MODE,JSON.parse(localStorage.getItem('learning-ifr-sim')||'{}'))}catch(e){}

SIM.view=function(block){
 addStyle();SIM.stop();
 const panel=SIM.panels[block.sim.panel],sc=block.sim.scenario;
 const el=document.getElementById('view');
 document.getElementById('brand').textContent=sc.title;
 const nAct=sc.phases.reduce((s,p)=>s+(p.actions||[]).length,0);
 el.innerHTML=`<div><div class="eyebrow">Pratique · ${esc(panel.name)}</div><h1>${esc(sc.title)}</h1><p class="lead">${esc(sc.intro||'')}</p></div>
  <div class="opt"><span class="lbl">Mode</span><div class="seg" id="mMode"><button type="button" data-v="guide">Guidé</button><button type="button" data-v="auto">Autonome</button></div>
   <p class="note" id="mDesc"></p></div>
  <div class="opt"><span class="lbl">Cadence</span><div class="seg" id="mSpeed"><button type="button" data-v="0.7">Lente</button><button type="button" data-v="1">Normale</button><button type="button" data-v="1.4">Rapide</button></div></div>
  <div class="opt"><span class="lbl">Son : consignes et radio</span><div class="seg" id="mSound"><button type="button" data-v="on">Activé</button><button type="button" data-v="off">Coupé</button></div></div>
  <div class="opt"><span class="lbl">Commandes vocales</span><div class="seg" id="mMic"><button type="button" data-v="on">Activées</button><button type="button" data-v="off">Désactivées</button></div>
   <p class="note">${SRC?"Dis l'action : « plein gaz », « volets un cran », « pompe », « réchauffage », « compenser »… Pour la radio, dis ton message ou « radio ».":"La dictée n'est pas disponible dans ce navigateur (Chrome sur Android ou Safari sur iPhone la gèrent)."}</p></div>
  <div class="opt"><label class="lbl" for="mCs">Indicatif</label><input class="cs" id="mCs" maxlength="6" value="${esc(MODE.cs)}" autocomplete="off"></div>
  <p class="note">${sc.phases.length} phases, ${nAct} actions. Touche la commande ou l'instrument concerné : un appui suffit, la précision du geste ne compte pas.</p>
  <div class="row"><button type="button" class="primary" id="go">Démarrer le tour de piste</button><button type="button" class="ghost" id="avBtn">Vérifier son et micro</button><a class="btn ghost" href="#/f/${block.id}">Fiche mémo</a></div>`;
 const desc={guide:"La phase et la consigne s'affichent. Après quelques secondes, les commandes à actionner clignotent. L'avion attend que tu aies tout fait.",
  auto:"Aucune consigne : tu lis les instruments et la carte. L'avion continue, ce qui n'est pas fait à temps est compté manqué."};
 const seg=(id,key)=>{const g=document.getElementById(id);const upd=()=>{g.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v)===String(MODE[key])));if(key==='mode')document.getElementById('mDesc').textContent=desc[MODE.mode]};
  g.querySelectorAll('button').forEach(b=>b.onclick=()=>{MODE[key]=key==='speed'?+b.dataset.v:b.dataset.v;try{localStorage.setItem('learning-ifr-sim',JSON.stringify(MODE))}catch(e){}upd()});upd()};
 seg('mMode','mode');seg('mSpeed','speed');seg('mSound','sound');seg('mMic','mic');
 document.getElementById('mCs').oninput=e=>{const v=e.target.value.toUpperCase().replace(/[^A-Z-]/g,'');MODE.cs=/^[A-Z]-?[A-Z]{3,4}$/.test(v)?(v.includes('-')?v:v[0]+'-'+v.slice(1)):MODE.cs;try{localStorage.setItem('learning-ifr-sim',JSON.stringify(MODE))}catch(e){}};
 const launch=()=>{unlockTTS();start(block,panel,sc)};
 document.getElementById('go').onclick=()=>{if(avChecked())launch();else{unlockTTS();avDialog(launch)}};
 document.getElementById('avBtn').onclick=()=>{unlockTTS();avDialog(null)};
};

function cs(){return MODE.cs||'F-GLIF'}
function csShort(){const c=cs().replace('-','');return c[0]+'-'+c.slice(-2)}
function T(s,speech){if(!s)return s;const ph=w=>w.replace('-','').split('').map(c=>ICAO[c]||c).join(' ');
 return s.replace(/\{CS\}/g,speech?ph(cs()):cs()).replace(/\{cs\}/g,speech?ph(csShort()):csShort())}
SIM.T=T;
function start(block,panel,sc){
 const el=document.getElementById('view');
 const parts=panel.elements.map(e=>({e,b:B[e.type](e)}));
 let svg=`<svg viewBox="0 0 ${panel.vb[0]} ${panel.vb[1]}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Planche de bord ${esc(panel.name)}">
  <rect x="0" y="0" width="${panel.vb[0]}" height="${panel.vb[1]}" fill="#1B2126"/>`;
 for(const {e,b} of parts){
  if(e.z&&b.box){const [bx,by,bw,bh]=b.box;svg+=`<g class="zone" data-z="${e.z}">${b.h}<rect class="hit" x="${bx}" y="${by}" width="${bw}" height="${bh}"/><rect class="ring" id="ring_${e.z}" x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="10"/></g>`}
  else svg+=b.h}
 svg+='</svg>';
 el.innerHTML=`<div class="sim" id="simRoot">
  <div class="sim-bar"><div class="sim-count"><span>Phase <b id="cPh">1</b>/${sc.phases.length}</span><span>✓ <b id="cOk">0</b></span><span>manquées <b id="cMiss">0</b></span><span>erreurs <b id="cBad">0</b></span></div>
   <div class="row"><button type="button" class="small" id="sPause">Pause</button><button type="button" class="small" id="sFull">Plein écran</button><button type="button" class="small ghost" id="sQuit">Arrêter</button></div></div>
  <div class="sim-strip"><div class="sim-cue" id="cue"></div><div class="sim-toast" id="toast"></div></div>
  <div class="sim-mic" id="mic" ${MODE.mic==='on'&&SRC?'':'hidden'}><span class="dot"></span><span>Commandes vocales</span><span id="heard"></span></div>
  <div class="sim-stage" id="stage">${svg}<div class="sim-paused" id="pz" hidden>PAUSE</div></div>
  <p class="sim-rot">Tourne le téléphone en paysage pour agrandir la planche.</p></div>`;
 const q=id=>document.getElementById(id);
 parts.forEach(p=>p.R=p.b.bind(q));
 const st=Object.assign({agl:0,ias:0,vs:0,hdg:sc.qfu,pos:0,bank:0,pitch:0,rpm:900},sc.init&&sc.init.vars||{});
 st.ctl=Object.assign({},panel.init,sc.init&&sc.init.ctl||{});st.anim={trim:0,stick:0,tx:0};
 const R={alive:true,raf:0,paused:false,pi:-1,pt:0,from:null,prevHdg:st.hdg,log:[],ok:0,miss:0,bad:0,wrong:[],shown:{},S:{elev:sc.elev,qnh:sc.qnh||1013,leg:''},rec:null};
 run=R;
 if(navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>{R.lock=l}).catch(()=>{});
 const zl=Object.fromEntries(panel.elements.filter(e=>e.z).map(e=>[e.z,e.zl||e.label||e.z]));
 const cue=q('cue'),toast=q('toast');let toastT=0;
 const show=(cls,html,ms)=>{toast.className='sim-toast show '+cls;toast.innerHTML=html;clearTimeout(toastT);toastT=setTimeout(()=>toast.classList.remove('show'),ms||2600)};
 const ring=(z,cls)=>{const r=q('ring_'+z);if(!r)return;r.classList.remove('ok','bad');void r.getBBox();r.classList.add(cls)};
 const counts=()=>{q('cOk').textContent=R.ok;q('cMiss').textContent=R.miss;q('cBad').textContent=R.bad;q('cPh').textContent=Math.min(R.pi+1,sc.phases.length)};
 const cur=()=>sc.phases[R.pi];
 function enter(i){
  if(R.acts&&R.pi>=0)R.log.push({ph:cur(),acts:R.acts});
  R.pi=i;R.pt=0;R.hinted=false;R.waitShown=false;const ph=cur();if(!ph){R.acts=null;return finish()}
  R.from={agl:st.agl,ias:st.ias,vs:st.vs,hdg:st.hdg,pos:st.pos,pitch:st.pitch};R.hasPitch=ph.to&&ph.to.pitch!=null;
  R.acts=(ph.actions||[]).map(a=>({a,s:'pending'}));R.S.leg=ph.leg||'';
  document.querySelectorAll('.sim-stage .ring.hint').forEach(r=>r.classList.remove('hint'));
  drawCue();counts();
  if(MODE.mode==='guide')sayQ(T(ph.cue||ph.name),'instr');
 }
 function drawCue(){const ph=cur();if(!ph)return;
  if(MODE.mode==='guide'){const pend=R.acts.filter(x=>x.s==='pending');
   cue.innerHTML=`<b>${esc(ph.name)}</b>${esc(T(ph.cue||''))}${R.pt>2.5&&pend.length?`<div class="todo">À faire : ${pend.map(x=>esc(T(x.a.label))).join(' · ')}</div>`:''}`}
  else cue.innerHTML=`<b>${esc(ph.leg||'')}</b>`}
 function apply(a){if(a.set!==undefined)st.ctl[a.c]=a.set;if(a.fx)a.fx(st.ctl,st);if(a.c==='trim')st.anim.trim=performance.now();if(a.c==='stick')st.anim.stick=performance.now();if(a.c==='radio')st.anim.tx=performance.now()+1600}
 function tap(z,src,qv){
  if(!R.alive||R.paused||!cur())return;
  let x=R.acts.find(x=>x.s==='pending'&&x.a.c===z&&qualOk(x.a,qv));
  if(!x&&R.acts.some(x=>x.s==='pending'&&x.a.c===z)){const y=R.acts.find(x=>x.s==='pending'&&x.a.c===z);R.bad++;ring(z,'bad');const msg=`Pas ce réglage : attendu « ${T(y.a.label)} ».`;R.wrong.push({ph:cur().name,msg});show('bad','✗ '+esc(msg));counts();return}
  if(x){x.s='ok';R.ok++;apply(x.a);ring(z,'ok');const r=q('ring_'+z);if(r&&!R.acts.some(y=>y.s==='pending'&&y.a.c===z))r.classList.remove('hint');const a=x.a;
   if(a.say&&src!=='voice')sayQ(T(a.say,true),'pilot');
   if(a.reply)sayQ(T(a.reply,true),'atc');
   show('ok','✓ '+esc(T(a.label))+(a.say?`<small>« ${esc(T(a.say))} »</small>`:'')+(a.reply?`<span class="atc">${esc(a.from||'Tour')} : « ${esc(T(a.reply))} »</span>`:''),a.reply||a.say?(a.reply||'').length*70+5000:2600);
   counts();drawCue();return}
  // animation de la commande même si l'action n'est pas attendue
  if(z==='trim')st.anim.trim=performance.now();if(z==='stick')st.anim.stick=performance.now();
  R.bad++;ring(z,'bad');
  let msg='Rien à faire sur '+zl[z]+' dans ce tour de piste.';
  const later=sc.phases.slice(R.pi+1).find(p=>(p.actions||[]).some(a=>a.c===z));
  const before=sc.phases.slice(0,R.pi+1).reverse().find(p=>(p.actions||[]).some(a=>a.c===z));
  if(later){const a=later.actions.find(a=>a.c===z);msg=`Pas maintenant. ${a.label} : en « ${later.name} ».`}
  else if(before){msg=`Pas maintenant : ${zl[z]} est déjà réglé (fait en « ${before.name} »).`}
  R.wrong.push({ph:cur().name,msg});show('bad','✗ '+esc(T(msg)));counts();
 }
 /* dictée continue */
 function micStart(){if(!SRC||MODE.mic!=='on'||!R.alive||R.rec)return;const rec=new SRC();R.rec=rec;rec.lang='fr-FR';rec.continuous=true;rec.interimResults=false;rec.maxAlternatives=1;
  rec.onstart=()=>q('mic')&&q('mic').classList.add('on');
  rec.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){if(!e.results[i].isFinal)continue;const t=e.results[i][0].transcript.trim();if(!t||speakingNow())continue;
   if(q('heard'))q('heard').textContent='« '+t+' »';
   if(R.paused){if(/reprendre|reprise|continue/i.test(t))q('sPause').click();continue}
   if(/^\s*(pause|stop)\s*$/i.test(t)){q('sPause').click();continue}
   const zs=parseVoice(t);if(!zs.length){show('bad','Pas compris : « '+esc(t)+' »');continue}zs.forEach(o=>tap(o.z,'voice',o.q))}};
  rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){MODE.mic='off';saveAV({mic:null});q('mic')&&(q('mic').hidden=true);if(!R.paused)q('sPause').click();avDialog(null,'Le micro est bloqué : les commandes vocales sont coupées. Autorise-le, puis relance le tour de piste.')}};
  rec.onend=()=>{R.rec=null;q('mic')&&q('mic').classList.remove('on');if(R.alive&&MODE.mic==='on')setTimeout(micStart,250)};
  try{rec.start()}catch(e){R.rec=null}}
 function micStop(){if(R.rec){const r=R.rec;R.rec=null;r.onend=null;try{r.abort()}catch(e){}}}
 R.micStop=micStop;
 q('stage').addEventListener('pointerdown',ev=>{const g=ev.target.closest('.zone');if(g){ev.preventDefault();tap(g.dataset.z)}});
 q('sPause').onclick=()=>{R.paused=!R.paused;q('pz').hidden=!R.paused;q('sPause').textContent=R.paused?'Reprendre':'Pause';if(R.paused)hush()};
 q('sFull').onclick=()=>{const s=q('simRoot');try{(document.fullscreenElement?document.exitFullscreen():(s.requestFullscreen||s.webkitRequestFullscreen).call(s))}catch(e){}};
 q('sQuit').onclick=()=>finish(true);
 function step(dt){
  const ph=cur();if(!ph)return;R.pt+=dt;
  const to=Object.assign({},R.from,ph.to||{}),f=ph.dur>0?ease(R.pt/ph.dur):1,L=(a,b)=>a+(b-a)*f;
  st.agl=L(R.from.agl,to.agl);st.ias=L(R.from.ias,to.ias);st.vs=L(R.from.vs,to.vs);st.pos=L(R.from.pos,to.pos);
  st.hdg=norm(R.from.hdg+angDiff(R.from.hdg,to.hdg)*f);
  st.pitch=R.hasPitch?L(R.from.pitch,to.pitch):(st.agl<1?0:clamp(2+st.vs/160,-6,10));
  const rate=dt>0?angDiff(R.prevHdg,st.hdg)/dt:0;R.prevHdg=st.hdg;st.bank+=((st.agl<1?0:clamp(rate*1.6,-25,25))-st.bank)*Math.min(1,dt*4);st.turn=st.agl<1?clamp(rate*1.2,-25,25):st.bank;
  const th=st.ctl.throttle,air=st.agl>1;
  let rT=th==='plein'?2250+st.ias*(air?.8:.5):th==='palier'?2250:th==='approche'?(air?1750:1800):(air?1300:1000);if(st.ctl.run===false)rT=0;if(st.rpmDrop&&performance.now()<st.rpmDrop)rT-=90;
  st.rpm+=(rT-st.rpm)*Math.min(1,dt*2);
  const pend=R.acts.filter(x=>x.s==='pending');
  if(MODE.mode==='guide'&&R.pt>2.5&&pend.length&&!R.hinted){R.hinted=true;pend.forEach(x=>{const r=q('ring_'+x.a.c);r&&r.classList.add('hint')});drawCue()}
  const motionDone=R.pt>=ph.dur;
  if(motionDone&&!pend.length){R.hinted=false;return enter(R.pi+1)}
  if(MODE.mode==='auto'){const win=ph.win||Math.max(ph.dur,5);
   if(R.pt>=win){pend.forEach(x=>{x.s='miss';R.miss++;apply(x.a)});
    show('miss','Manqué : '+pend.map(x=>esc(x.a.label)).join(' · '));R.hinted=false;return enter(R.pi+1)}}
  else if(motionDone&&!R.waitShown){R.waitShown=true;drawCue()}
  if(!motionDone)R.waitShown=false;
 }
 function draw(){for(const p of parts)p.b.upd(p.R,st,R.S)}
 let last=performance.now();
 function frame(now){if(!R.alive)return;const dt=Math.min(.1,(now-last)/1000)*MODE.speed;last=now;if(!R.paused)step(dt);if(R.alive){draw();R.raf=requestAnimationFrame(frame)}}
 function finish(aborted){
  if(!R.alive)return;R.alive=false;cancelAnimationFrame(R.raf);try{R.lock&&R.lock.release()}catch(e){}
  if(R.acts)R.acts.filter(x=>x.s==='pending').forEach(x=>x.s='miss');
  hush();micStop();
  debrief(block,sc,R,aborted);run=null;
 }
 enter(0);draw();R.raf=requestAnimationFrame(frame);micStart();
 try{q('simRoot').scrollIntoView({block:'start'})}catch(e){}
}

function debrief(block,sc,R,aborted){
 if(R.acts&&R.pi<sc.phases.length&&R.pi>=0&&!R.log.some(l=>l.ph===sc.phases[R.pi]))R.log.push({ph:sc.phases[R.pi],acts:R.acts});
 const total=R.log.reduce((s,l)=>s+l.acts.length,0),ok=R.log.reduce((s,l)=>s+l.acts.filter(x=>x.s==='ok').length,0);
 if(!aborted&&total){const b=S.by[block.id]||(S.by[block.id]={t:0,o:0});b.t+=total;b.o+=ok;save()}
 const p=total?Math.round(ok/total*100):0;
 const el=document.getElementById('view');
 el.innerHTML=`<div><div class="eyebrow">Débrief · ${MODE.mode==='guide'?'mode guidé':'mode autonome'}</div><h1>${aborted?'Tour de piste interrompu':'Tour de piste terminé'}</h1></div>
  <div class="row" style="align-items:baseline;gap:18px"><span class="big">${p} %</span><span class="note">${ok}/${total} actions à temps · ${R.bad} erreur${R.bad>1?'s':''} de commande</span></div>
  <div class="row"><button type="button" class="primary" id="again">Recommencer</button><a class="btn" href="#/f/${block.id}">Fiche mémo</a><a class="btn ghost" href="#/m/${block.mod.id}">Autres exercices</a></div>
  <div class="debrief">${R.log.filter(l=>l.acts.length).map(l=>`<div class="ph"><h3>${esc(l.ph.name)}</h3><ul>${l.acts.map(x=>`<li class="${x.s}"><span class="s">${x.s==='ok'?'✓':'✗'}</span><span>${esc(T(x.a.label))}</span>${x.s!=='ok'&&x.a.why?`<span class="why">${esc(x.a.why)}</span>`:''}</li>`).join('')}</ul></div>`).join('')}</div>
  ${R.wrong.length?`<section><h2>Commandes touchées à tort</h2><div style="height:8px"></div><div class="debrief">${R.wrong.map(w=>`<div class="ph"><span class="note">${esc(w.ph)}</span><span>${esc(w.msg)}</span></div>`).join('')}</div></section>`:''}`;
 document.getElementById('again').onclick=()=>SIM.view(block);
 window.scrollTo(0,0);
}

/* ---------- fiche mémo générée depuis le scénario ---------- */
SIM.memo=function(sc,head,foot){
 return (head||'')+sc.phases.filter(p=>(p.actions||[]).length).map(p=>`<h3>${esc(p.name)}</h3><p style="margin:0 0 6px;color:var(--muted);font-size:14px">${esc(T(p.cue||''))}</p><ul>${p.actions.map(a=>`<li><b>${esc(T(a.label))}</b>${a.why?` — ${esc(a.why)}`:''}${a.say?`<br><span style="font-family:var(--f-mono);font-size:13px">« ${esc(T(a.say))} »</span>`:''}${a.reply?`<br><span style="font-family:var(--f-mono);font-size:13px;color:var(--muted)">${esc(a.from||'Tour')} : « ${esc(T(a.reply))} »</span>`:''}</li>`).join('')}</ul>`).join('')+(foot||'');
};
})();
