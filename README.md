# Fisiologia Perioperatória — v0.5

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
