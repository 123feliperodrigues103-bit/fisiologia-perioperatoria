# Fisiologia Perioperatória — v0.5.5

Plataforma educacional estática para casos fictícios/desidentificados, com registros seriados, gráficos, fichas científicas e backup em JSON.

## Novidades

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

**Antes da atualização, exporte o JSON dos seus casos.** Dados de exemplo/fictícios apenas: JSON não é criptografado. Teste localmente no navegador antes de publicar.

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
