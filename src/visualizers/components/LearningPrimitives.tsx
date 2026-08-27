import type {InsightModel,RuleFocus} from '../types';

export function InsightRail({insights}:{insights:InsightModel}){
  const items=[['STATE',insights.state],['BASE',insights.base],['CHOICE',insights.choice],['INVARIANT',insights.invariant]];
  return <div className="insight-rail">{items.map(([label,text])=><article key={label}><small>{label}</small><p>{text}</p></article>)}</div>;
}

export function RuleStrip({rules}:{rules:RuleFocus[]}){
  return <div className="rule-strip" aria-label="Algorithm tokens aligned to the current visual">{rules.map((rule,index)=><div className={rule.active?'active':''} key={`${rule.token}-${index}`}><code>{rule.token}</code><span>{rule.meaning}</span></div>)}</div>;
}

export function formatCost(value:number|null){return value===null?'∞':value.toLocaleString()}
