# Fisiologia Perioperatória — v0.6.7

**Candidata para teste local. O site publicado não foi alterado.**

## Caso 001 — Cirurgia abdominal de grande porte

Na **Biblioteca didática**, clique em **Abrir Caso 001 — cirurgia abdominal**. O exemplo abre como uma cópia independente, editável e descartável com **quatro coletas pareadas**, em tempos relativos aproximados: T0, +2 h, +4h30 e +10h50 (UTI).

- Pancreatectomia corpo-caudal + esplenectomia, sob anestesia geral. Três gasometrias intraoperatórias: **FiO₂ 50%**.
- Quarta gasometria na UTI: paciente **extubado, em ar ambiente (FiO₂ 21%)**, noradrenalina em dose baixa e cateter peridural ainda em uso, reforçado após a terceira coleta. Não se atribui causalidade a essas intervenções a partir das gasometrias.
- O exemplo é integralmente fictício para uso didático, inspirado na fisiologia de um procedimento de grande porte. Não apresenta etiquetas de procedência em cada campo. Albumina, fosfato e magnésio possuem valores basais mantidos na evolução, sem redosagens.
- Na UTI, a hemoglobina é 12,5 g/dL e K⁺ é 2,9 mmol/L; o caso inclui duas reposições de 10 mL de KCl. Não se supõe uma concentração específica da preparação para converter essas reposições em mEq.
- Resultados calculáveis: P/F, PAO₂ e gradiente A–a, ΔPCO₂ arterial–venoso central, CaO₂, CcvO₂, extração central estimada, HCO₃⁻ calculado, ânion gap, SID simplificado, SIDa, SIDe e SIG. Os resultados derivam dos valores apresentados nos registros do caso.
- Não foram inventados valores para os módulos independentes de ventilação mecânica e hemodinâmica. A história clínica posterior foi informada como favorável, embora os índices da UTI requeiram leitura contextual.

### Valores importantes para conferência

| Momento | FiO₂ | K⁺ (mmol/L) | Lactato (mmol/L) | ScvO₂ | ΔPCO₂ (mmHg) | P/F |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T0 | 50% | 2,9 | 1,0 | 78,5% | 6,4 | 363,4 |
| +2 h | 50% | 3,2 | 1,4 | 82,1% | 6,2 | 290,0 |
| +4h30 | 50% | 2,9 | 1,9 | 86,3% | 1,6 | 321,4 |
| +10h50 UTI | 21% | 2,9 | 3,6 | 71,9% | 11,7 | 368,1 |

A escala do gráfico é proporcional aos intervalos do caso fictício. A P/F da UTI não deve ser diretamente equiparada aos valores sob ventilação mecânica, pois FiO₂ e suporte respiratório mudaram.

## Ajustes de interface pedidos anteriormente

- A caixa **Cálculos derivados · Opcional** aparece **antes** da **Evolução do paciente**.
- Entradas numéricas dos três módulos, perfil, exercícios do K⁺ e revisão do importador aceitam **vírgula ou ponto decimal** (por exemplo, `3,5` ou `3.5`) e rejeitam textos numéricos ambíguos. Os valores são armazenados como números.
- Os casos pessoais não perdem a opção de data/hora; o exemplo usa apenas os tempos relativos e oculta as datas absolutas.
- Chave `localStorage` e estrutura JSON `fisiologia-perioperatoria-cases-v04` preservadas. Casos e exemplos **já salvos não são sobrescritos**; é preciso abrir uma **nova cópia** do Caso 001 na Biblioteca para ver os quatro tempos.
- KCl 19,1% = 2,56 mEq/mL, as fichas clicáveis de potássio/glicemia e os links canônicos para o UpToDate permanecem preservados.

## Uso

Extraia o ZIP e abra `index.html` em um navegador moderno. Todo o caso didático funciona sem internet. O carregamento do motor de OCR, se selecionado, ainda pode precisar de internet.

Material para estudo. **Não validado para prescrição nem decisões assistenciais.** Não envie ao site dados identificáveis de pacientes. Nenhuma alteração foi publicada na Vercel.

## Ajuste v0.6.6

O Caso 001 passou a ser apresentado como um único cenário fictício coeso. Removidos o bloco **Como ler o exemplo** e as etiquetas **simulado**, **premissa**, **hemograma** e **relato** nos campos, incluindo cópias anteriormente salvas. Todos os valores e fórmulas foram preservados. As dosagens basais de albumina, fosfato e magnésio são explicitadas uma única vez na narrativa.

## Correção v0.6.7 — importação de laudo copiado do computador

O importador **Colar texto** agora aceita tanto o formato de tabela compactada em uma linha por parâmetro quanto o texto copiado da visualização de prontuário, no qual rótulo, resultado, unidade e referência aparecem em linhas distintas. Exemplo aceito:

```text
GASOMETRIA ARTERIAL
pH
7.37
7,35 A 7,45
PO2
160.70
mmHg
80 A 100
mmHg
pCO2
42.40
mmHg
38 A 50
mmHg
```

O resultado reconhecido é pH 7.37, PaO₂ 160.70 mmHg e PaCO₂ 42.40 mmHg. Intervalos de referência isolados não são importados como resultados. A origem arterial/venosa central e todos os números ainda devem ser revisados e confirmados pelo usuário antes de aplicar, assim como em versões anteriores. As verificações de unidade que impedem importar glicose em mmol/L como mg/dL ou lactato em mg/dL como mmol/L continuam funcionando, mesmo quando a unidade está na linha seguinte.

**Testes efetuados:** verificação de sintaxe de `script.js` e `importer.js`; 10 casos automatizados do parser, incluindo o texto exato que falhou, o formato antigo e cenários de segurança; arquivo ZIP testado quanto à integridade. Não houve publicação automática. A abertura gráfica em navegador não pôde ser testada nesta execução por restrição de acesso local do ambiente; o funcionamento interativo deve ser conferido no navegador após baixar a versão.
