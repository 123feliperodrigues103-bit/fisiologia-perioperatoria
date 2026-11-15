# Fisiologia Perioperatória — v0.5.7.1 (candidata para teste)

## Quatro formas de incluir uma gasometria

O botão **Importar gasometria** abre um painel com quatro abas:

1. **Manual:** os campos atuais continuam disponíveis e inalterados.
2. **Colar texto:** cole o laudo copiado do sistema do laboratório (inclusive intervalos de referência). O parser JavaScript reconhece os valores do paciente, separa intervalos, identifica rótulos, usa a origem arterial/venosa central explicitamente informada e oferece **prévia editável**. Não transforma horário de emissão do laudo em horário da coleta.
3. **Foto:** escolha JPG/PNG/WEBP (até 10 MB). O Tesseract.js 5.1.1 é carregado sob demanda do CDN e faz OCR **no próprio navegador**, sem enviar a imagem a uma API de IA. Exige internet para baixar o motor, WebAssembly e idiomas, especialmente na primeira utilização; o OCR pode falhar em fotos desfocadas. Depois da leitura, o texto fica disponível para correção e análise pelo mesmo parser de texto. O teste automatizado cobriu o fluxo da interface com OCR simulado, **não o reconhecimento real da foto pela biblioteca em todos os navegadores**. Priorize testar em HTTPS após revisão local.
4. **JSON + IA:** instrução copiável, com esquema e chaves oficiais, para qualquer IA capaz de interpretar imagem/texto e gerar um arquivo `.json`. Continua usando o botão existente **Importar JSON**, que adiciona casos e não substitui os atuais.

## Segurança da prévia e do armazenamento

- O site pede conferência **explícita** da origem arterial ou venosa central antes de preencher. Um laudo identificado apenas como "amostra não específica" **não é presumido arterial**.
- O usuário pode corrigir, omitir ou manter valores; todos devem estar dentro de limites técnicos de entrada. Resultados com unidades incompatíveis são rejeitados (ex.: lactato em mg/dL não é convertido silenciosamente).
- A opção padrão cria **novo registro no caso ativo**; é possível preencher o registro atual (aviso de sobreposição) ou criar caso novo. Não armazena texto bruto/imagen; ficam apenas valores e uma observação genérica desidentificada.
- Textos com cabeçalhos arterial e venoso misturados são bloqueados para impedir que dados de duas amostras sejam escritos como uma.
- O texto da gasometria e a imagem não são enviados ao backend pelo código da plataforma. Na opção de foto, o navegador faz requisições de **download das bibliotecas e modelos de OCR** a fornecedores externos (CDN); para segurança de dados clínicos, use apenas material fictício ou anonimizado e respeite as regras do serviço/LGPD.
- O JSON não contém criptografia; enviar laudos a IA de terceiros implica outro serviço e outra política de tratamento de dados. **Remova dados identificáveis antes de compartilhar**.
- O valor BE do laudo é armazenado como apresentado, sem assumir BE(B) versus BEecf. CO₂ total, glicose, hematócrito e outras variáveis sem campo no site são reconhecidas ou ignoradas, mas não criam cálculos novos.

## Testes no navegador

- Laudo venoso central no formato fornecido pelo usuário: **pH 7,34; PcvO₂ 57,70; PcvCO₂ 44,00; HCO₃⁻ 23,20; BE −2,00; ScvO₂ 86,30**. Intervalos de referência não foram importados e CO₂ total 24,60 ficou apenas como metadado visível na prévia.
- Formato Radiometer ABL digitado, com rótulos `cHCO3-(P)c`, `ABEc`, `cNa+`, `cK+`, `cCa2+` e `cLac`, frações 21% e vírgulas decimais: parâmetros conhecidos mapeados corretamente; origem não específica exigiu seleção manual.
- Criação de caso novo, segundo registro, persistência local (chave `fisiologia-perioperatoria-v04-cases`), conferência do tipo de amostra, exportação JSON e cálculos preexistentes testados.
- Integração de leitura de foto testada com motor OCR simulado. O carregamento externo e a precisão real de OCR precisam ser validados no dispositivo do usuário.

## Instalando a versão

Os **cinco arquivos** da raiz do ZIP devem ficar juntos: `index.html`, `styles.css`, `script.js`, `importer.js` (novo) e `README.md`. **Não esqueça o `importer.js`**, que não existia nas versões anteriores. Continue sem bibliotecas de compilação nem servidor próprio; as entradas manual, texto e JSON funcionam sem dependências remotas. A aba Foto precisa de internet na primeira utilização.

**Não publicar até completar os testes no Chrome.** O projeto é educacional e não substitui validação clínica.

---

# Fisiologia Perioperatória — v0.5.6

## Novo nesta versão

- BE arterial e venoso central **informados no laudo** como entradas numéricas opcionais. O valor do gasômetro tem prioridade.
- Quando faltar o BE de uma amostra, a plataforma calcula **SBE estimado** usando pH e bicarbonato informado daquela mesma amostra ou, se ausente, o HCO₃⁻ calculado por Henderson–Hasselbalch. Não apresenta BE(B) calculado como equivalente ao SBE.
- Ficha científica de Base Excess com quatro abas (Entender, Fórmula, Limitações, Referências), exemplos dinâmicos e distinção BE(B) versus BEecf.
- Inclusão de BE no painel de integração fisiológica, sem novas decisões ou diagnósticos automáticos.
- Chaves `be` e `bev` são opcionais no mesmo JSON/formato v0.4, sem migração de casos e sem alterar a chave localStorage. Os dados antigos continuam compatíveis.
- BE do equipamento é ele mesmo calculado e pode variar conforme o algoritmo; se o laudo não especificar BE(B)/BEecf o site não presume a modalidade.

## Fórmula do SBE didático

SBE = 0,9287 × [HCO₃⁻ − 24,4 + 14,83 × (pH − 7,40)], em mEq/L. Usar HCO₃⁻ em mmol/L. Não interpretar um BE negativo como diagnóstico isolado de acidose láctica ou indicação de bicarbonato.

## Referências

- Siggaard-Andersen: https://pubmed.ncbi.nlm.nih.gov/13478/
- Kellum: https://pmc.ncbi.nlm.nih.gov/articles/PMC1297616/
- Understanding base excess (2022): https://link.springer.com/article/10.1007/s00134-022-06748-4
- French expert guidelines (2019): https://pmc.ncbi.nlm.nih.gov/articles/PMC6695455/

## Histórico e compatibilidade

- Ventilação reduzida aos campos usuais do carrinho: VC expirado, FR, VM, pausa inspiratória, I:E, Pplat, PEEP e Ppico. A FiO₂ permanece na seção de gasometria arterial.
- Módulo de equilíbrio acidobásico com bicarbonato calculado por Henderson–Hasselbalch (arterial e venoso central), H⁺, SID simplificado, SID aparente, SID efetiva e SIG.
- Detalhes de eletrólitos e condições avançadas recolhíveis; apenas resultados que podem ser calculados aparecem.
- ΔpH medido e estimativa de pH arterial pela amostra venosa central têm ficha científica com quatro abas.
- Fichas científicas para Henderson–Hasselbalch e Stewart, além das existentes para P/F e ΔPCO₂.

## Requisitos científicos e limites

- HCO₃⁻ calculado de pH e PCO₂ NÃO é uma medida independente.
- SID simplificado = Na + K − Cl − lactato (mmol/L monovalentes). SIDa também inclui 2×Ca²⁺ e 2×Mg²⁺ fornecidos em mmol/L.
- SIDe: HCO₃⁻ arterial calculado + albumina (convertida de g/dL para g/L) × (0,123pH−0,631) + fosfato (mmol/L) × (0,309pH−0,469).
- SIG = SIDa−SIDe. É estimativa, não identificação de uma substância.
- Para driving pressure e complacência com um único campo PEEP, assume-se que a PEEP informada representa adequadamente a PEEP total e que Pplat foi medida corretamente em paciente passivo. A interface NÃO verifica essas premissas; os resultados são rotulados como aproximações.
- A entrada de pausa inspiratória (%) é apenas registro; não certifica pausa válida ou paciente passivo.
- Apenas uma estimativa separada e claramente rotulada do pH arterial pode ser exibida a partir do pH venoso central; ela NÃO alimenta outros cálculos arteriais.

## Compatibilidade de dados

O armazenamento local e o formato de exportação/importação usam o mesmo identificador da v0.4. Casos existentes devem continuar disponíveis ao atualizar os arquivos no mesmo domínio. O novo campo I:E é texto (ex.: `1:2`); os demais são numéricos. Arquivos JSON da v0.4 continuam importáveis.

Se os casos guardados no navegador forem importantes e você quiser preservar uma cópia independente, a exportação JSON é opcional e recomendada. Dados fictícios/desidentificados apenas: JSON não é criptografado. Teste localmente no navegador antes de publicar.

## Fontes científicas auxiliares

- https://pmc.ncbi.nlm.nih.gov/articles/PMC9416819/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC2702213/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC1175910/

Não validado para diagnóstico ou orientação terapêutica; uso educacional.

## Ajustes v0.5.1

- Na⁺, K⁺, Cl⁻ e lactato agora estão visíveis no painel acidobásico; albumina, fosfato, cálcio e magnésio continuam opcionais e recolhíveis.
- Diferença Na−Cl (aproximação grosseira), SID simplificada, SIDa, SIDe, SIG e ânion gap sem K⁺ (com correção por albumina quando disponível).
- Seleção **manual** de hipótese de distúrbio primário por registro: acidose/alcalose metabólica, acidose/alcalose respiratória aguda ou crônica.
- PaCO₂ esperada na acidose metabólica pela fórmula de Winter (±2); alcalose metabólica pela relação aproximada 40 + 0,7 × (HCO₃−24) (±5).
- HCO₃⁻ esperado nos quatro cenários respiratórios, com faixa de compensação para respostas agudas e crônicas.
- Se houver apenas bicarbonato venoso, pode-se mostrar uma **estimativa de PaCO₂ esperada** sob hipótese metabólica, mas **não comparar com PcvCO₂** como se fosse arterial.
- HCO₃⁻ informado arterial/venoso tem preferência sobre HCO₃⁻ recalculado por Henderson–Hasselbalch nas fórmulas de compensação; permanecem diferenciados no código.
- Preservados `localStorage` e o formato JSON `fisiologia-perioperatoria-cases-v04`, garantindo compatibilidade com backups v0.4/v0.5.

### Referências complementares

- Merck Manual Professional, *Acid-Base Disorders* e *Primary Changes and Compensations in Simple Acid-Base Disorders*: https://www.merckmanuals.com/professional/multimedia/table/primary-changes-and-compensations-in-simple-acid-base-disorders
- McGraw-Hill, *Acid-Base Emergencies*: https://accessworldmed.mhmedical.com/content.aspx?bookid=3367&sectionid=281696574

**Uso educacional; fórmulas de compensação são aproximações, não diagnósticos automáticos.**

## Ajustes v0.5.2 — Ficha científica CaO₂

- A ficha CaO₂ agora tem as quatro abas: Entender, Fórmula, Limitações e Referências.
- Exemplo dinâmico para o registro ativo, separando O₂ ligado à Hb, dissolvido e percentual dissolvido; exibe DO₂ se o DC estiver informado.
- Discussão da curva de dissociação, P₅₀, efeito Bohr, diferença entre PaO₂, SaO₂, SpO₂ e CaO₂, capacidade teórica (1,39) e prática (1,34) da Hb, saturação funcional/fracional e dis-hemoglobinemias.
- Correções na pesquisa: não assumir shunt em hipoxemia sem etiologia estabelecida; não generalizar 1,34 vs 1,38 como simples chave de saturação; referência de Janotka & Ostadal corretamente identificada como Molecular and Cellular Biochemistry.
- NÃO foram adicionados campos, variáveis, chaves do armazenamento, cálculos da plataforma ou gráficos novos. A única mudança funcional é o diálogo do CaO₂; casos e backups permanecem no formato anterior.

### Teste dirigido

Abra um caso, informe Hb=15, SaO₂=98%, PaO₂=100 mmHg e clique na ficha de CaO₂: deve mostrar 19,698 mL/dL ligado à Hb, 0,310 dissolvido e CaO₂=20,01 mL/dL. Modifique Hb para 7: CaO₂=9,50 mL/dL. Confira as 4 abas.

## Ajustes v0.5.3 — Ficha ΔpH e estimativa venosa central → arterial

- ΔpH arterial menos venoso central passa a ter ficha científica de quatro abas.
- Se houver **apenas pH venoso central** em faixa não extrema (7,20–7,60), surge um cartão claramente rotulado de **pH arterial aproximado (estimativa)**, com ponto central pHcv+0,04; na ficha aparece a faixa de diferenças típicas populacionais pHcv+0,03 a +0,05. **Não** é intervalo de confiança/predição individual nem medida arterial.
- Se o pH arterial estiver presente, a estimativa não é exibida; havendo também pH venoso, aparece o ΔpH real das amostras.
- A aproximação não é usada em nenhum cálculo arterial, gasométrico, acidobásico, Stewart, de compensação ou de oxigenação.
- A interface não detecta choque, instabilidade hemodinâmica nem amostra venosa periférica: a fórmula pode ser inadequada mesmo se o pH estiver entre 7,20 e 7,60.
- As diferenças típicas e limitações foram extraídas do UpToDate, **Venous blood gases and alternatives to arterial carbon dioxide measurement in adults** (Arthur C Theodore, atualização 12/06/2026), tabela 2 e texto correlato, fornecido pelo usuário.
- Os casos salvos, formulário, JSON e chave localStorage permanecem iguais aos da v0.5.2.

### Teste dirigido

Após criar ou carregar um caso, deixe o pH arterial vazio e informe pH venoso central de 7,30. Deve aparecer **pH arterial ≈ (estimativa) = 7,34**. Abra a ficha para ver a faixa **7,33–7,35**. Depois informe pH arterial 7,36: o cartão estimado deve desaparecer e dar lugar a **ΔpH medido = 0,06**. Não publique antes de conferir essas condições no Chrome.

## v0.5.5 — Três fichas da Investigação Científica 004

- CcvO₂, C(a−cv)O₂ e extração central estimada agora dispõem, individualmente, de quatro abas: Entender, Fórmula, Limitações, Referências.
- Cálculos **dinâmicos** com o registro ativo; CcvO₂ discrimina o O₂ ligado à Hb, dissolvido e a origem da Hb (venosa medida ou arterial usada como hipótese).
- A diferença de conteúdos mostra o cálculo completo; a extração mostra o cálculo completo e, apenas se comparáveis as concentrações de Hb, a aproximação por saturações.
- Conteúdo venoso central NÃO é conteúdo venoso misto, nem permite obter VO₂ sistêmico exato por Fick. Não há classificação diagnóstica automática.
- Revisão científica: não concluir shunt ou hipoxia citopática por ScvO₂ alta + lactato alto; não converter ScvO₂ para SvO₂ com correção fixa; dados de concordância da metanálise de Li et al. advêm de subconjunto (10 estudos, n=524).
- Mantém **oito entradas ventilatórias**, nenhuma nova variável de entrada, nenhuma mudança nas fórmulas numéricas já existentes, `localStorage` e formato JSON v0.4.
- Na base de conhecimento, a nova ficha exige preferência por co-oximetria quando disponível, atenção à coleta simultânea, Hb venosa medida versus Hb arterial estimada, concentração versus saturação e papel da parcela dissolvida.

### Teste local recomendado

Carregue ou crie um caso. Entre com Hb 10 g/dL, SaO₂ 98%, PaO₂ 100 mmHg, ScvO₂ 70%, PcvO₂ 40 mmHg. Sem Hb venosa adicional: CaO₂=13,442 mL/dL, CcvO₂=9,504 mL/dL, diferença=3,938 mL/dL, extração central estimada≈29,3%. Clique em cada um dos três cartões e abra as quatro abas; na ficha de CcvO₂ confirme aviso de Hb arterial como aproximação. Depois informe Hb venosa diferente e confirme que a aproximação por saturações deixa de ser exibida. Não publique antes de testar no navegador.

### Referências
- https://pmc.ncbi.nlm.nih.gov/articles/PMC7921020/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC13195361/


## v0.5.5 — Ficha integrada dos índices de perfusão
- Adicionado somente um acesso discreto "Explorar integração fisiológica" na seção de resultados: sem campos novos e sem novas métricas automaticamente diagnósticas.
- Ficha em quatro abas (Entender, Fórmula, Limitações, Referências) para interpretar ScvO₂, ΔPcv-aCO₂, C(a−cv)O₂ e lactato. Os quatro valores são extraídos do registro ativo, sem inferir mecanismo.
- Razão ΔPCO₂/C(a−cv)O₂ calculada somente dentro da aba Fórmula, rotulada como demonstração exploratória dimensional, nunca equiparada ao quociente respiratório RQ; não exibida se denominador ≤ 0,5 mL/dL ou dados ausentes.
- Evidências: Dubin et al. 2020, Gutierrez et al. 2025 (epub 2024), Su et al. 2018 e Janotka & Ostadal 2021.
- Preservados formatos do JSON, chave localStorage, cálculos e campos anteriores. Não validada para decisões clínicas.


## Revisão v0.5.7.1 — melhoria do OCR após fotografia real

- No modo Foto, opção de recorte automático central (ativada por padrão) e autocontraste da imagem antes do OCR. Pode ser desativado para outras posições de laudo. O recorte exclui na maioria dos recibos o cabeçalho/etiqueta, mas NÃO substitui a remoção de dados identificadores antes da fotografia.
- O parser agora tolera rótulos deformados (pO,, pCO,, cHCO,(P)c, ABEç, sO,, cCa?, etc.) e ignora a seção de valores corrigidos pela temperatura.
- Resultados OCR numericamente fora da faixa técnica (ex.: `974%`, `69 mmol/L`, `36 mmol/L`) NÃO são corrigidos automaticamente. São destacados com campo vazio e desmarcado, exigindo edição e seleção explícita.
- Mesmo valores tecnicamente plausíveis podem estar errados (ex.: cálcio iônico `1,08` versus `1,03`). Conferência de cada valor com o laudo permanece obrigatória.
- A opção Colar texto, importação JSON, campos manuais, dados já salvos e todas as fórmulas foram preservados.
- Recorte e processamento OCR foram aferidos em fotografia Radiometer enviada pelo usuário com Tesseract local; a performance do Tesseract.js no navegador do usuário ainda precisa ser confirmada.
