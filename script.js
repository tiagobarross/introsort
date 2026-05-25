/* ==========================================================================
   VISUALIZADOR DE INTROSORT - LÓGICA E ALGORITMOS
   ========================================================================== */

// Elementos do DOM
const sliderArraySize = document.getElementById('slider-array-size');
const sliderSortingSpeed = document.getElementById('slider-sorting-speed');
const sliderRecursionLimit = document.getElementById('slider-recursion-limit');
const labelArraySizeValue = document.getElementById('label-array-size-value');
const labelSortingSpeedValue = document.getElementById('label-sorting-speed-value');
const labelRecursionLimitValue = document.getElementById('label-recursion-limit-value');

const buttonGenerateArray = document.getElementById('button-generate-array');
const buttonStartSorting = document.getElementById('button-start-sorting');
const buttonPauseSorting = document.getElementById('button-pause-sorting');
const buttonResetSorting = document.getElementById('button-reset-sorting');

const statActiveAlgorithm = document.getElementById('stat-active-algorithm');
const statElapsedTime = document.getElementById('stat-elapsed-time');
const statComparisonCount = document.getElementById('stat-comparison-count');
const statSwapCount = document.getElementById('stat-swap-count');
const statRecursionDepth = document.getElementById('stat-recursion-depth');

const containerBars = document.getElementById('container-bars');
const virtualConsole = document.getElementById('virtual-console');

// Estado Global da Aplicação
let arrayValues = [];
let isPlaying = false;
let isPaused = false;
let shouldAbort = false;
let speedMs = parseInt(sliderSortingSpeed.value, 10);
let totalElements = parseInt(sliderArraySize.value, 10);

let comparisonCount = 0;
let swapCount = 0;
let maxRecursionDepthReached = 0;
let recursionDepthLimit = 0;

let startTime = 0;
let pauseStartTime = 0;
let elapsedTimeIntervalId = null;
let resolvePausePromise = null;

// Inicialização de Eventos
window.addEventListener('DOMContentLoaded', () => {
    generateNewArray();
    setupEventListeners();
});

function setupEventListeners() {
    buttonGenerateArray.addEventListener('click', () => {
        if (!isPlaying) {
            generateNewArray();
        }
    });

    buttonStartSorting.addEventListener('click', () => {
        if (isPaused) {
            resumeSorting();
        } else if (!isPlaying) {
            startSortingFlow();
        }
    });

    buttonPauseSorting.addEventListener('click', () => {
        if (isPlaying && !isPaused) {
            pauseSorting();
        }
    });

    buttonResetSorting.addEventListener('click', () => {
        resetSortingFlow();
    });

    sliderArraySize.addEventListener('input', (event) => {
        totalElements = parseInt(event.target.value, 10);
        labelArraySizeValue.textContent = totalElements;
        if (!isPlaying) {
            generateNewArray();
        }
    });

    sliderSortingSpeed.addEventListener('input', (event) => {
        speedMs = parseInt(event.target.value, 10);
        labelSortingSpeedValue.textContent = speedMs;
    });

    sliderRecursionLimit.addEventListener('input', (event) => {
        recursionDepthLimit = parseInt(event.target.value, 10);
        labelRecursionLimitValue.textContent = recursionDepthLimit;
    });
}

// Lógica de Console Didático
function logEducationalMessage(messageText, typeClass = 'system-msg') {
    const consoleLine = document.createElement('div');
    consoleLine.className = `console-line ${typeClass}`;
    consoleLine.innerHTML = `&gt;&gt; ${messageText}`;
    virtualConsole.appendChild(consoleLine);
    virtualConsole.scrollTop = virtualConsole.scrollHeight;
}

function clearEducationalConsole() {
    virtualConsole.innerHTML = '';
}

// Geração e Renderização do Array
function generateNewArray() {
    arrayValues = [];
    clearEducationalConsole();
    logEducationalMessage(`Gerando novo vetor aleatório com ${totalElements} elementos.`, 'system-msg');

    // Reseta contadores e cronômetro na UI
    resetStatsUI();

    for (let index = 0; index < totalElements; index++) {
        // Valores entre 5 e 100 para representar a porcentagem da altura na visualização
        const randomHeightValue = Math.floor(Math.random() * 95) + 5;
        arrayValues.push({
            value: randomHeightValue,
            state: 'default' // Estados: 'default', 'quicksort', 'heapsort', 'insertionsort', 'comparing', 'sorted'
        });
    }

    updateRecursionLimitSlider();
    renderBars();
}

// Atualiza as configurações e o valor exibido do slider de limite de profundidade de recursão
function updateRecursionLimitSlider() {
    const maxCalculatedLimit = 2 * Math.floor(Math.log2(arrayValues.length));
    sliderRecursionLimit.max = maxCalculatedLimit;

    let currentSliderValue = parseInt(sliderRecursionLimit.value, 10);
    if (isNaN(currentSliderValue) || currentSliderValue > maxCalculatedLimit || currentSliderValue < 1) {
        sliderRecursionLimit.value = maxCalculatedLimit;
        currentSliderValue = maxCalculatedLimit;
    }

    sliderRecursionLimit.min = 1;
    labelRecursionLimitValue.textContent = sliderRecursionLimit.value;
    recursionDepthLimit = currentSliderValue;
}

function renderBars() {
    containerBars.innerHTML = '';

    for (let barIndex = 0; barIndex < arrayValues.length; barIndex++) {
        const barElement = document.createElement('div');
        barElement.className = 'array-bar';
        barElement.style.height = `${arrayValues[barIndex].value}%`;

        // Aplica classe de cor com base no estado do elemento
        const elementState = arrayValues[barIndex].state;
        if (elementState !== 'default') {
            barElement.classList.add(elementState);
        }

        containerBars.appendChild(barElement);
    }
}

// Reset das Métricas de Interface
function resetStatsUI() {
    statActiveAlgorithm.textContent = 'Inativo';
    statActiveAlgorithm.className = 'stat-value text-muted';
    statElapsedTime.textContent = '0.00s';
    statComparisonCount.textContent = '0';
    statSwapCount.textContent = '0';
    statRecursionDepth.textContent = `0 / 0`;

    comparisonCount = 0;
    swapCount = 0;
    maxRecursionDepthReached = 0;
    recursionDepthLimit = 0;

    if (elapsedTimeIntervalId) {
        clearInterval(elapsedTimeIntervalId);
        elapsedTimeIntervalId = null;
    }
}

// Controle de Fluxo: Pause/Play/Abort
async function checkPauseAndAbort() {
    if (shouldAbort) {
        throw new Error('SortAborted');
    }

    if (isPaused) {
        logEducationalMessage('Execução PAUSADA pelo usuário.', 'system-msg');

        await new Promise((resolve) => {
            resolvePausePromise = resolve;
        });
        logEducationalMessage('Execução RETOMADA pelo usuário.', 'system-msg');
    }
}

async function sleep(durationMs) {
    await checkPauseAndAbort();
    return new Promise((resolve) => setTimeout(resolve, durationMs));
}

// Início do Processo de Ordenação
async function startSortingFlow() {
    isPlaying = true;
    isPaused = false;
    shouldAbort = false;

    // Habilita/Desabilita botões adequadamente
    buttonGenerateArray.disabled = true;
    sliderArraySize.disabled = true;
    sliderRecursionLimit.disabled = true;
    buttonStartSorting.disabled = true;
    buttonPauseSorting.disabled = false;

    clearEducationalConsole();
    resetStatsUI();

    // Obtém o limite de profundidade do Introsort definido no slider
    recursionDepthLimit = parseInt(sliderRecursionLimit.value, 10);
    statRecursionDepth.textContent = `0 / ${recursionDepthLimit}`;

    logEducationalMessage(`Iniciando Introsort. Tamanho do vetor: ${arrayValues.length}. Limite de profundidade de recursão: ${recursionDepthLimit}.`, 'transition-msg');

    // Inicia cronômetro
    startTime = performance.now()
    elapsedTimeIntervalId = setInterval(() => {

        if (isPaused) {
            return;
        }

        const currentTime = performance.now();
        const durationSeconds = (currentTime - startTime) / 1000;
        statElapsedTime.textContent = `${durationSeconds.toFixed(2)}s`;
    }, 50);

    try {
        await introSortFlow();

        // Finalização com sucesso
        clearInterval(elapsedTimeIntervalId);
        const finalTime = (performance.now() - startTime) / 1000;
        statElapsedTime.textContent = `${finalTime.toFixed(2)}s`;

        // Pinta todo o vetor de ordenado
        for (let elementIndex = 0; elementIndex < arrayValues.length; elementIndex++) {
            arrayValues[elementIndex].state = 'sorted';
        }
        renderBars();

        statActiveAlgorithm.textContent = 'Concluído';
        statActiveAlgorithm.className = 'stat-value text-success';
        logEducationalMessage(`Ordenação concluída com sucesso! Total de comparações: ${comparisonCount}. Total de trocas/escritas: ${swapCount}.`, 'transition-msg');

    } catch (error) {
        if (error.message === 'SortAborted') {
            logEducationalMessage('Ordenação interrompida e resetada.', 'system-msg');
        } else {
            console.error(error);
            logEducationalMessage(`Erro durante a execução: ${error.message}`, 'system-msg');
        }
    } finally {
        isPlaying = false;
        isPaused = false;
        buttonGenerateArray.disabled = false;
        sliderArraySize.disabled = false;
        sliderRecursionLimit.disabled = false;
        buttonStartSorting.disabled = false;
        buttonPauseSorting.disabled = true;
        if (elapsedTimeIntervalId) {
            clearInterval(elapsedTimeIntervalId);
        }
    }
}

function pauseSorting() {
    isPaused = true;
    pauseStartTime = performance.now();
    buttonStartSorting.disabled = false;
    buttonPauseSorting.disabled = true;
}

function resumeSorting() {
    const pausedDuration = performance.now() - pauseStartTime;
    startTime += pausedDuration;
    isPaused = false;
    buttonStartSorting.disabled = true;
    buttonPauseSorting.disabled = false;
    if (resolvePausePromise) {
        resolvePausePromise();
        resolvePausePromise = null;
    }
}

function resetSortingFlow() {
    shouldAbort = true;
    isPaused = false;
    isPlaying = false;

    if (resolvePausePromise) {
        resolvePausePromise();
        resolvePausePromise = null;
    }

    // Pequeno delay para garantir que o loop abortado termine de limpar antes de regenerar
    setTimeout(() => {
        generateNewArray();
        buttonGenerateArray.disabled = false;
        sliderArraySize.disabled = false;
        sliderRecursionLimit.disabled = false;
        buttonStartSorting.disabled = false;
        buttonPauseSorting.disabled = true;
    }, 50);
}

// ==========================================================================
// ALGORITMOS DE ORDENAÇÃO DO INTROSORT (Com regras estritas de nomenclatura)
// ==========================================================================

async function introSortFlow() {
    await runIntroSortRecursive(0, arrayValues.length - 1, 0);
}

async function runIntroSortRecursive(leftIndex, rightIndex, recursionDepth) {
    await checkPauseAndAbort();

    // Atualiza estatística de profundidade máxima
    if (recursionDepth > maxRecursionDepthReached) {
        maxRecursionDepthReached = recursionDepth;
        statRecursionDepth.textContent = `${maxRecursionDepthReached} / ${recursionDepthLimit}`;
    }

    const partitionSize = rightIndex - leftIndex + 1;

    // Regra 1: Caso o tamanho do subarray seja pequeno (< 16), usa InsertionSort
    if (partitionSize < 16) {
        logEducationalMessage(`Partição [Índices: ${leftIndex} a ${rightIndex}] com tamanho ${partitionSize} < 16. Desviando para InsertionSort.`, 'insertionsort-msg');
        await runInsertionSort(leftIndex, rightIndex);
        return;
    }

    // Regra 2: Caso atinja a profundidade máxima de recursão, desvia para HeapSort
    if (recursionDepth > recursionDepthLimit) {
        logEducationalMessage(`Profundidade da recursão (${recursionDepth}) atingiu o limite (${recursionDepthLimit}). Desviando partição [${leftIndex} a ${rightIndex}] para HeapSort.`, 'heapsort-msg');
        await runHeapSort(leftIndex, rightIndex);
        return;
    }

    // Executa QuickSort
    statActiveAlgorithm.textContent = 'QuickSort';
    statActiveAlgorithm.className = 'stat-value text-primary';
    logEducationalMessage(`QuickSort ativo na partição [${leftIndex} a ${rightIndex}] com profundidade de recursão ${recursionDepth}.`, 'quicksort-msg');

    // Define elementos da partição como ativos em QuickSort
    for (let elementIndex = leftIndex; elementIndex <= rightIndex; elementIndex++) {
        if (arrayValues[elementIndex].state !== 'sorted') {
            arrayValues[elementIndex].state = 'quicksort';
        }
    }
    renderBars();

    const pivotFinalIndex = await runQuickSortPartition(leftIndex, rightIndex);

    // Chamadas recursivas nas partições esquerda e direita incrementando a profundidade
    await runIntroSortRecursive(leftIndex, pivotFinalIndex - 1, recursionDepth + 1);
    await runIntroSortRecursive(pivotFinalIndex + 1, rightIndex, recursionDepth + 1);
}

// Particionamento do QuickSort (Lomuto Partition Scheme)
async function runQuickSortPartition(leftIndex, rightIndex) {
    const pivotValue = arrayValues[rightIndex].value;
    arrayValues[rightIndex].state = 'comparing';
    renderBars();

    let partitionIndex = leftIndex;

    for (let currentIndex = leftIndex; currentIndex < rightIndex; currentIndex++) {
        await checkPauseAndAbort();

        arrayValues[currentIndex].state = 'comparing';
        if (partitionIndex !== currentIndex) {
            arrayValues[partitionIndex].state = 'comparing';
        }
        renderBars();

        comparisonCount++;
        statComparisonCount.textContent = comparisonCount;
        await sleep(speedMs);

        if (arrayValues[currentIndex].value < pivotValue) {
            // Realiza a troca física
            const tempValueHolder = arrayValues[currentIndex].value;
            arrayValues[currentIndex].value = arrayValues[partitionIndex].value;
            arrayValues[partitionIndex].value = tempValueHolder;

            swapCount++;
            statSwapCount.textContent = swapCount;

            // Renderiza após a troca
            renderBars();
            await sleep(speedMs);

            // Restaura cor da partição antiga para indicar quicksort ativo
            arrayValues[partitionIndex].state = 'quicksort';
            partitionIndex++;
        }

        arrayValues[currentIndex].state = 'quicksort';
        if (partitionIndex !== currentIndex) {
            arrayValues[partitionIndex].state = 'quicksort';
        }
    }

    // Coloca o pivot em sua posição correta final
    await checkPauseAndAbort();
    const tempValueHolder = arrayValues[partitionIndex].value;
    arrayValues[partitionIndex].value = arrayValues[rightIndex].value;
    arrayValues[rightIndex].value = tempValueHolder;

    swapCount++;
    statSwapCount.textContent = swapCount;

    arrayValues[rightIndex].state = 'quicksort';
    arrayValues[partitionIndex].state = 'sorted'; // O pivot está definitivamente ordenado

    renderBars();
    await sleep(speedMs);

    return partitionIndex;
}

// Implementação do HeapSort
async function runHeapSort(leftIndex, rightIndex) {
    statActiveAlgorithm.textContent = 'HeapSort';
    statActiveAlgorithm.className = 'stat-value text-danger';

    const subHeapSize = rightIndex - leftIndex + 1;

    // Marca todos os elementos da partição como HeapSort ativo
    for (let elementIndex = leftIndex; elementIndex <= rightIndex; elementIndex++) {
        if (arrayValues[elementIndex].state !== 'sorted') {
            arrayValues[elementIndex].state = 'heapsort';
        }
    }
    renderBars();

    // Fase 1: Constrói a max heap
    const halfHeapSize = Math.floor(subHeapSize / 2);
    for (let parentIndex = halfHeapSize - 1; parentIndex >= 0; parentIndex--) {
        await runHeapify(leftIndex, subHeapSize, parentIndex);
    }

    // Fase 2: Extrai elementos um a um do heap
    for (let heapEndIndex = subHeapSize - 1; heapEndIndex > 0; heapEndIndex--) {
        await checkPauseAndAbort();

        // Troca a raiz (maior elemento) com o último elemento do subheap
        const tempValueHolder = arrayValues[leftIndex].value;
        arrayValues[leftIndex].value = arrayValues[leftIndex + heapEndIndex].value;
        arrayValues[leftIndex + heapEndIndex].value = tempValueHolder;

        swapCount++;
        statSwapCount.textContent = swapCount;

        // O elemento trocado para o final do subheap está na posição correta
        arrayValues[leftIndex + heapEndIndex].state = 'sorted';
        renderBars();
        await sleep(speedMs);

        // Reconstrói a max heap no restante desordenado
        await runHeapify(leftIndex, heapEndIndex, 0);
    }

    // O último elemento restante no heap (índice 0) também estará na posição correta
    arrayValues[leftIndex].state = 'sorted';
    renderBars();
}

// Função Heapify para manter propriedade de Max Heap
async function runHeapify(startIndex, heapSize, rootIndex) {
    await checkPauseAndAbort();

    let largestIndex = rootIndex;
    const leftChildIndex = 2 * rootIndex + 1;
    const rightChildIndex = 2 * rootIndex + 2;

    // Compara filho esquerdo
    if (leftChildIndex < heapSize) {
        comparisonCount++;
        statComparisonCount.textContent = comparisonCount;

        // Habilita cor de comparação
        arrayValues[startIndex + leftChildIndex].state = 'comparing';
        arrayValues[startIndex + largestIndex].state = 'comparing';
        renderBars();
        await sleep(speedMs);

        if (arrayValues[startIndex + leftChildIndex].value > arrayValues[startIndex + largestIndex].value) {
            // Restaura anterior
            arrayValues[startIndex + largestIndex].state = 'heapsort';
            largestIndex = leftChildIndex;
        } else {
            arrayValues[startIndex + leftChildIndex].state = 'heapsort';
            arrayValues[startIndex + largestIndex].state = 'heapsort';
        }
    }

    // Compara filho direito
    if (rightChildIndex < heapSize) {
        comparisonCount++;
        statComparisonCount.textContent = comparisonCount;

        // Habilita cor de comparação
        arrayValues[startIndex + rightChildIndex].state = 'comparing';
        arrayValues[startIndex + largestIndex].state = 'comparing';
        renderBars();
        await sleep(speedMs);

        if (arrayValues[startIndex + rightChildIndex].value > arrayValues[startIndex + largestIndex].value) {
            arrayValues[startIndex + largestIndex].state = 'heapsort';
            largestIndex = rightChildIndex;
        } else {
            arrayValues[startIndex + rightChildIndex].state = 'heapsort';
            arrayValues[startIndex + largestIndex].state = 'heapsort';
        }
    }

    // Se o maior não for a raiz, realiza a troca e continua heapificando recursivamente
    if (largestIndex !== rootIndex) {
        const tempValueHolder = arrayValues[startIndex + rootIndex].value;
        arrayValues[startIndex + rootIndex].value = arrayValues[startIndex + largestIndex].value;
        arrayValues[startIndex + largestIndex].value = tempValueHolder;

        swapCount++;
        statSwapCount.textContent = swapCount;

        // Pinta de comparing para dar destaque no swap
        arrayValues[startIndex + rootIndex].state = 'comparing';
        arrayValues[startIndex + largestIndex].state = 'comparing';
        renderBars();
        await sleep(speedMs);

        // Restaura estados para heapsort ativo antes de descer recursivo
        arrayValues[startIndex + rootIndex].state = 'heapsort';
        arrayValues[startIndex + largestIndex].state = 'heapsort';

        await runHeapify(startIndex, heapSize, largestIndex);
    }
}

// Implementação do InsertionSort para pequenas partições
async function runInsertionSort(leftIndex, rightIndex) {
    statActiveAlgorithm.textContent = 'InsertionSort';
    statActiveAlgorithm.className = 'stat-value text-success';

    // Marca todos os elementos da partição como ativos em InsertionSort
    for (let elementIndex = leftIndex; elementIndex <= rightIndex; elementIndex++) {
        if (arrayValues[elementIndex].state !== 'sorted') {
            arrayValues[elementIndex].state = 'insertionsort';
        }
    }
    renderBars();

    for (let currentIndex = leftIndex + 1; currentIndex <= rightIndex; currentIndex++) {
        await checkPauseAndAbort();

        const keyElement = arrayValues[currentIndex];
        let scanIndex = currentIndex - 1;

        // Pinta a chave que está sendo comparada/inserida
        keyElement.state = 'comparing';
        renderBars();

        while (scanIndex >= leftIndex) {
            await checkPauseAndAbort();

            arrayValues[scanIndex].state = 'comparing';
            renderBars();

            comparisonCount++;
            statComparisonCount.textContent = comparisonCount;
            await sleep(speedMs);

            if (arrayValues[scanIndex].value > keyElement.value) {
                // Move o elemento uma posição à frente
                arrayValues[scanIndex + 1] = arrayValues[scanIndex];
                swapCount++;
                statSwapCount.textContent = swapCount;

                // Restaura o estado visual do deslocado
                arrayValues[scanIndex + 1].state = 'insertionsort';
                renderBars();
                await sleep(speedMs);

                scanIndex--;
            } else {
                arrayValues[scanIndex].state = 'insertionsort';
                break;
            }
        }

        // Insere o elemento chave na posição de inserção correta
        arrayValues[scanIndex + 1] = keyElement;
        keyElement.state = 'insertionsort';
        renderBars();
        await sleep(speedMs);
    }

    // Marca todo o trecho ordenado como sorted na partição concluída
    for (let elementIndex = leftIndex; elementIndex <= rightIndex; elementIndex++) {
        arrayValues[elementIndex].state = 'sorted';
    }
    renderBars();
}
