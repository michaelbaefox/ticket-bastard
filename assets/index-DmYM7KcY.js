import{c as u,r as n,g as d}from"./index-D2yeNAie.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=u("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=u("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=u("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);function z(r){const[e,t]=n.useState(void 0);return d(()=>{if(r){t({width:r.offsetWidth,height:r.offsetHeight});const h=new ResizeObserver(o=>{if(!Array.isArray(o)||!o.length)return;const f=o[0];let s,i;if("borderBoxSize"in f){const c=f.borderBoxSize,a=Array.isArray(c)?c[0]:c;s=a.inlineSize,i=a.blockSize}else s=r.offsetWidth,i=r.offsetHeight;t({width:s,height:i})});return h.observe(r,{box:"border-box"}),()=>h.unobserve(r)}else t(void 0)},[r]),e}function g(r){const e=n.useRef({value:r,previous:r});return n.useMemo(()=>(e.current.value!==r&&(e.current.previous=e.current.value,e.current.value=r),e.current.previous),[r])}export{v as C,S,g as a,y as b,z as u};
