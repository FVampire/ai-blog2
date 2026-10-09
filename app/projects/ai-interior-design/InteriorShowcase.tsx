'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import s from './interior.module.css';

const ASSET='/uploads/ai-interior-design';
const spaces=[
 ['03-living','客餐厅','自然绿与胡桃木，把日常生活装进柔和的窗光。'],
 ['06-master','主卧','布艺、收纳与休息，保持同一种温润的秩序。'],
 ['05-kitchen','厨房','L 形台面、凹入式水槽，让设计落到真实的使用细节。'],
 ['14-gaming','电竞房','从“把书房改成电竞房”，到双屏桌面与完整设备布局。'],
 ['15-gaming-night','电竞夜景','青紫色灯带与低照度光线，同一个房间的另一种性格。'],
 ['16-vanity','卫浴细节','陶瓷、玻璃与金属，近距离也经得起看。'],
 ['01-overview','全屋总览','全部空间统一建模，风格与动线放在同一个家里推敲。'],
 ['02-plan','俯视户型','以全屋布局为底稿，理解每个区域之间的关系。'],
 ['04-dining','餐厅','四人餐桌、软包餐椅和器物，构成家的聚会中心。'],
 ['07-bedroom','次卧','紧凑空间里的休息与收纳。'],
 ['08-ensuite','主卫','独立卫浴的淋浴、陶瓷与玻璃细节。'],
 ['09-bathroom','公卫','公共卫浴的完整空间表达。'],
 ['10-entry','玄关','进门的第一眼，也照顾换鞋与收纳。'],
 ['11-corridor','走廊','门洞、踢脚线与光影，让连接空间也有完整的表情。'],
 ['12-balcony','阳台','座椅、边桌与植物，留出日常生活的缓冲带。'],
 ['13-laundry','家政区','洗烘叠放与家政收纳，处理生活的另一面。'],
] as const;
const steps=[
 ['01','把想法变成空间','保留户型骨架，推敲分区、家具尺度与使用关系。把“想要什么样的家”变成可以讨论的布局。'],
 ['02','把空间变得真实','补齐家具造型、织物褶皱、木纹、金属和玻璃，让风格从配色进入真实的材质层次。'],
 ['03','把真实变成画面','在同一套全屋场景里建立室内摄影机、日光与夜景，交付一套连贯的写实效果图。'],
 ['04','把画面变成体验','把模型导入浏览器，按房间单独查看、旋转缩放、切换室内视角。让设计重新回到人的手里。'],
];

export default function InteriorShowcase(){
 const [active,setActive]=useState(0),[started,setStarted]=useState(false),[ready,setReady]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{
  function message(event:MessageEvent){if(event.origin===window.location.origin&&event.source===frame.current?.contentWindow&&event.data?.type==='qiju-show-gallery')document.getElementById('gallery')?.scrollIntoView({behavior:'smooth'});}
  window.addEventListener('message',message);return()=>window.removeEventListener('message',message);
 },[]);
 function launch(){setStarted(true);document.getElementById('experience')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 const current=spaces[active];
 return <main className={s.page}>
  <nav className={s.nav}><Link href="/projects" className={s.back}>← 返回作品集</Link><a className={s.wordmark} href="#top">栖居 <span>QI.JU</span></a><a href="#experience">探索这个家 ↗</a></nav>
  <section className={s.hero} id="top">
   <div className={s.heroCopy}><p className={s.kicker}>AI × SPACE DESIGN / CONCEPT 01</p><h1>在装修之前，<br/>先住进<br/><em>未来的家。</em></h1><p className={s.lead}>把空间想象，变成可以亲手探索的生活现场。</p><p className={s.description}>栖居是一套 AI 协作的装修设计展示原型。从户型构想到家具材质，从全屋写实效果图到浏览器里的 3D 体验，让每一次设计选择都更具体。</p><div className={s.actions}><button onClick={launch}>进入 3D 空间 <span>↗</span></button><a href="#gallery">先看设计作品 ↓</a></div><p className={s.projectMeta}>120㎡建筑面积概念 · 两卧 / 电竞房 / 两厅 / 两卫</p></div>
   <figure className={s.heroVisual}><Image src={`${ASSET}/03-living.webp`} alt="自然绿沙发、胡桃木家具与窗光构成的客餐厅写实方案" fill priority sizes="(max-width: 800px) 100vw, 65vw"/><figcaption><span>QI.JU / EVERYDAY LIVING</span><b>把“想象中的家”<br/>变成看得见的生活。</b></figcaption><div className={s.visualStamp}>AI DESIGN<br/><strong>栖居</strong><small>SPACE / MATERIAL / EXPERIENCE</small></div></figure>
  </section>
  <div className={s.metrics}><div><b>13</b><span>空间统一建模</span></div><div><b>16</b><span>写实设计视角</span></div><div><b>3D</b><span>浏览器交互体验</span></div><p>一套房子，一条完整的设计链路。<br/><strong>从想法，到可探索的家。</strong></p></div>
  <section className={s.intro}><p className={s.kicker}>BEYOND A PRETTY PICTURE</p><h2>装修沟通，<br/>终于有了<strong>空间感。</strong></h2><div><p>看一张图，可以被风格打动。走进一个空间，才能理解它与生活的关系。</p><p>这个案例把布局、家具、材质、光照与交互放在同一套模型里。你可以从全屋总览进入某个房间，近看桌面和床品，也可以切换电竞房的日夜氛围。设计不再停在一句“应该会很好看”。</p></div></section>
  <section id="experience" className={s.experience}><div className={s.sectionHead}><div><p className={s.kicker}>01 / INTERACTIVE SPACE</p><h2>这个家，<em>你来探索。</em></h2></div><p>点击房间即可单独查看。<br/>旋转、缩放，或进入室内视角。</p></div><div className={s.viewerBar}><span><i/> {started?'交互模型':'全屋空间预览'}</span><a href={`${ASSET}/demo/index.html`} target="_blank" rel="noreferrer">全屏打开 ↗</a></div><div className={s.viewer}>
   {started?<><iframe ref={frame} src={`${ASSET}/demo/index.html`} title="栖居全屋写实交互模型" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-downloads" onLoad={()=>setReady(true)}/>{!ready&&<div className={s.viewerLoading}>正在打开你的未来之家…</div>}</>:<><Image src={`${ASSET}/01-overview.webp`} alt="包含客餐厅、卧室、电竞房、卫浴和家政区的全屋模型总览" fill sizes="100vw"/><div className={s.viewerStart}><span>真实 3D 模型 · 可交互</span><button onClick={launch}>亲手看看这个家 <b>↗</b></button><small>模型较精细，首次打开请稍候。</small></div></>}
  </div><div className={s.experienceNotes}><span>区域单独查看</span><span>室内摄影机视角</span><span>墙高与顶面控制</span><span>日夜氛围切换</span></div></section>
  <section id="gallery" className={s.gallery}><div className={s.sectionHead}><div><p className={s.kicker}>02 / SPACES & ATMOSPHERES</p><h2>13 个空间，<br/><em>同一个家的性格。</em></h2></div><p>自然木色与柔和绿，贯穿日常。<br/>电竞房用灯光释放另一种情绪。</p></div><div className={s.galleryTabs} aria-label="选择空间效果图">{spaces.map(([id,title],i)=><button key={id} aria-pressed={active===i} onClick={()=>setActive(i)}>{title}</button>)}</div><figure className={s.galleryHero}><Image key={current[0]} src={`${ASSET}/${current[0]}.webp`} alt={current[1]+'：'+current[2]} fill sizes="100vw"/></figure><div className={s.galleryCaption} aria-live="polite"><h3>{current[1]}</h3><p>{current[2]}</p><a href={`${ASSET}/${current[0]}.webp`} target="_blank" rel="noreferrer">查看大图 ↗</a></div></section>
  <section className={s.process}><div className={s.sectionHead}><div><p className={s.kicker}>03 / FROM IDEA TO EXPERIENCE</p><h2>不止是效果图。<br/><em>是一条完整的设计链路。</em></h2></div><p>AI 参与推演，模型承接细节，<br/>让最终作品可以被看见、被操作、被继续修改。</p></div><div className={s.steps}>{steps.map(([number,title,copy])=><article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div><div className={s.tech}><span>AI 协作设计</span><span>Blender / Cycles</span><span>PBR 材质</span><span>Three.js / WebGL</span><span>可编辑全屋场景</span></div></section>
  <section className={s.closing}><p className={s.kicker}>DESIGN THE WAY YOU LIVE</p><h2>家不该只存在于想象里。</h2><p>先看见它，先感受它，再决定它。</p><button onClick={launch}>现在，走进栖居 ↗</button></section>
  <footer className={s.footer}><Link href="/projects">← 返回作品集</Link><p>概念展示案例 · 模型轮廓约 101.52㎡，120㎡为原建筑面积设定。<br/>本页使用项目实际生成的模型与效果图；实时光照与离线效果图有所不同。</p><a href={`${ASSET}/credits.md`}>材质来源与许可 ↗</a></footer>
 </main>;
}
