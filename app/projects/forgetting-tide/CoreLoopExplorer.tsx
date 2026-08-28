'use client';

import { useState } from 'react';

import Image from 'next/image';

import styles from './forgetting-tide.module.css';

const steps = [
  {
    id: 'squad',
    index: '01',
    label: '编队',
    title: '先决定这一队能用什么方式解决问题',
    decision: '选择三只生物、队长和四项主动技能。',
    input: '属性、种族、战术倾向与技能资格共同开放技能池。',
    result: '确定资源颜色、行动顺序，以及护盾反击或荆棘中毒等构筑。',
    example: '灯笼菇负责治疗溢出，锈铁单位承伤，回声单位接续行动。',
    image: '/projects/forgetting-tide/vision/skill-pool-final.png',
    alt: '队伍与共享技能池构筑界面',
  },
  {
    id: 'expedition',
    index: '02',
    label: '远征',
    title: '路线不是关卡列表，而是一份风险计划',
    decision: '在安全路线、证词房、精英支路与提前归潮之间取舍。',
    input: '共享生命、破碎记忆、实体碎片与特殊见证会持续带入下一房间。',
    result: '取得的证据改写地图池、Boss 援助和归航收益。',
    example: '绕路调查地下药房，可能失去补给，却能得到推翻单一证词的病历。',
    image: '/projects/forgetting-tide/screenshots/expedition.png',
    alt: '灰烬医院远征地图',
  },
  {
    id: 'battle',
    index: '03',
    label: '战斗',
    title: '公开敌人意图，把难题留给行动顺序',
    decision: '三只生物每回合各行动一次，由玩家决定先后。',
    input: '队伍共享生命；护盾、荆棘、状态与行动机会归属个体。',
    result: '五色资源强化技能用途，不只是增加伤害数字。',
    example: '同一项荆棘外衣，可被强化成护盾、中毒或保留反击层数。',
    image: '/projects/forgetting-tide/screenshots/battle.png',
    alt: '三生物回合制战斗界面',
  },
  {
    id: 'testimony',
    index: '04',
    label: '见证',
    title: '记录谁看见了什么，以及谁为此付出代价',
    decision: '面对伊芮、塞勒与米娅，可以倾听、质询、出示证据或沉默。',
    input: '每组证词拆成身份、行为、代价与自我解释四片。',
    result: '主张、旁证、反证和未确认内容分别进入见证墙。',
    example: '一张班表同时写着急救、禁闭和育护，三种现实因此都获得证据。',
    image: '/projects/forgetting-tide/vision/testimony-wall-final.png',
    alt: '三位见证者的证词墙',
  },
  {
    id: 'reflection',
    index: '05',
    label: '映照',
    title: '不是选一句结局，而是固定一套可继续游玩的现实',
    decision: '在救护院、证言牢床区与育护庭中固定一种主映照。',
    input: '证词完整度、同行记忆和本次远征带回的世界事实。',
    result: '补给、精英路线、环境危害、NPC 与地图结构永久改变。',
    example: '另外两份证词不会被删除，它们会作为异见继续出现在后续事件里。',
    image: '/projects/forgetting-tide/concepts/three-truths.png',
    alt: '灰烬医院三种现实映照',
  },
  {
    id: 'return',
    index: '06',
    label: '归航',
    title: '把一次远征的结果带回可观察的社区',
    decision: '击败 Boss、安全归潮或紧急撤退，决定本次可保留的资源。',
    input: '世界事实、实体碎片、同行记忆与灯塔工程材料。',
    result: '稳定道路、点亮灯芯、迎来生物，并开放新的远征入口。',
    example: '恢复潮门后，营地不只多一个按钮，整片平台与来访者都会发生变化。',
    image: '/projects/forgetting-tide/vision/camp-final.png',
    alt: '完整形态的记忆灯塔营地',
  },
];

export default function CoreLoopExplorer() {
  const [activeId, setActiveId] = useState(steps[0].id);
  const active = steps.find((step) => step.id === activeId) ?? steps[0];

  return (
    <div className={styles.loopExplorer}>
      <div className={styles.loopRail} role="tablist" aria-label="一次远征的六个阶段">
        {steps.map((step) => (
          <button
            type="button"
            role="tab"
            key={step.id}
            aria-selected={step.id === active.id}
            className={step.id === active.id ? styles.activeLoopStep : ''}
            onClick={() => setActiveId(step.id)}
          >
            <span>{step.index}</span><b>{step.label}</b>
          </button>
        ))}
      </div>

      <article className={styles.loopDetail} role="tabpanel">
        <div className={styles.loopImage}>
          <Image src={active.image} alt={active.alt} fill sizes="(max-width: 900px) 100vw, 58vw" />
          <span>{active.index} / {active.label}</span>
        </div>
        <div className={styles.loopCopy}>
          <span>EXPEDITION STEP {active.index}</span>
          <h3>{active.title}</h3>
          <dl>
            <div><dt>玩家决定</dt><dd>{active.decision}</dd></div>
            <div><dt>系统输入</dt><dd>{active.input}</dd></div>
            <div><dt>直接结果</dt><dd>{active.result}</dd></div>
          </dl>
          <p><b>例如</b>{active.example}</p>
        </div>
      </article>
    </div>
  );
}
