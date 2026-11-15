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
 arterialFields:[['fio2','FiO₂','%'],['hb','Hb arterial','g/dL'],['aph','pH',''],['apo2','PaO₂','mmHg'],['apco2','PaCO₂','mmHg'],['aso2','SaO₂','%'],['hco3','HCO₃⁻ informado','mmol/L']],
 venousFields:[['hbv','Hb venosa · opcional','g/dL'],['vph','pH venoso',''],['vpo2','PcvO₂','mmHg'],['vpco2','PcvCO₂','mmHg'],['vso2','ScvO₂','%'],['vhco3','HCO₃⁻ venoso informado','mmol/L']],
 ventFields:[['vt','VC expirado','mL'],['rr','FR total','irpm'],['minute','VM medido','L/min'],['pause','Pausa inspiratória','%'],['ieratio','Relação I:E (ex.: 1:2)',''],['pplat','Platô (Pplat)','cmH₂O'],['peep','PEEP','cmH₂O'],['ppeak','Pico (Ppico)','cmH₂O']],
 hemoFields:[['co','Débito cardíaco','L/min'],['hr','FC','bpm'],['map','PAM','mmHg'],['cvp','PVC','mmHg']],
 advancedFields:[['pb','Pressão barométrica','mmHg'],['rq','Quociente respiratório assumido','']],
 acidFields:[['na','Sódio (Na⁺)','mmol/L'],['k','Potássio (K⁺)','mmol/L'],['cl','Cloreto (Cl⁻)','mmol/L'],['lactate','Lactato','mmol/L']],
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
 pf:['Relação PaO₂/FiO₂','Índice de oxigenação arterial ajustado à FiO₂.','P/F = PaO₂ / (FiO₂ / 100)','A P/F depende de condições ventilatórias, pressão barométrica e circulação; não determina shunt ou SDRA isoladamente.'],
 dco2:['Gradiente venoso central–arterial de PCO₂','Diferença de pressões parciais de CO₂, não de conteúdos.','ΔPCO₂ = PcvCO₂ − PaCO₂','Não mede débito cardíaco ou hipoperfusão diretamente.'],
 dph:['Diferença arterial–venosa de pH','Diferença entre pH arterial e venoso central.','ΔpH = pH arterial − pH venoso','Escala logarítmica, não equivale à diferença de concentração de H⁺.'],
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
 ['EQUILÍBRIO ACIDOBÁSICO',[['hco3a','HCO₃⁻ arterial (H–H)','mmol/L',1],['hco3v','HCO₃⁻ venoso (H–H)','mmol/L',1],['hplusA','H⁺ arterial','nmol/L',1],['hplusV','H⁺ venoso','nmol/L',1],['sidnacl','Na⁺ − Cl⁻ (SID aprox.)','mmol/L',1],['sids','SID simplificado','mEq/L',1],['sida','SID aparente','mEq/L',1],['side','SID efetivo','mEq/L',1],['sig','SIG','mEq/L',1],['ag','Ânion gap (sem K⁺)','mmol/L',1],['agcorr','AG corrigido (albumina)','mmol/L',1]]],
 ['COMPENSAÇÃO ACIDOBÁSICA',[['pco2exp','PaCO₂ esperada','mmHg',1],['hco3exp','HCO₃⁻ esperado','mmol/L',1]]],
 ['GASOMETRIA E OXIGENAÇÃO',[['pf','Relação P/F','mmHg',1],['dco2','ΔPCO₂','mmHg',1],['dph','ΔpH','',2],['cao2','CaO₂','mL/dL',2],['cvo2','CcvO₂ estimado','mL/dL',2],['aav','CaO₂ − CcvO₂','mL/dL',2],['eo2','Extração central','%',1],['pao2','PAO₂ estimada','mmHg',1],['aagrad','Gradiente A–a','mmHg',1]]],
 ['PACIENTE E VENTILAÇÃO',[['pbw','PBW','kg',1],['bsa','Superfície corporal','m²',2],['vtpbw','VC/PBW','mL/kg',1],['ve','VM calculado','L/min',2],['ie','Relação I:E','',2]]],
 ['MECÂNICA E CIRCULAÇÃO',[['dp','Driving pressure (aprox.)','cmH₂O',1],['cstat','Complacência estática (aprox.)','mL/cmH₂O',1],['cdyn','Complacência dinâmica (aprox.)','mL/cmH₂O',1],['do2','DO₂','mL/min',1],['doi','DO₂ indexado','mL/min/m²',1]]]
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
  hco3a,hco3v,hplusA:pHa===null?null:Math.pow(10,9-pHa),hplusV:pHv===null?null:Math.pow(10,9-pHv),sidnacl:sidNaCl,sids:simpleSid,sida,side,sig:maybe(sida,side)?sida-side:null,ag:anionGap,agcorr:correctedAG,pco2exp:comp?.kind==='pco2'&&Number.isFinite(comp.middle)?comp.middle:null,hco3exp:comp?.kind==='hco3'&&Number.isFinite(comp.middle)?comp.middle:null,
  pf:maybe(fio,pa)?pa/(fio/100):null,dco2:maybe(pc,pv)?pv-pc:null,dph:maybe(pHa,pHv)?pHa-pHv:null,
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
function fieldsHtml(r,id){return fields[id].map(([key,label,unit])=>{
 const x=r.values[key];const isText=key==='ieratio';
 return `<div class="field"><label for="f_${key}">${label} <span class="unit">${unit}</span></label><input id="f_${key}" data-field="${key}" type="${isText?'text':'number'}" ${isText?'maxlength="12"':'step="any" inputmode="decimal"'} value="${x===null||x===undefined?'':esc(x)}" placeholder="${isText?'1:2':'—'}"></div>`;
 }).join('');}
function renderLayout(){const c=activeCase();document.getElementById('caseSelect').innerHTML=cases.length?cases.map(x=>`<option value="${esc(x.id)}" ${x.id===activeId?'selected':''}>${esc(x.title)}</option>`).join(''):'<option value="">Nenhum caso</option>';
 document.getElementById('caseArea').hidden=!c;document.getElementById('emptyArea').hidden=!!c;
 if(!c)return;const r=currentRecord();recordId=r?.id||null;
 document.getElementById('profileFields').innerHTML=profileHtml(c);
 document.getElementById('recordTabs').innerHTML=c.records.map((x,i)=>`<button type="button" class="record-tab ${x.id===recordId?'selected':''}" data-record="${esc(x.id)}"><b>Registro ${i+1}</b><small>${esc(x.time?x.time.replace('T',' '):'Sem data')}</small></button>`).join('');
 document.getElementById('recordTime').value=r?.time||'';document.getElementById('recordNote').value=r?.note||'';
 for(const id of Object.keys(fields))document.getElementById(id).innerHTML=fieldsHtml(r,id);
 document.getElementById('primaryDisorder').value=DISORDERS.includes(r?.values.primaryDisorder)?r.values.primaryDisorder:'';
 renderResults();}
function renderResults(){const c=activeCase(),r=currentRecord();if(!c||!r)return;const results=compute(r.values,c.profile);
 document.getElementById('validation').textContent='Os resultados aparecem conforme dados válidos são inseridos.';
 const cards=metricGroups.map(([category,items])=>{
  const available=items.filter(([key])=>Number.isFinite(results[key]));
  if(!available.length)return '';
  return `<div class="metric-group-label">${category}</div>`+available.map(([key,label,unit,places])=>`<button class="metric" data-info="${key}"><span class="label">${label}</span><span class="number">${key==='ie'?fmtIE(results[key]):fmt(results[key],places)}</span><span class="unit">${unit}</span><span class="more">Entender fórmula e limites ↗</span></button>`).join('');
 }).join('');
 document.getElementById('metricCards').innerHTML=cards||'<p class="hint">Preencha os dados disponíveis. Apenas índices com requisitos satisfeitos aparecerão aqui.</p>';
 renderCompensation(r.values,results);
 renderEvolution();}
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
function renderEvolution(){const c=activeCase();if(!c)return;
 const maxShown=Math.min(c.records.length,50),cols=c.records.slice(0,maxShown),computed=cols.map(r=>compute(r.values,c.profile));
 const shownMetrics=allMetrics.filter(([key])=>computed.some(x=>Number.isFinite(x[key])));
 const metricSelect=document.getElementById('chartMetric'),old=metricSelect.value;
 metricSelect.innerHTML=shownMetrics.map(([key,label])=>`<option value="${key}" ${old===key?'selected':''}>${label}</option>`).join('');
 const chosen=shownMetrics.some(m=>m[0]===old)?old:shownMetrics[0]?.[0];metricSelect.value=chosen||'';
 document.getElementById('compareHead').innerHTML=`<tr><th>Índice</th>${cols.map((r,i)=>`<th>R${i+1}${r.time?' · '+esc(r.time.replace('T',' ')):''}</th>`).join('')}</tr>`;
 document.getElementById('compareBody').innerHTML=shownMetrics.map(([key,label,unit,places])=>`<tr><td>${esc(label)} <span class="unit">${unit}</span></td>${computed.map(x=>`<td>${key==='ie'&&Number.isFinite(x[key])?fmtIE(x[key]):fmt(x[key],places)}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="2">Nenhum índice calculável ainda.</td></tr>';
 const points=computed.map((x,i)=>({i,v:x[chosen]})).filter(p=>Number.isFinite(p.v));const canvas=document.getElementById('chartBox');
 if(points.length<2){canvas.innerHTML='<div class="empty-chart">Preencha pelo menos dois registros com dados suficientes para visualizar esta variável.</div>';return;}
 const w=720,h=205,left=55,right=20,top=20,bottom=42;let min=Math.min(...points.map(p=>p.v)),max=Math.max(...points.map(p=>p.v));const pad=Math.max((max-min)*.15,Math.abs(max)*.05,.5);min-=pad;max+=pad;
 const x=i=>left+(w-left-right)*(cols.length===1?0:i/(cols.length-1));const y=v=>top+(h-top-bottom)*(max-v)/(max-min);
 const line=points.map(p=>`${x(p.i)},${y(p.v)}`).join(' ');
 canvas.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Evolução de ${esc(allMetrics.find(m=>m[0]===chosen)?.[1]||chosen)}"><g fill="none" stroke="#dfe7ee">${[0,1,2,3,4].map(i=>`<line x1="${left}" y1="${top+(h-top-bottom)*i/4}" x2="${w-right}" y2="${top+(h-top-bottom)*i/4}"/>`).join('')}</g><g font-size="11" fill="#718799">${[0,1,2,3,4].map(i=>`<text x="${left-8}" y="${top+(h-top-bottom)*i/4+4}" text-anchor="end">${fmt(max-(max-min)*i/4,1)}</text>`).join('')}${cols.map((r,i)=>`<text x="${x(i)}" y="${h-15}" text-anchor="middle">R${i+1}</text>`).join('')}</g><polyline points="${line}" fill="none" stroke="#287da6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${points.map(p=>`<circle cx="${x(p.i)}" cy="${y(p.v)}" r="4.5" fill="#287da6"><title>Registro ${p.i+1}: ${fmt(p.v,2)}</title></circle>`).join('')}</svg>`;
}
function info(key){const definition=definitions[key];if(!definition)return;const [title,description,equation,limit]=definition;document.getElementById('dialogTitle').textContent=title;const node=document.getElementById('dialogContent');node.replaceChildren();if(key==='pf'||key==='dco2'||key==='cao2'||['hco3a','hco3v','hplusA','hplusV','sids','sida','side','sig','pco2exp','hco3exp'].includes(key)){
 const bar=document.createElement('div');bar.className='pf-tabs';bar.id='pfTabBar';bar.dataset.scienceKind=['hco3a','hco3v','hplusA','hplusV'].includes(key)?'hh':(['sids','sida','side','sig'].includes(key)?'stewart':(['pco2exp','hco3exp'].includes(key)?'compensation':key));bar.setAttribute('role','tablist');for(const t of pfTabs){const button=document.createElement('button');button.type='button';button.textContent=t.label;button.dataset.pfTab=t.id;button.setAttribute('role','tab');bar.appendChild(button);}const content=document.createElement('div');content.id='pfTabContent';content.className='pf-tab-content';node.append(bar,content);renderScienceTab('entender');
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

function renderScienceTab(tab){
 const bar=document.getElementById('pfTabBar');
 if(!bar)return;
 bar.querySelectorAll('button').forEach(button=>{
  const active=button.dataset.pfTab===tab;
  button.classList.toggle('selected',active);
  button.setAttribute('aria-selected',String(active));
 });
 const kind=bar.dataset.scienceKind;
 document.getElementById('pfTabContent').innerHTML=kind==='dco2'?dco2Panel(tab):kind==='hh'?hhPanel(tab):kind==='stewart'?stewartPanel(tab):kind==='compensation'?compensationPanel(tab):kind==='cao2'?cao2Panel(tab):pfPanel(tab);
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
document.getElementById('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error('Arquivo maior que 5 MB.');const raw=JSON.parse(await file.text());if(raw.format!=='fisiologia-perioperatoria-cases-v04'||!Array.isArray(raw.cases)||raw.cases.length>1000||!raw.cases.every(validCase))throw Error('Formato de arquivo inválido.');if(!confirm(`Importar ${raw.cases.length} caso(s)? Os novos casos serão adicionados aos existentes.`))return;for(const imported of raw.cases){const c=structuredClone(imported);c.id=newId();c.title=c.title.slice(0,100);c.records.forEach(r=>{r.id=newId();r.note=r.note.slice(0,180);r.time=r.time.slice(0,16);const filtered={};for(const k of [...Object.values(fields).flat().map(x=>x[0]),...legacyNumberKeys])if(typeof r.values[k]==='number'&&Number.isFinite(r.values[k]))filtered[k]=r.values[k];if(typeof r.values.ieratio==='string'&&r.values.ieratio.length<=12)filtered.ieratio=r.values.ieratio;if(DISORDERS.includes(r.values.primaryDisorder))filtered.primaryDisorder=r.values.primaryDisorder;r.values=filtered;});const p=c.profile;c.profile={age:val(p,'age',0,125),sex:['masculino','feminino'].includes(p.sex)?p.sex:'',height:val(p,'height',0,250),weight:val(p,'weight',0,500),description:String(p.description||'').slice(0,180)};cases.push(c);}activeId=cases.at(-1)?.id||null;recordId=activeCase()?.records[0]?.id||null;save();renderLayout();}catch(err){alert('Não foi possível importar: '+err.message);}finally{e.target.value='';}};
document.addEventListener('input',e=>{const target=e.target;const r=currentRecord(),c=activeCase();if(!r||!c)return;if(target.matches('[data-field]')){const raw=target.value.trim().replace(',','.');r.values[target.dataset.field]=target.dataset.field==='ieratio'?(raw||null):(raw===''?null:Number(raw));update();}else if(target.matches('[data-profile]')&&target.tagName!=='SELECT'){const k=target.dataset.profile;const raw=target.value.trim().replace(',','.');c.profile[k]=k==='description'?target.value:(raw===''?null:Number(raw));update();}else if(target.id==='recordNote'){r.note=target.value;save();}});
document.addEventListener('change',e=>{if(e.target.id==='primaryDisorder'){const r=currentRecord();if(r){r.values.primaryDisorder=DISORDERS.includes(e.target.value)?e.target.value:'';update();}}if(e.target.matches('[data-profile]')){const c=activeCase();if(c){c.profile[e.target.dataset.profile]=e.target.value;update();}}if(e.target.id==='recordTime'){const r=currentRecord();if(r){r.time=e.target.value;save();renderLayout();}}if(e.target.id==='chartMetric')renderEvolution();});
document.addEventListener('click',e=>{const tab=e.target.closest('[data-record]');if(tab){recordId=tab.dataset.record;renderLayout();return;}const scienceTab=e.target.closest('[data-pf-tab]');if(scienceTab){renderScienceTab(scienceTab.dataset.pfTab);return;}const card=e.target.closest('[data-info]');if(card)info(card.dataset.info);});
document.getElementById('closeDialog').onclick=()=>document.getElementById('infoDialog').close();
renderLayout();
