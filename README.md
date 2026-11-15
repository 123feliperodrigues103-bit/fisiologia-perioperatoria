# Fisiologia Perioperatória — v0.5.2

Plataforma educacional estática para casos fictícios/desidentificados, com registros seriados, gráficos, fichas científicas e backup em JSON.

## Novidades

- Ventilação reduzida aos campos usuais do carrinho: VC expirado, FR, VM, pausa inspiratória, I:E, Pplat, PEEP e Ppico. A FiO₂ permanece na seção de gasometria arterial.
- Módulo de equilíbrio acidobásico com bicarbonato calculado por Henderson–Hasselbalch (arterial e venoso central), H⁺, SID simplificado, SID aparente, SID efetiva e SIG.
- Detalhes de eletrólitos e condições avançadas recolhíveis; apenas resultados que podem ser calculados aparecem.
- ΔpH preservado como resultado descritivo, sem ficha extensa.
- Fichas científicas para Henderson–Hasselbalch e Stewart, além das existentes para P/F e ΔPCO₂.

## Requisitos científicos e limites

- HCO₃⁻ calculado de pH e PCO₂ NÃO é uma medida independente.
- SID simplificado = Na + K − Cl − lactato (mmol/L monovalentes). SIDa também inclui 2×Ca²⁺ e 2×Mg²⁺ fornecidos em mmol/L.
- SIDe: HCO₃⁻ arterial calculado + albumina (convertida de g/dL para g/L) × (0,123pH−0,631) + fosfato (mmol/L) × (0,309pH−0,469).
- SIG = SIDa−SIDe. É estimativa, não identificação de uma substância.
- Para driving pressure e complacência com um único campo PEEP, assume-se que a PEEP informada representa adequadamente a PEEP total e que Pplat foi medida corretamente em paciente passivo. A interface NÃO verifica essas premissas; os resultados são rotulados como aproximações.
- A entrada de pausa inspiratória (%) é apenas registro; não certifica pausa válida ou paciente passivo.
- Os dados venosos NÃO são automaticamente corrigidos por +0,03 para inferir valores arteriais.

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
