<!-- GSD:project-start source:PROJECT.md -->
## Project

O "Visualizador de Introsort" é uma aplicação web interativa e moderna desenvolvida com HTML, CSS e JavaScript puros. A aplicação foi projetada para demonstrar de forma visual e didática o funcionamento do algoritmo de ordenação híbrido Introsort, que combina QuickSort, HeapSort e InsertionSort para otimizar o tempo de execução e mitigar o pior caso de ordenação.

**Core Value:** Fornecer uma representação visual clara, precisa e fluida do funcionamento dinâmico do algoritmo Introsort (QuickSort -> HeapSort -> InsertionSort) para fins educacionais e de apresentação acadêmica.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

- **Front-end**: HTML5 semântico, CSS3 moderno (Custom Properties, Flexbox, Grid), JavaScript ES6+ assíncrono para controle de animação.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **Nomenclatura Descritiva**: É expressamente proibido o uso de variáveis genéricas ou curtas como `i`, `j`, `x`, `arr` nas principais funções de ordenação e interface. Devem ser usados nomes como `currentIndex`, `pivotIndex`, `arrayValues`, `recursionDepth`, `leftPartition`, `rightPartition`, `swappedElements`, `comparisonCount`, etc.
- **Animações de Interface**: Uso de transições CSS suaves para movimentação de elementos e alteração de cores.
- **Estruturação de Código**: Manter o código bem estruturado, limpo e modular em `index.html`, `style.css` e `script.js`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

- O visualizador funciona como uma SPA (Single Page Application) simples.
- A lógica de renderização (`renderBars`) lê os valores do array de forma reativa e desenha o DOM.
- As funções de ordenação assíncronas suspendem a execução via `sleep` a cada comparação/troca para permitir a percepção visual do algoritmo em tempo real.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

| Skill          | Description           | Path                      |
| -------------- | --------------------- | ------------------------- |
| gsd-add-tests | Generate tests for a completed phase | `.agent/skills/gsd-add-tests/SKILL.md` |
| gsd-verify-work | Validate built features through conversational UAT | `.agent/skills/gsd-verify-work/SKILL.md` |
| gsd-plan-phase | Create detailed phase plan with verification loop | `.agent/skills/gsd-plan-phase/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` — do not edit manually.
<!-- GSD:profile-end -->
