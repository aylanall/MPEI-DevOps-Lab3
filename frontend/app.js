document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const totalCountInput = document.getElementById('totalCount');
    const batchSizeInput = document.getElementById('batchSize');
    const logContainer = document.getElementById('logContainer');
    const summaryDiv = document.getElementById('summary');
    const totalTimeSpan = document.getElementById('totalTime');
    const avgSpeedSpan = document.getElementById('avgSpeed');
    const successCountSpan = document.getElementById('successCount');
    const errorCountSpan = document.getElementById('errorCount');

    let isRunning = false;

    // Генерация одного тестового события.
    // ВАЖНО: проверьте обязательные поля в Swagger (/docs), когда бэкенд запущен.
    // Возможно, потребуются дополнительные поля (location, time и т.д.).
    function generateEvent(index) {
        return {
            name: `Тестовое событие #${index}`,
            description: `Автоматически созданное событие для нагрузочного теста. Номер: ${index}`
        };
    }

    async function sendBatch(batch, batchNumber) {
        const payload = { events: batch };
        const startTime = performance.now();
        try {
            const response = await fetch('/api/v1/events/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const duration = (performance.now() - startTime) / 1000;

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const speed = batch.length / duration;
            addLog(
                `Пакет #${batchNumber}: УСПЕХ. Событий: ${batch.length}, ` +
                `Время: ${duration.toFixed(2)} с, Скорость: ${speed.toFixed(2)} соб/с`,
                'success'
            );
            return { success: true, count: batch.length };
        } catch (error) {
            addLog(`Пакет #${batchNumber}: ОШИБКА. ${error.message}`, 'error');
            return { success: false, count: batch.length };
        }
    }

    function addLog(message, type) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    startBtn.addEventListener('click', async () => {
        if (isRunning) return;

        const totalCount = parseInt(totalCountInput.value, 10);
        const batchSize = parseInt(batchSizeInput.value, 10);

        if (isNaN(totalCount) || totalCount <= 0) {
            alert('Введите корректное общее количество событий.');
            return;
        }
        if (isNaN(batchSize) || batchSize <= 0 || batchSize > 200) {
            alert('Размер пакета должен быть от 1 до 200.');
            return;
        }

        isRunning = true;
        startBtn.disabled = true;
        logContainer.innerHTML = '';
        summaryDiv.style.display = 'none';

        const overallStartTime = performance.now();
        let successCount = 0;
        let errorCount = 0;
        let processedCount = 0;
        let batchNumber = 0;

        while (processedCount < totalCount) {
            const currentBatchSize = Math.min(batchSize, totalCount - processedCount);
            const batch = [];
            for (let i = 0; i < currentBatchSize; i++) {
                batch.push(generateEvent(processedCount + i + 1));
            }

            batchNumber++;
            const result = await sendBatch(batch, batchNumber);

            if (result.success) {
                successCount += result.count;
            } else {
                errorCount += result.count;
            }
            processedCount += currentBatchSize;
        }

        const overallEndTime = performance.now();
        const totalTime = (overallEndTime - overallStartTime) / 1000;
        const avgSpeed = totalCount / totalTime;

        totalTimeSpan.textContent = `${totalTime.toFixed(2)} с`;
        avgSpeedSpan.textContent = `${avgSpeed.toFixed(2)} событий/с`;
        successCountSpan.textContent = successCount;
        errorCountSpan.textContent = errorCount;
        summaryDiv.style.display = 'block';

        isRunning = false;
        startBtn.disabled = false;
    });
});
