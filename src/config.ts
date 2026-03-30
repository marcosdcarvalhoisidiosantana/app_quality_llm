document.addEventListener('DOMContentLoaded', async () => {
    const inputSize = document.getElementById('chunk-size') as HTMLInputElement;
    const inputOverlap = document.getElementById('chunk-overlap') as HTMLInputElement;
    const btnCancel = document.getElementById('btn-cancel') as HTMLButtonElement;
    const form = document.getElementById('rag-config-form') as HTMLFormElement;

    // Load configs on map mount
    try {
        const settings = await window.api.getRagSettings();
        if (settings) {
            inputSize.value = (settings.chunkSize || 600).toString();
            inputOverlap.value = (settings.chunkOverlap || 60).toString();
        } else {
            inputSize.value = '600';
            inputOverlap.value = '60';
        }
    } catch(err) {
        console.error("Failed loading configurations", err);
    }

    btnCancel.addEventListener('click', () => {
        window.close();
    });

    form.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        
        const cSize = parseInt(inputSize.value, 10);
        const cOverlap = parseInt(inputOverlap.value, 10);

        if(cOverlap > cSize) {
           return alert('Erro! O Chunk Overlap não pode ser superior ao Chunk Size.');
        }

        try {
            await window.api.saveRagSettings({
                chunkSize: cSize,
                chunkOverlap: cOverlap
            });
            alert('Configurações salvas com sucesso!');
            window.close();
        } catch(err: any) {
            alert('Erro ao persistir configurações: ' + err.message);
        }
    });
});
