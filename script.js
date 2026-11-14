"use strict";
// Caso 001: valores fornecidos para uso EDUCACIONAL, não clínico.
const original = {
  t0: {fio2:50,hb:13.4,hbv:null,aph:7.37,apo2:181.7,apco2:45.2,aso2:98.4,vph:7.34,vpo2:49.1,vpco2:51.6,vso2:78.5},
  tf: {fio2:50,hb:13.2,hbv:null,aph:7.37,apo2:160.7,apco2:42.4,aso2:97.1,vph:7.34,vpo2:57.7,vpco2:44,vso2:86.3}
};
let data = structuredClone(original);
let selected = 't0';
const definitions = {
 fio2:['FiO₂ (%)','Fração inspirada de oxigênio. A entrada está em porcentagem; a fórmula P/F usa fração (50% = 0,50).'],
 hb:['Hb arterial (g/dL)','Hemoglobina arterial medida. Necessária ao cálculo de conteúdo arterial de oxigênio.'],
 hbv:['Hb venosa (g/dL)','Campo opcional. Se vazio, adotamos Hb arterial como estimativa — hipótese explícita e não uma medida venosa.'],
 aph:['pH arterial','Grandeza logarítmica que expressa atividade de íons hidrogênio.'],
 apo2:['PaO₂ (mmHg)','Pressão parcial arterial de oxigênio.'],
 apco2:['PaCO₂ (mmHg)','Pressão parcial arterial de dióxido de carbono.'],
 aso2:['SaO₂ (%)','Saturação arterial de oxigênio (entrada percentual).'],
 vph:['pH venoso','pH da amostra venosa obtida pelo CVC.'],
 vpo2:['PcvO₂ (mmHg)','Pressão parcial de O₂ da amostra venosa central/atrial. Não confundir com sangue venoso misto de artéria pulmonar.'],
 vpco2:['PcvCO₂ (mmHg)','Pressão parcial de CO₂ da amostra venosa central/atrial.'],
 vso2:['ScvO₂ (%)','Saturação venosa da amostra de CVC, neste caso com ponta atrial. Não equivale automaticamente a SvO₂ mista.'],
 pf:['Relação PaO₂/FiO₂','Relação entre pressão parcial arterial de O₂ e FiO₂ em fração.','P/F = PaO₂ / (FiO₂ / 100)','Indicador global de oxigenação; depende de condições ventilatórias. Não identifica isoladamente a causa de alteração.'],
 dco2:['Gradiente venoarterial de PCO₂','Diferença de PRESSÕES parciais de CO₂, não de conteúdos sanguíneos de CO₂.','ΔPCO₂ = PcvCO₂ − PaCO₂','Não mede débito cardíaco e não determina sozinho hipoperfusão.'],
 dph:['Diferença arterial–venosa de pH','Diferença numérica entre pH arterial e venoso.','ΔpH = pH arterial − pH venoso','Por ser escala logarítmica, não equivale diretamente a diferença de concentração de H⁺.'],
 cao2:['Conteúdo arterial de O₂','Estimativa do volume de oxigênio por decilitro de sangue arterial.','CaO₂ = 1,34 × Hb × (SaO₂/100) + 0,0031 × PaO₂','Primeiro termo: O₂ associado à Hb. Segundo: O₂ dissolvido. Constantes aproximadas.'],
 cvo2:['Conteúdo venoso central de O₂ estimado','Estimativa a partir de saturação e pressão parciais de sangue do CVC.','CcvO₂ = 1,34 × Hb_venosa × (ScvO₂/100) + 0,0031 × PcvO₂','Se Hb venosa não informada, usamos Hb arterial como aproximação. Não é conteúdo venoso misto.'],
 aav:['Diferença de conteúdos arterial–venoso central','Diferença estimada entre conteúdos arteriais e da amostra venosa do CVC.','CaO₂ − CcvO₂','Não corresponde necessariamente à diferença arteriovenosa sistêmica de O₂.'],
 eo2:['Extração central estimada (%)','Percentual da diferença de conteúdo O₂ arterial–central em relação ao conteúdo arterial.','100 × (CaO₂ − CcvO₂) / CaO₂','Não é a taxa sistêmica verdadeira de extração (requer sangue venoso misto).']
};
const fields = {
 commonFields:[['fio2','FiO₂','%'],['hb','Hb arterial','g/dL'],['hbv','Hb venosa · opcional','g/dL']],
 arterialFields:[['aph','pH',''],['apo2','PaO₂','mmHg'],['apco2','PaCO₂','mmHg'],['aso2','SaO₂','%']],
 venousFields:[['vph','pH',''],['vpo2','PcvO₂','mmHg'],['vpco2','PcvCO₂','mmHg'],['vso2','ScvO₂','%']]
};
const n = v => Number.isFinite(v) ? v : null;
function calc(d){
 const vals=Object.values(d).filter(x=>x!==null);
 if(vals.some(x=>!Number.isFinite(x)))return null;
 if(!Number.isFinite(d.fio2)||d.fio2<=0||d.fio2>100||d.fio2<21||d.hb<=0||d.hb>30||d.hbv!==null&&(d.hbv<=0||d.hbv>30)||[d.aso2,d.vso2].some(x=>x<0||x>100)||[d.apo2,d.apco2,d.vpo2,d.vpco2].some(x=>x<0)) return null;
 const cao2=1.34*d.hb*d.aso2/100+0.0031*d.apo2;
 const cvo2=1.34*(d.hbv??d.hb)*d.vso2/100+0.0031*d.vpo2;
 return {pf:d.apo2/(d.fio2/100),dco2:d.vpco2-d.apco2,dph:d.aph-d.vph,cao2,cvo2,aav:cao2-cvo2,eo2:100*(cao2-cvo2)/cao2};
}
const metricNames={pf:'Relação P/F',dco2:'ΔPCO₂',dph:'ΔpH',cao2:'CaO₂',cvo2:'CcvO₂ estimado',aav:'CaO₂ − CcvO₂',eo2:'Extração central estimada'};
const units={pf:'mmHg',dco2:'mmHg',dph:'',cao2:'mL O₂/dL',cvo2:'mL O₂/dL',aav:'mL O₂/dL',eo2:'%'};
const decimals={pf:1,dco2:1,dph:2,cao2:2,cvo2:2,aav:2,eo2:2};
const format=(value,digits=1)=>Number.isFinite(value)?value.toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits}):'—';
function renderFields(){for(const [id,arr] of Object.entries(fields))document.getElementById(id).innerHTML=arr.map(([key,label,unit])=>`<div class="field"><label for="f_${key}">${label} <span class="unit">${unit}</span></label><input id="f_${key}" type="number" step="any" inputmode="decimal" data-field="${key}" value="${data[selected][key]??''}" /></div>`).join('');}
function render(){const result=calc(data[selected]);document.getElementById('validation').textContent=result?'':'Verifique os valores: campos numéricos válidos são necessários.';document.getElementById('metricCards').innerHTML=Object.keys(metricNames).map(key=>`<button class="metric" data-info="${key}"><span class="label">${metricNames[key]}</span><span class="number">${result?format(result[key],decimals[key]):'—'}</span><span class="unit">${units[key]}</span><span class="more">Entender fórmula e limites ↗</span></button>`).join('');const a=calc(data.t0),b=calc(data.tf);document.getElementById('compareBody').innerHTML=Object.keys(metricNames).map(key=>`<tr><td>${metricNames[key]} <span class="unit">${units[key]}</span></td><td>${a?format(a[key],decimals[key]):'—'}</td><td>${b?format(b[key],decimals[key]):'—'}</td><td>${a&&b?format(b[key]-a[key],decimals[key]):'—'}</td></tr>`).join('');}
function info(key){const [title,description,equation,limit]=definitions[key];document.getElementById('dialogTitle').textContent=title;const node=document.getElementById('dialogContent');node.replaceChildren();for(const sentence of [description,limit].filter(Boolean)){const p=document.createElement('p');p.textContent=sentence;node.appendChild(p);}if(equation){const p=document.createElement('div');p.className='equation';p.textContent=equation;node.insertBefore(p,node.children[1]||null);}document.getElementById('infoDialog').showModal();}
document.addEventListener('input',event=>{const input=event.target;if(!input.matches('[data-field]'))return;const raw=input.value.trim().replace(',','.');data[selected][input.dataset.field]=raw===''?null:Number(raw);render();});
document.addEventListener('click',event=>{const tab=event.target.closest('[data-moment]');if(tab){selected=tab.dataset.moment;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===tab));renderFields();render();return;}const card=event.target.closest('[data-info]');if(card)info(card.dataset.info);});
document.getElementById('reset').onclick=()=>{data=structuredClone(original);renderFields();render();};document.getElementById('closeDialog').onclick=()=>document.getElementById('infoDialog').close();
renderFields();render();
