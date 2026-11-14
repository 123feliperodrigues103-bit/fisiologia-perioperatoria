# Gasometria pareada — protótipo v0.1

Primeiro protótipo da plataforma acadêmica **Fisiologia Perioperatória**.

## Rodar localmente
Abra `index.html` no navegador. Nenhuma instalação, comando ou dependência é necessária.

## Publicar
1. Crie um repositório GitHub (pode ser público) chamado `fisiologia-perioperatoria`.
2. Adicione `index.html`, `styles.css`, `script.js` e `README.md` **na raiz** do repositório, não dentro de uma subpasta.
3. Na Vercel, **Add New > Project > Import Git Repository** e selecione o repositório.
4. Se solicitado, selecione **Framework Preset: Other**, **Build Command: vazio** e **Output Directory: .** (raiz).
5. Clique em **Deploy**. A Vercel fornecerá o endereço efetivo.

## Validação
Cálculos educacionais preliminares: P/F, ΔPCO₂, ΔpH, CaO₂, CcvO₂ estimado, diferença de conteúdos e extração central estimada. Não validado para decisões clínicas. Não calcula DO₂ ou VO₂ sem débito cardíaco e dados apropriados.

## Dados
Caso 001 sem identificadores. Em ambos os momentos usa Hb arterial como aproximação de Hb venosa, explicitado na interface.
