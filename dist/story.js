'use strict';
(() => {
  const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d',{alpha:false}),stage=$('stage'),journey=$('journey');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),range=(p,a,b)=>clamp((p-a)/(b-a)),smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
  const visible=(p,a,b,c,d)=>smooth(range(p,a,b))*(1-smooth(range(p,c,d)));
  const images={},spriteCache=new Map(),assetNames=['sky','gate','clouds','heaven-sky','heaven-long','heaven-palace','heaven-horses','angle-wide','canyon','lotus-front','poses-c','poses-d','poses-e','worlds','projectile','impacts'];
  let W=0,H=0,dpr=1,p=0,ready=false,requested=false,draws=0,loaded=0;
  let soft=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=()=>W/H<1.15;
  const CHAPTERS=[[0,'序 · 天阙'],[.10,'壹 · 金阙'],[.235,'贰 · 引弦'],[.43,'叁 · 万象'],[.56,'肆 · 凝神'],[.638,'伍 · 见光'],[.748,'陆 · 离弦'],[.775,'柒 · 破空'],[.85,'终 · 九霄'],[.947,'终 · 余响']];
  const SCENES=[{a:.11,b:.13,c:.17,d:.19,n:'I',title:'金阙\n无声',verse:'越过云海，\n风停在弦上。'},{a:.855,b:.87,c:.89,d:.91,n:'IX',title:'一箭\n破九霄',verse:'目光所至，\n长空不再遥远。'}];
  // Cache atlas cells once. Every pose is a separate redrawn image.
  function sprite(name,frame=0){
    if(name==='heaven-horses'){
      const key=name+':'+frame;if(!spriteCache.has(key)){const im=images[name],c=document.createElement('canvas');c.width=Math.floor(im.width/2);c.height=im.height;c.getContext('2d').drawImage(im,frame*c.width,0,c.width,c.height,0,0,c.width,c.height);spriteCache.set(key,c);}return spriteCache.get(key);
    }
    if(!name.startsWith('poses-')&&name!=='worlds'&&name!=='impacts'&&name!=='angle-poses')return images[name];
    const key=name+':'+frame;
    if(!spriteCache.has(key)){const im=images[name],c=document.createElement('canvas'),sw=Math.floor(im.width/2),sh=Math.floor(im.height/2);const edge=['poses-f'].includes(name)?52:2;c.width=sw-edge;c.height=sh-4;c.getContext('2d').drawImage(im,(frame%2)*sw+2,Math.floor(frame/2)*sh+2,sw-edge,sh-4,0,0,c.width,c.height);spriteCache.set(key,c);}return spriteCache.get(key);
  }
  function fill(color,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(0,0,W,H);ctx.restore();}
  function image(name,{x=W/2,y=H/2,w,h,scale=1,alpha=1,rotation=0,frame=0,flip=false}={}){
    if(alpha<=0)return;const im=sprite(name,frame);if(!im)return;
    if(!w&&!h){w=W;h=w*im.height/im.width;}else if(!w)w=h*im.width/im.height;else if(!h)h=w*im.height/im.width;
    ctx.save();ctx.globalAlpha=clamp(alpha);ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(flip?-scale:scale,scale);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();
  }
  function cover(name,{frame=0,scale=1,x=0,y=0,alpha=1}={}){const im=sprite(name,frame),s=Math.max(W/im.width,H/im.height)*scale;image(name,{frame,w:im.width*s,h:im.height*s,x:W/2+x,y:H/2+y,alpha});}
  // Independently projected image planes: farther layers move less than nearby layers.
  function plane(name,{x=.5,y=.5,height=1,z=0,camera=0,pan=0,...opts}={}){const perspective=2.8/Math.max(.16,2.8+z-camera);image(name,{x:W/2+(x-.5)*W*perspective-pan*W/(2.8+z),y:H/2+(y-.5)*H*perspective,h:H*height*perspective,...opts});}
  function sky(progress){cover('sky',{scale:1.06+progress*.15,y:-H*progress*.045});}
  function cloudFront(progress,alpha=1){plane('clouds',{height:mobile()?1.4:1.24,y:.84+progress*.25,z:-.5,camera:progress*.8,pan:progress*.12,alpha});}
  function particles(progress,count=25,opacity=.5){ctx.save();ctx.fillStyle='#cfbd85';ctx.globalAlpha=opacity;for(let i=0;i<count;i++){const r=((i*71.31)%100)/100,q=((i*37.21)%100)/100,depth=1+(i%4)*.6,x=((r+progress*.24*depth)%1.2-.1)*W,y=((q-progress*.25*depth+3)%1.2-.1)*H,size=(i%3+1)*.8;ctx.fillRect(x,y,size,size*2.4);}ctx.restore();}
  function prelude(progress){
    sky(progress);
    if(progress>=.078){
      const t=smooth(range(progress,.10,.255)),im=images['heaven-long'],height=Math.max(H*2.65,W*im.height/im.width);
      image('heaven-long',{x:W*.5,y:height/2-(height-H)*t,h:height,alpha:smooth(range(progress,.078,.10))});
    }
    if(progress<.095){
      const t=smooth(range(progress,0,.09)),alpha=1-smooth(range(progress,.078,.095));
      cover('heaven-sky',{scale:1.02+t*.025,y:-H*t*.025,alpha});
      const sceneW=mobile()?W*1.42:W,horseH=mobile()?Math.min(H*.70,W*1.05):H*1.06;
      image('heaven-palace',{x:W*.5,y:H*(.57-t*.07),w:sceneW*(1.02-t*.1),alpha});
      for(let side=0;side<2;side++)image('heaven-horses',{frame:side,x:W*.5+(side?1:-1)*(mobile()?W*(.24+t*.05):sceneW*(.29+t*.10)),y:H*(mobile()?.66:.56)+H*t*.08,h:horseH*(1+t*.18),alpha});
      image('clouds',{x:W*.5,y:H*(1.05+t*.18),w:Math.max(W,H*1.2)*1.15,alpha:alpha*.85});
    }
    if(progress>=.10){
      const t=smooth(range(progress,.10,.25));
      image('gate',{x:W*.5,y:H*mix(.60,-.38,t),h:H*mix(mobile()?1.38:1.65,mobile()?.30:.38,t),alpha:smooth(range(progress,.10,.115))});
    }
    particles(progress*3,28,.35);
    if(progress>=.09&&progress<.20)image('clouds',{x:W*.5,y:H*(1.02+range(progress,.09,.255)*.12),w:Math.max(W,H*1.25)*1.18,alpha:1-smooth(range(progress,.15,.20))});
  }
  function world(frame,zoom=1){cover('worlds',{frame,scale:zoom});fill('#101c22',.18);}
  function blockWorld(progress){
    const t=range(progress,.43,.56),steps=[0,1,2,3,2,0,1,3,0,1],f=t*steps.length,step=Math.min(steps.length-1,Math.floor(f)),local=f-step,previous=steps[Math.max(0,step-1)],next=steps[step];world(previous,1.03);
    // Diagonal block cuts are a function of scroll distance, never elapsed time.
    for(let i=0;i<7;i++){const reveal=clamp(local*3.5-i*.12);ctx.save();ctx.beginPath();const x=i*W/7,offset=H*.14;ctx.moveTo(x-offset,0);ctx.lineTo(x+W/7-offset,0);ctx.lineTo(x+W/7+offset,H*reveal);ctx.lineTo(x+offset,H*reveal);ctx.closePath();ctx.clip();world(next,1.03+t*.05);ctx.restore();}
  }
  // Match the recording: steep low-angle shot, then a hard cut to the canyon wide.
  function drawAura(x,y,r,progress,alpha=1){
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha;ctx.strokeStyle='#c486f4';ctx.lineWidth=Math.max(1,H*.002);ctx.shadowColor='#b276f2';ctx.shadowBlur=18;
    for(let band=0;band<3;band++){
      ctx.beginPath();for(let i=0;i<=120;i++){const a=i/120*Math.PI*2,rr=r*(1+.022*Math.sin(a*11+progress*55+band)+.012*Math.sin(a*23-progress*25)+band*.014),px=Math.cos(a)*rr,py=Math.sin(a)*rr*.91;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.globalAlpha=alpha*(band?.22:.65);ctx.stroke();
    }
    const g=ctx.createRadialGradient(0,0,r*.7,0,0,r*1.08);g.addColorStop(0,'#b475f000');g.addColorStop(.74,'#b475f01a');g.addColorStop(1,'#b475f000');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(-r*1.1,-r*1.1,r*2.2,r*2.2);ctx.restore();
  }
  function archer(progress){
    const entering=progress<.32,close=progress>=.32&&progress<.365;
    const approach=smooth(range(progress,.245,.305));
    if(progress<.28){prelude(progress);cover('canyon',{scale:1+approach*.10,y:-H*approach*.025,alpha:smooth(range(progress,.235,.28))});}
    else if(progress<.43)cover('canyon',{scale:close?1.14:entering?1+approach*.10:1.03,y:close?H*.025:entering?-H*approach*.025:0});
    else blockWorld(progress);
    if(entering){
      const t=approach,y=mix(1.12,.52,t),height=mix(.18,.86,t);
      drawAura(W*.52,H*(y+.06),H*height*.42,progress,smooth(range(progress,.25,.28))*.8);
      image('angle-wide',{x:W*.49,y:H*y,h:H*height});
    }else if(close){
      const t=smooth(range(progress,.32,.365));
      drawAura(W*.5,H*.6,H*.65,t,.7);
      image('angle-wide',{x:W*.48,y:H*.80,h:H*mix(1.58,1.76,t)});
    }else{
      const t=range(progress,.365,.43),height=mix(.56,.52,smooth(t));
      drawAura(W*.49,H*.56,H*.23,progress,.85);
      image('angle-wide',{x:W*.49,y:H*.48,h:H*height});
    }
    if(!close&&progress<.43){
      const flowers=entering?approach:range(progress,.365,.43);
      image('lotus-front',{x:W*(.5+flowers*.025),y:H*(.50+flowers*.025),w:Math.max(W,H*1.78)*(1.0+flowers*.18),alpha:smooth(range(progress,.25,.29))});
    }
    particles(progress*2,18,.25);
  }
  function closeup(name,frame,zoom=1,alpha=1){if(mobile()){world(1,1.1);fill('#102c32',.55);image(name,{frame,x:W*.5,y:H*.48,w:W*1.45*zoom,alpha});cloudFront(.16,.65);}else cover(name,{frame,scale:zoom,x:W*.01,y:H*.06*(zoom-1),alpha});}
  function hand(progress){world(1,1.1);const t=range(progress,.56,.625);closeup('poses-c',Math.min(3,Math.floor(t*4)),1+t*.09);ctx.save();ctx.strokeStyle='#eee5cd';ctx.globalAlpha=.22;ctx.lineWidth=1;for(let i=0;i<12;i++){const y=H*(.12+i*.068);ctx.beginPath();ctx.moveTo(W*.84,y);ctx.lineTo(W*1.05,y-H*.02*t);ctx.stroke();}ctx.restore();}
  function feather(x,y,size,angle,alpha){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(size,size);ctx.globalAlpha=alpha;ctx.fillStyle='#f3ead3';ctx.strokeStyle='#344e4f';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-40,0);ctx.bezierCurveTo(-16,-9,22,-17,43,-4);ctx.bezierCurveTo(19,-3,5,17,-40,0);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-35,1);ctx.quadraticCurveTo(4,1,37,-4);ctx.stroke();ctx.lineWidth=.35;for(let k=0;k<11;k++){const x=-25+k*5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+7,-7-Math.sin(k)*3);ctx.moveTo(x,1);ctx.lineTo(x+7,7+Math.sin(k)*3);ctx.stroke();}ctx.restore();
  }
  function eyes(progress){
    const reveal=range(progress,.638,.704),focus=range(progress,.704,.748),name=progress<.704?'poses-d':'poses-e',frame=Math.min(3,Math.floor((progress<.704?reveal:focus)*4));closeup(name,frame,1+reveal*.05+focus*.16);
    const burst=smooth(range(progress,.654,.727));if(burst>0&&burst<1)for(let i=0;i<22;i++){const side=i%2?-1:1,depth=.5+(i%5)*.32,x=W*(.5+side*(.04+(i%4)*.035+burst*.7*depth)),y=H*(.43+Math.sin(i*2.7)*(.025+burst*.5)),size=(mobile()?.45:.65)*(1+burst*depth*2.5);feather(x,y,size,side*burst*2.5+i*.25,(1-range(burst,.82,1))*.95);}
  }
  function impact(progress,start,end,variant=0){
    const t=range(progress,start,end),frame=variant?(t<.48?2:3):(t<.45?0:1);
    cover('impacts',{frame,scale:1.01+t*.025});
    if(soft)fill('#394644',.55);
  }
  function launchFlash(progress){
    cover('impacts',{frame:3,scale:1.01+range(progress,.748,.775)*.12});
    if(soft)fill('#394644',.62);
  }
  function heavenClouds(travel){
    // Nine separately projected cloud strata pass the camera in sequence.
    if(!spriteCache.has('cloud-ring')){
      const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');g.drawImage(images.clouds,-410,-210,1844,1444);
      g.globalCompositeOperation='destination-in';const mask=g.createRadialGradient(512,512,240,512,512,512);mask.addColorStop(0,'#fff0');mask.addColorStop(.20,'#fff0');mask.addColorStop(.44,'#ffff');mask.addColorStop(.68,'#ffff');mask.addColorStop(1,'#fff0');g.fillStyle=mask;g.fillRect(0,0,1024,1024);spriteCache.set('cloud-ring',c);
    }
    for(let layer=8;layer>=0;layer--){
      const depth=.65+layer*.39-travel*3.95;if(depth<=.08)continue;
      const r=Math.min(W,H)*.35/depth;if(r<Math.min(W,H)*.13)continue;
      const alpha=clamp((depth-.08)*3)*.62,cx=W*.5,cy=H*.42;
      ctx.save();ctx.translate(cx,cy);ctx.scale(1.5,1);ctx.rotate(layer*.73);ctx.globalAlpha=alpha;ctx.drawImage(spriteCache.get('cloud-ring'),-r,-r,r*2,r*2);ctx.restore();
    }
  }
  function flight(progress){
    const t=range(progress,.775,.947),travel=smooth(range(progress,.84,.937));world(1,1.04+travel*.65);fill('#071a25',.22);
    if(progress>=.84)heavenClouds(travel);
    const cx=W*.5,cy=H*.42;ctx.save();ctx.strokeStyle='#e6f0da';ctx.globalAlpha=.15+travel*.2;ctx.lineWidth=1;
    for(let i=0;i<65;i++){const a=i*2.39996,phase=(i*.137+t*3)%1,r=(.17+phase*.8)*Math.max(W,H),r2=r+H*(.03+travel*.18);ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.65);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2*.65);ctx.stroke();}ctx.restore();
    const launch=range(progress,.775,.84),exit=smooth(range(progress,.905,.937));
    const px=W*(.52-exit*.02),py=H*(.48-exit*.47),size=H*(.20+launch*.24)*(1-exit*.91);
    if(travel>0){ctx.save();const g=ctx.createLinearGradient(px,py,px,H*1.2);g.addColorStop(0,'#fffbea');g.addColorStop(.22,'#e6cfa9b0');g.addColorStop(1,'#abcde000');ctx.fillStyle=g;ctx.globalAlpha=travel*.9;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+W*.022,H*1.1);ctx.lineTo(px-W*.022,H*1.1);ctx.closePath();ctx.fill();ctx.restore();}
    image('projectile',{x:px,y:py,h:size,rotation:-.13+launch*.28,alpha:1-smooth(range(progress,.932,.94))});
    particles(t*3,45,.55);fill(soft?'#8b8f85':'#efe6cf',smooth(range(progress,.937,.947)));
  }
  function ending(progress){const t=range(progress,.947,1);sky(.7);fill('#e8dfcc',.52);plane('clouds',{x:.76,y:.86,height:1,z:0,camera:t*.24,alpha:.8});image('projectile',{x:W*(mobile()?.82:.79),y:H*.53,h:H*(mobile()?.5:.7),rotation:-.24,alpha:.16});particles(t*.3,12,.25);}
  function updateCopy(){
    const openAlpha=1-smooth(range(p,.008,.032));$('opening').style.opacity=openAlpha;$('opening').style.transform=`translate(-50%, ${-range(p,0,.1)*H*.12}px)`;$('opening').hidden=p>.035;
    const scene=SCENES.find(s=>p>=s.a&&p<=s.d);$('chapter-copy').style.opacity=scene?visible(p,scene.a,scene.b,scene.c,scene.d):0;if(scene){$('chapter-number').textContent=scene.n;$('chapter-title').textContent=scene.title;$('chapter-verse').textContent=scene.verse;}
    $('closing').hidden=p<.947;$('closing').style.opacity=smooth(range(p,.947,.97));$('closing').style.transform=`translateY(${(1-smooth(range(p,.947,.985)))*30}px)`;
    const chapter=CHAPTERS.filter(c=>p>=c[0]).at(-1);$('scene-label').textContent=chapter[1];$('progress-label').textContent=String(Math.round(p*100)).padStart(2,'0')+' / 100';$('progress-line').style.transform=`scaleX(${p})`;$('scroll-label').textContent=p>.975?'向上滚动，重访此境':'下滚推进 · 停下即定格';stage.classList.toggle('dark',p>=.255&&p<.947);stage.classList.toggle('impact',(p>=.625&&p<.638)||(p>=.748&&p<.775));stage.dataset.chapter=chapter[1];stage.dataset.progress=p.toFixed(5);stage.classList.toggle('portrait',mobile());stage.dataset.visual=p<.10?'horses':p<.255?'gate':p<.43?'bow':'other';
  }
  function draw(){requested=false;if(!ready)return;p=clamp((scrollY-journey.offsetTop)/(journey.offsetHeight-H));ctx.setTransform(dpr,0,0,dpr,0,0);fill('#e8dfcc');if(p<.235)prelude(p);else if(p<.56)archer(p);else if(p<.625)hand(p);else if(p<.638)impact(p,.625,.638);else if(p<.748)eyes(p);else if(p<.775)launchFlash(p);else if(p<.947)flight(p);else ending(p);updateCopy();draws++;}
  function schedule(){if(!requested){requested=true;requestAnimationFrame(draw);}}
  function resize(){W=stage.clientWidth;H=stage.clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);schedule();}
  const flashButton=$('soft-flash');function setSoft(){flashButton.setAttribute('aria-pressed',String(soft));flashButton.innerHTML='柔和闪光 <span aria-hidden="true">'+(soft?'●':'○')+'</span>';schedule();}flashButton.addEventListener('click',()=>{soft=!soft;setSoft();});setSoft();
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);
  // No continuous render loop, autoplay, timer or pointer-driven story state.
  Promise.all(assetNames.map(async name=>{const im=new Image();im.src=`art/${name}.webp`;await im.decode();images[name]=im;loaded++;$('load-count').textContent=String(Math.round(loaded/assetNames.length*100)).padStart(2,'0');})).then(()=>{for(const name of assetNames)if(name.startsWith('poses-')||name==='worlds'||name==='impacts'||name==='angle-poses')for(let i=0;i<4;i++)sprite(name,i);ready=true;$('loading').hidden=true;resize();}).catch(()=>{$('loading').innerHTML='<span>画卷未能加载，请刷新重试。</span>';});
  resize();window.storyState=()=>({progress:p,chapter:stage.dataset.chapter,draws,ready,soft,width:W,height:H,frames:13,assets:loaded});
})();
