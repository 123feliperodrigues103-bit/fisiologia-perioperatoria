"use strict";
const STORAGE_KEY='fisiologia-perioperatoria-v04-cases';
const EXAMPLE={
  title:'Caso 001 — exemplo didático',profile:{age:null,sex:'',height:null,weight:null,description:'Dados fictícios/desidentificados para testar a plataforma.'},
  records:[
    {id:'ex1',time:'2026-11-12T09:03',note:'Momento inicial',values:{fio2:50,hb:13.4,aph:7.37,apo2:181.7,apco2:45.2,aso2:98.4,vph:7.34,vpo2:49.1,vpco2:51.6,vso2:78.5}},
    {id:'ex2',time:'2026-11-12T13:32',note:'Momento posterior',values:{fio2:50,hb:13.2,aph:7.37,apo2:160.7,apco2:42.4,aso2:97.1,vph:7.34,vpo2:57.7,vpco2:44,vso2:86.3}}
  ]
};
const profileGroups=[['age','Idade','anos'],['sex','Sexo para PBW',''],['height','Altura','cm'],['weight','Peso real','kg'],['description','Descrição didática','']];
const fields={
 arterialFields:[['fio2','FiO₂','%'],['hb','Hb arterial','g/dL'],['aph','pH',''],['apo2','PaO₂','mmHg'],['apco2','PaCO₂','mmHg'],['aso2','SaO₂','%'],['hco3','HCO₃⁻','mEq/L'],['lactate','Lactato','mmol/L']],
 venousFields:[['hbv','Hb venosa opcional','g/dL'],['vph','pH venoso',''],['vpo2','PcvO₂','mmHg'],['vpco2','PcvCO₂','mmHg'],['vso2','ScvO₂','%']],
 ventFields:[['vt','VC expirado','mL'],['vti','VC inspirado','mL'],['rr','FR total','irpm'],['minute','Ventilação-minuto medida','L/min'],['etco2','EtCO₂','mmHg'],['eto2','EtO₂ tele-expiratório','%'],['feo2','O₂ expirado misto','%']],
 mechanicalFields:[['peep','PEEP programada','cmH₂O'],['peepi','Auto-PEEP medida','cmH₂O'],['peeptotal','PEEP total medida','cmH₂O'],['pplat','Pplat','cmH₂O'],['ppeak','Ppico','cmH₂O'],['flow','Fluxo constante','L/min'],['ti','Tempo inspiratório','s'],['passive','Paciente passivo (1=sim)','0 ou 1']],
 hemoFields:[['co','Débito cardíaco','L/min'],['hr','Frequência cardíaca','bpm'],['map','PAM','mmHg'],['cvp','PVC','mmHg'],['pb','Pressão barométrica','mmHg'],['rq','Quociente respiratório assumido','']]
};
const definitions={
 pf:['Relação PaO₂/FiO₂','Índice de oxigenação arterial ajustado à FiO₂.','P/F = PaO₂ / (FiO₂ / 100)','A P/F depende de condições ventilatórias, pressão barométrica e circulação; não determina shunt ou SDRA isoladamente.'],
 dco2:['Gradiente venoso central–arterial de PCO₂','Diferença de pressões parciais de CO₂, não de conteúdos.','ΔPCO₂ = PcvCO₂ − PaCO₂','Não mede débito cardíaco ou hipoperfusão diretamente.'],
 dph:['Diferença arterial–venosa de pH','Diferença entre pH arterial e venoso central.','ΔpH = pH arterial − pH venoso','Escala logarítmica, não equivale à diferença de concentração de H⁺.'],
 cao2:['Conteúdo arterial de O₂','Conteúdo de oxigênio associado à Hb e dissolvido.','CaO₂ = 1,34 × Hb × SaO₂/100 + 0,0031 × PaO₂','Constantes aproximadas; requer saturação arterial válida.'],
 cvo2:['Conteúdo venoso central de O₂ estimado','Conteúdo da amostra venosa central, não misto.','CcvO₂ = 1,34 × Hb_v × ScvO₂/100 + 0,0031 × PcvO₂','Se Hb venosa não for medida, utiliza-se Hb arterial como hipótese explícita.'],
 aav:['Diferença CaO₂ − CcvO₂','Diferença de conteúdos arterial e venoso central.','CaO₂ − CcvO₂','Não é necessariamente a diferença arteriovenosa mista sistêmica.'],
 eo2:['Extração central estimada','Fração de conteúdo arterial que não aparece no sangue venoso central.','100 × (CaO₂ − CcvO₂) / CaO₂','Não equivale à extração sistêmica venosa mista.'],
 pbw:['Peso corporal predito','Predição para adultos a partir da altura e sexo usado na equação de ARDSNet.','Masculino: 50 + 0,91 × (altura − 152,4); feminino: 45,5 + 0,91 × (altura − 152,4)','Não é peso real; não utilizar como fórmula pediátrica.'],
 bsa:['Superfície corporal','Estimativa pela equação de Mosteller.','SC = √(altura(cm) × peso(kg) / 3600)','É estimativa antropométrica.'],
 vtpbw:['Volume corrente por PBW','Volume expirado dividido pelo peso predito.','VC/PBW = VTe / PBW','Exige medição confiável do volume expirado.'],
 ve:['Ventilação-minuto calculada','Volume expirado multiplicado pela frequência respiratória total.','V̇E = VTe(mL) × FR / 1000','Não equivale à ventilação alveolar.'],
 dp:['Driving pressure do sistema respiratório','Diferença entre Pplat e PEEP total.','ΔP = Pplat − PEEPtotal','Exige pausa inspiratória válida, passividade e PEEP total conhecida.'],
 cstat:['Complacência estática do sistema respiratório','Volume corrente dividido pela driving pressure.','Cstat = VTe / (Pplat − PEEPtotal)','Não é complacência isolada do pulmão; depende da parede torácica.'],
 cdyn:['Complacência dinâmica aproximada','Razão VTe/(Ppico−PEEPtotal), influenciada por resistência e fluxo.','Cdyn ≈ VTe / (Ppico − PEEPtotal)','Não isola elastância. Depende de condições e modo ventilatório.'],
 raw:['Resistência aparente','Diferença de pressões resistiva sobre fluxo inspiratório constante.','R ≈ (Ppico − Pplat) / fluxo (L/s)','Válido apenas com fluxo inspiratório constante (VCV, onda quadrada), pausa válida e paciente passivo; inclui resistência do tubo. A plataforma não verifica o modo ventilatório.'],
 etgap:['Gradiente PaCO₂–EtCO₂','Diferença entre PaCO₂ e CO₂ tele-expiratório.','PaCO₂ − EtCO₂','EtCO₂ não é CO₂ expirado misto; não calcula espaço morto sozinho.'],
 pao2:['Pressão alveolar estimada de O₂','Equação alveolar simplificada.','PAO₂ ≈ FiO₂ × (Pb − 47) − PaCO₂/R','Depende de pressão barométrica e R assumido; não é medição direta.'],
 aagrad:['Gradiente alvéolo-arterial estimado de O₂','Diferença entre PAO₂ estimada e PaO₂.','A–a = PAO₂ − PaO₂','Depende de equação alveolar simplificada e suas hipóteses.'],
 do2:['Oferta global de oxigênio','Produto de débito cardíaco informado e conteúdo arterial de O₂.','DO₂ = DC × CaO₂ × 10','Não mede perfusão microcirculatória. DC deve ser obtido independentemente.'],
 doi:['Oferta de oxigênio indexada','DO₂ dividido por superfície corporal estimada.','DO₂I = DO₂/SC','Herdadas as limitações de DO₂ e SC.'],
 ie:['Relação I:E','Relação entre tempo inspiratório e expiratório.','Te = 60/FR − Ti; I:E = 1 : Te/Ti','Pressupõe frequência e tempos representativos do ciclo.'],
 leak:['Diferença relativa entre VTi e VTe','Diferença inspiratório-expiratória relativa ao volume inspirado.','100 × (VTi − VTe)/VTi','Não diagnostica vazamento isoladamente; sensores, compressibilidade e fluxo fresco interferem.']
};
const metricGroups=[
 ['GASOMETRIA',[['pf','Relação P/F','mmHg',1],['dco2','ΔPCO₂','mmHg',1],['dph','ΔpH','',2],['cao2','CaO₂','mL/dL',2],['cvo2','CcvO₂ estimado','mL/dL',2],['aav','CaO₂ − CcvO₂','mL/dL',2],['eo2','Extração central','%',1],['pao2','PAO₂ estimada','mmHg',1],['aagrad','Gradiente A–a','mmHg',1],['etgap','PaCO₂ − EtCO₂','mmHg',1]]],
 ['PACIENTE E VENTILAÇÃO',[['pbw','PBW','kg',1],['bsa','Superfície corporal','m²',2],['vtpbw','VC/PBW','mL/kg',1],['ve','Volume-minuto calculado','L/min',2],['ie','Relação I:E','',2],['leak','Diferença VTi − VTe','%',1]]],
 ['MECÂNICA E CIRCULAÇÃO',[['dp','Driving pressure','cmH₂O',1],['cstat','Complacência estática','mL/cmH₂O',1],['cdyn','Complacência dinâmica','mL/cmH₂O',1],['raw','Resistência aparente','cmH₂O·s/L',1],['do2','DO₂','mL/min',1],['doi','DO₂ indexado','mL/min/m²',1]]]
];
const allMetrics=metricGroups.flatMap(g=>g[1]);
const newId=()=> 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const emptyValues=()=>({});
function createCase(title='Caso sem título'){return {id:newId(),title,profile:{age:null,sex:'',height:null,weight:null,description:''},records:[{id:newId(),time:'',note:'',values:emptyValues()}]};}
function exampleCase(){const c=structuredClone(EXAMPLE);c.id=newId();c.records.forEach(r=>r.id=newId());return c;}
function readCases(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(data)?data.filter(validCase):[];}catch{return [];}}
function validCase(c){return !!c&&typeof c==='object'&&typeof c.id==='string'&&typeof c.title==='string'&&c.profile&&typeof c.profile==='object'&&Array.isArray(c.records)&&c.records.length<=2000&&c.records.every(r=>r&&typeof r.id==='string'&&typeof r.time==='string'&&typeof r.note==='string'&&r.values&&typeof r.values==='object');}
let cases=readCases(), activeId=cases[0]?.id||null, recordId=cases[0]?.records[0]?.id||null;
function activeCase(){return cases.find(c=>c.id===activeId)||null;}
function currentRecord(){const c=activeCase();return c?.records.find(r=>r.id===recordId)||c?.records[0]||null;}
function fmt(x,places=1){return Number.isFinite(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:places,maximumFractionDigits:places}):'—';}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function val(d,k,min=-Infinity,max=Infinity){const x=d?.[k];return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max?x:null;}
function maybe(...n){return n.every(v=>v!==null&&Number.isFinite(v));}
function compute(d,p){const out={};const get=(k,min,max)=>val(d,k,min,max);const height=val(p,'height',100,250),weight=val(p,'weight',1,500);
 const pbw=height!==null&&['masculino','feminino'].includes(p?.sex)&&height>=152.4?(p.sex==='masculino'?50:45.5)+0.91*(height-152.4):null;
 const bsa=maybe(height,weight)?Math.sqrt(height*weight/3600):null;
 const fio=get('fio2',21,100),pa=get('apo2',0,1000),pc=get('apco2',0,200),pv=get('vpco2',0,200),hb=get('hb',0.1,30),hbv=get('hbv',0.1,30),sa=get('aso2',0,100),sv=get('vso2',0,100),pvo=get('vpo2',0,1000),vte=get('vt',1,3000),vti=get('vti',1,3000),rr=get('rr',1,100),plat=get('pplat',0,100),peak=get('ppeak',0,100),peepTotal=get('peeptotal',0,50),peep=get('peep',0,50),peepi=get('peepi',0,50),flow=get('flow',0.01,200),ti=get('ti',0.05,30),dc=get('co',0.01,40),et=get('etco2',0,200);
 const knownPeep=peepTotal??(maybe(peep,peepi)?peep+peepi:null);
 const validStatic=get('passive',0,1)===1; // explicitly confirmed, not inferred
 const dp=maybe(plat,knownPeep)&&plat>knownPeep&&validStatic?plat-knownPeep:null;
 const cao2=maybe(hb,sa,pa)?1.34*hb*(sa/100)+0.0031*pa:null;
 const cvo2=maybe(hbv??hb,sv,pvo)?1.34*(hbv??hb)*(sv/100)+0.0031*pvo:null;
 const aav=maybe(cao2,cvo2)?cao2-cvo2:null;
 const pb=get('pb',200,1100),rq=get('rq',0.5,1.5);
 const pao2=maybe(fio,pc,pb,rq)?(fio/100)*(pb-47)-pc/rq:null;
 const aagrad=maybe(pao2,pa)?pao2-pa:null;
 const ie=maybe(rr,ti)&&60/rr>ti? (60/rr-ti)/ti:null;
 Object.assign(out,{pf:maybe(fio,pa)?pa/(fio/100):null,dco2:maybe(pc,pv)?pv-pc:null,dph:maybe(get('aph',6,8),get('vph',6,8))?d.aph-d.vph:null,cao2,cvo2,aav,eo2:maybe(aav,cao2)&&cao2>0?100*aav/cao2:null,pbw,bsa,vtpbw:maybe(vte,pbw)&&pbw>0?vte/pbw:null,ve:maybe(vte,rr)?vte*rr/1000:null,ie,leak:maybe(vte,vti)?100*(vti-vte)/vti:null,dp,cstat:maybe(vte,dp)&&dp>0?vte/dp:null,cdyn:maybe(vte,peak,knownPeep)&&peak>knownPeep&&validStatic?vte/(peak-knownPeep):null,raw:maybe(peak,plat,flow)&&peak>=plat&&validStatic?(peak-plat)/(flow/60):null,etgap:maybe(pc,et)?pc-et:null,pao2,aagrad,do2:maybe(dc,cao2)?10*dc*cao2:null,doi:maybe(dc,cao2,bsa)&&bsa>0?10*dc*cao2/bsa:null});
 return out;}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cases));document.getElementById('saveStatus').textContent='Salvo neste navegador';}catch{document.getElementById('saveStatus').textContent='Não foi possível salvar. Exporte seus casos.';}}
function profileHtml(c){return profileGroups.map(([key,label,unit])=>{const v=c.profile[key]??'';let control;if(key==='sex')control=`<select data-profile="${key}"><option value="">Não informado</option><option value="masculino" ${v==='masculino'?'selected':''}>Masculino (PBW)</option><option value="feminino" ${v==='feminino'?'selected':''}>Feminino (PBW)</option></select>`;else control=`<input data-profile="${key}" ${key==='description'?'type="text" maxlength="180"':`type="number" step="any" min="0"`} value="${esc(v)}" placeholder="Opcional">`;return `<div class="profile-field"><label>${label}${unit?' ('+unit+')':''}</label>${control}</div>`;}).join('');}
function fieldsHtml(r,id){return fields[id].map(([key,label,unit])=>{const x=r.values[key];return `<div class="field"><label for="f_${key}">${label} <span class="unit">${unit}</span></label><input id="f_${key}" data-field="${key}" type="number" step="any" inputmode="decimal" value="${x===null||x===undefined?'':esc(x)}" placeholder="—"></div>`;}).join('');}
function renderLayout(){const c=activeCase();document.getElementById('caseSelect').innerHTML=cases.length?cases.map(x=>`<option value="${esc(x.id)}" ${x.id===activeId?'selected':''}>${esc(x.title)}</option>`).join(''):'<option value="">Nenhum caso</option>';
 document.getElementById('caseArea').hidden=!c;document.getElementById('emptyArea').hidden=!!c;
 if(!c)return;const r=currentRecord();recordId=r?.id||null;
 document.getElementById('profileFields').innerHTML=profileHtml(c);
 document.getElementById('recordTabs').innerHTML=c.records.map((x,i)=>`<button type="button" class="record-tab ${x.id===recordId?'selected':''}" data-record="${esc(x.id)}"><b>Registro ${i+1}</b><small>${esc(x.time?x.time.replace('T',' '):'Sem data')}</small></button>`).join('');
 document.getElementById('recordTime').value=r?.time||'';document.getElementById('recordNote').value=r?.note||'';
 for(const id of Object.keys(fields))document.getElementById(id).innerHTML=fieldsHtml(r,id);
 renderResults();}
function renderResults(){const c=activeCase(),r=currentRecord();if(!c||!r)return;const results=compute(r.values,c.profile);
 document.getElementById('validation').textContent='“—” indica dados insuficientes ou condições não confirmadas.';
 document.getElementById('metricCards').innerHTML=metricGroups.map(([category,items])=>`<div class="metric-group-label">${category}</div>`+items.map(([key,label,unit,places])=>`<button class="metric ${results[key]===null?'unavailable':''}" data-info="${key}"><span class="label">${label}</span><span class="number">${fmt(results[key],places)}</span><span class="unit">${unit}</span><span class="more">${results[key]===null?'Ver requisitos e fórmula':'Entender fórmula e limites'} ↗</span></button>`).join('')).join('');
 renderEvolution();}
function renderEvolution(){const c=activeCase();if(!c)return;
 const metricSelect=document.getElementById('chartMetric'),old=metricSelect.value;metricSelect.innerHTML=allMetrics.map(([key,label])=>`<option value="${key}" ${old===key?'selected':''}>${label}</option>`).join('');
 const maxShown=Math.min(c.records.length,50);const cols=c.records.slice(0,maxShown),computed=cols.map(r=>compute(r.values,c.profile));const chosen=metricSelect.value||'pf';
 document.getElementById('compareHead').innerHTML=`<tr><th>Índice</th>${cols.map((r,i)=>`<th>R${i+1}${r.time?' · '+esc(r.time.replace('T',' ')):''}</th>`).join('')}</tr>`;
 document.getElementById('compareBody').innerHTML=allMetrics.map(([key,label,unit,places])=>`<tr><td>${esc(label)} <span class="unit">${unit}</span></td>${computed.map(x=>`<td>${fmt(x[key],places)}</td>`).join('')}</tr>`).join('');
 const points=computed.map((x,i)=>({i,v:x[chosen]})).filter(p=>Number.isFinite(p.v));const canvas=document.getElementById('chartBox');if(points.length<2){canvas.innerHTML='<div class="empty-chart">Preencha pelo menos dois registros com dados suficientes para visualizar esta variável.</div>';return;}
 const w=720,h=205,left=55,right=20,top=20,bottom=42;let min=Math.min(...points.map(p=>p.v)),max=Math.max(...points.map(p=>p.v));const pad=Math.max((max-min)*.15,Math.abs(max)*.05,.5);min-=pad;max+=pad;const x=i=>left+(w-left-right)*(cols.length===1?0:i/(cols.length-1));const y=v=>top+(h-top-bottom)*(max-v)/(max-min);
 const line=points.map(p=>`${x(p.i)},${y(p.v)}`).join(' ');
 canvas.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolução de ${esc(allMetrics.find(m=>m[0]===chosen)?.[1]||chosen)}"><g fill="none" stroke="#dfe7ee">${[0,1,2,3,4].map(i=>`<line x1="${left}" y1="${top+(h-top-bottom)*i/4}" x2="${w-right}" y2="${top+(h-top-bottom)*i/4}"/>`).join('')}</g><g font-size="11" fill="#718799">${[0,1,2,3,4].map(i=>`<text x="${left-8}" y="${top+(h-top-bottom)*i/4+4}" text-anchor="end">${fmt(max-(max-min)*i/4,1)}</text>`).join('')}${cols.map((r,i)=>`<text x="${x(i)}" y="${h-15}" text-anchor="middle">R${i+1}</text>`).join('')}</g><polyline points="${line}" fill="none" stroke="#287da6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${points.map(p=>`<circle cx="${x(p.i)}" cy="${y(p.v)}" r="4.5" fill="#287da6"><title>Registro ${p.i+1}: ${fmt(p.v,2)}</title></circle>`).join('')}</svg>`;
}
function info(key){const definition=definitions[key];if(!definition)return;const [title,description,equation,limit]=definition;document.getElementById('dialogTitle').textContent=title;const node=document.getElementById('dialogContent');node.replaceChildren();if(key==='pf'||key==='dco2'){
 const bar=document.createElement('div');bar.className='pf-tabs';bar.id='pfTabBar';bar.dataset.scienceKind=key;bar.setAttribute('role','tablist');for(const t of pfTabs){const button=document.createElement('button');button.type='button';button.textContent=t.label;button.dataset.pfTab=t.id;button.setAttribute('role','tab');bar.appendChild(button);}const content=document.createElement('div');content.id='pfTabContent';content.className='pf-tab-content';node.append(bar,content);renderScienceTab('entender');
 }else{const p=document.createElement('p');p.textContent=description;node.appendChild(p);const eq=document.createElement('div');eq.className='equation';eq.textContent=equation;node.appendChild(eq);const r=currentRecord(),c=activeCase(),result=r&&c?compute(r.values,c.profile)[key]:null;const show=document.createElement('p');show.textContent=`Resultado do registro: ${fmt(result,2)} ${allMetrics.find(m=>m[0]===key)?.[2]||''}`;node.appendChild(show);const note=document.createElement('p');note.textContent=limit;node.appendChild(note);}document.getElementById('infoDialog').showModal();}

const pfTabs = [
 {id:'entender',label:'Entender'},
 {id:'formula',label:'Fórmula'},
 {id:'limites',label:'Limitações'},
 {id:'fontes',label:'Referências'}
];
function pfPanel(tab){
 const d=currentRecord()?.values||{};
 const pf=val(d,'apo2',0,1000)!==null&&val(d,'fio2',21,100)!==null
  ?d.apo2/(d.fio2/100):null;
 if(tab==='entender')return `
  <h3>O que a relação P/F descreve?</h3>
  <p>É um índice da oxigenação arterial obtida para determinada fração inspirada de oxigênio (FiO₂). Relaciona a <strong>PaO₂ medida na gasometria</strong> com a <strong>FiO₂ administrada</strong>.</p>
  <p>Uma P/F menor significa que, naquela condição de medida, a pressão arterial de O₂ foi menor em relação à fração inspirada. A relação, sozinha, não identifica a causa nem mede a porcentagem de shunt.</p>
  <div class="concept-note"><strong>Ideia central:</strong> PaO₂ depende da pressão alveolar de O₂ e das trocas gasosas. Entre os determinantes estão a distribuição ventilação/perfusão (V/Q), o shunt e as condições de ventilação.</div>
  <p>A relação P/F é utilizada na avaliação da oxigenação, inclusive como um componente dos critérios de SDRA. <strong>Um ponto de corte isolado não estabelece o diagnóstico.</strong></p>`;
 if(tab==='formula')return `
  <h3>Como calcular</h3>
  <div class="equation equation-large">P/F = PaO₂ (mmHg) ÷ FiO₂ (fração)</div>
  <p><strong>PaO₂:</strong> pressão parcial arterial de oxigênio, em mmHg. <strong>FiO₂:</strong> fração inspirada de oxigênio, sem unidade. Se digitada como percentual, divida por 100.</p>
  <div class="worked-example"><span class="eyebrow">CÁLCULO DINÂMICO · ${esc(currentRecord()?.note||currentRecord()?.time||"REGISTRO ATUAL")}</span>
   <p>PaO₂ = <strong>${fmt(d.apo2,1)} mmHg</strong></p>
   <p>FiO₂ = <strong>${fmt(d.fio2,1)}%</strong> = ${Number.isFinite(d.fio2)?fmt(d.fio2/100,2):'—'}</p>
   <div class="worked-result">${pf===null?'Dados inválidos para P/F':`${fmt(d.apo2,1)} ÷ ${fmt(d.fio2/100,2)} = <strong>${fmt(pf,1)} mmHg</strong>`}</div>
  </div>
  <p><strong>Análise dimensional:</strong> pressão ÷ número adimensional = pressão. Por isso, a unidade física da P/F é mmHg, embora às vezes seja omitida na prática.</p>
  <p class="subtle">Esta fórmula não calcula a pressão alveolar de O₂ nem a fração de shunt.</p>`;
 if(tab==='limites')return `
  <h3>O que a P/F não conta</h3>
  <ul class="science-list">
   <li><strong>FiO₂:</strong> a P/F não é necessariamente constante quando mudamos a FiO₂; o comportamento depende da distribuição V/Q e do shunt.</li>
   <li><strong>PEEP e suporte ventilatório:</strong> a fórmula não incorpora PEEP ou pressão média das vias aéreas, embora possam alterar a oxigenação.</li>
   <li><strong>Pressão barométrica e PaCO₂:</strong> modificam a pressão alveolar de O₂ e podem alterar a P/F mesmo sem nova lesão pulmonar.</li>
   <li><strong>Circulação e extração:</strong> na presença de mistura venosa, o conteúdo venoso misto de O₂ pode influenciar a PaO₂. A hemoglobina não entra diretamente na equação P/F.</li>
   <li><strong>Interpretação etiológica:</strong> P/F não diferencia shunt verdadeiro de baixo V/Q e não mede diretamente a fração de shunt.</li>
   <li><strong>Contexto:</strong> uma P/F acima de 300 não prova trocas gasosas normais; abaixo de 300, isoladamente, não diagnostica SDRA.</li>
  </ul>
  <div class="concept-note">Comparações seriadas devem considerar FiO₂, ventilação e demais condições de coleta, independentemente do caso analisado.</div>`;
 return `
  <h3>Fontes principais — bibliografia do TSA</h3>
  <ol class="science-list">
   <li><em>Miller's Anesthesia</em>, capítulos 12, <em>Respiratory Physiology and Pathophysiology</em>, e 37, <em>Respiratory Monitoring</em>. Edição dos arquivos de origem a confirmar.</li>
   <li><em>Barash — Clinical Anesthesia</em>, 9ª edição, capítulos 15, <em>Respiratory Function in Anesthesia</em>, e 26, <em>Commonly Used Monitoring Techniques</em>.</li>
  </ol>
  <p><strong>Leituras complementares:</strong> Aboab e colaboradores (2006), <em>Relation between PaO₂/FiO₂ ratio and FiO₂: a mathematical description</em>; Karbing e colaboradores (2007), <em>Variation in the PaO₂/FiO₂ ratio with FiO₂</em>.</p>
  <p class="subtle">Síntese educacional original baseada nas pesquisas do projeto. As referências são indicadas por capítulo, sem atribuir páginas não conferidas.</p>`;
}
function renderPfTab(tab){
 const tabs=document.getElementById('pfTabBar');
 if(!tabs)return;
 tabs.querySelectorAll('button').forEach(button=>{
  const active=button.dataset.pfTab===tab;
  button.classList.toggle('selected',active);
  button.setAttribute('aria-selected',String(active));
 });
 document.getElementById('pfTabContent').innerHTML=pfPanel(tab);
}
// Ficha 002: síntese educacional de Miller (caps. 12, 13 e 32) e
// Barash (9ª ed., caps. 12, 15 e 26). Não substitui avaliação clínica.
function dco2Panel(tab){
 const d=currentRecord()?.values||{};
 const valid=val(d,'vpco2',0,200)!==null&&val(d,'apco2',0,200)!==null;
 const gap=valid?d.vpco2-d.apco2:null;
 if(tab==='entender')return `
  <h3>O que significa o gradiente venoso central–arterial de CO₂?</h3>
  <p>É a diferença entre a <strong>pressão parcial de CO₂ da amostra venosa central (PcvCO₂)</strong> e a <strong>PaCO₂ da amostra arterial</strong>, coletadas em momentos comparáveis.</p>
  <p>Os tecidos produzem CO₂, que é transportado pelo sangue até os pulmões. Em condições relativamente estáveis, <strong>fluxo sanguíneo menor para uma mesma produção de CO₂</strong> tende a aumentar a diferença de conteúdo venoarterial de CO₂ e pode aumentar o gradiente de pressões.</p>
  <div class="concept-note"><strong>Ideia central:</strong> o gradiente de PCO₂ pode trazer informação indireta sobre a relação entre fluxo e produção de CO₂, mas não é uma medida de débito cardíaco, perfusão microcirculatória ou metabolismo anaeróbico.</div>
  <p>O CO₂ circula como bicarbonato, compostos carbamino e CO₂ dissolvido. A <strong>PCO₂ não é o conteúdo total de CO₂</strong> no sangue.</p>`;
 if(tab==='formula')return `
  <h3>Como calcular</h3>
  <div class="equation equation-large">ΔPcv–aCO₂ = PcvCO₂ − PaCO₂</div>
  <p>As duas grandezas são pressões parciais em mmHg, portanto o gradiente também é expresso em <strong>mmHg</strong>. Uma amostra venosa central não é automaticamente equivalente à venosa mista.</p>
  <div class="worked-example"><span class="eyebrow">CÁLCULO DINÂMICO · ${esc(currentRecord()?.note||currentRecord()?.time||"REGISTRO ATUAL")}</span>
   <p>PcvCO₂ = <strong>${Number.isFinite(d.vpco2)?fmt(d.vpco2,1):'—'} mmHg</strong></p>
   <p>PaCO₂ = <strong>${Number.isFinite(d.apco2)?fmt(d.apco2,1):'—'} mmHg</strong></p>
   <div class="worked-result">${valid?`${fmt(d.vpco2,1)} − ${fmt(d.apco2,1)} = <strong>${fmt(gap,1)} mmHg</strong>`:'Preencha pressões parciais válidas.'}</div>
  </div>
  <h3>Por que o fluxo pode influenciar esse gradiente?</h3>
  <div class="equation">V̇CO₂ = DC × (Cv̄CO₂ − CaCO₂)</div>
  <p>Esse é o princípio de Fick para o CO₂ em estado estacionário: <strong>DC</strong> é débito cardíaco e <strong>Cv̄CO₂ − CaCO₂</strong> é diferença de <strong>conteúdos</strong> venoso misto–arterial, não de pressões. Se DC estiver em L/min e os conteúdos em mL/dL, multiplique por 10 dL/L para obter V̇CO₂ em mL/min.</p>
  <p>A passagem de diferença de conteúdo para diferença de pressões depende da curva de dissociação do CO₂; por isso, não se pode substituir diretamente uma pela outra.</p>`;
 if(tab==='limites')return `
  <h3>O que o ΔPCO₂ não permite concluir sozinho</h3>
  <ul class="science-list">
   <li><strong>Pressão ≠ conteúdo:</strong> a equação de Fick usa conteúdos; nossa calculadora utiliza pressões parciais.</li>
   <li><strong>Efeito Haldane:</strong> a oxigenação da hemoglobina modifica a capacidade de transporte de CO₂. A desoxi-hemoglobina transporta mais CO₂ a uma mesma PCO₂, dificultando a conversão de pressão em conteúdo.</li>
   <li><strong>Amostragem:</strong> sangue venoso central e venoso misto não são intercambiáveis. A posição do CVC e a composição do sangue coletado importam.</li>
   <li><strong>Outros determinantes:</strong> metabolismo, hemoglobina, pH, temperatura, circulação regional e transientes ventilatórios podem influenciar o resultado.</li>
   <li><strong>6 mmHg:</strong> limiar pragmático usado em estudos de terapia intensiva, não um divisor fisiológico absoluto. Acima dele não se prova baixo débito; abaixo dele não se garante perfusão adequada.</li>
   <li><strong>Perfusão e oxigenação:</strong> um gradiente aparentemente normal não exclui alteração microcirculatória ou hipóxia tecidual.</li>
   <li><strong>Comparação temporal:</strong> registrar contexto ventilatório, hemodinâmico e o intervalo entre coletas; uma mudança isolada não identifica sua causa.</li>
  </ul>
  <div class="concept-note">Evite usar o ΔPCO₂ como gatilho isolado para infusão de fluidos, inotrópicos ou outras intervenções.</div>`;
 return `
  <h3>Fontes principais — bibliografia do TSA</h3>
  <ol class="science-list">
   <li><em>Miller's Anesthesia</em>, capítulos 12 (<em>Respiratory Physiology and Pathophysiology</em>), 13 (<em>Cardiac Physiology</em>) e 32 (<em>Cardiovascular Monitoring</em>). Edição dos arquivos de origem a confirmar.</li>
   <li><em>Barash — Clinical Anesthesia</em>, 9ª edição, capítulos 12 (<em>Cardiac Anatomy and Physiology</em>), 15 (<em>Respiratory Function in Anesthesia</em>) e 26 (<em>Commonly Used Monitoring Techniques</em>).</li>
  </ol>
  <p><strong>Contexto:</strong> a aplicação clínica do limiar de 6 mmHg deriva da literatura de terapia intensiva; não é uma equação fisiológica universal apresentada nesses capítulos.</p>
  <p class="subtle">Síntese educacional original baseada nas fontes selecionadas para o projeto. Referências por capítulo, sem atribuição de páginas não verificadas.</p>`;
}
function renderScienceTab(tab){
 const bar=document.getElementById('pfTabBar');
 if(!bar)return;
 bar.querySelectorAll('button').forEach(button=>{
  const active=button.dataset.pfTab===tab;
  button.classList.toggle('selected',active);
  button.setAttribute('aria-selected',String(active));
 });
 const kind=bar.dataset.scienceKind;
 document.getElementById('pfTabContent').innerHTML=kind==='dco2'?dco2Panel(tab):pfPanel(tab);
}
function switchCase(id){activeId=id;recordId=activeCase()?.records[0]?.id||null;renderLayout();}
function update(){save();renderResults();}
document.getElementById('caseSelect').onchange=e=>switchCase(e.target.value);
document.getElementById('newCase').onclick=()=>{const title=prompt('Identificação fictícia ou código do caso (sem dados pessoais):','Novo caso');if(title===null)return;const c=createCase(title.trim().slice(0,100)||'Novo caso');cases.push(c);activeId=c.id;recordId=c.records[0].id;save();renderLayout();};
document.getElementById('loadExample').onclick=()=>{const c=exampleCase();cases.push(c);activeId=c.id;recordId=c.records[0].id;save();renderLayout();};
document.getElementById('addRecord').onclick=()=>{const c=activeCase();if(!c)return;const r={id:newId(),time:'',note:'',values:{}};c.records.push(r);recordId=r.id;save();renderLayout();};
document.getElementById('duplicateRecord').onclick=()=>{const c=activeCase(),r=currentRecord();if(!c||!r)return;const copy=structuredClone(r);copy.id=newId();copy.note=(copy.note||'')+' (cópia)';copy.time='';c.records.push(copy);recordId=copy.id;save();renderLayout();};
document.getElementById('deleteRecord').onclick=()=>{const c=activeCase(),r=currentRecord();if(!c||!r||!confirm('Excluir este registro?'))return;c.records=c.records.filter(x=>x.id!==r.id);if(!c.records.length)c.records=[{id:newId(),time:'',note:'',values:{}}];recordId=c.records[Math.max(0,c.records.length-1)].id;save();renderLayout();};
document.getElementById('deleteCase').onclick=()=>{const c=activeCase();if(!c||!confirm(`Excluir o caso “${c.title}” e todos os seus registros?`))return;cases=cases.filter(x=>x.id!==c.id);activeId=cases[0]?.id||null;recordId=cases[0]?.records[0]?.id||null;save();renderLayout();};
document.getElementById('exportCases').onclick=()=>{const blob=new Blob([JSON.stringify({format:'fisiologia-perioperatoria-cases-v04',exportedAt:new Date().toISOString(),cases},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='fisiologia-perioperatoria-casos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.getElementById('importCases').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error('Arquivo maior que 5 MB.');const raw=JSON.parse(await file.text());if(raw.format!=='fisiologia-perioperatoria-cases-v04'||!Array.isArray(raw.cases)||raw.cases.length>1000||!raw.cases.every(validCase))throw Error('Formato de arquivo inválido.');if(!confirm(`Importar ${raw.cases.length} caso(s)? Os novos casos serão adicionados aos existentes.`))return;for(const imported of raw.cases){const c=structuredClone(imported);c.id=newId();c.title=c.title.slice(0,100);c.records.forEach(r=>{r.id=newId();r.note=r.note.slice(0,180);r.time=r.time.slice(0,16);const filtered={};for(const k of Object.values(fields).flat().map(x=>x[0]))if(typeof r.values[k]==='number'&&Number.isFinite(r.values[k]))filtered[k]=r.values[k];r.values=filtered;});const p=c.profile;c.profile={age:val(p,'age',0,125),sex:['masculino','feminino'].includes(p.sex)?p.sex:'',height:val(p,'height',0,250),weight:val(p,'weight',0,500),description:String(p.description||'').slice(0,180)};cases.push(c);}activeId=cases.at(-1)?.id||null;recordId=activeCase()?.records[0]?.id||null;save();renderLayout();}catch(err){alert('Não foi possível importar: '+err.message);}finally{e.target.value='';}};
document.addEventListener('input',e=>{const target=e.target;const r=currentRecord(),c=activeCase();if(!r||!c)return;if(target.matches('[data-field]')){const raw=target.value.trim().replace(',','.');r.values[target.dataset.field]=raw===''?null:Number(raw);update();}else if(target.matches('[data-profile]')&&target.tagName!=='SELECT'){const k=target.dataset.profile;const raw=target.value.trim().replace(',','.');c.profile[k]=k==='description'?target.value:(raw===''?null:Number(raw));update();}else if(target.id==='recordNote'){r.note=target.value;save();}});
document.addEventListener('change',e=>{if(e.target.matches('[data-profile]')){const c=activeCase();if(c){c.profile[e.target.dataset.profile]=e.target.value;update();}}if(e.target.id==='recordTime'){const r=currentRecord();if(r){r.time=e.target.value;save();renderLayout();}}if(e.target.id==='chartMetric')renderEvolution();});
document.addEventListener('click',e=>{const tab=e.target.closest('[data-record]');if(tab){recordId=tab.dataset.record;renderLayout();return;}const scienceTab=e.target.closest('[data-pf-tab]');if(scienceTab){renderScienceTab(scienceTab.dataset.pfTab);return;}const card=e.target.closest('[data-info]');if(card)info(card.dataset.info);});
document.getElementById('closeDialog').onclick=()=>document.getElementById('infoDialog').close();
renderLayout();
