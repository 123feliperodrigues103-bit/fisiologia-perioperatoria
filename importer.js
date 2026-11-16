"use strict";
// v0.5.7.1 — OCR central com pré-processamento; valores ambíguos não são inferidos.
(() => {
 const dialog=document.getElementById('importDialog');
 const $=id=>document.getElementById(id);
 const query=(selector)=>Array.from(dialog.querySelectorAll(selector));
 const known={
  ph:['pH','',6,8],po2:['PO₂','mmHg',0,1000],pco2:['PCO₂','mmHg',0.1,200],
  hco3:['HCO₃⁻','mmol/L',0.1,80],be:['Base Excess (laudo)','mEq/L',-50,50],
  so2:['Saturação de O₂','%',0,100],hb:['Hemoglobina','g/dL',0.1,30],
  fio2:['FiO₂','%',21,100],na:['Sódio','mmol/L',80,200],k:['Potássio','mmol/L',0.1,15],
  cl:['Cloreto','mmol/L',50,160],lactate:['Lactato','mmol/L',0,35],
  caion:['Cálcio ionizado','mmol/L',0.1,4],mg:['Magnésio','mmol/L',0.1,6],
  albumin:['Albumina','g/dL',0,8],phosphate:['Fosfato','mmol/L',0,12],glucose:['Glicose','mg/dL',0,1500]
 };
 const toField={
  arterial:{ph:'aph',po2:'apo2',pco2:'apco2',hco3:'hco3',be:'be',so2:'aso2',hb:'hb'},
  venous:{ph:'vph',po2:'vpo2',pco2:'vpco2',hco3:'vhco3',be:'bev',so2:'vso2',hb:'hbv'}
 };
 const extraLabels={tco2:'CO₂ total',hematocrit:'Hematócrito',cohb:'Carboxi-hemoglobina',methb:'Meta-hemoglobina',hhb:'Desoxi-hemoglobina'};
 let extracted=null;
 const promptTemplate=`Você receberá uma gasometria FICTÍCIA ou completamente ANONIMIZADA. Transcreva SOMENTE os valores do paciente que estejam legíveis. Não inclua nome, prontuário, data de nascimento, identificadores nem o texto integral do laudo. Não confunda valores de referência com resultados, horário do laudo com horário da coleta, nem gasometria venosa com arterial. Se a origem da amostra não for explícita, peça confirmação ANTES de criar JSON.\n\nResponda exclusivamente com um JSON válido (sem blocos Markdown) neste formato:\n{\n  "format":"fisiologia-perioperatoria-cases-v04",\n  "cases":[{\n    "id":"caso-importado-1",\n    "title":"Gasometria anonimizada",\n    "profile":{"age":null,"sex":"","height":null,"weight":null,"description":"Caso desidentificado"},\n    "records":[{\n      "id":"registro-1",\n      "time":"",\n      "note":"Valores transcritos e conferidos; origem da amostra confirmada",\n      "values":{}\n    }]\n  }]\n}\n\nPara gasometria ARTERIAL, use somente as chaves disponíveis: aph (pH), apo2 (PaO2 em mmHg), apco2 (PaCO2 em mmHg), aso2 (SaO2 %), hco3 (HCO3 mmol/L), be (BE de laudo mEq/L), hb (Hb g/dL), fio2 (FiO2 %).\nPara gasometria VENOSA CENTRAL, use: vph, vpo2, vpco2, vso2, vhco3, bev, hbv. A origem venosa deve ser CENTRAL, não simplesmente periférica.\nOutros campos compartilhados permitidos: na, k, cl, glucose (glicose em mg/dL), lactate, caion, mg, albumin, phosphate. Use números decimais com ponto no JSON e mantenha BE negativo. Se o resultado vier em unidades diferentes, só converta com regra explícita e verificada. Não inclua campos ausentes e não invente valores. Não presuma BE(B) ou BEecf se o laudo não especificar. Se houver múltiplas amostras, separe em registros distintos, preservando a origem correta de cada valor. Não inclua intervalos de referência em values.\n\nO arquivo será importado na plataforma Fisiologia Perioperatória; confira se é JSON puro e se o usuário confirmou a origem da amostra.`;
 $('aiPromptPreview').textContent=promptTemplate;
 function changeTab(tab){
  query('[data-import-tab]').forEach(b=>{const active=b.dataset.importTab===tab;b.classList.toggle('selected',active);b.setAttribute('aria-selected',String(active));});
  query('[data-import-pane]').forEach(p=>p.hidden=p.dataset.importPane!==tab);
 }
 function clearReview(){extracted=null;$('importReview').hidden=true;$('importPreview').replaceChildren();$('importConfirmSample').checked=false;}
 function reset(){clearReview();$('importRawText').value='';$('importImage').value='';$('importOCRStatus').textContent='';$('importPromptStatus').textContent='';changeTab('manual');}
 function normalize(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).toLowerCase().replace(/[^a-z0-9]/g,'');}
 function labelCode(original){
  const label=normalize(original);
  if(!label||label.endsWith('t')&&['pht','po2t','pco2t'].includes(label))return null;
  if(['ph','phsangue'].includes(label))return 'ph';
  if(['po2','p02','pa02','pao2','pvo2','pcvo2','po','p0'].includes(label))return 'po2';
  if(['pco2','pc02','paco2','pvco2','pcvco2','pco','pc0'].includes(label))return 'pco2';
  if(label.startsWith('chco')||label.startsWith('hco3')||['bicarbonato'].includes(label))return 'hco3';
  if(['tco2','ctco2','co2total','ctco2pc','ctcopc','otcopc'].includes(label)||/^c?tco/.test(label)||/^otco/.test(label))return 'tco2';
  if(['excessodebase','basedeficit','baseexcess','abe','abec','be','bec','beecf','sbe'].includes(label))return 'be';
  if(['so2','so','saturo2','saturacaodeo2','saturacaoo2','o2sat','sato2','svo2','scvo2','sao2'].includes(label))return 'so2';
  if(['cthb','thb','hb','hemoglobina','hemoglobinatotal'].includes(label))return 'hb';
  if(['fio2','fo2i','fi02','fo2','foi','fo1'].includes(label))return 'fio2';
  if(['na','cna','cnat','cna1','sodio','nasodio'].includes(label))return 'na';
  if(['k','ck','potassio'].includes(label))return 'k';
  if(['cl','ccl','cloro','cloreto'].includes(label))return 'cl';
  if(['lac','clac','lactato','lactate','acidolactico'].includes(label))return 'lactate';
  if(['ca','ca2','cca2','cca','coa','caion','calcioionico','calcioionizado'].includes(label))return 'caion';
  if(['mg','cmg','magnesio'].includes(label))return 'mg';
  if(['albumina','albumin','alb'].includes(label))return 'albumin';
  if(['fosfato','phosphate','pi'].includes(label))return 'phosphate';
  if(['glicose','glucose','glu','cglu','glicemia'].includes(label))return 'glucose';
  if(['hematocrito','hematocrit','htc','hct','hcte','het','hete'].includes(label))return 'hematocrit';
  if(['fcohb','cohb'].includes(label))return 'cohb';
  if(['fmethb','methb','metahemoglobina'].includes(label))return 'methb';
  if(['fhhb','hhb'].includes(label))return 'hhb';
  return null;
 }
 function sourceType(raw){
  const s=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const hasVenous=/gasometria\s+(?:venosa\s+central|central\s+venosa)|amostra\s*:\s*venosa\s+central/.test(s);
  const hasArterial=/gasometria\s+arterial|amostra\s*:\s*arterial/.test(s);
  if(hasVenous&&hasArterial)return 'mixed';
  if(hasVenous)return 'venous';
  if(hasArterial)return 'arterial';
  return '';
 }
 function parseLab(text){
  const clipped=String(text||'').slice(0,40000);
  const values={};const extras=[];const ambiguous=[];const invalid=[];const uncertain={};
  const lines=clipped.split(/\r?\n/);
  let inTemperatureSection=false;
  for(const raw of lines){
   const line=raw.trim();
   if(!line)continue;
   // Evita ler duplicatas (e eventuais erros de OCR) do bloco de correção por temperatura.
   if(/valores?\s+corrigidos?\s+pela\s+temperatura/i.test(line)){inTemperatureSection=true;continue;}
   if(inTemperatureSection){
    if(/^(notas?|observac|impresso|resultados?)/i.test(line))inTemperatureSection=false;
    else continue;
   }
   // O primeiro número APÓS o rótulo é o resultado; os seguintes são referências.
   const m=line.match(/^(.{1,48}?)(?:\s*:\s*|\s+)([-+−]?\d{1,5}(?:[.,]\d{1,4})?)(?=\s|%|$)/);
   if(!m)continue;
   const label=m[1].trim(),key=labelCode(label);if(!key)continue;
   const rawValue=m[2].replace('−','-');
   const value=Number(rawValue.replace(',','.'));
   if(!Number.isFinite(value))continue;
   if(key in extraLabels){extras.push(`${extraLabels[key]} (${m[2]})`);continue;}
   let normalizedValue=value;
   if(key==='fio2'&&value>0&&value<=1)normalizedValue=value*100;
   const [,unit,min,max]=known[key];
   if(normalizedValue<min||normalizedValue>max){
    // Não adivinhar 974→97,4, 36→3,6 ou 69→6,9. Deixar campo em branco para edição manual.
    const warning=`${known[key][0]}: OCR/texto mostra “${m[2]}”, fora da faixa técnica ${min}–${max} ${unit}. Confira casas decimais na fotografia.`;
    invalid.push(warning);
    if(!Object.hasOwn(values,key)&&!Object.hasOwn(uncertain,key))uncertain[key]=m[2];
    continue;
   }
   if(key==='glucose'&&/\bmmol\s*\/\s*l\b/i.test(line)){
    invalid.push('Glicose apresentada em mmol/L: não importada automaticamente. Converta e confira no laudo antes de inserir em mg/dL.');
    continue;
   }
   if(key==='lactate'&&/mg\s*\/\s*d[lL]/i.test(line)){
    invalid.push('Lactato em mg/dL não foi importado: confira a unidade antes de preencher.');
    continue;
   }
   if(Object.hasOwn(values,key)){
    if(Math.abs(values[key]-normalizedValue)>0.00001)ambiguous.push(`${known[key][0]} aparece com dois valores diferentes; apenas o primeiro foi mantido.`);
    continue;
   }
   values[key]=normalizedValue;
   delete uncertain[key];
  }
  return {sample:sourceType(clipped),values,extras,invalid,ambiguous,uncertain};
 }
 function mappedKey(key,sample){return (toField[sample]&&toField[sample][key]) || (['fio2','na','k','cl','lactate','caion','mg','albumin','phosphate','glucose'].includes(key)?key:null);}
 function showReview(parsed){
  extracted=parsed.sample==='mixed'?null:parsed;
  const keys=Object.keys(parsed.values),uncertainKeys=Object.keys(parsed.uncertain||{}).filter(k=>!keys.includes(k));
  const review=$('importReview');review.hidden=false;
  $('importConfirmSample').checked=false;
  $('importSampleType').value=['arterial','venous'].includes(parsed.sample)?parsed.sample:'';
  $('importDestination').value=activeCase()?'new_record':'new_case';
  $('importAnalysisSummary').textContent=parsed.sample==='mixed'?'Foram identificados laudos arteriais e venosos no mesmo texto: importe separadamente para evitar misturar amostras.':`${keys.length} resultado(s) reconhecido(s) e ${uncertainKeys.length} campo(s) com leitura duvidosa. A origem ${parsed.sample==='arterial'?'arterial':parsed.sample==='venous'?'venosa central':'não foi identificada com segurança'}; confirme manualmente antes de importar.`;
  const items=$('importPreview');items.replaceChildren();
  for(const key of [...keys,...uncertainKeys]){
   const unsure=!Object.hasOwn(parsed.values,key);
   const wrapper=document.createElement('div');wrapper.className='import-item'+(unsure?' import-uncertain':'');wrapper.dataset.importKey=key;
   const selected=document.createElement('input');selected.type='checkbox';selected.checked=!unsure;selected.setAttribute('aria-label',`Incluir ${known[key][0]}`);selected.className='import-include';
   const name=document.createElement('label');name.textContent=known[key][0]+(unsure?' · conferir':'');
   const num=document.createElement('input');num.type='text';num.inputMode='decimal';num.autocomplete='off';num.spellcheck=false;num.value=unsure?'':String(parsed.values[key]);num.placeholder=unsure?`OCR: ${parsed.uncertain[key]}`:'';num.className='import-number';num.setAttribute('aria-label',`Valor revisado de ${known[key][0]}`);
   const unit=document.createElement('small');unit.textContent=known[key][1];wrapper.append(selected,name,num,unit);items.append(wrapper);
   // Para um valor duvidoso, só incluir após digitação explícita de um número plausível.
   if(unsure){num.addEventListener('input',()=>{if(num.value.trim())selected.checked=true;else selected.checked=false;});}
  }
  const notes=[];
  if(parsed.extras.length)notes.push('Reconhecidos, mas sem campo no site: '+[...new Set(parsed.extras)].join('; ')+'.');
  if(parsed.ambiguous.length)notes.push(...parsed.ambiguous);
  if(parsed.invalid.length)notes.push(...parsed.invalid);
  if(parsed.sample==='mixed')notes.push('Não é permitido preencher um registro a partir de duas origens misturadas. Separe o texto.');
  if(!keys.length&&!uncertainKeys.length)notes.push('Nenhum resultado reconhecido. Revise o texto ou a fotografia, corrija os rótulos e tente novamente.');
  notes.push('Confira CADA resultado com o laudo: OCR pode produzir números plausíveis mas errados (por exemplo, cálcio 1,08 em lugar de 1,03). Valores de referência e horário do laudo não são importados.');
  $('importWarnings').textContent=notes.join(' ');
  review.scrollIntoView({behavior:'smooth',block:'start'});
 }
 function analyzeText(){const text=$('importRawText').value;if(!text.trim()){clearReview();alert('Cole algum texto do laudo primeiro.');return;}showReview(parseLab(text));}
 function apply(){
  if(!extracted){alert('Analise uma gasometria antes de preencher.');return;}
  const sample=$('importSampleType').value;
  if(!sample){alert('Escolha explicitamente se a amostra é arterial ou venosa central.');return;}
  if(!$('importConfirmSample').checked){alert('Confira os valores e confirme a origem da amostra antes de aplicar.');return;}
  const values={};
  for(const element of query('[data-import-key]')){
   if(!element.querySelector('.import-include').checked)continue;
   const key=element.dataset.importKey,target=mappedKey(key,sample);
   if(!target)continue;
   const input=element.querySelector('.import-number');if(input.value.trim()===''){alert('Há um valor selecionado mas vazio. Preencha-o ou desmarque-o.');return;}
   const num=parseMedicalDecimal(input.value),[,unit,min,max]=known[key];
   if(!Number.isFinite(num)||num<min||num>max){alert(`${known[key][0]} fora dos limites técnicos aceitos (${min} a ${max} ${unit}).`);return;}
   values[target]=num;
  }
  if(!Object.keys(values).length){alert('Selecione ao menos um resultado válido.');return;}
  let dest=$('importDestination').value;
  if(dest!=='new_case'&&!activeCase())dest='new_case';
  const message=`Confirmar importação de ${Object.keys(values).length} campo(s) ${sample==='venous'?'venosos centrais':'arteriais'} ${dest==='new_case'?'em caso novo':dest==='new_record'?'em NOVO registro':'no registro ATUAL'}?${dest==='current_record'?' Os campos com a mesma chave serão substituídos.':''}`;
  if(!confirm(message))return;
  let c=activeCase();
  if(dest==='new_case'){
   c=createCase('Gasometria importada — caso desidentificado');cases.push(c);activeId=c.id;recordId=c.records[0].id;
  }
  if(!c)return;
  let record=currentRecord();
  if(dest==='new_record'){record={id:newId(),time:'',note:'',values:{}};c.records.push(record);recordId=record.id;}
  if(!record)return;
  Object.assign(record.values,values);
  if(dest!=='current_record')record.note=`Gasometria ${sample==='venous'?'venosa central':'arterial'} importada; amostra e valores conferidos. Coleta sem horário validado.`;
  save();renderLayout();dialog.close();reset();
 }
 function loadOCR(){return new Promise((resolve,reject)=>{
  if(window.Tesseract){resolve();return;}
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  script.async=true;script.onload=()=>window.Tesseract?resolve():reject(new Error('Motor OCR indisponível.'));
  script.onerror=()=>reject(new Error('Não foi possível baixar o motor OCR. Verifique internet ou use Colar texto.'));
  document.head.appendChild(script);
 });}
 async function prepareOCRPhoto(file){
  // O recibo Radiometer costuma ficar no centro, com etiquetas e outros papéis nas bordas.
  // Este recorte opcional evita cabeçalhos identificadores e melhora OCR; desative se a imagem estiver fora do centro.
  const bitmap=await createImageBitmap(file);
  try{
   const crop=$('importCropCenter').checked;
   const sx=crop?Math.round(bitmap.width*0.18):0;
   const sy=crop?Math.round(bitmap.height*0.205):0;
   const sw=crop?Math.max(1,Math.min(bitmap.width-sx,Math.round(bitmap.width*0.53))):bitmap.width;
   const sh=crop?Math.max(1,Math.min(bitmap.height-sy,Math.round(bitmap.height*0.55))):bitmap.height;
   const scale=Math.min(2,2000/Math.max(sw,sh));
   const canvas=document.createElement('canvas');
   canvas.width=Math.round(sw*scale);canvas.height=Math.round(sh*scale);
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw Error('Navegador não conseguiu preparar a imagem.');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
   const data=ctx.getImageData(0,0,canvas.width,canvas.height);
   const a=data.data,hist=new Uint32Array(256);
   // Autocontraste robusto a aproximadamente 2% de pixels brancos/escuros extremos.
   for(let i=0;i<a.length;i+=4){const v=Math.round(0.299*a[i]+0.587*a[i+1]+0.114*a[i+2]);a[i]=a[i+1]=a[i+2]=v;hist[v]++;}
   const pixels=a.length/4,tail=pixels*0.02;
   let sum=0,lo=0,hi=255;
   for(let j=0;j<256;j++){sum+=hist[j];if(sum>=tail){lo=j;break;}}
   sum=0;
   for(let j=255;j>=0;j--){sum+=hist[j];if(sum>=tail){hi=j;break;}}
   const span=Math.max(30,hi-lo);
   for(let i=0;i<a.length;i+=4){const v=(a[i]-lo)*255/span;const contrast=(v-128)*1.25+128;a[i]=a[i+1]=a[i+2]=Math.round(Math.min(255,Math.max(0,contrast)));}
   ctx.putImageData(data,0,0);
   return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Falha ao preparar imagem.')),'image/png'));
  }finally{bitmap.close();}
 }
 async function recognizePhoto(){
  const image=$('importImage').files?.[0];const btn=$('recognizeImage'),status=$('importOCRStatus');
  if(!image){status.textContent='Escolha uma imagem primeiro.';return;}
  if(image.size>10e6||!['image/jpeg','image/png','image/webp'].includes(image.type)){status.textContent='Use uma imagem JPG, PNG ou WEBP com até 10 MB.';return;}
  btn.disabled=true;clearReview();status.textContent='Preparando reconhecimento local...';
  let worker=null;
  try{
   await loadOCR();
   const prepared=await prepareOCRPhoto(image);
   status.textContent='Carregando português e inglês (internet necessária na primeira utilização)...';
   worker=await window.Tesseract.createWorker('por+eng',1,{logger:m=>{
    if(m.status&&typeof m.progress==='number'){status.textContent=`${m.status} · ${Math.round(m.progress*100)}%`;}
   }});
   if(worker.setParameters)await worker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'});
   status.textContent='Reconhecendo os valores na imagem...';
   const result=await worker.recognize(prepared);
   const txt=result.data?.text||'';
   if(!txt.trim())throw Error('Não foi possível reconhecer texto. Tente imagem mais nítida ou cole o resultado textual.');
   $('importRawText').value=txt;
   changeTab('text');showReview(parseLab(txt));
   status.textContent='Texto reconhecido. Confira TODOS os valores, principalmente decimais e cálcio.';
  }catch(err){status.textContent=`OCR não concluído: ${err.message}. Tente novamente sem recorte ou use o texto do laboratório.`;}
  finally{if(worker)try{await worker.terminate();}catch{}btn.disabled=false;}
 }
 $('openGasImport').addEventListener('click',()=>{reset();dialog.showModal();});
 $('closeImportDialog').addEventListener('click',()=>{dialog.close();reset();});
 dialog.addEventListener('close',reset);
 query('[data-import-tab]').forEach(b=>b.addEventListener('click',()=>changeTab(b.dataset.importTab)));
 $('goManualFields').addEventListener('click',()=>{dialog.close();reset();if(!activeCase()){alert('Crie primeiro um caso para preencher manualmente.');$('newCase').focus();return;}$('arterialFields').scrollIntoView({behavior:'smooth',block:'start'});});
 $('analyzeLabText').addEventListener('click',analyzeText);
 $('recognizeImage').addEventListener('click',recognizePhoto);
 $('applyLabImport').addEventListener('click',apply);
 $('importJsonFromGuide').addEventListener('click',()=>{dialog.close();reset();$('importFile').click();});
 $('copyAIPrompt').addEventListener('click',async()=>{
  const status=$('importPromptStatus');
  try{await navigator.clipboard.writeText(promptTemplate);status.textContent='Instrução copiada. Cole na IA de sua preferência.';}
  catch{status.textContent='O navegador não permitiu copiar automaticamente. Selecione e copie o texto em “Ver instrução completa”.';$('aiPromptPreview').closest('details').open=true;}
 });
 // Útil para testes locais de parser sem expor quaisquer identificadores clínicos.
 window.labImportPreviewForTest=parseLab;
})();
