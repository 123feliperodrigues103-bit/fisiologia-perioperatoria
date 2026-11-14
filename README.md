# Fisiologia Perioperatória — v0.4

Plataforma educacional estática (HTML/CSS/JS) para casos fictícios ou desidentificados, registros seriados e fórmulas fisiológicas calculadas independentemente. **Não validada para decisões assistenciais. Não insira dados identificáveis de pacientes.**

## Usar

Abra `index.html` no navegador. Escolha **Novo caso** ou **Carregar exemplo**. Complete informações opcionais do caso, crie quantos registros desejar e adicione só os dados disponíveis. Os cartões atualizam os cálculos de acordo com cada variável necessária; o gráfico e a tabela mostram evolução até 50 registros (os demais permanecem salvos e podem ser consultados individualmente). Clique em P/F ou ΔPCO₂ para abrir as quatro abas de conteúdo científico já existentes.

## Persistência

Dados armazenados somente no `localStorage` do navegador/origem. Não há backend, conta ou sincronização; limpar dados do navegador pode apagá-los. Use **Exportar JSON** como backup; **Importar JSON** adiciona casos. Faça backups antes de mudar de navegador, dispositivo ou hospedagem. Evite incluir dados reais identificáveis mesmo no JSON exportado.

## Fisiologia e regras de cálculo

- Cada indicador depende apenas de seus próprios campos. Ausência ou dado inválido gera **—** no resultado correspondente.
- **PBW** pela fórmula adulta ARDSNet, quando sexo de referência e estatura de pelo menos 152,4 cm estão presentes; **SC** pela fórmula de Mosteller.
- Mecânica estática exige `Paciente passivo = 1`, Pplat e PEEP total informada **ou** PEEP programada + auto-PEEP medida. Não se presume que a PEEP programada seja igual à total quando auto-PEEP não foi informada.
- Resistência é aproximação válida apenas para fluxo inspiratório constante com condições apropriadas; requer confirmação de passividade, mas a interface não consegue verificar o modo ventilatório. Usuário deve observar essas limitações.
- **PAO₂** e **A–a** exigem pressão barométrica e R inseridos explicitamente, evitando inventar condições ambientais.
- **DO₂** exige DC informado; não é inferido de P/F ou gradiente CO₂.
- A plataforma não calcula VO₂ por Fick de amostra venosa central, nem VO₂ por diferença simples entre FiO₂ e EtO₂.
- Fichas científicas detalhadas existentes: P/F e ΔPCO₂. Outras fichas são resumos preliminares; capítulos Miller e Barash são referências científicas gerais do projeto.

## Publicação

Substitua `index.html`, `script.js`, `styles.css` e `README.md` no repositório; teste localmente antes de commit/push. Site hospedado em Vercel pode servir os mesmos arquivos estáticos.
