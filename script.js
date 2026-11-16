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
// Os identificadores dos campos antigos são preservados no armazenamento local e no JSON.
// O formulário mostra apenas as medidas mais úteis; parâmetros avançados são recolhíveis.
const fields={
 arterialFields:[['fio2','FiO₂','%'],['hb','Hb arterial','g/dL'],['aph','pH',''],['apo2','PaO₂','mmHg'],['apco2','PaCO₂','mmHg'],['aso2','SaO₂','%'],['hco3','HCO₃⁻ informado','mmol/L'],['be','BE arterial (laudo)','mEq/L']],
 venousFields:[['hbv','Hb venosa · opcional','g/dL'],['vph','pH venoso',''],['vpo2','PcvO₂','mmHg'],['vpco2','PcvCO₂','mmHg'],['vso2','ScvO₂','%'],['vhco3','HCO₃⁻ venoso informado','mmol/L'],['bev','BE venoso central (laudo)','mEq/L']],
 ventFields:[['vt','VC expirado','mL'],['rr','FR total','irpm'],['minute','VM medido','L/min'],['pause','Pausa inspiratória','%'],['ieratio','Relação I:E (ex.: 1:2)',''],['pplat','Platô (Pplat)','cmH₂O'],['peep','PEEP','cmH₂O'],['ppeak','Pico (Ppico)','cmH₂O']],
 hemoFields:[['co','Débito cardíaco','L/min'],['hr','FC','bpm'],['map','PAM','mmHg'],['cvp','PVC','mmHg']],
 advancedFields:[['pb','Pressão barométrica','mmHg'],['rq','Quociente respiratório assumido','']],
 acidFields:[['na','Sódio (Na⁺)','mmol/L'],['k','Potássio (K⁺)','mmol/L'],['cl','Cloreto (Cl⁻)','mmol/L'],['glucose','Glicose (glicemia)','mg/dL'],['lactate','Lactato','mmol/L']],
 acidAdvancedFields:[['albumin','Albumina','g/dL'],['phosphate','Fosfato inorgânico','mmol/L'],['caion','Cálcio ionizado','mmol/L'],['mg','Magnésio','mmol/L']]
};
const DISORDERS=['met_acidosis','met_alkalosis','resp_acidosis_acute','resp_acidosis_chronic','resp_alkalosis_acute','resp_alkalosis_chronic'];
const legacyNumberKeys=['vti','peepi','peeptotal','flow','ti','passive','etco2','eto2','feo2'];
function ratioToNumber(text){
 if(typeof text!=='string')return null;
 const parts=text.trim().replaceAll(',','.').match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
 if(!parts)return null;
 const i=Number(parts[1]),e=Number(parts[2]);
 return i>0&&e>0&&i<=20&&e/i<=30?e/i:null;
}
const definitions={
 ph:['pH e atividade dos íons H⁺','Escala logarítmica da atividade dos íons hidrogênio.','pH = −log₁₀(aH⁺); [H⁺] aprox. (nmol/L) = 10^(9−pH)','O pH é medido; a atividade não é idêntica à concentração.'],
 k:['Potássio — mecanismos e correção didática','Interpretação longitudinal do K⁺ em contexto ácido-base, glicêmico e renal.','Redistribuição transcelular ≠ alteração do conteúdo corporal total.','Fichas educacionais não indicam tratamento individual.'],
 integracao:['Interpretação integrada da gasometria pareada','Leitura conjunta de conteúdo venoso central, ΔPCO₂, lactato e razão de pressão/conteúdo.','ΔPCO₂ / C(a−cv)O₂ = (PcvCO₂−PaCO₂)/(CaO₂−CcvO₂)','Índice exploratório: não equivale ao quociente respiratório, não mede metabolismo anaeróbico e não é uma meta validada de ressuscitação.'],
 glucose:['Glicemia — interpretação perioperatória','Concentração medida de glicose no momento da coleta; interpretar com contexto clínico e tendência.','Glicose (mmol/L) = glicose (mg/dL) ÷ 18','Uma glicemia isolada não demonstra diabetes, CAD, EHH, nem indica prescrição automática.'],
 pf:['Relação PaO₂/FiO₂','Índice de oxigenação arterial ajustado à FiO₂.','P/F = PaO₂ / (FiO₂ / 100)','A P/F depende de condições ventilatórias, pressão barométrica e circulação; não determina shunt ou SDRA isoladamente.'],
 dco2:['Gradiente venoso central–arterial de PCO₂','Diferença de pressões parciais de CO₂, não de conteúdos.','ΔPCO₂ = PcvCO₂ − PaCO₂','Não mede débito cardíaco ou hipoperfusão diretamente.'],
 dph:['Diferença arterial–venosa de pH','ΔpH real de amostras arterial e venosa central pareadas.','ΔpH = pHa − pHcv','Valor descritivo. pH é logarítmico; ΔpH não diagnostica choque e não deve ser confundido com estimativa arterial a partir de amostra venosa.'],
 phest:['pH arterial APROXIMADO (somente venosa central)','Estimativa populacional de pH arterial em situação em que não foi informado pH arterial.','pHa estimado ≈ pHcv + (0,03 a 0,05)','Faixa heurística, não intervalo de previsão de 95%; pode falhar especialmente em choque, instabilidade ou distúrbios acidobásicos extremos. Nunca é usada para outros cálculos.'],
 bea:['BE arterial informado (laudo)','Valor de BE tal como fornecido no laudo de gasometria arterial.','BE(B) e BEecf/SBE são variantes calculadas pelo analisador.','Conferir a convenção do equipamento: BE(B) não é idêntico a SBE/BEecf.'],
 bev:['BE venoso central informado (laudo)','Valor de BE tal como fornecido no laudo de gasometria venosa central.','BE(B) e BEecf/SBE são variantes calculadas pelo analisador.','Não presumir que o BE venoso central representa exatamente o arterial.'],
 sbea:['SBE arterial estimado — Van Slyke','Estimativa do base excess padronizado a partir de pH e HCO₃⁻ arterial quando BE não foi informado.','SBE ≈ 0,9287 × [HCO₃⁻ − 24,4 + 14,83 × (pH − 7,40)]','Não substitui o valor de BE do laudo e depende dos dados e das constantes utilizadas.'],
 sbev:['SBE venoso central estimado — Van Slyke','Estimativa do SBE a partir de pH e HCO₃⁻ venoso central quando BE não foi informado.','SBE ≈ 0,9287 × [HCO₃⁻ − 24,4 + 14,83 × (pH − 7,40)]','Não é uma medida arterial nem substitui o valor informado pelo gasômetro.'],
 hco3a:['HCO₃⁻ arterial — Henderson–Hasselbalch','Bicarbonato calculado a partir de pH arterial e PaCO₂.','[HCO₃⁻] = 0,0301 × PaCO₂ × 10^(pH−6,1)','É matematicamente derivado dos dados de gasometria: não é uma terceira medida independente.'],
 hco3v:['HCO₃⁻ venoso central — Henderson–Hasselbalch','Bicarbonato calculado a partir de pH venoso central e PcvCO₂.','[HCO₃⁻] = 0,0301 × PcvCO₂ × 10^(pHvenoso−6,1)','Não equivale automaticamente ao bicarbonato arterial.'],
 hplusA:['Atividade/concentração aproximada de H⁺ arterial','Conversão da escala logarítmica de pH para concentração molar aproximada.','[H⁺] ≈ 10^(9−pH) nmol/L','pH é o logaritmo da atividade de H⁺; conversão é uma aproximação de concentração.'],
 hplusV:['Atividade/concentração aproximada de H⁺ venoso','Conversão da escala logarítmica de pH venoso.','[H⁺] ≈ 10^(9−pHvenoso) nmol/L','Amostra venosa central não é necessariamente substituto da arterial.'],
 sidnacl:['Diferença Na⁺ − Cl⁻ (SID aproximada)','Estimativa muito simplificada da diferença dos principais íons fortes.','Na⁺ − Cl⁻','Não é SIDa nem inclui K⁺, lactato⁻, Ca²⁺, Mg²⁺ e outros íons. Interprete a relação com contexto eletrolítico e albumina.'],
 ag:['Ânion gap sem potássio','Diferença entre cátions e ânions habitualmente dosados.','AG = Na⁺ − (Cl⁻ + HCO₃⁻)','Usa HCO₃⁻ informado, calculado arterial ou, na ausência destes, venoso como aproximação. Dependente de albumina e método laboratorial.'],
 agcorr:['Ânion gap corrigido pela albumina','Correção aproximada da queda do AG quando albumina é baixa.','AG corrigido ≈ AG + 2,5 × (4 − albumina em g/dL)','Fator aproximado, sensível à população e metodologia; não substitui avaliação dos ânions não mensurados.'],
 pco2exp:['PaCO₂ esperada na compensação metabólica','Estimativa de compensação respiratória para um distúrbio metabólico selecionado.','Acidose: PaCO₂ = 1,5×HCO₃⁻ + 8 (±2); alcalose: PaCO₂ ≈ 40 + 0,7×(HCO₃⁻−24) (±5)','Comparar com PaCO₂ arterial pareada. A fórmula de Winter não deve ser aplicada à alcalose; compensação estimada não confirma diagnóstico.'],
 hco3exp:['HCO₃⁻ esperado na compensação respiratória','Estimativa de resposta renal conforme agudeza do distúrbio respiratório informado.','Variação esperada de HCO₃⁻ por 10 mmHg de PaCO₂: acidose aguda +1 a +2; crônica +3 a +4; alcalose aguda −1 a −2; crônica −4 a −5.','Requer PaCO₂ arterial; pressupõe basais aproximados de PaCO₂=40 mmHg e HCO₃⁻=24 mmol/L. Distúrbios mistos e função renal alteram a resposta.'],
 sids:['SID simplificado','Diferença dos íons fortes disponíveis mais comuns.','SID simplificado = Na⁺ + K⁺ − Cl⁻ − lactato⁻','Não inclui Ca²⁺, Mg²⁺ ou outros íons fortes: não rotular como SID aparente completo.'],
 sida:['SID aparente (SIDa)','Balanço das cargas de íons fortes medidos.','SIDa = Na⁺ + K⁺ + 2×Ca²⁺ + 2×Mg²⁺ − Cl⁻ − lactato⁻','Ca²⁺ e Mg²⁺ introduzidos em mmol/L; multiplicamos por 2 para mEq/L. Outros íons fortes não mensurados permanecem ausentes.'],
 side:['SID efetiva (SIDe)','Soma do bicarbonato calculado e da carga dos ácidos fracos plasmáticos.','SIDe = HCO₃⁻ + Alb(g/L)×(0,123×pH−0,631) + Pi(mmol/L)×(0,309×pH−0,469)','Equação de Figge aproximada; exige pH, PCO₂, albumina e fosfato em unidades corretas.'],
 sig:['Strong ion gap (SIG)','Diferença entre SID aparente e SID efetiva.','SIG = SIDa − SIDe','Estimativa de íons fortes não medidos, sensível a erros analíticos e às hipóteses do modelo.'] ,
 cao2:['Conteúdo arterial de O₂','Conteúdo de oxigênio associado à Hb e dissolvido.','CaO₂ = 1,34 × Hb × SaO₂/100 + 0,0031 × PaO₂','Constantes aproximadas; requer saturação arterial válida.'],
 cvo2:['Conteúdo venoso central de O₂ estimado','Conteúdo da amostra venosa central, não misto.','CcvO₂ = 1,34 × Hb_v × ScvO₂/100 + 0,0031 × PcvO₂','Se Hb venosa não for medida, utiliza-se Hb arterial como hipótese explícita.'],
 aav:['Diferença CaO₂ − CcvO₂','Diferença de conteúdos arterial e venoso central.','CaO₂ − CcvO₂','Não é necessariamente a diferença arteriovenosa mista sistêmica.'],
 eo2:['Extração central estimada','Fração de conteúdo arterial que não aparece no sangue venoso central.','100 × (CaO₂ − CcvO₂) / CaO₂','Não equivale à extração sistêmica venosa mista.'],
 pbw:['Peso corporal predito','Predição para adultos a partir da altura e sexo usado na equação de ARDSNet.','Masculino: 50 + 0,91 × (altura − 152,4); feminino: 45,5 + 0,91 × (altura − 152,4)','Não é peso real; não utilizar como fórmula pediátrica.'],
 bsa:['Superfície corporal','Estimativa pela equação de Mosteller.','SC = √(altura(cm) × peso(kg) / 3600)','É estimativa antropométrica.'],
 vtpbw:['Volume corrente por PBW','Volume expirado dividido pelo peso predito.','VC/PBW = VTe / PBW','Exige medição confiável do volume expirado.'],
 ve:['Ventilação-minuto calculada','Volume expirado multiplicado pela frequência respiratória total.','V̇E = VTe(mL) × FR / 1000','Não equivale à ventilação alveolar.'],
 dp:['Driving pressure do sistema respiratório','Diferença entre Pplat e a PEEP informada.','ΔP ≈ Pplat − PEEP','Exige Pplat em pausa com fluxo zero e passividade; auto-PEEP relevante exige PEEP total medida. O monitor não valida essas condições.'],
 cstat:['Complacência estática do sistema respiratório','Volume corrente dividido pela driving pressure.','Cstat ≈ VTe / (Pplat − PEEP)','Não é complacência isolada do pulmão; depende da parede torácica.'],
 cdyn:['Complacência dinâmica aproximada','Razão VTe/(Ppico−PEEPtotal), influenciada por resistência e fluxo.','Cdyn ≈ VTe / (Ppico − PEEP)','Não isola elastância. Depende de condições e modo ventilatório.'],
 raw:['Resistência aparente','Diferença de pressões resistiva sobre fluxo inspiratório constante.','R ≈ (Ppico − Pplat) / fluxo (L/s)','Válido apenas com fluxo inspiratório constante (VCV, onda quadrada), pausa válida e paciente passivo; inclui resistência do tubo. A plataforma não verifica o modo ventilatório.'],
 etgap:['Gradiente PaCO₂–EtCO₂','Diferença entre PaCO₂ e CO₂ tele-expiratório.','PaCO₂ − EtCO₂','EtCO₂ não é CO₂ expirado misto; não calcula espaço morto sozinho.'],
 pao2:['Pressão alveolar estimada de O₂','Equação alveolar simplificada.','PAO₂ ≈ FiO₂ × (Pb − 47) − PaCO₂/R','Depende de pressão barométrica e R assumido; não é medição direta.'],
 aagrad:['Gradiente alvéolo-arterial estimado de O₂','Diferença entre PAO₂ estimada e PaO₂.','A–a = PAO₂ − PaO₂','Depende de equação alveolar simplificada e suas hipóteses.'],
 do2:['Oferta global de oxigênio','Produto de débito cardíaco informado e conteúdo arterial de O₂.','DO₂ = DC × CaO₂ × 10','Não mede perfusão microcirculatória. DC deve ser obtido independentemente.'],
 doi:['Oferta de oxigênio indexada','DO₂ dividido por superfície corporal estimada.','DO₂I = DO₂/SC','Herdadas as limitações de DO₂ e SC.'],
 ie:['Relação I:E','Relação inspiratória/expiratória informada no ventilador.','I:E informado como 1:x; resultado é x','Pressupõe frequência e tempos representativos do ciclo.'],
 leak:['Diferença relativa entre VTi e VTe','Diferença inspiratório-expiratória relativa ao volume inspirado.','100 × (VTi − VTe)/VTi','Não diagnostica vazamento isoladamente; sensores, compressibilidade e fluxo fresco interferem.']
};
const metricGroups=[
 ['EQUILÍBRIO ACIDOBÁSICO',[['hco3a','HCO₃⁻ arterial (H–H)','mmol/L',1],['hco3v','HCO₃⁻ venoso (H–H)','mmol/L',1],['bea','BE arterial informado','mEq/L',1],['sbea','SBE arterial estimado','mEq/L',1],['bev','BE venoso central informado','mEq/L',1],['sbev','SBE venoso estimado','mEq/L',1],['sidnacl','Na⁺ − Cl⁻ (SID aprox.)','mmol/L',1],['sids','SID simplificado','mEq/L',1],['sida','SID aparente','mEq/L',1],['side','SID efetivo','mEq/L',1],['sig','SIG','mEq/L',1],['ag','Ânion gap (sem K⁺)','mmol/L',1],['agcorr','AG corrigido (albumina)','mmol/L',1]]],
 ['COMPENSAÇÃO ACIDOBÁSICA',[['pco2exp','PaCO₂ esperada','mmHg',1],['hco3exp','HCO₃⁻ esperado','mmol/L',1]]],
 ['GASOMETRIA E OXIGENAÇÃO',[['pf','Relação P/F','mmHg',1],['dco2','ΔPCO₂','mmHg',1],['dph','ΔpH medido','',2],['phest','pH arterial ≈ (estimativa)','aproximado',2],['cao2','CaO₂','mL/dL',2],['cvo2','CcvO₂ calculado','mL/dL',2],['aav','C(a−cv)O₂','mL/dL',2],['eo2','Extração central estimada','%',1],['pao2','PAO₂ estimada','mmHg',1],['aagrad','Gradiente A–a','mmHg',1]]],
 ['PACIENTE E VENTILAÇÃO',[['pbw','PBW','kg',1],['bsa','Superfície corporal','m²',2],['vtpbw','VC/PBW','mL/kg',1],['ve','VM calculado','L/min',2],['ie','Relação I:E','',2]]],
 ['MECÂNICA E CIRCULAÇÃO',[['dp','Driving pressure (aprox.)','cmH₂O',1],['cstat','Complacência estática (aprox.)','mL/cmH₂O',1],['cdyn','Complacência dinâmica (aprox.)','mL/cmH₂O',1],['do2','DO₂','mL/min',1],['doi','DO₂ indexado','mL/min/m²',1]]]
];
const allMetrics=metricGroups.flatMap(g=>g[1]);
const newId=()=> 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const emptyValues=()=>({});
function createCase(title='Caso sem título'){return {id:newId(),title,kind:'case',profile:{age:null,sex:'',height:null,weight:null,description:''},records:[{id:newId(),time:'',note:'',values:emptyValues()}]};}
function exampleCase(){const c=structuredClone(EXAMPLE);c.kind='didactic';c.id=newId();c.records.forEach(r=>r.id=newId());return c;}
function readCases(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(data)?data.filter(validCase):[];}catch{return [];}}
function validCase(c){return !!c&&typeof c==='object'&&typeof c.id==='string'&&typeof c.title==='string'&&c.profile&&typeof c.profile==='object'&&Array.isArray(c.records)&&c.records.length<=2000&&c.records.every(r=>r&&typeof r.id==='string'&&typeof r.time==='string'&&typeof r.note==='string'&&r.values&&typeof r.values==='object');}
let cases=readCases(), activeId=cases[0]?.id||null, recordId=cases[0]?.records[0]?.id||null;
let activeModule='gas';
const isDidactic=c=>c?.kind==='didactic'||/^caso 001.*exemplo didático/i.test(c?.title||'');
function activeCase(){return cases.find(c=>c.id===activeId)||null;}
function currentRecord(){const c=activeCase();return c?.records.find(r=>r.id===recordId)||c?.records[0]||null;}
function fmt(x,places=1){return Number.isFinite(x)?x.toLocaleString('pt-BR',{minimumFractionDigits:places,maximumFractionDigits:places}):'—';}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtIE(x){return Number.isFinite(x)?'1:'+x.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:2}):'—';}
function val(d,k,min=-Infinity,max=Infinity){const x=d?.[k];return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max?x:null;}
function maybe(...n){return n.every(v=>v!==null&&Number.isFinite(v));}
function compensation(d,gas){
 const primary=typeof d.primaryDisorder==='string'&&DISORDERS.includes(d.primaryDisorder)?d.primaryDisorder:'';
 if(!primary)return null;
 const pc=val(d,'apco2',0.1,200);
 const reportedA=val(d,'hco3',0.1,80),reportedV=val(d,'vhco3',0.1,80);
 const hco3=reportedA??gas.hco3a??reportedV??gas.hco3v;
 const source=reportedA!==null?'HCO₃⁻ arterial informado':gas.hco3a!==null?'HCO₃⁻ calculado da gasometria arterial':reportedV!==null?'HCO₃⁻ venoso informado':'HCO₃⁻ calculado da gasometria venosa central';
 const metabolic=primary.startsWith('met_');
 if(metabolic){
  if(hco3===null)return {kind:'pco2',error:'Informe HCO₃⁻ ou pH + PCO₂ de uma gasometria para estimar a PaCO₂ esperada.'};
  let middle,low,high,formula;
  if(primary==='met_acidosis'){
   middle=1.5*hco3+8;low=middle-2;high=middle+2;
   formula='Winter: PaCO₂ esperada = 1,5 × HCO₃⁻ + 8 (± 2 mmHg)';
  }else{
   middle=40+0.7*(hco3-24);low=middle-5;high=middle+5;
   formula='Alcalose metabólica: PaCO₂ esperada ≈ 40 + 0,7 × (HCO₃⁻ − 24) (± 5 mmHg)';
  }
  const assumption=(primary==='met_acidosis'&&hco3>=24)||(primary==='met_alkalosis'&&hco3<=24)?'O HCO₃⁻ informado não segue a direção habitual desse distúrbio; reveja a hipótese selecionada.':'';
  return {kind:'pco2',middle,low,high,actual:pc,source,formula,assumption,venous:reportedA===null&&gas.hco3a===null};
 }
 if(pc===null)return {kind:'hco3',error:'Informe PaCO₂ arterial para calcular a resposta renal esperada. PcvCO₂ venosa não é substituta.'};
 const acidosis=primary.startsWith('resp_acidosis');
 const delta=(pc-40)/10;
 if((acidosis&&delta<=0)||(!acidosis&&delta>=0))return {kind:'hco3',error:'A PaCO₂ medida não está na direção do distúrbio respiratório escolhido. Confira a seleção e a gasometria.'};
 const chronic=primary.endsWith('chronic');
 const a=acidosis?(chronic?3:1):(chronic?4:1);
 const b=acidosis?(chronic?4:2):(chronic?5:2);
 const amount=Math.abs(delta),low=acidosis?24+a*amount:24-b*amount,high=acidosis?24+b*amount:24-a*amount;
 const state=(acidosis?'acidose':'alcalose')+' respiratória '+(chronic?'crônica':'aguda');
 return {kind:'hco3',middle:(low+high)/2,low,high,actual:hco3,source,formula:`${state}: HCO₃⁻ esperado ≈ 24 ${acidosis?'+':'−'} (${a} a ${b}) × |PaCO₂ − 40| / 10`,venous:reportedA===null&&gas.hco3a===null&&hco3!==null};
}
function compute(d,p){
 const out={};const get=(k,min,max)=>val(d,k,min,max);
 const height=val(p,'height',100,250),weight=val(p,'weight',1,500);
 const pbw=height!==null&&['masculino','feminino'].includes(p?.sex)&&height>=152.4?(p.sex==='masculino'?50:45.5)+0.91*(height-152.4):null;
 const bsa=maybe(height,weight)?Math.sqrt(height*weight/3600):null;
 const fio=get('fio2',21,100),pa=get('apo2',0,1000),pc=get('apco2',0.1,200),pv=get('vpco2',0.1,200);
 const hb=get('hb',0.1,30),hbv=get('hbv',0.1,30),sa=get('aso2',0,100),sv=get('vso2',0,100),pvo=get('vpo2',0,1000);
 const vte=get('vt',1,3000),rr=get('rr',1,100),plat=get('pplat',0,100),peak=get('ppeak',0,100),peep=get('peep',0,50);
 const dc=get('co',0.01,40),pHa=get('aph',6,8),pHv=get('vph',6,8);
 const caO2=maybe(hb,sa,pa)?1.34*hb*(sa/100)+0.0031*pa:null;
 const cvO2=maybe(hbv??hb,sv,pvo)?1.34*(hbv??hb)*(sv/100)+0.0031*pvo:null;
 const avO2=maybe(caO2,cvO2)?caO2-cvO2:null;
 const bar=get('pb',200,1100),rq=get('rq',0.5,1.5);
 const alveolarO2=maybe(fio,pc,bar,rq)?fio/100*(bar-47)-pc/rq:null;
 const driving=maybe(plat,peep)&&plat>peep?plat-peep:null;
 const hco3a=maybe(pHa,pc)?0.0301*pc*Math.pow(10,pHa-6.1):null;
 const hco3v=maybe(pHv,pv)?0.0301*pv*Math.pow(10,pHv-6.1):null;
 const comp=compensation(d,{hco3a,hco3v});
 const hco3ReportedA=get('hco3',0.1,80),hco3ReportedV=get('vhco3',0.1,80);
 const beReportedA=get('be',-50,50),beReportedV=get('bev',-50,50);
 // Não converter BE(B) reportado em SBE; sem valor reportado, estimar apenas SBE.
 // Usar HCO₃⁻ da MESMA amostra, informado no laudo ou calculado por H–H.
 const sbeArterial=maybe(pHa,hco3ReportedA??hco3a)?0.9287*((hco3ReportedA??hco3a)-24.4+14.83*(pHa-7.4)):null;
 const sbeVenous=maybe(pHv,hco3ReportedV??hco3v)?0.9287*((hco3ReportedV??hco3v)-24.4+14.83*(pHv-7.4)):null;
 const hco3Best=hco3ReportedA??hco3a??hco3ReportedV??hco3v;
 const na=get('na',80,200),k=get('k',0.1,15),cl=get('cl',50,160),lactate=get('lactate',0,35),caion=get('caion',0.1,4),mg=get('mg',0.1,6);
 const albumin=get('albumin',0,8),phosphate=get('phosphate',0,12);
 const sidNaCl=maybe(na,cl)?na-cl:null;
 const simpleSid=maybe(na,k,cl,lactate)?na+k-cl-lactate:null;
 const anionGap=maybe(na,cl,hco3Best)?na-cl-hco3Best:null;
 const correctedAG=maybe(anionGap,albumin)?anionGap+2.5*(4-albumin):null;
 const sida=maybe(simpleSid,caion,mg)?simpleSid+2*caion+2*mg:null;
 const chargeWeak=maybe(albumin,phosphate,pHa)?10*albumin*(0.123*pHa-0.631)+phosphate*(0.309*pHa-0.469):null;
 const side=maybe(hco3a,chargeWeak)?hco3a+chargeWeak:null;
 const ie=ratioToNumber(d.ieratio)??(maybe(rr,get('ti',0.05,30))&&60/rr>d.ti?(60/rr-d.ti)/d.ti:null);
 Object.assign(out,{
  hco3a,hco3v,bea:beReportedA,bev:beReportedV,sbea:beReportedA===null?sbeArterial:null,sbev:beReportedV===null?sbeVenous:null,hplusA:pHa===null?null:Math.pow(10,9-pHa),hplusV:pHv===null?null:Math.pow(10,9-pHv),sidnacl:sidNaCl,sids:simpleSid,sida,side,sig:maybe(sida,side)?sida-side:null,ag:anionGap,agcorr:correctedAG,pco2exp:comp?.kind==='pco2'&&Number.isFinite(comp.middle)?comp.middle:null,hco3exp:comp?.kind==='hco3'&&Number.isFinite(comp.middle)?comp.middle:null,
  pf:maybe(fio,pa)?pa/(fio/100):null,dco2:maybe(pc,pv)?pv-pc:null,dph:maybe(pHa,pHv)?pHa-pHv:null,
  // Estimativa populacional em paciente presumidamente estável: sem amostra arterial,
  // e apenas para pH venoso central fora dos extremos de distúrbio acidobásico.
  // NÃO utilizar esta variável como entrada em outras equações.
  phest:pHa===null&&pHv!==null&&pHv>=7.20&&pHv<=7.60?pHv+0.04:null,
  cao2:caO2,cvo2:cvO2,aav:avO2,eo2:maybe(avO2,caO2)&&caO2>0?100*avO2/caO2:null,
  pbw,bsa,vtpbw:maybe(vte,pbw)&&pbw>0?vte/pbw:null,ve:maybe(vte,rr)?vte*rr/1000:null,ie,
  dp:driving,cstat:maybe(vte,driving)&&driving>0?vte/driving:null,
  cdyn:maybe(vte,peak,peep)&&peak>peep?vte/(peak-peep):null,
  pao2:alveolarO2,aagrad:maybe(alveolarO2,pa)?alveolarO2-pa:null,
  do2:maybe(dc,caO2)?10*dc*caO2:null,doi:maybe(dc,caO2,bsa)&&bsa>0?10*dc*caO2/bsa:null
 });
 return out;
}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cases));document.getElementById('saveStatus').textContent='Salvo neste navegador';}catch{document.getElementById('saveStatus').textContent='Não foi possível salvar. Exporte seus casos.';}}
function profileHtml(c){return profileGroups.map(([key,label,unit])=>{const v=c.profile[key]??'';let control;if(key==='sex')control=`<select data-profile="${key}"><option value="">Não informado</option><option value="masculino" ${v==='masculino'?'selected':''}>Masculino (PBW)</option><option value="feminino" ${v==='feminino'?'selected':''}>Feminino (PBW)</option></select>`;else control=`<input data-profile="${key}" ${key==='description'?'type="text" maxlength="180"':`type="number" step="any" min="0"`} value="${esc(v)}" placeholder="Opcional">`;return `<div class="profile-field"><label>${label}${unit?' ('+unit+')':''}</label>${control}</div>`;}).join('');}
// v0.5.9: referências adultas de consulta, recolhidas; nenhuma cor/alarme automático por faixa.
// Não sinalizar valores dependentes da intervenção (FiO₂, PaO₂, PAM, DC, ScvO₂) como "anormais" por regra universal.
const REFERENCE_NOTES={
 aph:{min:7.35,max:7.45,label:'7,35–7,45'},vph:{min:7.32,max:7.43,label:'7,32–7,43',note:'venosa central; depende do contexto'},
 apco2:{min:35,max:45,label:'35–45 mmHg'},vpco2:{min:38,max:50,label:'38–50 mmHg',note:'venosa central'},
 hco3:{min:22,max:26,label:'22–26 mmol/L'},vhco3:{min:23,max:27,label:'23–27 mmol/L'},
 be:{min:-2,max:2,label:'−2 a +2 mEq/L',note:'conferir variante do laudo'},
 bev:{min:-3,max:3,label:'−3 a +3 mEq/L',note:'conferir laboratório e BE(B)/SBE'},
 na:{min:135,max:145,label:'135–145 mmol/L'},k:{min:3.5,max:5.0,label:'3,5–5,0 mmol/L'},
 cl:{min:98,max:106,label:'98–106 mmol/L',note:'dependente do método'},lactate:{min:0,max:2,label:'até 2 mmol/L'},
 caion:{min:1.12,max:1.32,label:'1,12–1,32 mmol/L',note:'conferir laboratório'},
 mg:{min:0.7,max:1.05,label:'0,70–1,05 mmol/L'},phosphate:{min:0.8,max:1.5,label:'0,8–1,5 mmol/L'},
 albumin:{min:3.5,max:5.0,label:'3,5–5,0 g/dL'},
 sbea:{min:-2,max:2,label:'−2 a +2 mEq/L',note:'estimativa'},sbev:{min:-3,max:3,label:'−3 a +3 mEq/L',note:'estimativa; venosa central'},
 hco3a:{min:22,max:26,label:'22–26 mmol/L'},hco3v:{min:23,max:27,label:'23–27 mmol/L'},
 bea:{min:-2,max:2,label:'−2 a +2 mEq/L'},
 ag:{min:8,max:12,label:'8–12 mmol/L',note:'sem K⁺, depende do método'},
 agcorr:{min:8,max:12,label:'8–12 mmol/L',note:'faixa ilustrativa; AG corrigido'}
};
function usualRange(key,profile){
 // A correção por albumina não transforma o AG em índice com normalidade próxima a zero.
 if(key==='agcorr')return null;
 if(key==='hb'||key==='hbv'){
  if(profile?.sex==='masculino')return {min:13.8,max:17.2,label:'13,8–17,2 g/dL',note:'adulto; MedlinePlus, varia entre laboratórios'};
  if(profile?.sex==='feminino')return {min:12.1,max:15.1,label:'12,1–15,1 g/dL',note:'adulto; MedlinePlus, varia entre laboratórios'};
  return null;
 }
 return REFERENCE_NOTES[key]||null;
}
// As faixas orientativas não participam dos cálculos nem da comparação temporal.
const REF_LINKS={
 hb:['MedlinePlus — Hemoglobina','https://medlineplus.gov/ency/article/003645.htm'],
 arterial:['RCPA — Gasometria arterial','https://www.rcpa.edu.au/Manuals/RCPA-Manual/Pathology-Tests/B/Blood-gas-arterial'],
 gasometria:['University of Michigan — Blood Gas Reference Ranges','https://www.pathology.med.umich.edu/static/apps/handbook/Tables/BloodGasRefRange.html'],
 venosa:['Giani et al., 2025 — Gasometria venosa (revisão narrativa)','https://pmc.ncbi.nlm.nih.gov/articles/PMC12387505/'],
 chemistry:['RCPA — Intervalos bioquímicos harmonizados','https://www.rcpa.edu.au/Manuals/RCPA-Manual/General-Information/IG/Table-6-Harmonised-reference-intervals-for-chem'],
 acid:['Kellum, 2005 — Fisiologia ácido-base','https://pmc.ncbi.nlm.nih.gov/articles/PMC1297616/']
};
const REF_LABELS={hb:'Hb arterial',hbv:'Hb venosa',aph:'pH arterial',vph:'pH venoso central',apco2:'PaCO₂',vpco2:'PcvCO₂',hco3:'HCO₃⁻ arterial (laudo)',vhco3:'HCO₃⁻ venoso (laudo)',be:'BE arterial (laudo)',bev:'BE venoso (laudo)',hco3a:'HCO₃⁻ arterial calculado',hco3v:'HCO₃⁻ venoso calculado',sbea:'SBE arterial calculado',sbev:'SBE venoso calculado',na:'Na⁺',k:'K⁺',cl:'Cl⁻',lactate:'Lactato',caion:'Ca²⁺ ionizado',mg:'Mg²⁺',phosphate:'Fosfato',albumin:'Albumina',ag:'Ânion gap sem K⁺',agcorr:'Ânion gap corrigido pela albumina'};
const REF_GROUPS=[
 ['Hemoglobina',['hb','hbv']],
 ['Gasometria arterial',['aph','apco2','hco3','be','hco3a','sbea']],
 ['Gasometria venosa central',['vph','vpco2','vhco3','bev','hco3v','sbev']],
 ['Eletrólitos e metabolismo',['na','k','cl','lactate','caion','mg','phosphate','albumin']],
 ['Índices derivados',['ag','agcorr']]
];
function referenceSource(key){
 if(['hb','hbv'].includes(key))return REF_LINKS.hb;
 if(['aph','apco2','be','sbea'].includes(key))return REF_LINKS.arterial;
 if(['vph','vpco2','vhco3','bev','hco3v','sbev'].includes(key))return REF_LINKS.venosa;
 if(['na','k','cl','lactate','caion','hco3','hco3a'].includes(key))return REF_LINKS.gasometria;
 if(['mg','phosphate','albumin'].includes(key))return REF_LINKS.chemistry;
 return REF_LINKS.acid;
}
function renderReferenceCatalog(){
 const node=document.getElementById('referenceCatalog');if(!node)return;
 const profile=activeCase()?.profile||{};
 node.innerHTML=`<p class="reference-intro">Faixas adultas <strong>apenas orientativas</strong>, herdadas do protótipo e dependentes da população, do método e do tipo de amostra. As fontes são para consulta e <strong>não validam necessariamente cada extremo numérico</strong>. Não são metas nem alertas. Para Hb, os limiares diagnósticos de anemia da <a href="https://www.who.int/publications/i/item/9789240088542" target="_blank" rel="noopener noreferrer">OMS 2024</a> são distintos do intervalo laboratorial.</p>${REF_GROUPS.map(([title,keys])=>`<section class="reference-group"><h3>${title}</h3><div class="reference-rows">${keys.map(key=>{
  const ref=usualRange(key,profile),source=referenceSource(key);
  const description=ref?ref.label+(ref.note?' · '+ref.note:''):(key==='agcorr'?'Sem intervalo universal específico para esta fórmula.':'Sem faixa selecionada (Hb depende do sexo informado).');
  return `<div class="reference-entry"><span><strong>${esc(REF_LABELS[key]||key)}</strong><small>${esc(description)}</small></span><a href="${source[1]}" target="_blank" rel="noopener noreferrer" aria-label="Consultar fonte sobre ${esc(REF_LABELS[key]||key)}">Fonte ↗</a></div>`;
 }).join('')}</div></section>`).join('')}<p class="reference-intro">Valores venosos centrais não devem ser confundidos com amostras venosas mistas ou periféricas. O ânion gap corrigido por albumina mantém a escala do AG tradicional: não utilizar o corte próximo de zero de outra fórmula. Consulte sempre os intervalos do laboratório responsável pela análise.</p>`;
}
function fieldsHtml(r,id){return fields[id].map(([key,label,unit])=>{
 const x=r.values[key];const isText=key==='ieratio';
 const phHelp=['aph','vph'].includes(key)?`<button type="button" class="field-help" data-info="ph">Entender pH e H⁺ ↗</button>`:key==='k'?`<button type="button" class="field-help k-open" data-info="k">Entender K⁺ e correção ↗</button>`:key==='glucose'?`<button type="button" class="field-help k-open" data-info="glucose">Entender glicemia ↗</button>`:'';
 return `<div class="field" data-field-wrap="${key}"><label for="f_${key}">${label} <span class="unit">${unit}</span></label><input id="f_${key}" data-field="${key}" type="${isText?'text':'number'}" ${isText?'maxlength="12"':'step="any" inputmode="decimal"'} value="${x===null||x===undefined?'':esc(x)}" placeholder="${isText?'1:2':'—'}">${phHelp}</div>`;
}).join('');}
function renderLayout(){const c=activeCase();document.getElementById('caseSelect').innerHTML=cases.length?cases.map(x=>`<option value="${esc(x.id)}" ${x.id===activeId?'selected':''}>${isDidactic(x)?'◇ Exemplo · ':''}${esc(x.title)}</option>`).join(''):'<option value="">Nenhum caso salvo</option>';
 document.getElementById('exampleLibrary').hidden=!c;
 document.getElementById('activeCaseTitle').textContent=c?.title||'—';document.getElementById('activeCaseKind').textContent=c?(isDidactic(c)?'◇ Exemplo didático · cópia editável':'Caso criado por você'):'Nenhum caso';
 applyModuleVisibility();
 document.getElementById('caseArea').hidden=!c;document.getElementById('emptyArea').hidden=!!c;
 if(!c)return;const r=currentRecord();recordId=r?.id||null;
 document.getElementById('profileFields').innerHTML=profileHtml(c);
 document.getElementById('recordTabs').innerHTML=c.records.map((x,i)=>`<button type="button" class="record-tab ${x.id===recordId?'selected':''}" data-record="${esc(x.id)}"><b>${i===0?'T0 · inicial':'T'+i}</b><small>${esc(x.time?x.time.replace('T',' '):'Sem data')}</small></button>`).join('');
 document.getElementById('recordTime').value=r?.time||'';document.getElementById('recordNote').value=r?.note||'';
 for(const id of Object.keys(fields))document.getElementById(id).innerHTML=fieldsHtml(r,id);
 document.getElementById('primaryDisorder').value=DISORDERS.includes(r?.values.primaryDisorder)?r.values.primaryDisorder:'';
 renderReferenceCatalog();
 renderResults();}
function renderResults(){const c=activeCase(),r=currentRecord();if(!c||!r)return;const results=compute(r.values,c.profile);
 document.getElementById('validation').textContent='Comparações descritivas · sem interpretação automática';
 renderReferenceCatalog();
 const resultTitle={gas:'Resultados · Gasometria',vent:'Resultados · Ventilação',hemo:'Resultados · Hemodinâmica'};
 document.getElementById('resultModuleLabel').textContent=resultTitle[activeModule]||resultTitle.gas;
 document.querySelector('.integrated-link').hidden=activeModule!=='gas';
 const allowedGroups=activeModule==='gas'?new Set(['EQUILÍBRIO ACIDOBÁSICO','COMPENSAÇÃO ACIDOBÁSICA','GASOMETRIA E OXIGENAÇÃO']):activeModule==='vent'?new Set(['PACIENTE E VENTILAÇÃO','MECÂNICA E CIRCULAÇÃO']):new Set(['MECÂNICA E CIRCULAÇÃO','PACIENTE E VENTILAÇÃO']);
 const cards=metricGroups.filter(([category])=>allowedGroups.has(category)).map(([category,items])=>{
  if(activeModule==='vent'&&category==='MECÂNICA E CIRCULAÇÃO')items=items.filter(([key])=>['dp','cstat','cdyn'].includes(key));
  if(activeModule==='hemo'&&category==='MECÂNICA E CIRCULAÇÃO')items=items.filter(([key])=>['do2','doi'].includes(key));
  if(activeModule==='hemo'&&category==='PACIENTE E VENTILAÇÃO')items=items.filter(([key])=>key==='bsa');
  const available=items.filter(([key])=>Number.isFinite(results[key]));
  if(!available.length)return '';
  return `<div class="metric-group-label">${category}</div>`+available.map(([key,label,unit,places])=>{
   return `<button class="metric" data-info="${key}"><span class="label">${label}</span><span class="number">${key==='ie'?fmtIE(results[key]):fmt(results[key],places)}</span><span class="unit">${unit}</span><span class="more">${key==='phest'?'Estimativa populacional · inadequada em choque ↗':'Entender fórmula e limites ↗'}</span></button>`;
  }).join('');
 }).join('');
 document.getElementById('metricCards').innerHTML=cards||'<p class="hint">Preencha os dados disponíveis. Apenas índices com requisitos satisfeitos aparecerão aqui.</p>';
 renderCompensation(r.values,results);
 renderEvolution();}
function applyModuleVisibility(){
 document.querySelectorAll('[data-module-content]').forEach(el=>{el.hidden=el.dataset.moduleContent!==activeModule;});
 document.querySelectorAll('[data-module]').forEach(btn=>{const active=btn.dataset.module===activeModule;btn.classList.toggle('selected',active);btn.setAttribute('aria-selected',String(active));});
}
function switchModule(name){if(!['gas','vent','hemo'].includes(name))return;activeModule=name;applyModuleVisibility();if(activeCase())renderResults();}
function renderCompensation(d,results){
 const node=document.getElementById('compensationSummary');if(!node)return;
 const c=compensation(d,{hco3a:results.hco3a,hco3v:results.hco3v});
 if(!c){node.innerHTML='<span class="subtle">Escolha uma hipótese acima. Exibiremos a fórmula, a faixa esperada e, quando disponível, a comparação com a gasometria arterial.</span>';return;}
 if(c.error){node.textContent=c.error;return;}
 const type=c.kind==='pco2'?'PaCO₂ esperada':'HCO₃⁻ esperado',unit=c.kind==='pco2'?'mmHg':'mmol/L';
 const actualLabel=c.kind==='pco2'?'PaCO₂ arterial':'HCO₃⁻ disponível';
 const comparison=Number.isFinite(c.actual)?(c.actual<c.low?'abaixo da faixa estimada':c.actual>c.high?'acima da faixa estimada':'dentro da faixa estimada'):'sem valor para comparação';
 const extra=c.venous?'A estimativa utiliza bicarbonato venoso; não infira PaCO₂ arterial a partir da PcvCO₂.': 'Os intervalos são aproximados e pressupõem um distúrbio primário simples.';
 node.innerHTML=`<span class="comp-kicker">${esc(type)}</span><strong class="comp-value">${fmt(c.middle,1)} <small>${unit}</small></strong><span class="comp-range">Faixa: <strong>${fmt(c.low,1)} a ${fmt(c.high,1)} ${unit}</strong></span><p class="comp-line">${esc(c.formula)}</p><p class="comp-line">${esc(actualLabel)}: ${fmt(c.actual,1)} ${unit} · <strong>${esc(comparison)}</strong></p><p class="comp-foot">Base: ${esc(c.kind==='pco2'?c.source:'PaCO₂ arterial')}. ${esc(extra)}${c.assumption?' '+esc(c.assumption):''}</p>`;
}
// Evolução: priorizar variáveis que são realmente acompanhadas por REGISTRO,
// não características fixas do caso como peso predito ou superfície corporal.
const EVOLUTION_RAW=[
 ['aph','pH arterial','',2],['vph','pH venoso central','',2],['apco2','PaCO₂','mmHg',1],['vpco2','PcvCO₂','mmHg',1],
 ['apo2','PaO₂','mmHg',1],['vpo2','PcvO₂','mmHg',1],['aso2','SaO₂','%',1],['vso2','ScvO₂','%',1],
 ['hb','Hb arterial','g/dL',1],['hbv','Hb venosa','g/dL',1],['be','BE arterial (laudo)','mEq/L',1],['bev','BE venoso (laudo)','mEq/L',1],
 ['lactate','Lactato','mmol/L',1],['na','Na⁺','mmol/L',1],['k','K⁺','mmol/L',1],['glucose','Glicose','mg/dL',0],['cl','Cl⁻','mmol/L',1],
 ['albumin','Albumina','g/dL',1],['caion','Ca²⁺ ionizado','mmol/L',2],
 ['map','PAM','mmHg',0],['hr','Frequência cardíaca','bpm',0],['co','Débito cardíaco','L/min',1],['cvp','PVC','mmHg',1],
 ['fio2','FiO₂','%',0],['peep','PEEP','cmH₂O',1],['vt','VC expirado','mL',0],['rr','FR total','irpm',0],['pplat','Pressão de platô','cmH₂O',1]
].map(([key,label,unit,places])=>({key,label,unit,places,source:'raw',refKey:key}));
const EVOLUTION_DERIVED_KEYS=['hco3a','hco3v','bea','sbea','bev','sbev','ag','agcorr','sidnacl','sids','sida','side','sig','pf','dco2','dph','cao2','cvo2','aav','eo2','pao2','aagrad','dp','cstat','cdyn','ve','vtpbw','do2','doi'];
const EVOLUTION_DERIVED=EVOLUTION_DERIVED_KEYS.map(key=>{
 const m=allMetrics.find(x=>x[0]===key);return m?{key,label:m[1],unit:m[2],places:m[3],source:'computed',refKey:key}:null;
}).filter(Boolean);
// Ao surgir BE informado, não duplicá-lo como índice calculado na evolução.
const EVOLUTION_METRICS=[...EVOLUTION_RAW,...EVOLUTION_DERIVED.filter(m=>!['bea','bev'].includes(m.key))];
const EVOLUTION_MAIN=['aph','vph','apco2','vpco2','hb','vso2','lactate','be','bev','sbea','sbev','k','glucose','dco2','cao2','cvo2','aav','eo2','pf','do2','map','co'];
function timeValue(m,r,computed){return m.source==='raw'?val(r.values,m.key):computed[m.key];}
// Valor, mudança T0 e mudança imediatamente anterior são dimensões separadas.
function deltaValue(value,base,places){
 if(!Number.isFinite(value)||!Number.isFinite(base))return null;
 const difference=value-base;
 const tolerance=Math.pow(10,-places)*0.5;
 const stable=Math.abs(difference)<tolerance;
 return {difference,stable,text:stable?'≈ 0':(difference>0?'+':'−')+fmt(Math.abs(difference),places),direction:stable?'stable':difference>0?'up':'down'};
}
function deltaLine(label,value,base,m){
 const d=deltaValue(value,base,m.places);
 return `<span class="delta-line ${d?.direction||'unknown'}" title="${esc(label)}; diferença absoluta, não melhora ou piora"><span class="delta-name">${esc(label)}</span><span class="delta-number">${d?(d.stable?'':d.direction==='up'?'↑ ':'↓ ')+esc(d.text):'—'}</span></span>`;
}
function evolutionRow(m,cols,computed){
 const baseline=cols.length?timeValue(m,cols[0],computed[0]):null;
 return `<tr><th scope="row">${['k','glucose'].includes(m.key)?`<button type="button" data-info="${m.key}" class="table-parameter-link" title="Abrir ficha de ${m.key==='k'?'potássio':'glicemia'}">${esc(m.label)} <span aria-hidden="true">↗</span></button>`:esc(m.label)} <span class="unit">${esc(m.unit)}</span></th>${cols.map((r,i)=>{
  const value=timeValue(m,r,computed[i]);if(!Number.isFinite(value))return '<td><span class="missing">—</span></td>';
  const previous=i>0?timeValue(m,cols[i-1],computed[i-1]):null;
  const deltas=i===0?'<span class="baseline-label">Ponto de partida</span>':`<span class="cell-deltas">${deltaLine('Δ T0',value,baseline,m)}${deltaLine('Δ ant.',value,previous,m)}</span>`;
  return `<td><span class="compare-reading"><strong>${m.key==='ie'?fmtIE(value):fmt(value,m.places)}</strong>${deltas}</span></td>`;
 }).join('')}</tr>`;
}
const TEMPORAL_HIGHLIGHTS=['hb','lactate','aph','vso2','dco2','be','map','co','do2'];
function renderTemporalFocus(cols,computed,available){
 const node=document.getElementById('temporalFocus');if(!node)return;
 const index=cols.findIndex(r=>r.id===recordId);
 if(index<0){node.innerHTML='';return;}
 if(index===0){node.innerHTML='<p class="temporal-intro"><strong>T0 · ponto de partida.</strong> Selecione um registro posterior para comparar suas medidas com esta primeira coleta. T0 pode estar alterado.</p>';return;}
 const rows=TEMPORAL_HIGHLIGHTS.map(key=>available.find(m=>m.key===key)).filter(Boolean)
  .filter(m=>Number.isFinite(timeValue(m,cols[index],computed[index]))).slice(0,6);
 const tiles=rows.map(m=>{
  const value=timeValue(m,cols[index],computed[index]);
  const baseline=timeValue(m,cols[0],computed[0]);
  const previous=timeValue(m,cols[index-1],computed[index-1]);
  return `<article class="temporal-tile"><span class="temporal-label">${esc(m.label)}</span><strong class="temporal-reading">${fmt(value,m.places)} <small>${esc(m.unit)}</small></strong><div class="temporal-deltas">${deltaLine('Δ T0',value,baseline,m)}${deltaLine('Δ ant.',value,previous,m)}</div></article>`;
 }).join('');
 node.innerHTML=`<div class="temporal-heading"><strong>T${index} · registro selecionado</strong><span>${esc(cols[index].time?cols[index].time.replace('T',' '):'Sem data')} · diferenças absolutas</span></div>${tiles?`<div class="temporal-tiles">${tiles}</div>`:'<p class="temporal-intro">Preencha dados no registro selecionado para acompanhar suas mudanças.</p>'}`;
}
function renderEvolution(){const c=activeCase();if(!c)return;
 const cols=c.records.slice(0,50),computed=cols.map(r=>compute(r.values,c.profile));
 const available=EVOLUTION_METRICS.filter(m=>cols.some((r,i)=>Number.isFinite(timeValue(m,r,computed[i]))));
 const first=available.filter(m=>EVOLUTION_MAIN.includes(m.key));
 const other=available.filter(m=>!EVOLUTION_MAIN.includes(m.key));
 const head=`<tr><th>Parâmetro</th>${cols.map((r,i)=>`<th>${i===0?'T0 · inicial':'T'+i}${r.time?' · '+esc(r.time.replace('T',' ')):''}</th>`).join('')}</tr>`;
 document.getElementById('compareHead').innerHTML=head;
 document.getElementById('compareBody').innerHTML=first.map(m=>evolutionRow(m,cols,computed)).join('')||'<tr><td colspan="2">Preencha dados dos registros para comparar.</td></tr>';
 document.getElementById('compareExtraHead').innerHTML=head;
 document.getElementById('compareExtraBody').innerHTML=other.map(m=>evolutionRow(m,cols,computed)).join('')||'<tr><td>Sem índices adicionais.</td></tr>';
 document.getElementById('extraComparisonDetails').hidden=!other.length;
 renderTemporalFocus(cols,computed,available);
 const select=document.getElementById('chartMetric'),old=select.value;
 // Apenas variáveis longitudinais com duas ou mais medidas válidas aparecem no seletor.
 const CHART_KEYS=new Set(['aph','vph','apco2','vpco2','aso2','vso2','hb','hbv','be','bev','lactate','na','k','glucose','cl','map','hr','co','cvp','dco2','pf','cao2','cvo2','aav','eo2','ag','agcorr','sids','do2','dp','cstat']);
 const graphChoices=available.filter(m=>CHART_KEYS.has(m.key)&&cols.filter((r,i)=>Number.isFinite(timeValue(m,r,computed[i]))).length>=2);
 select.innerHTML=graphChoices.map(m=>`<option value="${m.key}" ${old===m.key?'selected':''}>${esc(m.label)}</option>`).join('');
 const chosen=graphChoices.find(m=>m.key===old)||graphChoices.find(m=>m.key==='lactate')||graphChoices[0];
 select.value=chosen?.key||'';
 const canvas=document.getElementById('chartBox'),refNote=document.getElementById('chartReference');
 if(!chosen){canvas.innerHTML='<div class="empty-chart">Preencha pelo menos dois registros com dados suficientes para visualizar uma variável evolutiva.</div>';refNote.textContent='';return;}
 const points=cols.map((r,i)=>({i,v:timeValue(chosen,r,computed[i])})).filter(p=>Number.isFinite(p.v));
 const baselineValue=timeValue(chosen,cols[0],computed[0]);
 refNote.textContent=Number.isFinite(baselineValue)?'Linha tracejada = valor de T0, não faixa de normalidade. Os pontos mostram medições do próprio paciente.':'T0 não contém esta medida; o gráfico mostra a evolução disponível, sem linha de base individual.';
 const w=720,h=205,left=55,right=20,top=20,bottom=42;
 let min=Math.min(...points.map(p=>p.v)),max=Math.max(...points.map(p=>p.v));const pad=Math.max((max-min)*.18,Math.pow(10,-chosen.places)*2,Math.abs(max)*.002);min-=pad;max+=pad;
 const x=i=>left+(w-left-right)*(cols.length===1?0:i/(cols.length-1));const y=v=>top+(h-top-bottom)*(max-v)/(max-min);
 const line=points.map(p=>`${x(p.i)},${y(p.v)}`).join(' ');
 const baseLine=Number.isFinite(baselineValue)?`<line x1="${left}" y1="${y(baselineValue)}" x2="${w-right}" y2="${y(baselineValue)}" stroke="#96aaba" stroke-dasharray="6 5" stroke-width="1.5"/>`:'';
 canvas.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolução de ${esc(chosen.label)}, linha de base individual T0"><g fill="none" stroke="#dfe7ee">${[0,1,2,3,4].map(i=>`<line x1="${left}" y1="${top+(h-top-bottom)*i/4}" x2="${w-right}" y2="${top+(h-top-bottom)*i/4}"/>`).join('')}</g>${baseLine}<g font-size="11" fill="#718799">${[0,1,2,3,4].map(i=>`<text x="${left-8}" y="${top+(h-top-bottom)*i/4+4}" text-anchor="end">${fmt(max-(max-min)*i/4,Math.max(1,chosen.places))}</text>`).join('')}${cols.map((r,i)=>`<text x="${x(i)}" y="${h-15}" text-anchor="middle">T${i}</text>`).join('')}</g><polyline points="${line}" fill="none" stroke="#287da6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${points.map(p=>{const d=deltaValue(p.v,baselineValue,chosen.places);return `<circle cx="${x(p.i)}" cy="${y(p.v)}" r="4.5" fill="#287da6"><title>T${p.i}: ${fmt(p.v,chosen.places)} ${esc(chosen.unit)}${d?' · Δ T0 '+d.text:''}</title></circle>`;}).join('')}</svg>`;
}
function info(key){const definition=definitions[key];if(!definition)return;const [title,description,equation,limit]=definition;document.getElementById('dialogTitle').textContent=title;const node=document.getElementById('dialogContent');node.replaceChildren();if(key==='k'||key==='glucose'||key==='ph'||key==='integracao'||key==='pf'||key==='dco2'||key==='cao2'||['cvo2','aav','eo2'].includes(key)||key==='dph'||key==='phest'||['hco3a','hco3v','hplusA','hplusV','sids','sida','side','sig','pco2exp','hco3exp'].includes(key)||['bea','bev','sbea','sbev'].includes(key)){
 const bar=document.createElement('div');bar.className='pf-tabs';bar.id='pfTabBar';bar.dataset.scienceKind=key==='k'?'k':key==='glucose'?'glucose':key==='ph'?'ph':['hco3a','hco3v','hplusA','hplusV'].includes(key)?'hh':(['sids','sida','side','sig'].includes(key)?'stewart':(['pco2exp','hco3exp'].includes(key)?'compensation':(['bea','bev','sbea','sbev'].includes(key)?'baseexcess':key)));bar.setAttribute('role','tablist');for(const t of (['k','glucose'].includes(key)?pfTabs.map(t=>({...t,label:t.id==='formula'?'Cálculos':t.id==='limites'?'Cuidados':t.label})):pfTabs)){const button=document.createElement('button');button.type='button';button.textContent=t.label;button.dataset.pfTab=t.id;button.setAttribute('role','tab');bar.appendChild(button);}const content=document.createElement('div');content.id='pfTabContent';content.className='pf-tab-content';node.append(bar,content);renderScienceTab('entender');
 }else{const p=document.createElement('p');p.textContent=description;node.appendChild(p);const eq=document.createElement('div');eq.className='equation';eq.textContent=equation;node.appendChild(eq);const r=currentRecord(),c=activeCase(),result=r&&c?compute(r.values,c.profile)[key]:null;const show=document.createElement('p');show.textContent=`Resultado do registro: ${key==='ie'&&Number.isFinite(result)?fmtIE(result):fmt(result,2)} ${allMetrics.find(m=>m[0]===key)?.[2]||''}`;node.appendChild(show);const note=document.createElement('p');note.textContent=limit;node.appendChild(note);}document.getElementById('infoDialog').showModal();}

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
function hhPanel(tab){
 const d=currentRecord()?.values||{},r=compute(d,activeCase()?.profile||{});
 const arterial=Number.isFinite(r.hco3a)?`pH arterial ${fmt(d.aph,2)} · PaCO₂ ${fmt(d.apco2,1)} mmHg → HCO₃⁻ ${fmt(r.hco3a,1)} mmol/L`:'Dados arteriais incompletos';
 const venous=Number.isFinite(r.hco3v)?`pH venoso ${fmt(d.vph,2)} · PcvCO₂ ${fmt(d.vpco2,1)} mmHg → HCO₃⁻ ${fmt(r.hco3v,1)} mmol/L`:'Dados venosos incompletos';
 if(tab==='entender')return `<h3>O sistema bicarbonato–CO₂</h3><p>Henderson–Hasselbalch descreve o equilíbrio entre bicarbonato e CO₂ dissolvido no plasma. O pH depende da <strong>relação</strong> entre essas grandezas, não apenas do bicarbonato isolado.</p><div class="concept-note">A equação não compete com Stewart: ambas descrevem o mesmo sistema físico-químico, sob diferentes escolhas de variáveis explicativas.</div><p>Na gasometria, o pH e a PCO₂ costumam ser medidos; o bicarbonato apresentado pelo aparelho geralmente é <strong>calculado</strong> a partir deles.</p>`;
 if(tab==='formula')return `<h3>Equação a 37 °C</h3><div class="equation equation-large">pH = 6,1 + log₁₀ { [HCO₃⁻] / (0,0301 × PCO₂) }</div><div class="equation">[HCO₃⁻] = 0,0301 × PCO₂ × 10^(pH−6,1)</div><p>PCO₂ em mmHg; HCO₃⁻ em mmol/L; 0,0301 é a solubilidade aparente aproximada de CO₂ no plasma.</p><div class="worked-example"><span class="eyebrow">REGISTRO ATUAL</span><p>${arterial}</p><p>${venous}</p></div>`;
 if(tab==='limites')return `<h3>Limitações e amostra utilizada</h3><ul class="science-list"><li>O bicarbonato calculado pela gasometria não é prova independente de uma alteração metabólica.</li><li>A relação usa constantes aproximadas para temperatura corporal habitual.</li><li>Amostras arterial e venosa central podem ter pH e PCO₂ diferentes, sobretudo em distúrbios circulatórios.</li><li>Não converta automaticamente pH venoso em arterial somando uma diferença fixa.</li><li>Henderson–Hasselbalch descreve a relação química; não determina, isoladamente, a causa da acidose.</li></ul>`;
 return `<h3>Referências</h3><ol class="science-list"><li><em>Fundamentals of Arterial Blood Gas Interpretation</em> (2022), revisão da equação de Henderson–Hasselbalch e método de medição de gasometria.</li><li><em>The Stewart Approach — One Clinician's Perspective</em> (2009), conexão entre bicarbonato e modelo físico-químico.</li></ol><p>Links: <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9416819/" target="_blank" rel="noopener noreferrer">gasometria</a> e <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2702213/" target="_blank" rel="noopener noreferrer">Stewart</a>.</p>`;
}
function phPanel(tab){
 const d=currentRecord()?.values||{},pHa=val(d,'aph',6,8),pHv=val(d,'vph',6,8),a=pHa===null?null:Math.pow(10,9-pHa),v=pHv===null?null:Math.pow(10,9-pHv);
 const example=`<div class="worked-example"><span class="eyebrow">ESCALA LOGARÍTMICA · REGISTRO ATUAL</span><p>pH arterial: <strong>${fmt(pHa,2)}</strong> → [H⁺] aproximada: <strong>${fmt(a,1)} nmol/L</strong></p><p>pH venoso central: <strong>${fmt(pHv,2)}</strong> → [H⁺] aproximada: <strong>${fmt(v,1)} nmol/L</strong></p><p class="subtle">O H⁺ é explicado aqui, sem cartão nem gráfico independente.</p></div>`;
 if(tab==='entender')return `<h3>pH: uma escala logarítmica</h3><p>O pH descreve a <strong>atividade dos íons hidrogênio</strong> em solução. Reduções de pH representam aumento de atividade ácida; um decréscimo de 0,30 unidade corresponde a aproximadamente <strong>duas vezes</strong> mais atividade de H⁺, e não a um aumento linear.</p><p>pH 7,40 corresponde a cerca de 40 nmol/L de H⁺; pH 7,10, a cerca de 79 nmol/L. Esta é uma conversão didática, não um segundo marcador independente.</p>${example}`;
 if(tab==='formula')return `<h3>Definição e Henderson–Hasselbalch</h3><div class="equation equation-large">pH = −log₁₀(aH⁺)</div><div class="equation">[H⁺] aproximada (nmol/L) = 10^(9 − pH)</div><div class="equation">pH ≈ 6,1 + log₁₀ {[HCO₃⁻] / (0,0301 × PCO₂)}</div><p>A concentração é aproximada a partir da atividade; a equação bicarbonato–CO₂ descreve o mesmo equilíbrio. No gasômetro, pH e PCO₂ são usualmente medidos, e HCO₃⁻ é frequentemente calculado.</p>${example}`;
 if(tab==='limites')return `<h3>O que o pH não determina sozinho</h3><ul class="science-list"><li>O pH não informa o mecanismo acidobásico sem PCO₂, HCO₃⁻, BE e contexto.</li><li>pH normal pode coexistir com distúrbios mistos importantes e compensações.</li><li>Atividade química e concentração não são rigorosamente idênticas; a conversão de H⁺ é uma aproximação.</li><li>Valores arteriais e venosos centrais diferem e não devem ser confundidos, especialmente em choque.</li><li>As faixas usuais são orientativas para adultos, não gatilhos automáticos de intervenção.</li></ul>`;
 return `<h3>Referências</h3><ol class="science-list"><li><em>Miller's Anesthesia</em>, fisiologia do equilíbrio acidobásico.</li><li><em>Fundamentals of Arterial Blood Gas Interpretation</em>. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9416819/" target="_blank" rel="noopener noreferrer">Revisão de gasometria e Henderson–Hasselbalch</a>.</li><li><em>Clinical review: Reunification of acid–base physiology</em>. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC1297616/" target="_blank" rel="noopener noreferrer">Kellum, 2005</a>.</li></ol>`;
}
function stewartPanel(tab){
 const d=currentRecord()?.values||{},r=compute(d,activeCase()?.profile||{});
 if(tab==='entender')return `<h3>Stewart: as três variáveis independentes</h3><p>No modelo físico-químico, o pH é determinado pela <strong>PCO₂</strong>, pela <strong>diferença de íons fortes (SID)</strong> e pela quantidade total de <strong>ácidos fracos não voláteis (Aₜₒₜ)</strong>, principalmente albumina e fosfato.</p><p>O bicarbonato resulta do equilíbrio químico e da eletroneutralidade; não é uma variável independente nesse modelo.</p><div class="concept-note">Reduzir a SID, mantidas as demais condições, desloca o sistema na direção acidificante. Reduzir albumina tende a exercer efeito alcalinizante. Isso descreve efeitos físico-químicos, não um diagnóstico automático.</div>`;
 if(tab==='formula')return `<h3>Eletroneutralidade e equações</h3><div class="equation">SID simplificado = Na⁺ + K⁺ − Cl⁻ − lactato⁻</div><div class="equation">SIDa = Na⁺ + K⁺ + 2×[Ca²⁺] + 2×[Mg²⁺] − Cl⁻ − lactato⁻</div><div class="equation">SIDe ≈ HCO₃⁻(H–H) + Alb(g/L)×(0,123×pH−0,631) + Pi(mmol/L)×(0,309×pH−0,469)</div><div class="equation">SIG = SIDa − SIDe</div><p>Cálcio ionizado e magnésio devem ser informados em mmol/L e são convertidos para cargas equivalentes. Albumina é digitada em g/dL e convertida internamente para g/L.</p><div class="worked-example"><span class="eyebrow">REGISTRO ATUAL</span><p>SID simplificado: <strong>${fmt(r.sids,1)} mEq/L</strong></p><p>SIDa: <strong>${fmt(r.sida,1)} mEq/L</strong></p><p>SIDe: <strong>${fmt(r.side,1)} mEq/L</strong></p><p>SIG: <strong>${fmt(r.sig,1)} mEq/L</strong></p></div>`;
 if(tab==='limites')return `<h3>Premissas e armadilhas</h3><ul class="science-list"><li>SID simplificado não equivale a SIDa completo: faltam íons divalentes e outros íons fortes.</li><li>O SIG é estimativa dos íons fortes não mensurados; não mede uma substância específica.</li><li>A equação de Figge é uma aproximação em condições fisiológicas: extremos de pH e erros laboratoriais reduzem a confiabilidade.</li><li>Use resultados de amostras temporalmente comparáveis. O cálculo de SIDe/SIG aqui utiliza pH e PCO₂ <strong>arteriais</strong>.</li><li>As unidades importam: albumina g/dL→g/L; Ca²⁺ e Mg²⁺ em mmol/L→mEq/L.</li></ul>`;
 return `<h3>Referências</h3><ol class="science-list"><li><em>The Stewart Approach — One Clinician's Perspective</em>, Critical Care (2009), equações de SIDe/Figge.</li><li><em>Bench-to-bedside review: Fundamental principles of acid-base physiology</em>, Critical Care (2005), eletroneutralidade e SID/SIG.</li></ol><p>Links: <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2702213/" target="_blank" rel="noopener noreferrer">Stewart</a> e <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC1175910/" target="_blank" rel="noopener noreferrer">princípios físico-químicos</a>.</p>`;
}
function compensationPanel(tab){
 const d=currentRecord()?.values||{},r=compute(d,activeCase()?.profile||{}),c=compensation(d,{hco3a:r.hco3a,hco3v:r.hco3v});
 if(tab==='entender')return `<h3>Compensação não é um segundo diagnóstico</h3><p>Em um distúrbio metabólico primário, a ventilação modifica a PaCO₂. Em um distúrbio respiratório primário, o rim modifica a concentração de bicarbonato ao longo do tempo.</p><p>Primeiro escolha a hipótese do distúrbio primário. A fórmula apenas descreve a <strong>resposta compensatória esperada num distúrbio simples</strong>. Fora da faixa, considere uma alteração associada, sem concluir automaticamente qual seja.</p>`;
 if(tab==='formula')return `<h3>Fórmulas de compensação</h3><div class="equation">Acidose metabólica (Winter): PaCO₂ ≈ 1,5 × HCO₃⁻ + 8 (±2)</div><div class="equation">Alcalose metabólica: PaCO₂ ≈ 40 + 0,7 × (HCO₃⁻ − 24) (±5)</div><p>Distúrbios respiratórios: para cada 10 mmHg de PaCO₂ acima ou abaixo de 40, a variação compensatória do HCO₃⁻ é aproximada:</p><ul class="science-list"><li>Acidose respiratória aguda: +1 a +2 mmol/L</li><li>Acidose respiratória crônica: +3 a +4 mmol/L</li><li>Alcalose respiratória aguda: −1 a −2 mmol/L</li><li>Alcalose respiratória crônica: −4 a −5 mmol/L</li></ul><div class="worked-example"><span class="eyebrow">REGISTRO ATUAL</span><p>${c?.error?esc(c.error):c?`${esc(c.formula)}<br>Resultado: ${fmt(c.middle,1)} (faixa ${fmt(c.low,1)}–${fmt(c.high,1)})`:'Selecione o distúrbio no módulo acidobásico.'}</p></div>`;
 if(tab==='limites')return `<h3>Limitações</h3><ul class="science-list"><li>Seleção do distúrbio é feita pelo estudante, não diagnosticada pela calculadora.</li><li>Amostra venosa central pode fornecer bicarbonato estimado, mas <strong>PcvCO₂ não é PaCO₂</strong>.</li><li>As regras são aproximações; ventilação mecânica, tempo de evolução e função renal alteram a resposta.</li><li>Valores observados acima ou abaixo da faixa podem sugerir distúrbio misto, mas não estabelecem diagnóstico isoladamente.</li><li>A fórmula de Winter é específica para acidose metabólica, não para qualquer acidose.</li></ul>`;
 return `<h3>Referências</h3><ol class="science-list"><li><em>Merck Manual Professional</em>. Acid-Base Disorders, tabela Primary Changes and Compensations in Simple Acid-Base Disorders.</li><li><em>Guide to the Essentials in Emergency Medicine</em>, capítulo Acid-Base Emergencies, tabela de compensações.</li></ol><p><a href="https://www.merckmanuals.com/professional/multimedia/table/primary-changes-and-compensations-in-simple-acid-base-disorders" target="_blank" rel="noopener noreferrer">Tabela de compensação (Merck Manual)</a></p>`;
}
// Ficha científica 003: CaO₂. Síntese original baseada em Miller, Barash, Janotka & Ostadal
// e literatura de transporte de oxigênio. Não inferir saturação fracional de SpO₂.
function cao2Panel(tab){
 const d=currentRecord()?.values||{};
 const hb=val(d,'hb',0.1,30),sa=val(d,'aso2',0,100),pa=val(d,'apo2',0,1000);
 const available=maybe(hb,sa,pa);
 const bound=available?1.34*hb*sa/100:null;
 const dissolved=available?0.0031*pa:null;
 const total=available?bound+dissolved:null;
 const fraction=total!==null&&total>0?dissolved/total*100:null;
 const co=val(d,'co',0.01,40);
 const current=esc(currentRecord()?.note||currentRecord()?.time||'REGISTRO ATUAL');
 if(tab==='entender')return `
  <h3>O que significa o conteúdo arterial de oxigênio?</h3>
  <p>O <strong>CaO₂</strong> quantifica o volume de O₂ em cada <strong>decilitro de sangue arterial</strong> (mL O₂/dL). Somamos duas frações: O₂ ligado à hemoglobina e O₂ dissolvido na fase líquida, determinado pela pressão parcial.</p>
  <div class="concept-note"><strong>Três grandezas diferentes:</strong> a <strong>PaO₂</strong> expressa a pressão parcial do oxigênio dissolvido; a <strong>SaO₂</strong> expressa a saturação de O₂ da hemoglobina segundo o método de medida; o <strong>CaO₂</strong> expressa quanto O₂ o sangue contém. <strong>SpO₂</strong> é uma estimativa periférica de saturação, não de conteúdo.</div>
  <h3>Por que uma gasometria pode parecer normal na anemia?</h3>
  <p>Uma PaO₂ de 100 mmHg e SaO₂ de 98% podem coexistir tanto com Hb de 15 quanto de 7 g/dL. A quantidade de O₂ transportada, porém, será muito diferente, porque a hemoglobina carrega a maior parcela do O₂.</p>
  <div class="equation">Hb 15 g/dL: CaO₂ = 20,01 mL/dL<br>Hb 7 g/dL: CaO₂ = 9,50 mL/dL<br>Em ambos: PaO₂ 100 mmHg e SaO₂ 98%.</div>
  <h3>Curva de dissociação e afinidade</h3>
  <p>A relação PaO₂–SaO₂ é sigmoide: apresenta trecho íngreme em PO₂ baixa e platô em PO₂ mais alta. A P₅₀ habitual é próxima de <strong>26–27 mmHg</strong>. Acidose, CO₂, temperatura e 2,3-DPG elevados tendem a deslocar a curva para a direita (menor afinidade); alterações opostas, para a esquerda. Isso modifica a relação entre pressão e saturação, mas <strong>não determina sozinho o CaO₂ sem Hb e SaO₂</strong>.</p>
  <h3>Conteúdo não é oferta</h3>
  <div class="equation">DO₂ (mL/min) = DC (L/min) × CaO₂ (mL/dL) × 10 dL/L</div>
  <p>O CaO₂ não incorpora fluxo sanguíneo. Mesmo DO₂ adequado globalmente não garante perfusão microcirculatória ou utilização celular de O₂.</p>`;
 if(tab==='formula')return `
  <h3>Equação, constantes e unidades</h3>
  <div class="equation equation-large">CaO₂ = 1,34 × Hb × (SaO₂/100) + 0,0031 × PaO₂</div>
  <ul class="science-list">
   <li><strong>Hb:</strong> g/dL; <strong>SaO₂:</strong> percentual convertido em fração; <strong>PaO₂:</strong> mmHg.</li>
   <li><strong>1,34 mL O₂/g Hb:</strong> coeficiente empírico adotado nesta plataforma. A capacidade teórica estequiométrica fica próxima de 1,39; publicações podem utilizar 1,38. Esses coeficientes são convenções/modelos, e sua escolha não corrige, isoladamente, uma saturação inadequada.</li>
   <li><strong>0,0031 mL O₂/(dL·mmHg):</strong> coeficiente aproximado de solubilidade do O₂ a 37 °C, segundo a lei de Henry.</li>
  </ul>
  <div class="worked-example"><span class="eyebrow">CÁLCULO DINÂMICO · ${current}</span>
   <p>Hb = <strong>${fmt(hb,2)} g/dL</strong> · SaO₂ = <strong>${fmt(sa,1)}%</strong> · PaO₂ = <strong>${fmt(pa,1)} mmHg</strong></p>
   ${available?`<p>Ligado à Hb: 1,34 × ${fmt(hb,2)} × ${fmt(sa/100,3)} = <strong>${fmt(bound,3)} mL/dL</strong></p>
   <p>Dissolvido: 0,0031 × ${fmt(pa,1)} = <strong>${fmt(dissolved,3)} mL/dL</strong></p>
   <div class="worked-result">CaO₂ = ${fmt(bound,3)} + ${fmt(dissolved,3)} = <strong>${fmt(total,2)} mL O₂/dL</strong></div>
   <p>Participação dissolvida: ${fmt(fraction,2)}% do CaO₂ calculado.</p>
   ${co!==null?`<p>Com DC = ${fmt(co,2)} L/min, DO₂ calculado = <strong>${fmt(10*co*total,1)} mL O₂/min</strong> (não mede perfusão tecidual).</p>`:''}`:'<p>Preencha Hb arterial, SaO₂ e PaO₂ para demonstrar o cálculo com este registro.</p>'}
  </div>
  <h3>Hiperóxia e limite do O₂ dissolvido</h3>
  <p>Com Hb 15 g/dL e SaO₂ 100%, aumentar a PaO₂ de 100 para 500 mmHg acrescenta <strong>1,24 mL O₂/dL</strong> pela parcela dissolvida. Não confunda aumento de PaO₂ com aumento proporcional de conteúdo.</p>`;
 if(tab==='limites')return `
  <h3>O que o CaO₂ calculado não revela</h3>
  <ul class="science-list">
   <li><strong>Origem da saturação:</strong> co-oximetria mede espécies de Hb; alguns gasômetros estimam SaO₂ por curva a partir de PO₂ e condições assumidas. SpO₂ não é medida sanguínea direta de CaO₂.</li>
   <li><strong>Saturação funcional vs. oxi-hemoglobina fracional:</strong> a funcional usa HbO₂/(HbO₂ + HHb); a fracional usa HbO₂/hemoglobina total, incluindo COHb e MetHb. O valor informado pelo equipamento deve ser identificado. Se houver dis-hemoglobinas relevantes, a fórmula convencional com saturação funcional pode superestimar o conteúdo; utilizar co-oximetria adequada e um cálculo coerente com as espécies medidas.</li>
   <li><strong>COHb e MetHb:</strong> podem causar leituras de SpO₂ enganosas. Em metemoglobinemia significativa, muitos oxímetros de dois comprimentos de onda tendem a valores próximos a 85%. Em intoxicação por CO, a PaO₂ pode permanecer normal apesar da menor capacidade efetiva de transporte.</li>
   <li><strong>Constantes aproximadas:</strong> 1,34 e 0,0031 são coeficientes convencionais; não constituem uma correção personalizada de dis-hemoglobinemias, composição sanguínea ou temperatura.</li>
   <li><strong>Curva de dissociação:</strong> pH, PaCO₂, temperatura, 2,3-DPG e variantes da hemoglobina influenciam a relação entre PaO₂ e saturação. Não deduzir SaO₂ confiável somente da PaO₂ em situações especiais.</li>
   <li><strong>Limite clínico:</strong> CaO₂ não mede DC, VO₂, perfusão tecidual ou necessidade transfusional. DO₂ depende de DC, e a utilização tecidual depende de outros mecanismos.</li>
   <li><strong>Causa da hipoxemia:</strong> PaO₂ e SaO₂ baixas não provam, por si só, shunt; distúrbios V/Q, hipoventilação e outros mecanismos exigem avaliação específica.</li>
  </ul>
  <div class="concept-note">Em uso didático, confirme se a saturação inserida é medida por co-oximetria, calculada ou proveniente da oximetria de pulso. O formulário atual não discrimina automaticamente essas origens.</div>`;
 return `
  <h3>Fontes para estudo e aprofundamento</h3>
  <ol class="science-list">
   <li><em>Miller's Anesthesia</em> — capítulos de fisiologia respiratória e de monitorização; explorar transporte de O₂, hemoglobina e a curva de dissociação. Confirmar edição e paginação dos exemplares consultados.</li>
   <li><em>Barash — Clinical Anesthesia</em>, 9ª edição — capítulos de função respiratória e técnicas de monitorização; consultar co-oximetria, oximetria e trocas gasosas.</li>
   <li>Janotka M, Ostadal P. <em>Biochemical markers for clinical monitoring of tissue perfusion</em>. <em>Molecular and Cellular Biochemistry</em>. 2021;476:1313–1326. DOI: 10.1007/s11010-020-04019-8. Apresenta a relação entre CaO₂ e DO₂, com coeficiente de Hb 1,38.</li>
   <li><em>Oxygen Saturation and LOINC</em> — distinção entre saturação funcional e oxi-hemoglobina fracional; e <em>Oxygen Transport</em> — fundamentos de capacidade da hemoglobina.</li>
  </ol>
  <p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7921020/" target="_blank" rel="noopener noreferrer">Janotka &amp; Ostadal (2021)</a> · <a href="https://loinc.org/kb/users-guide/loinc-technical-briefs/oxygen-saturation-and-loinc" target="_blank" rel="noopener noreferrer">LOINC — saturação</a> · <a href="https://www.ncbi.nlm.nih.gov/books/NBK54103/" target="_blank" rel="noopener noreferrer">NCBI — transporte de O₂</a></p>
  <p class="subtle">Texto didático original. Não reproduz passagens extensas dos livros. Não atribuímos páginas ou figuras não conferidas. A ficha não foi validada para orientar decisões assistenciais.</p>`;
}

function dphPanel(tab){
 const d=currentRecord()?.values||{};
 const pHa=val(d,'aph',6,8),pHcv=val(d,'vph',6,8);
 const paired=maybe(pHa,pHcv),onlyVenous=pHa===null&&pHcv!==null;
 const eligible=onlyVenous&&pHcv>=7.20&&pHcv<=7.60;
 const actual=paired?pHa-pHcv:null;
 const hA=pHa===null?null:Math.pow(10,9-pHa),hV=pHcv===null?null:Math.pow(10,9-pHcv);
 if(tab==='entender')return `
  <h3>pH arterial e venoso não são idênticos</h3>
  <p>O sangue venoso central reflete a adição de CO₂ pela atividade metabólica e a composição do sangue que retorna de diferentes territórios. O sangue arterial e o venoso central têm, normalmente, pH próximos, mas distintos. A diferença não é uma constante fisiológica.</p>
  <div class="concept-note"><strong>Dois resultados diferentes:</strong> com as duas gasometrias, calculamos o <strong>ΔpH medido</strong>. Quando há apenas pH venoso central, podemos oferecer uma <strong>aproximação populacional do pH arterial</strong>, que não equivale a medir o sangue arterial.</div>
  <p>Segundo o UpToDate (2026), em condições habituais o pH venoso <strong>central</strong> costuma ser aproximadamente 0,03–0,05 unidade inferior ao arterial. Esse intervalo descreve diferenças típicas, e não a incerteza total aplicável a cada indivíduo.</p>
  <p>Por isso, a gasometria venosa ajuda na discussão acidobásica, mas não substitui a arterial para avaliar oxigenação nem para obter PaCO₂ precisa em pacientes instáveis.</p>`;
 if(tab==='formula')return `
  <h3>1. Se as duas amostras estão disponíveis</h3>
  <div class="equation equation-large">ΔpH = pH arterial medido − pH venoso central medido</div>
  <p>O pH é logarítmico: uma diferença de 0,03 unidade não equivale a uma diferença de 0,03 nmol/L de H⁺. Para discutir a concentração aparente de H⁺: [H⁺] ≈ 10^(9−pH), em nmol/L.</p>
  <div class="worked-example"><span class="eyebrow">GASOMETRIA PAREADA · REGISTRO ATUAL</span>
   ${paired?`<p>pHa ${fmt(pHa,2)} − pHcv ${fmt(pHcv,2)} = <strong>ΔpH ${fmt(actual,2)}</strong></p><p>[H⁺] arterial ≈ ${fmt(hA,1)} nmol/L · [H⁺] venoso central ≈ ${fmt(hV,1)} nmol/L</p>`:'<p>Não há duas medidas de pH válidas neste registro. O ΔpH medido permanece indisponível.</p>'}
  </div>
  <h3>2. Se só há gasometria venosa central</h3>
  <div class="equation">pH arterial aproximado ≈ pHcv + 0,03 a 0,05</div>
  <div class="worked-example"><span class="eyebrow">APROXIMAÇÃO DIDÁTICA · REGISTRO ATUAL</span>
   ${eligible?`<p>pHcv = ${fmt(pHcv,2)} → pH arterial aproximado: <strong>${fmt(pHcv+0.03,2)} a ${fmt(pHcv+0.05,2)}</strong></p><p>O cartão de resultado mostra o ponto central <strong>${fmt(pHcv+0.04,2)}</strong>, identificado como <strong>estimativa</strong>; a faixa inteira não constitui intervalo de confiança ou previsão individual.</p>`:onlyVenous?'<p>O pH venoso está em faixa extrema (&lt;7,20 ou &gt;7,60); não mostramos conversão numérica por segurança didática.</p>':'<p>Para demonstrar essa aproximação, deixe o pH arterial vazio e informe apenas o pH venoso central.</p>'}
  </div>
  <p><strong>Nota:</strong> nenhuma estimativa de pH arterial é utilizada como entrada nos cálculos de HCO₃⁻ arterial, compensação, SIDe/SIG, P/F ou nos demais índices.</p>`;
 if(tab==='limites')return `
  <h3>Limitações da extrapolação venosa → arterial</h3>
  <ul class="science-list">
   <li><strong>Variabilidade individual:</strong> +0,03 a +0,05 é uma diferença habitual entre médias/populações, não um intervalo de concordância de 95% para pacientes individuais. Não autoriza arredondar e tratar como medida.</li>
   <li><strong>Choque e baixo fluxo:</strong> as diferenças arteriovenosas de pH e PCO₂ podem se ampliar de maneira imprevisível na insuficiência circulatória, mesmo que o pH venoso isolado esteja entre 7,20 e 7,60. A interface não detecta choque.</li>
   <li><strong>Acidobase extrema:</strong> o UpToDate recomenda cautela com uso substitutivo de gasometria venosa em pH &lt;7,20 ou &gt;7,60. A calculadora oculta a estimativa numérica nessa faixa, mas isso não valida os demais casos.</li>
   <li><strong>Local da amostra:</strong> a referência de +0,03 a +0,05 é para sangue venoso central; amostras periféricas têm outras diferenças e não devem ser colocadas neste campo sem ressalva.</li>
   <li><strong>Oximetria:</strong> não existe conversão confiável de PcvO₂/ScvO₂ para PaO₂/SaO₂. Uma gasometria venosa não fornece relação P/F arterial nem gradiente A–a.</li>
   <li><strong>Henderson–Hasselbalch:</strong> o bicarbonato venoso pode ser calculado usando pHcv e PcvCO₂ reais, sem inventar pH arterial. O mesmo cuidado vale para PaCO₂ e para as compensações acidobásicas.</li>
  </ul>
  <div class="concept-note">A faixa estimada é apenas recurso didático. Se a resposta exigir exatidão arterial, use uma amostra arterial real e considere o estado circulatório.</div>`;
 return `
  <h3>Fontes</h3>
  <ol class="science-list">
   <li>Theodore AC. <em>Venous blood gases and alternatives to arterial carbon dioxide measurement in adults</em>. UpToDate. Última atualização: 12/06/2026. Seções "Interpretation: Venous to arterial conversion estimates", tabela 2 (página 13 no documento fornecido) e "Clinical uses". Fonte fornecida pelo usuário e utilizada em síntese, sem reproduzir integralmente o texto protegido.</li>
   <li>Middleton P, Kelly AM, Brown J, Robertson M. <em>Agreement between arterial and central venous values for pH, bicarbonate, base excess, and lactate</em>. Emerg Med J. 2006;23:622–624.</li>
   <li>Walkey AJ, Farber HW, O'Donnell C, et al. <em>The accuracy of the central venous blood gas for acid-base monitoring</em>. J Intensive Care Med. 2010;25:104–110.</li>
   <li>Adrogué HJ, Rashad MN, Gorin AB, et al. <em>Assessing acid-base status in circulatory failure. Differences between arterial and central venous blood</em>. N Engl J Med. 1989;320:1312–1316.</li>
  </ol>
  <p>As referências de artigos são as citadas no UpToDate enviado. A ficha é educacional e os detalhes originais devem ser consultados antes de inferir aplicabilidade a uma população específica.</p>`;
}

// Ficha 004: conteúdo venoso central e índices derivados. Descrição original,
// baseada em Miller/Barash, Janotka & Ostadal (2021) e Li et al. (2026).
// IMPORTANTÍSSIMO: ScvO₂ e SvO₂ não são intercambiáveis individualmente.
function oxygenVenousPanel(tab,kind){
 const d=currentRecord()?.values||{};
 const hb=val(d,'hb',0.1,30),hbv=val(d,'hbv',0.1,30);
 const sa=val(d,'aso2',0,100),sv=val(d,'vso2',0,100);
 const pa=val(d,'apo2',0,1000),pv=val(d,'vpo2',0,1000);
 const useHb=hbv??hb;
 const arterial=maybe(hb,sa,pa);
 const venous=maybe(useHb,sv,pv);
 const ca=arterial?1.34*hb*sa/100+0.0031*pa:null;
 const cv=venous?1.34*useHb*sv/100+0.0031*pv:null;
 const boundV=venous?1.34*useHb*sv/100:null;
 const dissV=venous?0.0031*pv:null;
 const delta=maybe(ca,cv)?ca-cv:null;
 const extraction=maybe(ca,delta)&&ca>0?100*delta/ca:null;
 const sameHb=hbv===null||(hb!==null&&Math.abs(hbv-hb)<0.000001);
 const satApprox=maybe(sa,sv)&&sa>0&&sameHb?100*(sa-sv)/sa:null;
 const source=hbv!==null?'Hb venosa informada':'Hb arterial usada como aproximação da Hb venosa';
 const current=esc(currentRecord()?.note||currentRecord()?.time||'REGISTRO ATUAL');
 const heading=kind==='cvo2'?'Conteúdo venoso central':kind==='aav'?'Diferença de conteúdos':'Extração central estimada';
 if(tab==='entender'){
  const intro=kind==='cvo2'?
    `<h3>O que resta de O₂ no sangue venoso central?</h3><p>O <strong>CcvO₂</strong> informa a quantidade de oxigênio em cada decilitro de sangue venoso central. A ScvO₂ indica a porcentagem de hemoglobina saturada; o conteúdo incorpora também a <strong>quantidade de hemoglobina</strong> e o O₂ dissolvido.</p><div class="concept-note"><strong>Exemplo:</strong> com PcvO₂ de 40 mmHg, Hb de 10 g/dL e ScvO₂ de 70%, CcvO₂ ≈ <strong>9,50 mL/dL</strong>. Se Hb cair para 7 g/dL e ScvO₂ subir para 80%, CcvO₂ cai para <strong>7,63 mL/dL</strong>. Saturação maior não significa necessariamente conteúdo maior.</div>`:
   kind==='aav'?
    `<h3>O que representa C(a−cv)O₂?</h3><p>É a diferença entre a quantidade de O₂ no sangue arterial e no sangue venoso <strong>central</strong> coletado em momento comparável. A diferença é uma janela para o balanço entre transporte e extração dos territórios amostrados, não uma medição direta do consumo global.</p><div class="concept-note">A diferença envolvendo sangue da artéria pulmonar (C[a−v̄]O₂) seria necessária para a aplicação sistêmica clássica do princípio de Fick. C(a−cv)O₂ <strong>não a substitui</strong>.</div>`:
    `<h3>Quanto do conteúdo arterial não aparece no sangue venoso central?</h3><p>A <strong>extração central estimada</strong> é uma razão matemática: C(a−cv)O₂ dividido pelo CaO₂. Ela pode ajudar a comparar registros seriados com coleta semelhante, mas não mede, por si só, o consumo tecidual de O₂ nem a extração global do organismo.</p><div class="concept-note">Quando a Hb é igual nas duas amostras e a parcela dissolvida é desprezível, a razão é próxima de <strong>(SaO₂ − ScvO₂)/SaO₂</strong>. Na anemia ou na hiperóxia, essa simplificação pode perder precisão.</div>`;
  return `${intro}<h3>Por que a coleta venosa importa?</h3><p>Amostras venosas centrais provenientes da VCS ou da junção cavoatrial representam principalmente a drenagem da parte superior do corpo. Dependendo da posição da ponta e do local de aspiração, pode haver mistura com sangue da VCI e do seio coronariano. Não se deve tratar essas amostras como sangue venoso <strong>misto</strong> da artéria pulmonar.</p><p>A saturação venosa pode ser alterada por oferta arterial, concentração de Hb, distribuição regional de fluxo e consumo metabólico. Sedação, anestesia, anemia, mudança de débito e hipoxemia podem agir em direções diferentes.</p><p>Na metanálise perioperatória de Li et al. (2026), ScvO₂ e SvO₂ apresentaram correlação, mas <strong>não foram intercambiáveis em pacientes individuais</strong>.</p>`;
 }
 if(tab==='formula'){
  const common=`<p>Unidades: Hb em g/dL; saturações em % convertidas em fração; PO₂ em mmHg; conteúdos em <strong>mL O₂/dL</strong>. Coeficientes aproximados: 1,34 mL O₂/g Hb e 0,0031 mL O₂/(dL·mmHg).</p>`;
  if(kind==='cvo2')return `<h3>Equação do conteúdo venoso central</h3><div class="equation equation-large">CcvO₂ = 1,34 × Hbᵥ × (ScvO₂/100) + 0,0031 × PcvO₂</div>${common}
   <div class="worked-example"><span class="eyebrow">CÁLCULO DINÂMICO · ${current}</span>
    <p>Hb utilizada: <strong>${fmt(useHb,2)} g/dL</strong> · ScvO₂: <strong>${fmt(sv,1)}%</strong> · PcvO₂: <strong>${fmt(pv,1)} mmHg</strong></p>
    <p><strong>Origem da Hb:</strong> ${esc(source)}.</p>
    ${venous?`<p>Ligado à Hb: <strong>${fmt(boundV,3)} mL/dL</strong> · Dissolvido: <strong>${fmt(dissV,3)} mL/dL</strong></p><div class="worked-result">CcvO₂ = <strong>${fmt(cv,3)} mL O₂/dL</strong></div>`:'<div class="worked-result">Informe ScvO₂, PcvO₂ e Hb arterial ou venosa válida para calcular CcvO₂.</div>'}
   </div><p>Se a Hb venosa não foi informada, a Hb arterial é uma <strong>aproximação assumida</strong>, não uma medida de Hb venosa.</p>`;
  if(kind==='aav')return `<h3>Diferença arterial–venosa central de conteúdo</h3><div class="equation equation-large">C(a−cv)O₂ = CaO₂ − CcvO₂</div>${common}
   <div class="worked-example"><span class="eyebrow">CÁLCULO DINÂMICO · ${current}</span>
    <p>CaO₂ = <strong>${fmt(ca,3)}</strong> · CcvO₂ = <strong>${fmt(cv,3)}</strong> mL/dL</p>
    <div class="worked-result">${delta!==null?`C(a−cv)O₂ = ${fmt(ca,3)} − ${fmt(cv,3)} = <strong>${fmt(delta,3)} mL O₂/dL</strong>`:'Informe Hb, SaO₂, PaO₂, ScvO₂ e PcvO₂ para calcular a diferença.'}</div>
    <p><strong>Hb da parcela venosa:</strong> ${esc(source)}.</p>
   </div><p>Esta diferença não equivale a VO₂ (mL/min). O princípio de Fick sistêmico exige fluxo sanguíneo e <strong>conteúdo venoso misto</strong>, não apenas venoso central.</p>`;
  return `<h3>Extração central por conteúdos</h3><div class="equation equation-large">EO₂,cv (%) = 100 × [CaO₂ − CcvO₂] / CaO₂</div>${common}
   <div class="worked-example"><span class="eyebrow">CÁLCULO DINÂMICO · ${current}</span>
    <p>CaO₂ = <strong>${fmt(ca,3)}</strong> · CcvO₂ = <strong>${fmt(cv,3)}</strong> mL/dL</p>
    <div class="worked-result">${extraction!==null?`EO₂,cv = 100 × ${fmt(delta,3)} / ${fmt(ca,3)} = <strong>${fmt(extraction,1)}%</strong>`:'Dados insuficientes para estimar extração central.'}</div>
    ${satApprox!==null?`<p>Aproximação apenas com saturações: 100 × (${fmt(sa,1)} − ${fmt(sv,1)}) / ${fmt(sa,1)} = <strong>${fmt(satApprox,1)}%</strong>${extraction!==null?`; diferença ≈ ${fmt(Math.abs(extraction-satApprox),1)} ponto(s) percentual(is) da equação completa`:''}.</p>`:'<p>A aproximação saturacional não é exibida porque as hemoglobinas informadas são diferentes ou faltam saturações válidas.</p>'}
    <p><strong>Hb venosa:</strong> ${esc(source)}.</p>
   </div><p>A aproximação saturacional pressupõe Hb semelhante entre amostras e contribuição pequena de O₂ dissolvido; é especialmente sensível à hiperóxia, anemia acentuada e dis-hemoglobinemias.</p>`;
 }
 if(tab==='limites'){
  const special=kind==='cvo2'?'<li><strong>Hb arterial como substituta:</strong> quando não existe Hb venosa, a plataforma usa a arterial como hipótese. Diluição de coleta, infusões e momentos diferentes podem invalidá-la.</li>':
   kind==='aav'?'<li><strong>Amostras pareadas:</strong> mudanças de FiO₂, Hb, hemodinâmica ou tempo de coleta entre as amostras comprometem o significado fisiológico da diferença de conteúdos.</li>':
   '<li><strong>Razão, não VO₂:</strong> a extração central não equivale necessariamente a VO₂/DO₂ sistêmicos. Uma ScvO₂ aumentada pode refletir menor demanda, mistura venosa diferente ou extração alterada, sem provar hipóxia celular.</li>';
  return `<h3>Antes de interpretar ${heading.toLowerCase()}</h3><ul class="science-list">
   <li><strong>Venosa central ≠ venosa mista:</strong> nem a saturação nem a diferença de conteúdos podem ser usadas como substitutas numéricas confiáveis de amostras da artéria pulmonar.</li>
   <li><strong>Posição do CVC:</strong> VCS, junção cavoatrial e átrio direito podem receber misturas diferentes de sangue regional. É especialmente relevante quando há alterações do fluxo esplâncnico.</li>
   <li><strong>Dados realmente medidos:</strong> saturações derivadas de curva-padrão do gasômetro podem diferir da co-oximetria. SpO₂ não mede ScvO₂ nem substitui Hb ou co-oximetria diante de dis-hemoglobinas.</li>
   ${special}
   <li><strong>Hiperóxia e anemia:</strong> a parcela dissolvida torna-se proporcionalmente mais relevante; não descarte o termo 0,0031 × PO₂ sem considerar as condições.</li>
   <li><strong>Integração:</strong> ΔPCO₂, lactato, Hb, ventilação e evolução temporal dão contexto, mas não demonstram isoladamente falha microvascular, débito baixo ou metabolismo anaeróbico.</li>
   <li><strong>Sem decisões automáticas:</strong> valores altos ou baixos deste índice não definem diagnóstico, volemia, necessidade de transfusão ou intervenção.</li>
   </ul><div class="concept-note">Na metanálise de Li et al., os limites de concordância de ScvO₂ versus SvO₂ foram aproximadamente −12,15% a +11,17% <strong>em dez estudos com 524 pacientes analisados nessa comparação</strong>. Essa faixa não é regra de conversão para um paciente individual.</div>`;
 }
 return `<h3>Fontes consultadas para esta ficha</h3><ol class="science-list">
  <li><em>Miller's Anesthesia</em>. Fisiologia respiratória, fisiologia cardíaca e monitorização cardiovascular (capítulos selecionados do projeto; edição e páginas específicas a confirmar).</li>
  <li><em>Barash — Clinical Anesthesia</em>, 9ª ed. Fisiologia respiratória e técnicas de monitorização, capítulos 15 e 26 (paginação não verificada).</li>
  <li>Janotka M, Ostadal P. <em>Biochemical markers for clinical monitoring of tissue perfusion.</em> Mol Cell Biochem. 2021;476:1313–1326. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7921020/" target="_blank" rel="noopener noreferrer">Texto integral</a>.</li>
  <li>Li L, He LX, Yao YT. <em>Correlation between central venous oxygen saturation and mixed venous oxygen saturation in surgical patients: A systematic review and meta-analysis.</em> 2026;16:100076. DOI: 10.1016/j.aicoj.2026.100076. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC13195361/" target="_blank" rel="noopener noreferrer">Texto integral</a>.</li>
 </ol><p class="subtle">Revisão crítica do relatório NotebookLM da Investigação 004. As equações de conteúdos adotam coeficientes convencionais; as diferenças entre ScvO₂ e SvO₂ não autorizam conversões fixas. Conteúdo educacional, não ferramenta validada para decisões clínicas.</p>`;
}

// Investigação 005 — interpretação conjunta, não uma regra diagnóstica nem nova métrica persistida.
function integrationPanel(tab){
 const r=currentRecord(),d=r?.values||{},c=activeCase();
 const m=c&&r?compute(d,c.profile):{};
 const gap=Number.isFinite(m.dco2)?m.dco2:null;
 const diff=Number.isFinite(m.aav)?m.aav:null;
 const sv=val(d,'vso2',0,100),lact=val(d,'lactate',0,35);
 const beShown=m.bea??m.sbea??null,beLabel=Number.isFinite(m.bea)?'BE arterial informado':Number.isFinite(m.sbea)?'SBE arterial estimado':'BE arterial';
 // Denominadores pequenos amplificam erros de amostragem e arredondamento.
 const ratio=(gap!==null&&diff!==null&&diff>0.5)?gap/diff:null;
 const valOr=(v,places=1)=>Number.isFinite(v)?fmt(v,places):'não disponível';
 const current=`<div class="integrated-readout" aria-label="Valores do registro ativo">
   <div><small>ScvO₂ · saturação venosa central</small><strong>${valOr(sv,1)}${sv===null?'':'%'}</strong></div>
   <div><small>ΔPcv−aCO₂ · pressão</small><strong>${valOr(gap,1)}${gap===null?'':' mmHg'}</strong></div>
   <div><small>C(a−cv)O₂ · diferença de conteúdos</small><strong>${valOr(diff,2)}${diff===null?'':' mL/dL'}</strong></div>
   <div><small>Lactato informado</small><strong>${valOr(lact,1)}${lact===null?'':' mmol/L'}</strong></div>
   <div><small>${beLabel}</small><strong>${valOr(beShown,1)}${beShown===null?'':' mEq/L'}</strong></div>
  </div>`;
 if(tab==='entender')return `<h3>Por que os indicadores podem parecer contraditórios?</h3>
  <p>Uma <strong>ScvO₂ elevada</strong> indica que o sangue venoso central ainda contém grande proporção de Hb oxigenada. Isso pode ocorrer por redução do consumo regional, aumento da oferta relativa, heterogeneidade de fluxo ou dificuldade de extração. <strong>Não é prova de perfusão tecidual adequada.</strong></p>
  <p>O <strong>ΔPCO₂</strong> relaciona a pressão parcial de CO₂ venosa central à arterial. Pode aumentar quando a remoção circulatória de CO₂ é insuficiente em relação à sua produção, mas também é influenciado pela relação entre conteúdo e pressão de CO₂, Hb, oxigenação e estado acidobásico.</p>
  <div class="concept-note"><strong>Questão central:</strong> ScvO₂ de 82% com ΔPCO₂ de 10 mmHg é uma combinação fisiologicamente possível. Não comprova, por si só, baixo débito, choque, shunt microvascular ou metabolismo anaeróbico.</div>
  ${current}<p>O <strong>lactato</strong> reflete produção e depuração; pode elevar-se com hipóxia, estimulação adrenérgica, medicamentos e alterações metabólicas ou de depuração. Um único valor não define sua causa.</p>
  <p>O <strong>BE</strong> complementa a avaliação do componente não respiratório da alteração acidobásica. Um BE muito negativo expressa maior déficit de bases na convenção adotada, mas não indica qual ácido ou mecanismo o produziu: compare com lactato, ânion gap, albumina, cloreto e SID. O valor do laudo pode ser BE(B) ou BEecf/SBE.</p>
  <p>Compare os registros e as condições de coleta: momento cirúrgico, circulação, Hb, ventilação, intervenções e origem da amostra. A evolução acrescenta contexto, mas não prova causalidade.</p>`;
 if(tab==='formula')return `<h3>De onde surgiu a razão ΔPCO₂/C(a−cv)O₂?</h3>
  <p>Em um estado estacionário, o princípio de Fick para a circulação sistêmica relaciona as taxas de troca gasosa às diferenças de <strong>conteúdo</strong> arterial e venoso <strong>misto</strong>.</p>
  <div class="equation equation-large">RQ ≈ [Cv̄CO₂ − CaCO₂] / [CaO₂ − Cv̄O₂]</div>
  <p>As diferenças de conteúdo usam unidades comparáveis (mL de gás/dL de sangue). A igualdade exige uma descrição adequada dos fluxos e do sangue venoso misto; uma amostra venosa central não é intercambiável com a mista.</p>
  <p>Para tornar a fórmula mais acessível, propôs-se substituir a diferença de <em>conteúdo de CO₂</em> pela diferença de sua <em>pressão parcial</em>. Essa substituição elimina a equivalência dimensional e depende da curva de dissociação de CO₂.</p>
  <div class="equation equation-large">Razão exploratória = (PcvCO₂ − PaCO₂) / (CaO₂ − CcvO₂)</div>
  ${current}
  <div class="worked-example"><span class="eyebrow">DEMONSTRAÇÃO MATEMÁTICA · REGISTRO ATUAL</span>
   <p>Numerador: <strong>${valOr(gap,2)} mmHg</strong>; denominador: <strong>${valOr(diff,3)} mL O₂/dL</strong>.</p>
   <div class="worked-result">${ratio!==null?`${fmt(gap,2)} ÷ ${fmt(diff,3)} = <strong>${fmt(ratio,2)} mmHg·dL/mL O₂</strong>`:gap===null||diff===null?'Informe dados arteriais e venosos suficientes para ΔPCO₂ e diferença de conteúdos de O₂.':'A diferença de conteúdos é nula, negativa ou muito pequena (≤0,5 mL/dL). A razão não é exibida, pois fica indefinida ou particularmente instável.'}</div>
   <p class="subtle">Cálculo exclusivamente didático; não é o RQ, não classifica metabolismo anaeróbico nem desencadeia alerta.</p>
  </div><p><strong>Análise dimensional:</strong> mmHg ÷ (mL O₂/dL) = mmHg·dL/mL O₂, ao contrário do RQ adimensional. Se o conteúdo de O₂ for expresso em mL/L, o valor numérico muda por um fator de dez.</p>
  <p>Exemplo: ΔPCO₂ = 10 mmHg e C(a−cv)O₂ = 2,5 mL/dL produzem razão = 4,0 mmHg·dL/mL O₂. Isso não significa RQ de 4,0.</p>`;
 if(tab==='limites')return `<h3>Por que não usar a razão como diagnóstico?</h3>
  <ul class="science-list">
   <li><strong>Pressão ≠ conteúdo:</strong> a curva de dissociação de CO₂ não é uma reta com inclinação constante. Efeito Haldane, concentração de Hb, saturação, pH, temperatura e bicarbonato alteram a relação.</li>
   <li><strong>Venosa central ≠ mista:</strong> os compartimentos têm drenagens diferentes. A razão baseada em CcvO₂ não fornece RQ sistêmico por Fick.</li>
   <li><strong>Denominador pequeno:</strong> baixa diferença de conteúdos de O₂ pode elevar muito o valor da razão sem que isso prove anaerobiose. Medidas não simultâneas e Hb de fontes distintas aumentam incerteza.</li>
   <li><strong>Estudo prospectivo:</strong> Gutierrez et al. mediram o RQ por calorimetria indireta em 47 pacientes com choque séptico. A razão pressão/conteúdo não apresentou correlação relevante (R²=0,01). A amostra e o contexto limitam generalizações.</li>
   <li><strong>Desfechos clínicos:</strong> em ensaio randomizado com 228 pacientes com sepse grave/choque séptico, ressuscitação guiada pela razão não melhorou o prognóstico em comparação com estratégia orientada por saturação venosa.</li>
   <li><strong>Sem corte universal:</strong> valores acima de 1,4 foram usados em estudos observacionais, mas não definem metabolismo anaeróbico nem indicam fluidos, transfusão ou inotrópicos.</li>
   <li><strong>Tendência não prova mecanismo:</strong> queda do ΔPCO₂ após uma intervenção pode coexistir com mudanças de fluxo, consumo e transporte de CO₂; não demonstra responsividade volêmica.</li>
  </ul>
  <div class="concept-note">Não concluir que ScvO₂ alta + ΔPCO₂ alto <em>confirma</em> shunting ou disfunção mitocondrial. A conclusão mais rigorosa é: dados potencialmente discordantes, que exigem integrar contexto, cronologia e outras medidas.</div>`;
 return `<h3>Fontes e posições científicas</h3><ol class="science-list">
  <li>Janotka M, Ostadal P. <em>Biochemical markers for clinical monitoring of tissue perfusion.</em> Mol Cell Biochem. 2021;476:1313–1326. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7921020/" target="_blank" rel="noopener noreferrer">Revisão de marcadores</a>.</li>
  <li>Dubin A, Pozo MO, Hurtado J. <em>Central venous minus arterial carbon dioxide pressure to arterial minus central venous oxygen content ratio as an indicator of tissue oxygenation.</em> Rev Bras Ter Intensiva. 2020;32:115–122. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7206946/" target="_blank" rel="noopener noreferrer">Revisão crítica</a>.</li>
  <li>Gutierrez FJ et al. <em>Lack of correlation between central venous minus arterial PCO₂ to arterial minus central venous O₂ content ratio and respiratory quotient in patients with septic shock.</em> Med Intensiva (Engl Ed). 2025;49:8–14 (publicação eletrônica 2024). <a href="https://pubmed.ncbi.nlm.nih.gov/38909012/" target="_blank" rel="noopener noreferrer">Estudo prospectivo</a>.</li>
  <li>Su L et al. <em>P(v−a)CO₂/C(a−v)O₂-directed resuscitation does not improve prognosis compared with SvO₂...</em> J Crit Care. 2018;48:314–320. <a href="https://pubmed.ncbi.nlm.nih.gov/30278407/" target="_blank" rel="noopener noreferrer">Ensaio randomizado</a>.</li>
  <li><em>Miller's Anesthesia</em> e <em>Barash — Clinical Anesthesia</em>: transporte de CO₂, efeito Haldane, princípio de Fick e monitorização hemodinâmica; edição/páginas específicas não conferidas.</li>
 </ol><p class="subtle">Síntese original da Investigação Científica 005. Distingue proposição fisiológica, associação observacional e demonstração de benefício clínico. Não é recomendação de manejo.</p>`;
}

// v0.5.6 — BE informado no laudo e SBE calculado em sua ausência; sem reinterpretação automática.
function bePanel(tab){
 const d=currentRecord()?.values||{}, c=activeCase();
 const r=c?compute(d,c.profile):{};
 const bea=val(d,'be',-50,50),bev=val(d,'bev',-50,50);
 const ha=val(d,'aph',6,8),hv=val(d,'vph',6,8);
 const pc=val(d,'apco2',0.1,200),pv=val(d,'vpco2',0.1,200);
 const reportedHco3A=val(d,'hco3',0.1,80),reportedHco3V=val(d,'vhco3',0.1,80);
 const hA=reportedHco3A??r.hco3a??null,hV=reportedHco3V??r.hco3v??null;
 const calc=(h,ph)=>Number.isFinite(h)&&Number.isFinite(ph)?0.9287*(h-24.4+14.83*(ph-7.40)):null;
 const calculatedA=calc(hA,ha),calculatedV=calc(hV,hv);
 const n=(x,p=1)=>Number.isFinite(x)?fmt(x,p):'não disponível';
 const valCard=(name,reported,sbe,ph,hco3,source)=>`<div class="worked-example"><span class="eyebrow">${name}</span>
  <p><strong>BE informado:</strong> ${n(reported)}${reported===null?'':' mEq/L'}${reported===null?' (ausente no registro)':''}</p>
  <p><strong>SBE calculado para comparação didática:</strong> ${n(sbe)}${sbe===null?'':' mEq/L'}</p>
  <p class="subtle">pH ${n(ph,2)} · HCO₃⁻ ${n(hco3)} mmol/L (${source}).</p></div>`;
 const example=valCard('ARTERIAL',bea,calculatedA,ha,hA,reportedHco3A!==null?'informado':Number.isFinite(r.hco3a)?'calculado por H–H':'não disponível')+
    valCard('VENOSA CENTRAL',bev,calculatedV,hv,hV,reportedHco3V!==null?'informado':Number.isFinite(r.hco3v)?'calculado por H–H':'não disponível');
 if(tab==='entender')return `<h3>O que significa Base Excess?</h3>
  <p>O <strong>Base Excess (BE)</strong> é a quantidade teórica de ácido forte ou base forte necessária para titular o sangue, sob condições de referência (<strong>37 °C, PCO₂ 40 mmHg e pH 7,40</strong>). É calculado a partir de propriedades acidobásicas e ajuda a descrever o <strong>componente não respiratório</strong> do distúrbio.</p>
  <p>BE próximo de zero representa uma referência habitual; <strong>BE negativo</strong> (ou base deficit positivo) sugere componente metabólico acidificante e <strong>BE positivo</strong>, componente alcalinizante. Como regra orientadora, a faixa de referência é aproximadamente −2 a +2 mEq/L, variando conforme laboratório e método.</p>
  <div class="concept-note"><strong>Atenção:</strong> o gasômetro <em>não dosa diretamente</em> o BE. Ele calcula BE(B) ou BEecf/SBE usando pH, PCO₂, HCO₃⁻ derivado e, conforme o algoritmo, Hb. O campo do site registra o <strong>valor do laudo</strong>, sem presumir qual variante foi usada.</div>
  ${example}
  <p>O BE não identifica a causa da acidose. Por exemplo, BE −10 mEq/L pode coexistir com lactato elevado, acidose hiperclorêmica, retenção de ânions não medidos ou uma combinação desses processos. Integre com albumina, AG, SID, lactato e evolução temporal.</p>`;
 if(tab==='formula')return `<h3>BE(B) versus SBE/BEecf</h3>
  <p><strong>BE(B)</strong> representa o excesso/déficit de base calculado para a amostra de <em>sangue total</em>, considerando seu tamponamento hemoglobínico. <strong>BEecf/SBE</strong> é uma padronização que aproxima o comportamento do compartimento extracelular; em formulações usuais considera uma concentração efetiva de Hb de aproximadamente 5 g/dL.</p>
  <div class="equation equation-large">SBE ≈ 0,9287 × [HCO₃⁻ − 24,4 + 14,83 × (pH − 7,40)]</div>
  <p>HCO₃⁻ em mmol/L e SBE em mEq/L. Para <strong>estimar o SBE</strong>, usamos o HCO₃⁻ informado da mesma amostra ou, se ausente, o calculado por Henderson–Hasselbalch. A fórmula exibida é uma versão de Van Slyke; fabricantes podem adotar outras constantes.</p>
  ${example}
  <p>Se o BE foi informado, <strong>ele é preservado como a observação do laudo</strong>, e o SBE acima fica apenas como demonstração na ficha. Quando o BE não é informado, o cartão de resultados exibirá <strong>SBE estimado</strong> como uma variável distinta.</p>
  <p>Em pacientes com ventilação controlada, reduzir a PaCO₂ pode elevar o pH sem corrigir a causa da acidose metabólica. O SBE busca reduzir a interferência da PCO₂, mas não é perfeitamente independente dela.</p>`;
 if(tab==='limites')return `<h3>Limitações e armadilhas</h3><ul class="science-list">
  <li><strong>Não é uma medida independente:</strong> BE é derivado do estado acidobásico já representado por pH, PCO₂ e bicarbonato; não equivale a uma terceira dosagem de ácido.</li>
  <li><strong>BE(B) ≠ SBE:</strong> os algoritmos modelam compartimentos e tamponamento diferentes. Comparar valores de laudos de equipamentos distintos pode mostrar pequenas discrepâncias sem mudança clínica real.</li>
  <li><strong>BE não revela o ânion:</strong> BE negativo pode refletir lactato, hipercloremia, ácidos não mensurados ou efeitos combinados; albumina e fosfato também interferem. Não atribuir todo déficit de bases a lactato.</li>
  <li><strong>Venoso central ≠ arterial:</strong> sobretudo em choque e hipoperfusão, pH, PCO₂ e BE podem divergir. Não converter BE venoso em BE arterial usando um ajuste fixo.</li>
  <li><strong>SBE calculado é aproximação:</strong> pressupõe constantes e condições de referência; o uso de HCO₃⁻ calculado por H–H compartilha os mesmos dados básicos do pH/PCO₂.</li>
  <li><strong>Não prescreve bicarbonato:</strong> magnitude do déficit de bases não equivale à dose a administrar nem identifica indicação terapêutica. A etiologia, a ventilação e a circulação importam.</li>
  <li><strong>Tempo importa:</strong> a melhora do BE e do lactato após recuperação hemodinâmica pode não ocorrer no mesmo momento, e nenhum índice isolado prova resolução da hipoperfusão.</li>
  </ul><div class="concept-note">Compare BE com pH, HCO₃⁻, AG corrigido para albumina, Na–Cl/SID, lactato e contexto cirúrgico. O parâmetro é descritivo, não diagnóstico etiológico automático.</div>`;
 return `<h3>Referências e convenções</h3><ol class="science-list">
  <li>Siggaard-Andersen O. <em>The van Slyke equation.</em> Scand J Clin Lab Invest Suppl. 1977;146:15–20. <a href="https://pubmed.ncbi.nlm.nih.gov/13478/" target="_blank" rel="noopener noreferrer">Artigo original</a>.</li>
  <li>Kellum JA. <em>Clinical review: Reunification of acid–base physiology.</em> Crit Care. 2005. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC1297616/" target="_blank" rel="noopener noreferrer">Derivação e limitações do SBE</a>.</li>
  <li><em>Understanding base excess (BE): merits and pitfalls.</em> Intensive Care Med. 2022. <a href="https://link.springer.com/article/10.1007/s00134-022-06748-4" target="_blank" rel="noopener noreferrer">Diferenças entre BE(B) e BEecf</a>.</li>
  <li>Recomendações de painel francês. <em>Diagnosis and management of metabolic acidosis.</em> Ann Intensive Care. 2019. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6695455/" target="_blank" rel="noopener noreferrer">Consenso e interpretação</a>.</li>
  <li>Park M et al. <em>Partitioning evolutive standard base excess determinants in septic shock patients.</em> Rev Bras Ter Intensiva. 2007. <a href="https://www.scielo.br/j/rbti/a/5vMXHFf7db5GyJKSmzgCyyd/" target="_blank" rel="noopener noreferrer">Van Slyke e integração com Stewart</a>.</li>
 </ol><p class="subtle">Nomenclatura e algoritmo devem ser conferidos no laudo do equipamento. Conteúdo educacional não validado para decisão assistencial.</p>`;
}

// Investigação 007 — ficha K⁺, auditada contra os quatro artigos UpToDate enviados pelo usuário.
// A dose terapêutica depende do cenário; a ficha NÃO gera prescrições ou doses por peso não fundamentadas.
function potassiumSciencePanel(tab){
 const c=activeCase(),r=currentRecord(),d=r?.values||{};
 const k=val(d,'k',0,15),gl=val(d,'glucose',0,1500),ph=val(d,'aph',6,8),mg=val(d,'mg',0,8);
 const idx=c?.records.findIndex(x=>x.id===r.id)??-1;
 const base=idx>0?val(c.records[0]?.values,'k'):null,prev=idx>0?val(c.records[idx-1]?.values,'k'):null;
 const trend=idx>0?`<p class="k-trend"><strong>T${idx}:</strong> K⁺ ${fmt(k,1)} mmol/L · ${deltaLine('Δ T0',k,base,{places:1})} · ${deltaLine('Δ anterior',k,prev,{places:1})}</p>`:`<p class="k-trend">K⁺ ${fmt(k,1)} mmol/L · T0 é ponto de partida, não valor normal.</p>`;
 const status=k===null?'Não foi informado K⁺ neste registro':k<3.5?'Potássio abaixo da faixa orientativa':k>5?'Potássio acima da faixa orientativa':'Potássio dentro da faixa orientativa';
 const metabolicCaution=gl!==null&&gl>=250&&k!==null&&k<4.0?`<p class="k-metabolic-warning"><strong>Atenção à evolução durante insulinoterapia:</strong> glicemia ${fmt(gl,0)} mg/dL e K⁺ ${fmt(k,1)} mmol/L. Insulina e tratamento da hiperosmolalidade podem reduzir rapidamente a potassemia. ${k<3.5?'Na CAD/EHH <em>confirmada</em>, o consenso internacional de 2024 e o algoritmo de emergência no UpToDate de anestesia recomendam adiar a insulina enquanto K⁺ &lt;3,5 mmol/L, até sua correção.':'A proximidade do limite inferior exige considerar o potássio e sua evolução antes e durante a insulinoterapia.'} A hiperglicemia isolada não diagnostica CAD/EHH.</p>`:'';
 const bicarbCaution=ph!==null&&ph<7.2&&k!==null&&k<4.0?`<p class="k-metabolic-warning"><strong>Acidemia associada a K⁺ baixo/limítrofe:</strong> se bicarbonato for considerado para a acidemia, a potassemia pode cair. Considerar também cálcio ionizado, geração de CO₂, ventilação e carga de sódio/volume. A gasometria sozinha não define uma dose de bicarbonato.</p>`:'';
 const caution='<p class="k-didactic"><strong>Uso exclusivamente educacional.</strong> Os dados da gasometria não estabelecem, isoladamente, mecanismo, urgência, prescrição nem via. ECG, sintomas, função renal, diurese, medicamentos, perdas e contexto clínico precisam ser conhecidos; considerar protocolo assistencial aplicável.</p>';
 const links={hyper:'https://www.uptodate.com/contents/treatment-and-prevention-of-hyperkalemia-in-adults',hypo:'https://www.uptodate.com/contents/clinical-manifestations-and-treatment-of-hypokalemia-in-adults',eval:'https://www.uptodate.com/contents/evaluation-of-the-adult-patient-with-hypokalemia',causes:'https://www.uptodate.com/contents/causes-of-hypokalemia-in-adults'};
 if(tab==='entender')return `<h3>Potássio — contexto deste momento</h3><p><strong>${status}.</strong> A concentração sérica não representa necessariamente o estoque corporal e deve ser interpretada com a velocidade da mudança.</p>${trend}<div class="k-two"><div><h4>Alteração do estoque corporal</h4><p>Perdas renais e gastrointestinais, retenção renal, diurese e excreção distal modificam a quantidade total de K⁺. Distúrbios persistentes podem coexistir com mudanças transcelulares.</p></div><div><h4>Redistribuição transcelular</h4><p>Insulina, estímulo β₂-adrenérgico, hiperosmolalidade e alterações ácido-base mudam rapidamente a concentração extracelular, sem quantificar o déficit ou excesso corporal.</p></div></div><p><strong>Variáveis concomitantes:</strong> glicemia ${fmt(gl,0)} mg/dL · pH arterial ${fmt(ph,2)} · Mg ${fmt(mg,2)} mmol/L. Dados ausentes não significam valores normais.</p>${metabolicCaution}${bicarbCaution}<h4>Raciocínio diferencial da hipocalemia</h4><p>Se a causa não for óbvia, combinar história, acidose ou alcalose e excreção urinária de K⁺ ajuda a diferenciar perdas renais, digestivas e redistribuição. K⁺ baixo com alcalose e perdas renais, por exemplo, não equivale a K⁺ baixo após insulina.</p><p>Hipomagnesemia pode sustentar perdas urinárias e dificultar a correção do K⁺. A hipocalemia por redistribuição pode apresentar <strong>hipercalemia de rebote</strong> após reposição.</p>${caution}`;
 if(tab==='formula')return `<h3>Cálculos e esquemas descritos nas fontes</h3><p>Os números seguintes são exemplos <strong>documentados</strong> para cenários específicos; não são doses calculadas para este paciente.</p><h4>Hipercalemia com repercussão cardíaca — cálcio intravenoso</h4><div class="k-two"><div><h4>Gluconato de cálcio</h4><p>UpToDate: <strong>1.000 mg IV</strong>, equivalentes a 10 mL da preparação a 10%, contendo cerca de <strong>4,6 mEq</strong> de cálcio elementar. Pode ser administrado em acesso periférico apropriado.</p></div><div><h4>Cloreto de cálcio</h4><p>UpToDate: <strong>500–1.000 mg IV</strong>, equivalentes a 5–10 mL a 10%, contendo cerca de <strong>6,8–13,6 mEq</strong> de cálcio elementar. Prefere-se acesso central ou veia profunda devido ao risco de lesão por extravasamento.</p></div></div><p class="k-didactic"><strong>Não são equivalentes por volume.</strong> O cloreto de cálcio contém aproximadamente três vezes mais cálcio elementar por mL a 10%. As diretrizes também diferem nas doses recomendadas de gluconato; verificar qual diretriz e cenário se aplicam. O cálcio antagoniza efeitos cardíacos, mas <strong>não reduz o K⁺</strong>. A fonte descreve administração monitorizada e eventual repetição conforme ECG.</p><h4>Hipercalemia — redistribuição com insulina</h4><p>No manejo de emergência, o UpToDate descreve <strong>10 unidades de insulina regular IV</strong> associadas a <strong>25 g de glicose</strong>; com glicemia ≥250 mg/dL, descreve insulina sem glicose inicial. Aponta risco de hipoglicemia tardia e monitorização glicêmica horária por 5–6 horas. A estratégia não elimina K⁺ do organismo.</p><h4>Hipocalemia — reposição descrita no UpToDate</h4><p>Em perdas de potássio com hipocalemia leve a moderada (3,0–3,4 mmol/L), quando há possibilidade de via enteral, o capítulo descreve <strong>10–20 mEq por dose oral, 2–4 vezes ao dia</strong>, conforme causa. Em hipocalemia grave ou sintomática, KCl IV pode ser necessário; a fonte descreve <strong>10–20 mEq/h para a maioria</strong>, com taxas mais altas somente em situações excepcionais ameaçadoras à vida, sob monitorização e condições apropriadas.</p><p><strong>Sal escolhido:</strong> KCl em geral; em hipocalemia com acidose metabólica, o UpToDate discute sais alcalinizantes de K⁺, conforme etiologia e disponibilidade. Uma gasometria não determina automaticamente o sal nem a via.</p><details class="k-extra"><summary>Estimar déficit corporal de K⁺ — somente em perdas crônicas, com ressalvas</summary><p>O UpToDate relata aproximadamente <strong>200–400 mEq de déficit para queda de 1 mmol/L</strong> de K⁺ na hipocalemia <em>crônica por perda corporal</em>. Isso é uma relação populacional, <strong>não uma dose de reposição</strong>, e não serve para CAD/EHH, paralisia periódica, redistribuição ou situações rapidamente mutáveis.</p><label class="k-opt-in"><input type="checkbox" id="kDeficitEligible"> Confirmo que o exercício representa perda corporal crônica, e não redistribuição ou cenário agudo</label><div class="k-calc-grid"><label>K⁺ habitual conhecido (mmol/L)<input id="kDeficitBaseline" type="number" min="2.0" max="6.5" step="0.1" inputmode="decimal" placeholder="Informar valor documentado"></label><button type="button" class="secondary" id="kDeficitButton">Estimar déficit teórico</button></div><p class="k-calc-result" id="kDeficitResult" aria-live="polite">Não há cálculo automático a partir da potassemia isolada.</p></details><details class="k-extra"><summary>Razão K⁺/creatinina urinária — dados externos à gasometria</summary><p>Se uma amostra de urina isolada tiver <strong>K⁺ em mEq/L</strong> e <strong>creatinina em mg/dL</strong>, a razão em mEq/g auxilia na avaliação de perdas renais. O UpToDate descreve valores &gt;13 mEq/g como sugestivos de excreção inadequada na hipocalemia, com exceções importantes.</p><div class="k-calc-grid"><label>K⁺ urinário (mEq/L)<input id="kUrineK" type="number" min="0" max="300" step="0.1" inputmode="decimal" placeholder="Ex.: 30"></label><label>Creatinina urinária (mg/dL)<input id="kUrineCr" type="number" min="0.1" max="1000" step="0.1" inputmode="decimal" placeholder="Ex.: 100"></label><button type="button" class="secondary" id="kUrineButton">Calcular razão</button></div><p class="k-calc-result" id="kUrineResult" aria-live="polite">As duas dosagens devem pertencer à mesma amostra urinária.</p></details><h4>KCl concentrado — conversão farmacêutica</h4><p class="k-pharm-highlight"><strong>KCl 19,1%: 2,56 mEq de K⁺ por mL</strong> (aproximadamente 2,5 mEq/mL). Uma apresentação frequente, não universal: confirmar rótulo e unidade. A quantidade de concentrado é diferente do volume final e da velocidade da bomba.</p><details class="k-extra"><summary>Converter mEq em mL de KCl 19,1% · apenas aritmética</summary><p>10 mEq = 3,9 mL; 15 mEq = 5,9 mL; 20 mEq = 7,8 mL. Esta ferramenta não seleciona a dose.</p><div class="k-calc-grid"><label>Quantidade definida (mEq)<input id="kConcentrateMeq" type="number" min="0.1" max="100" step="0.1" inputmode="decimal" placeholder="Ex.: 15"></label><button type="button" class="secondary" id="kConcentrateButton">Converter em mL</button></div><p class="k-calc-result" id="kConcentrateResult" aria-live="polite">Não corresponde à dose total a administrar nem a velocidade de infusão.</p></details><p class="k-didactic">KCl concentrado exige diluição e administração controlada; nunca injetar o concentrado diretamente por via intravenosa. Conferir acesso, concentração final, bomba, monitorização e protocolo aplicável.</p><h4>Bicarbonato e potássio</h4><p>Seu efeito redutor de K⁺ na hipercalemia aguda é variável e não deve ser considerado monoterapia. O cálculo educacional de dose para <em>tratar acidemia</em> pertence à ficha ácido-base, após auditoria da fonte específica; não incluímos preparo ou diluição.</p>${caution}`;
 if(tab==='limites')return `<h3>Precauções e limites da interpretação</h3><ul class="science-list"><li><strong>ECG:</strong> sua normalidade não exclui hipercalemia importante; o padrão eletrocardiográfico não progride de maneira confiável com a concentração. Na hipocalemia, considerar arritmias, ondas U, repolarização prolongada e condições predisponentes.</li><li><strong>Gluconato e cloreto de cálcio:</strong> ambos podem ser usados na estabilização de membrana em hipercalemia com indicação apropriada. Não são bioequivalentes em volumes iguais; atentar à via, monitorização e lesão tecidual por extravasamento.</li><li><strong>Potássio IV:</strong> velocidade, concentração e acesso são condições de segurança distintas. O UpToDate recomenda monitorização contínua do ECG em situações específicas, incluindo reposição IV &gt;10 mEq/h.</li><li><strong>Hipomagnesemia:</strong> pode provocar perda renal persistente de K⁺; sua avaliação é relevante desde o início, e não somente após tratamento fracassado.</li><li><strong>Redistribuição:</strong> após insulina, β₂-agonistas ou reversão de alcalemia, a potassemia pode mudar sem corresponder ao déficit corporal. Reposição indiscriminada pode ocasionar rebote.</li><li><strong>CAD/EHH:</strong> hiperglicemia isolada não estabelece diagnóstico. Na CAD/EHH confirmada, o consenso de 2024 e o algoritmo do UpToDate de anestesia utilizam K⁺ &lt;3,5 mmol/L para adiar insulina, enquanto o capítulo geral de hipocalemia ainda menciona &gt;3,3 mmol/L. Não misturar limiares sem identificar a fonte e o cenário.</li><li><strong>Bicarbonato:</strong> o benefício para reduzir K⁺ agudamente é limitado; acompanhar K⁺, pH, Ca²⁺ ionizado, produção de CO₂ e estado volêmico, sem automatizar indicação.</li><li><strong>Função renal e diurese:</strong> interferem no risco de hipercalemia por reposição e na capacidade de excreção. Na hipocalemia, K⁺ urinário isolado pode enganar; a razão K⁺/creatinina também apresenta limitações.</li><li><strong>Pós-operatório:</strong> o capítulo de hipercalemia do UpToDate especificamente orienta evitar poliestirenossulfonato de sódio pelo risco gastrointestinal.</li></ul>${metabolicCaution}${bicarbCaution}${caution}`;
 return `<h3>Referências auditadas</h3><ol class="science-list"><li><a href="${links.hyper}" target="_blank" rel="noopener noreferrer">Mount DB. <em>Treatment and prevention of hyperkalemia in adults</em></a>. UpToDate, versão 60.0, 03/11/2026. Seções: Calcium; Insulin with glucose; Sodium bicarbonate; Monitoring; Remove potassium from the body.</li><li><a href="${links.hypo}" target="_blank" rel="noopener noreferrer">Mount DB. <em>Clinical manifestations and treatment of hypokalemia in adults</em></a>. UpToDate, 10/08/2026. Seções: Hypomagnesemia and redistributive hypokalemia; Estimation of the potassium deficit; Mild to moderate hypokalemia; Intravenous potassium repletion.</li><li><a href="${links.eval}" target="_blank" rel="noopener noreferrer">Mount DB. <em>Evaluation of the adult patient with hypokalemia</em></a>. UpToDate, 28/07/2025. Seções: Assessment of urinary potassium excretion; Urine potassium-to-creatinine ratio; Assessment of acid-base status.</li><li><a href="${links.causes}" target="_blank" rel="noopener noreferrer">Mount DB. <em>Causes of hypokalemia in adults</em></a>. UpToDate, 02/10/2026. Seções: Increased entry into cells; Increased gastrointestinal losses; Increased urinary losses.</li><li><a href="https://www.uptodate.com/contents/anesthesia-for-patients-with-diabetes-mellitus-and-or-hyperglycemia" target="_blank" rel="noopener noreferrer">Abdelmalak e Sreedharan, UpToDate: anestesia em diabetes/hiperglicemia</a> (15/06/2026), algoritmo de emergência em CAD: K⁺ &lt;3,5 mmol/L antes de iniciar insulina. Diverge do limiar 3,3 mencionado no capítulo geral de hipocalemia.</li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11272983/" target="_blank" rel="noopener noreferrer">Consenso internacional de 2024 sobre crises hiperglicêmicas</a>: limiar de K⁺ &lt;3,5 mmol/L na CAD/EHH confirmada.</li><li><a href="https://guidelines.ukkidney.org/hyperkalaemia/6-summary-of-clinical-practice-guideline-for-hyperkalaemia/6-2-section-ii-hospital/" target="_blank" rel="noopener noreferrer">UK Kidney Association, 2026</a>: exemplo de divergência em dose de gluconato de cálcio para emergência hipercalêmica.</li></ol><p>Conteúdo resumido em linguagem original, com as fontes identificadas por tópico e seção. Diferentes recomendações podem refletir condições, população e diretriz distintas; nenhuma das fontes valida prescrição automática com uma gasometria isolada.</p>${caution}`;
}
// Ficha glicemia: auditada com três PDFs integrais do UpToDate recebidos em 15/11/2026.
// Sem prescrição automática, especialmente para DM1, CAD/EHH ou procedimentos complexos.
function glucoseSciencePanel(tab){
 const c=activeCase(),r=currentRecord(),d=r?.values||{};
 const gl=val(d,'glucose',0,1500),na=val(d,'na',90,200),k=val(d,'k',0,15),ph=val(d,'aph',6,8);
 const idx=c?.records.findIndex(x=>x.id===r.id)??-1;
 const base=idx>0?val(c.records[0]?.values,'glucose'):null,prev=idx>0?val(c.records[idx-1]?.values,'glucose'):null;
 const trend=idx>0?`<p class="k-trend"><strong>T${idx}:</strong> glicemia ${fmt(gl,0)} mg/dL · ${deltaLine('Δ T0',gl,base,{places:0})} · ${deltaLine('Δ anterior',gl,prev,{places:0})}</p>`:`<p class="k-trend">Glicemia ${fmt(gl,0)} mg/dL · T0 é a primeira coleta, não necessariamente o normal do paciente.</p>`;
 const category=gl===null?'Glicemia não informada':gl<54?'Hipoglicemia &lt;54 mg/dL (nível 2)':gl<70?'Hipoglicemia entre 54 e 69 mg/dL (nível 1)':gl>140?'Valor acima de 140 mg/dL':'Valor sem hipoglicemia ou hiperglicemia hospitalar pelos critérios usuais';
 const hypo=gl!==null&&gl<70?`<p class="k-metabolic-warning"><strong>Hipoglicemia durante anestesia exige avaliação e tratamento imediatos:</strong> ${fmt(gl,0)} mg/dL. A anestesia pode mascarar seus sinais. No contexto de paciente sedado/anestesiado com glicemia &lt;70 mg/dL, o UpToDate perioperatório descreve 25 g de glicose IV e nova medida em 5–10 minutos; confirmar a via, o contexto e a resposta.</p>`:'';
 const high=gl!==null&&gl>180?`<p class="k-metabolic-warning"><strong>Glicemia acima dos alvos usuais:</strong> ${fmt(gl,0)} mg/dL. Não é possível escolher insulina pela medida isolada: verificar diabetes tipo 1 ou 2, insulina prévia, jejum, cirurgia, tendência, acesso e possibilidade de CAD/EHH. O UpToDate distingue correções intermitentes e infusão contínua conforme o cenário.</p>`:'';
 const interaction=k!==null&&gl!==null?`<p class="k-didactic"><strong>Potássio simultâneo:</strong> ${fmt(k,1)} mmol/L. A administração de insulina pode reduzir a potassemia por redistribuição intracelular. ${k<3.5?'<strong>K⁺ abaixo de 3,5 mmol/L:</strong> na CAD/EHH <em>confirmada</em>, o algoritmo de emergência reproduzido no UpToDate de anestesia recomenda corrigir K⁺ antes de iniciar insulina. Esse limiar não se aplica indiscriminadamente à hiperglicemia isolada.':k<4.0?'K⁺ próximo ao limite inferior merece avaliação e monitorização cuidadosa se houver insulinoterapia.':'O valor inicial não quantifica o estoque total de potássio, especialmente em crises hiperglicêmicas.'} Glicemia, pH e K⁺ isolados não diagnosticam CAD/EHH.</p>`:'';
 const caution='<p class="k-didactic"><strong>Finalidade educacional.</strong> A ficha não diagnostica crises hiperglicêmicas nem seleciona um regime de insulina. A adequação depende de diabetes prévio, uso de insulina, ingestão ou jejum, doença crítica, função renal, cetonas, tendências e monitorização. Confirmar método e resultados discrepantes.</p>';
 const links={anesthesia:'https://www.uptodate.com/contents/anesthesia-for-patients-with-diabetes-mellitus-and-or-hyperglycemia',perioperative:'https://www.uptodate.com/contents/perioperative-glycemic-management-in-adults-with-diabetes-mellitus',critical:'https://www.uptodate.com/contents/glycemic-control-in-critically-ill-adult-and-pediatric-patients',hyperK:'https://www.uptodate.com/contents/treatment-and-prevention-of-hyperkalemia-in-adults'};
 if(tab==='entender')return `<h3>Glicemia — fisiologia e evolução</h3><p><strong>${category}.</strong> A trajetória entre coletas é tão importante quanto o valor isolado, sobretudo durante cirurgia, estresse, jejum, terapia com corticoides ou insulina e mudanças no aporte de glicose.</p>${trend}<div class="k-two"><div><h4>Por que aumenta?</h4><p>Resposta cirúrgica e inflamatória, catecolaminas, cortisol, glucagon e hormônio do crescimento favorecem gliconeogênese, glicogenólise e resistência à insulina. Aporte exógeno e diabetes prévio também interferem.</p></div><div><h4>Por que pode diminuir?</h4><p>Insulina, alterações do aporte enteral/parenteral, jejum e mudanças na resistência à insulina podem precipitar queda. Em pacientes anestesiados, os sintomas de neuroglicopenia e a resposta autonômica não são confiavelmente reconhecidos.</p></div></div><p><strong>Dados desta coleta:</strong> Na⁺ ${fmt(na,1)} mmol/L · K⁺ ${fmt(k,1)} mmol/L · pH arterial ${fmt(ph,2)}. Ausência de medida não é normalidade.</p><p><strong>Contexto anestésico:</strong> choque e vasopressores podem prejudicar a confiabilidade da glicemia capilar; nestas condições o UpToDate favorece amostras venosas/arteriais por método laboratorial.</p>${hypo}${high}${interaction}${caution}`;
 if(tab==='formula'){
  const mmol=gl!==null?gl/18:null;
  const tonic=na!==null&&gl!==null?2*na+gl/18:null;
  const excess=gl!==null?Math.max(0,gl-100)/100:null;
  const corr16=na!==null&&excess!==null?na+1.6*excess:null;
  const corr24=na!==null&&excess!==null?na+2.4*excess:null;
  return `<h3>Cálculos e esquemas educativos</h3><div class="k-two"><div><h4>Glicose, mmol/L</h4><p>Glicemia (mg/dL) ÷ 18</p><p class="glucose-big-result">${mmol===null?'—':fmt(mmol,1)+' mmol/L'}</p></div><div><h4>Tonicidade plasmática estimada</h4><p>2 × Na⁺ <strong>medido</strong> + glicose/18</p><p class="glucose-big-result">${tonic===null?'—':fmt(tonic,1)+' mOsm/kg ≈'}</p><small>Estimativa da osmolalidade efetiva. Não inclui ureia; não equivale à osmolalidade total medida.</small></div></div><h4>Na⁺ corrigido na hiperglicemia</h4><p>Na⁺ medido + fator × (glicemia − 100)/100, quando glicemia &gt;100 mg/dL. Os dois fatores são abordagens estimativas de literatura complementar, não derivadas dos três artigos de glicemia do UpToDate enviados.</p><div class="k-two"><div><h4>Fator 1,6</h4><p class="glucose-big-result">${corr16===null?'—':fmt(corr16,1)+' mmol/L'}</p><p>Estimativa clássica.</p></div><div><h4>Fator 2,4</h4><p class="glucose-big-result">${corr24===null?'—':fmt(corr24,1)+' mmol/L'}</p><p>Estimativa alternativa; diferença pode ser relevante quando há hiperglicemia importante.</p></div></div><p class="k-didactic">O sódio <strong>medido</strong> entra no cálculo da tonicidade atual. O sódio corrigido é uma estimativa da natremia em outra condição glicêmica; não o substitua no primeiro cálculo. Tonicidade e sódio corrigido não diagnosticam CAD/EHH isoladamente.</p>
  <details class="k-extra"><summary>Exemplo de escala de insulina corretiva publicado no UpToDate</summary><p><strong>Contexto da tabela:</strong> exemplo de correção periódica com insulina de ação curta ou rápida, em adultos com diabetes tipo 2 sem insulinoterapia habitual no manejo intraoperatório. Não se aplica automaticamente a DM1, CAD/EHH, infusões IV em cirurgia complexa ou pacientes críticos com esquema próprio. As unidades abaixo <strong>não são dose personalizada para o paciente desta ficha</strong>.</p><div class="glucose-table-wrap"><table class="glucose-example-table"><thead><tr><th scope="col">Glicemia (mg/dL)</th><th scope="col">Exemplo de unidades por aplicação (a cada 4–6 h)</th></tr></thead><tbody><tr><td>&lt;150</td><td>0</td></tr><tr><td>151–200</td><td>0–2</td></tr><tr><td>201–250</td><td>4</td></tr><tr><td>251–300</td><td>6</td></tr><tr><td>301–350</td><td>8</td></tr><tr><td>351–400</td><td>10</td></tr></tbody></table></div><p>Fonte: Khan, Ghali e Cagliero, UpToDate, tabela 2, p. 24 do PDF. <strong>Pressuposto ilustrativo:</strong> fator de sensibilidade de 1 unidade para ~25 mg/dL. Pessoas mais sensíveis podem exigir esquema muito menos intenso. Valores fora da tabela e a escolha entre SC/IV exigem avaliação independente; não extrapolar doses.</p>${interaction}<p class="k-didactic">Essa tabela serve para estudar um regime publicado; não é uma regra de correção automática da glicemia de um paciente real.</p></details>
  <details class="k-extra"><summary>Hipoglicemia na anestesia: medida de resgate descrita no UpToDate</summary><p>Para paciente <strong>sedado ou anestesiado</strong> com glicemia &lt;70 mg/dL, o artigo perioperatório descreve <strong>25 g de glicose IV</strong>, seguidos de <strong>rechecagem em 5–10 minutos</strong>; pode ser necessário aporte subsequente para evitar recorrência. A dose descreve massa de glicose, não escolha universal de concentração, diluente ou volume. Aplicar protocolo clínico e monitorização.</p></details>
  ${hypo}${high}${interaction}${caution}`;
 }
 if(tab==='limites')return `<h3>Metas, monitorização e limites</h3><ul class="science-list"><li><strong>Meta perioperatória:</strong> o artigo de manejo perioperatório do UpToDate procura 110–180 mg/dL quando possível sem hipoglicemia; cita a ADA (100–180 mg/dL). O artigo de anestesia utiliza habitualmente 140–180 mg/dL, com individualização.</li><li><strong>Pacientes críticos:</strong> o UpToDate recomenda 140–180 mg/dL para a maioria, apoiado em ensaios como NICE-SUGAR; metas rigorosas de 80–110 mg/dL aumentaram hipoglicemia grave, sem benefício geral consistente de mortalidade.</li><li><strong>Início do tratamento na UTI:</strong> em adultos <em>sem diabetes tipo 1</em>, o artigo descreve considerar correção regular SC se glicemia for persistentemente &gt;180 mg/dL por 12–24 horas, escalonando conforme resposta. Valores muito elevados, instabilidade ou cirurgia complexa podem demandar abordagem distinta. Não aplicar esse critério a DM1 ou CAD/EHH.</li><li><strong>Insulina basal em DM1:</strong> não interromper a cobertura basal só porque o paciente está em jejum. A falta absoluta de insulina pode precipitar CAD; estratégias para infusão e aporte de glicose dependem do cenário.</li><li><strong>Monitorização:</strong> em anestesia, o UpToDate sugere glicemia a cada hora se recebeu insulina, ou aproximadamente a cada duas horas para diabéticos não tratados com insulina; intervalos menores se &lt;100 mg/dL ou queda rápida. Em infusão IV na UTI, habitualmente a cada hora.</li><li><strong>Perfusão prejudicada:</strong> hipoperfusão, hipotensão e vasopressores reduzem confiabilidade da medida capilar; verificar amostra arterial/venosa quando indicado.</li><li><strong>Hipoglicemia:</strong> &lt;70 mg/dL merece ação; &lt;54 mg/dL é hipoglicemia mais significativa. Sob anestesia, não confiar em sinais clínicos.</li><li><strong>Crise metabólica:</strong> CAD requer evidência de cetose e acidose; EHH exige critérios adicionais de hiperosmolaridade. Inibidores SGLT2 podem associar-se a CAD com glicemia relativamente baixa.</li><li><strong>Insulina–K⁺:</strong> insulinoterapia pode reduzir rapidamente o K⁺ medido. O algoritmo de CAD do artigo anestésico retarda insulina se K⁺ &lt;3,5 mmol/L, mas isso <em>não</em> é limite universal para toda hiperglicemia.</li></ul>${hypo}${high}${interaction}${caution}`;
 return `<h3>Fontes auditadas: UpToDate</h3><ol class="science-list"><li><a href="${links.perioperative}" target="_blank" rel="noopener noreferrer">Khan NA, Ghali WA, Cagliero E. <em>Perioperative glycemic management in adults with diabetes mellitus</em></a>. UpToDate, 19/12/2025. Seções <em>Glycemic targets</em>, <em>Intraoperative management</em>, <em>Monitoring</em> e <em>Hypoglycemia treatment</em>; tabela 2 de insulina corretiva (p. 24).</li><li><a href="${links.anesthesia}" target="_blank" rel="noopener noreferrer">Abdelmalak BB, Sreedharan R. <em>Anesthesia for patients with diabetes mellitus and/or hyperglycemia</em></a>. UpToDate, 15/06/2026. Seções <em>Monitoring blood glucose</em>, <em>Glycemic targets</em> e tabela de emergência em CAD com limiar K⁺ 3,5 mmol/L.</li><li><a href="${links.critical}" target="_blank" rel="noopener noreferrer">Patel J. <em>Glycemic control in critically ill adult and pediatric patients</em></a>. UpToDate, 17/06/2026. Seções <em>Our approach</em>, <em>Target range of blood glucose</em>, <em>Insulin therapy administration</em> e <em>Monitoring</em>.</li><li><a href="${links.hyperK}" target="_blank" rel="noopener noreferrer">Mount DB. <em>Treatment and prevention of hyperkalemia in adults</em></a>. UpToDate, 03/11/2026. Monitorização glicêmica prolongada após insulina usada para redução aguda de K⁺.</li></ol><h4>Complementares (não substituem UpToDate)</h4><ol class="science-list"><li><a href="https://diretriz.diabetes.org.br/manejo-da-sindrome-hiperglicemica-hiperosmolar-nao-cetotica-shhnc/" target="_blank" rel="noopener noreferrer">SBD 2026, abordagem da síndrome hiperglicêmica hiperosmolar</a>. Comparação dos fatores 1,6 e 2,4 para sódio corrigido.</li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11272983/" target="_blank" rel="noopener noreferrer">Consenso internacional sobre crises hiperglicêmicas, 2024</a>. Critérios de crises e interpretação eletrolítica.</li></ol><p class="subtle">Os três PDFs integrais de glicemia foram conferidos em 15/11/2026. Todos os links do UpToDate no aplicativo utilizam o domínio canônico www.uptodate.com. As recomendações foram resumidas; nenhuma pode substituir avaliação individual.</p>${caution}`;
}
function runKConcentrateConversion(){
 const output=document.getElementById('kConcentrateResult');if(!output)return;
 const raw=document.getElementById('kConcentrateMeq')?.value.trim()||'';
 const amount=raw?Number(raw.replace(',','.')):NaN;
 if(!Number.isFinite(amount)||amount<=0||amount>100){output.textContent='Informe uma quantidade positiva de K⁺ em mEq para converter. A ferramenta não define a dose.';return;}
 output.textContent=`${fmt(amount,1)} mEq ÷ 2,56 mEq/mL = ${fmt(amount/2.56,1)} mL de KCl concentrado 19,1%. Este NÃO é o volume final nem a velocidade da bomba. A dose selecionada exige indicação clínica independente.`;
}
function runKDeficitEstimate(){
 const output=document.getElementById('kDeficitResult');if(!output)return;
 if(!document.getElementById('kDeficitEligible')?.checked){output.textContent='Marque a condição de aplicabilidade para o exercício; não há cálculo para redistribuição ou causa indeterminada.';return;}
 const k=val(currentRecord()?.values||{},'k',0,15);
 const raw=document.getElementById('kDeficitBaseline')?.value?.trim()||'';
 const baseline=raw===''?NaN:Number(raw.replace(',','.'));
 if(k===null||!(k<3.5)||!Number.isFinite(baseline)||baseline<=k||baseline>6.5){output.textContent='Informe K⁺ medido abaixo de 3,5 mmol/L e um valor habitual anterior documentado maior que o atual. Sem esses dados, não estimar.';return;}
 const difference=baseline-k;
 output.textContent=`Exercício populacional: redução de ${fmt(difference,1)} mmol/L em relação ao K⁺ habitual corresponderia, em perda crônica, a aproximadamente ${fmt(difference*200,0)}–${fmt(difference*400,0)} mEq de déficit corporal. NÃO representa a dose a infundir: redistribuição, perdas ativas, função renal e evolução alteram a resposta.`;
}
function runKUrineRatio(){
 const output=document.getElementById('kUrineResult');if(!output)return;
 const kraw=document.getElementById('kUrineK')?.value?.trim()||'', craw=document.getElementById('kUrineCr')?.value?.trim()||'';
 const ku=kraw===''?NaN:Number(kraw.replace(',','.')),cr=craw===''?NaN:Number(craw.replace(',','.'));
 if(!Number.isFinite(ku)||ku<0||ku>300||!Number.isFinite(cr)||cr<=0||cr>1000){output.textContent='Informe K⁺ urinário em mEq/L e creatinina urinária em mg/dL, na mesma amostra.';return;}
 const ratio=100*ku/cr;
 output.textContent=`Razão K⁺/creatinina urinária = ${fmt(ratio,1)} mEq/g de creatinina. ${ratio>13?'Acima de 13 mEq/g, pode sugerir perda renal inadequada na hipocalemia.':'Até 13 mEq/g pode ser compatível com conservação renal de K⁺.'} Não define a etiologia isoladamente; considerar efeito de diuréticos, volume urinário, ácido-base e momento da coleta.`;
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
 document.getElementById('pfTabContent').innerHTML=kind==='k'?potassiumSciencePanel(tab):kind==='glucose'?glucoseSciencePanel(tab):kind==='ph'?phPanel(tab):kind==='integracao'?integrationPanel(tab):kind==='dco2'?dco2Panel(tab):kind==='hh'?hhPanel(tab):kind==='stewart'?stewartPanel(tab):kind==='compensation'?compensationPanel(tab):kind==='baseexcess'?bePanel(tab):kind==='cao2'?cao2Panel(tab):['cvo2','aav','eo2'].includes(kind)?oxygenVenousPanel(tab,kind):kind==='dph'||kind==='phest'?dphPanel(tab):pfPanel(tab);
}
function switchCase(id){activeId=id;recordId=activeCase()?.records[0]?.id||null;renderLayout();}
function update(){save();renderResults();}
document.querySelectorAll('[data-module]').forEach(btn=>btn.addEventListener('click',()=>switchModule(btn.dataset.module)));
document.getElementById('toggleJsonTools').onclick=()=>{const panel=document.getElementById('jsonToolBody'),button=document.getElementById('toggleJsonTools');panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));button.innerHTML=panel.hidden?'Abrir ferramentas <span aria-hidden="true">⌄</span>':'Recolher ferramentas <span aria-hidden="true">⌃</span>';};
document.getElementById('caseSelect').onchange=e=>switchCase(e.target.value);
document.getElementById('newCase').onclick=()=>{const title=prompt('Identificação fictícia ou código do caso (sem dados pessoais):','Novo caso');if(title===null)return;const c=createCase(title.trim().slice(0,100)||'Novo caso');cases.push(c);activeId=c.id;recordId=c.records[0].id;save();renderLayout();};
document.getElementById('loadExample').onclick=()=>{const c=exampleCase();cases.push(c);activeId=c.id;recordId=c.records[0].id;save();renderLayout();};
document.getElementById('newCaseFromEmpty').onclick=()=>document.getElementById('newCase').click();
document.getElementById('exampleFromEmpty').onclick=()=>document.getElementById('loadExample').click();
document.getElementById('addRecord').onclick=()=>{const c=activeCase();if(!c)return;const r={id:newId(),time:'',note:'',values:{}};c.records.push(r);recordId=r.id;save();renderLayout();};
document.getElementById('duplicateRecord').onclick=()=>{const c=activeCase(),r=currentRecord();if(!c||!r)return;const copy=structuredClone(r);copy.id=newId();copy.note=(copy.note||'')+' (cópia)';copy.time='';c.records.push(copy);recordId=copy.id;save();renderLayout();};
document.getElementById('deleteRecord').onclick=()=>{const c=activeCase(),r=currentRecord();if(!c||!r||!confirm('Excluir este registro?'))return;c.records=c.records.filter(x=>x.id!==r.id);if(!c.records.length)c.records=[{id:newId(),time:'',note:'',values:{}}];recordId=c.records[Math.max(0,c.records.length-1)].id;save();renderLayout();};
document.getElementById('deleteCase').onclick=()=>{const c=activeCase();if(!c||!confirm(`Excluir o caso “${c.title}” e todos os seus registros?`))return;cases=cases.filter(x=>x.id!==c.id);activeId=cases[0]?.id||null;recordId=cases[0]?.records[0]?.id||null;save();renderLayout();};
document.getElementById('exportCases').onclick=()=>{const blob=new Blob([JSON.stringify({format:'fisiologia-perioperatoria-cases-v04',exportedAt:new Date().toISOString(),cases},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='fisiologia-perioperatoria-casos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.getElementById('importCases').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error('Arquivo maior que 5 MB.');const raw=JSON.parse(await file.text());if(raw.format!=='fisiologia-perioperatoria-cases-v04'||!Array.isArray(raw.cases)||raw.cases.length>1000||!raw.cases.every(validCase))throw Error('Formato de arquivo inválido.');if(!confirm(`Importar ${raw.cases.length} caso(s)? Os novos casos serão adicionados aos existentes.`))return;for(const imported of raw.cases){const c=structuredClone(imported);c.id=newId();c.title=c.title.slice(0,100);c.kind=c.kind==='didactic'?'didactic':'case';c.records.forEach(r=>{r.id=newId();r.note=r.note.slice(0,180);r.time=r.time.slice(0,16);const filtered={};for(const k of [...Object.values(fields).flat().map(x=>x[0]),...legacyNumberKeys])if(typeof r.values[k]==='number'&&Number.isFinite(r.values[k]))filtered[k]=r.values[k];if(typeof r.values.ieratio==='string'&&r.values.ieratio.length<=12)filtered.ieratio=r.values.ieratio;if(DISORDERS.includes(r.values.primaryDisorder))filtered.primaryDisorder=r.values.primaryDisorder;r.values=filtered;});const p=c.profile;c.profile={age:val(p,'age',0,125),sex:['masculino','feminino'].includes(p.sex)?p.sex:'',height:val(p,'height',0,250),weight:val(p,'weight',0,500),description:String(p.description||'').slice(0,180)};cases.push(c);}activeId=cases.at(-1)?.id||null;recordId=activeCase()?.records[0]?.id||null;save();renderLayout();}catch(err){alert('Não foi possível importar: '+err.message);}finally{e.target.value='';}};
document.addEventListener('input',e=>{const target=e.target;const r=currentRecord(),c=activeCase();if(!r||!c)return;if(target.matches('[data-field]')){const raw=target.value.trim().replace(',','.');r.values[target.dataset.field]=target.dataset.field==='ieratio'?(raw||null):(raw===''?null:Number(raw));update();}else if(target.matches('[data-profile]')&&target.tagName!=='SELECT'){const k=target.dataset.profile;const raw=target.value.trim().replace(',','.');c.profile[k]=k==='description'?target.value:(raw===''?null:Number(raw));update();}else if(target.id==='recordNote'){r.note=target.value;save();}});
document.addEventListener('change',e=>{if(e.target.id==='primaryDisorder'){const r=currentRecord();if(r){r.values.primaryDisorder=DISORDERS.includes(e.target.value)?e.target.value:'';update();}}if(e.target.matches('[data-profile]')){const c=activeCase();if(c){c.profile[e.target.dataset.profile]=e.target.value;update();}}if(e.target.id==='recordTime'){const r=currentRecord();if(r){r.time=e.target.value;save();renderLayout();}}if(e.target.id==='chartMetric')renderEvolution();});
document.addEventListener('click',e=>{const tab=e.target.closest('[data-record]');if(tab){recordId=tab.dataset.record;renderLayout();return;}if(e.target.closest('#kDeficitButton')){runKDeficitEstimate();return;}if(e.target.closest('#kUrineButton')){runKUrineRatio();return;}if(e.target.closest('#kConcentrateButton')){runKConcentrateConversion();return;}const scienceTab=e.target.closest('[data-pf-tab]');if(scienceTab){renderScienceTab(scienceTab.dataset.pfTab);return;}const card=e.target.closest('[data-info]');if(card)info(card.dataset.info);});
document.getElementById('openIntegration').onclick=()=>info('integracao');
document.getElementById('closeDialog').onclick=()=>document.getElementById('infoDialog').close();
renderLayout();
