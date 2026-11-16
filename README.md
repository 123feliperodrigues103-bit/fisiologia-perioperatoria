# Fisiologia Perioperatória — v0.6.4 (candidata para teste local)

**Ainda não publicada.** Evolução da v0.6.2, sem alterações de estrutura ou schema dos casos.

## Novidades v0.6.4 (candidata)

- **Glicemia clicável**, junto ao campo e na tabela temporal: quatro abas (Entender, Cálculos, Cuidados, Referências), com análise longitudinal, mecanismos perioperatórios, hipoglicemia e hiperglicemia hospitalar.
- **Cálculos a partir de Na⁺ e glicose medidos:** glicose mg/dL ↔ mmol/L, tonicidade estimada e sódio corrigido para hiperglicemia com os coeficientes explícitos de 1,6 e 2,4 (estimativas, nunca substituir o sódio medido). A tonicidade usa sódio **medido**, não corrigido.
- **Interação K⁺–glicose** sem inferir cetoacidose de uma glicemia isolada; metas contextualizadas segundo três tópicos UpToDate: perioperatório 110–180 mg/dL, anestesia 140–180 mg/dL e UTI 140–180 mg/dL. **Não há insulina prescrita automaticamente.** A ficha de glicemia foi auditada com três PDFs integrais do UpToDate; SBD e consenso 2024 ficam como complementos para sódio corrigido e critérios de crises.
- **KCl 19,1% contém 2,56 mEq/mL** em destaque na aba Cálculos do K⁺; exemplos 10/15/20 mEq e conversor facultativo de mEq para mL de concentrado. A ferramenta não seleciona dose, velocidade, diluente nem acesso. Nunca aplicar concentrado EV sem diluição.
- Mantidos cálculos anteriores, importador de gasometria, gasometria longitudinal, módulos independentes, JSON e chave de armazenamento sem migração.

## Auditoria adicional v0.6.4

- Três PDFs do UpToDate conferidos diretamente. A ficha de glicemia agora diferencia as metas dos artigos de anestesia, manejo perioperatório e UTI, e descreve monitorização, hipoglicemia e DM1 sem algoritmos automáticos.
- Incluída sob abertura opcional a **tabela 2 do UpToDate**, apenas como exemplo de escala corretiva de insulina no contexto de DM2 sem insulina prévia e controle perioperatório, com suas limitações (sensibilidade individual e contraindicação de extrapolação).
- Corrigida interação K⁺-insulina com a fonte primária UpToDate de anestesia, que utiliza K⁺ <3,5 na CAD; divergência com outro capítulo explicitada.
- **Todos os links do UpToDate no site verificados**, usando somente `https://www.uptodate.com/contents/...`, inclusive os três novos. Links externos de ADA/SBD/consenso permanecem em seus domínios próprios.
- Tonicidade e estimativas do Na⁺ corrigido mantidas, mas fatores de Na⁺ corrigido são identificados como evidência complementar, não como resultado específico dos PDFs de glicemia do UpToDate.

## Principal mudança

O clique em **K⁺** abre quatro abas: **Entender, Cálculos, Cuidados e Referências**, com conteúdo integrado de hipercalemia e hipocalemia. Nenhuma aba hidroeletrolítica independente foi criada; a análise temporal T0/Tn−1 segue em primeiro plano.

- Removidos o título “Se seu protocolo de anestesia expressar a dose por peso” e o conversor mg/kg para cloreto de cálcio. **Práticas locais não foram convertidas em regras do software.**
- **Cloreto e gluconato de cálcio** aparecem lado a lado, sem tratamento preferencial, com conteúdo de cálcio elementar distinto, contexto, acesso e diferenças entre diretrizes. As doses do UpToDate são apresentadas como exemplos documentados de manejo adulto, não como prescrições.
- Ampliada a ficha para hipocalemia: redistribuição × perdas, hipóteses renais/digestivas, relação com pH, glicemia, hipomagnesemia, função renal e segurança da reposição.
- Aba **Cálculos** mantém exemplos e faixas retirados diretamente das fontes e adiciona dois exercícios **opcionais e não prescritivos**: estimativa muito aproximada do déficit corporal somente se usuário declarar perdas crônicas, com K⁺ habitual conhecido; e razão K⁺/creatinina urinária (requer K⁺ e creatinina de urina, mesmo espécime). Nenhum cálculo é executado automaticamente a partir de uma gasometria.
- Corrigida a orientação de CAD/EHH: consenso internacional 2024 usa limiar **K⁺ <3,5 mmol/L** para adiar insulina, enquanto capítulo geral de hipocalemia do UpToDate ainda menciona **3,3 mmol/L**. A ficha documenta a divergência e não infere CAD de hiperglicemia isolada.
- Bicarbonato: ficha do K⁺ descreve interação; sem dose para corrigir acidemia até conferirmos artigo específico. Não são abordadas diluições ou preparo de bicarbonato.

## Fontes diretamente conferidas

1. David B. Mount. *Treatment and prevention of hyperkalemia in adults*. UpToDate, versão 60.0, 03 nov 2026.
2. David B. Mount. *Clinical manifestations and treatment of hypokalemia in adults*. UpToDate, 10 ago 2026.
3. David B. Mount. *Evaluation of the adult patient with hypokalemia*. UpToDate, 28 jul 2025.
4. David B. Mount. *Causes of hypokalemia in adults*. UpToDate, 02 out 2026.
5. Khan NA, Ghali WA, Cagliero E. *Perioperative glycemic management in adults with diabetes mellitus*. UpToDate, 19 dez 2025.
6. Abdelmalak BB, Sreedharan R. *Anesthesia for patients with diabetes mellitus and/or hyperglycemia*. UpToDate, 15 jun 2026.
7. Patel J. *Glycemic control in critically ill adult and pediatric patients*. UpToDate, 17 jun 2026.
8. *Hyperglycemic Crises in Adults With Diabetes: A Consensus Report*, 2024, para contexto CAD/EHH.

As fontes são resumidas em texto original. Não se incluem conteúdos extensos licenciados do UpToDate.

## Teste local e compatibilidade

Extraia o ZIP e abra `index.html` em um navegador moderno. Teste a criação de um novo caso ou o exemplo didático; navegue para gasometria, preencha K⁺, pH e glicose em T0/T1 e clique em **K⁺**. Abra as abas, especialmente os exercícios opcionais dentro de *Cálculos*.

- `localStorage`: chave anterior `fisiologia-perioperatoria-v04-cases` preservada.
- JSON: `fisiologia-perioperatoria-cases-v04` preservado; `glucose` opcional em mg/dL.
- Importador de laudos, importação/exportação JSON, cálculos existentes e módulos de ventilação/hemodinâmica não modificados.
- Material para **educação médica**, não validado para prescrição automática ou suporte decisório clínico.
- A versão publicada do site não foi modificada.
