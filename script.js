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
// Conteúdo educacional da primeira ficha: baseado em Miller (caps. 12 e 37)
// e Barash, 9ª edição (caps. 15 e 26); síntese original do projeto.
// Não usar este material como ferramenta clínica validada.
const pfTabs = [
 {id:'entender',label:'Entender'},
 {id:'formula',label:'Fórmula'},
 {id:'limites',label:'Limitações'},
 {id:'fontes',label:'Referências'}
];
function pfPanel(tab){
 const d=data[selected];
 const pf=Number.isFinite(d.apo2)&&Number.isFinite(d.fio2)&&d.fio2>=21&&d.fio2<=100
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
  <div class="worked-example"><span class="eyebrow">CÁLCULO DINÂMICO · ${selected==='t0'?'T0':'TFINAL'}</span>
   <p>PaO₂ = <strong>${format(d.apo2,1)} mmHg</strong></p>
   <p>FiO₂ = <strong>${format(d.fio2,1)}%</strong> = ${Number.isFinite(d.fio2)?format(d.fio2/100,2):'—'}</p>
   <div class="worked-result">${pf===null?'Dados inválidos para P/F':`${format(d.apo2,1)} ÷ ${format(d.fio2/100,2)} = <strong>${format(pf,1)} mmHg</strong>`}</div>
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
 const d=data[selected];
 const valid=Number.isFinite(d.vpco2)&&d.vpco2>=0&&Number.isFinite(d.apco2)&&d.apco2>=0;
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
  <div class="worked-example"><span class="eyebrow">CÁLCULO DINÂMICO · ${selected==='t0'?'T0':'TFINAL'}</span>
   <p>PcvCO₂ = <strong>${Number.isFinite(d.vpco2)?format(d.vpco2,1):'—'} mmHg</strong></p>
   <p>PaCO₂ = <strong>${Number.isFinite(d.apco2)?format(d.apco2,1):'—'} mmHg</strong></p>
   <div class="worked-result">${valid?`${format(d.vpco2,1)} − ${format(d.apco2,1)} = <strong>${format(gap,1)} mmHg</strong>`:'Preencha pressões parciais válidas.'}</div>
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
function info(key){
 const [title,description,equation,limit]=definitions[key];
 document.getElementById('dialogTitle').textContent=title;
 const node=document.getElementById('dialogContent');
 node.replaceChildren();
 if(key==='pf'||key==='dco2'){
  const bar=document.createElement('div');bar.className='pf-tabs';bar.id='pfTabBar';bar.dataset.scienceKind=key;bar.setAttribute('role','tablist');
  for(const tab of pfTabs){
   const button=document.createElement('button');button.type='button';button.textContent=tab.label;
   button.dataset.pfTab=tab.id;button.setAttribute('role','tab');bar.appendChild(button);
  }
  const content=document.createElement('div');content.id='pfTabContent';content.className='pf-tab-content';
  node.append(bar,content);renderScienceTab('entender');
 }else{
  for(const sentence of [description,limit].filter(Boolean)){
   const p=document.createElement('p');p.textContent=sentence;node.appendChild(p);
  }
  if(equation){const p=document.createElement('div');p.className='equation';p.textContent=equation;node.insertBefore(p,node.children[1]||null);}
 }
 document.getElementById('infoDialog').showModal();
}
document.addEventListener('input',event=>{const input=event.target;if(!input.matches('[data-field]'))return;const raw=input.value.trim().replace(',','.');data[selected][input.dataset.field]=raw===''?null:Number(raw);render();});
document.addEventListener('click',event=>{const tab=event.target.closest('[data-moment]');if(tab){selected=tab.dataset.moment;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===tab));renderFields();render();return;}const pfTab=event.target.closest('[data-pf-tab]');if(pfTab){renderScienceTab(pfTab.dataset.pfTab);return;}const card=event.target.closest('[data-info]');if(card)info(card.dataset.info);});
document.getElementById('reset').onclick=()=>{data=structuredClone(original);renderFields();render();};document.getElementById('closeDialog').onclick=()=>document.getElementById('infoDialog').close();
renderFields();render();
