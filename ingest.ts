import { PDFParse } from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Configurar para usar models locais no diretório se preferir, ou manter padrão do huggingface
// env.localModelPath = './models';

/**
 * Script de Ingestão (ETL) para RAG usando LLMs/Embeddings locais
 * 
 * @param {Buffer} dataBuffer - O buffer com o conteúdo do PDF.
 * @param {string} documentName - Nome do arquivo para compor os metadados.
 * @param {number} chunkSize - Tamanho dos pedaços de texto.
 * @param {number} chunkOverlap - Nível de sobreposição dos chunks gerados.
 * @returns {Array} Array de objetos contendo: text, metadata, e os vectors/embeddings.
 */
export async function processDocument(dataBuffer: Buffer, documentName: string, chunkSize: number = 600, chunkOverlap: number = 60) {
    console.log("Iniciando pipeline de processamento de documentos...");
    console.log(`Parâmetros de Chunking configurados: Size=${chunkSize}, Overlap=${chunkOverlap}`);

    // ------------------------------------------------------------------------
    // 1. EXTRAÇÃO (Leitura do PDF via Buffer já fornecido do banco original)
    // ------------------------------------------------------------------------
    console.log(`[1/4] Lendo buffer do arquivo PDF: ${documentName}`);
    let fullText = "";
    try {
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        fullText = result.text;
        await parser.destroy();
    } catch (error) {
        console.error(`Erro ao processar as páginas do documento '${documentName}'.`, error);
        throw error;
    }

    console.log(`Leitura concluída. Total de caracteres extraídos: ${fullText.length}`);

    // ------------------------------------------------------------------------
    // 2. TRANSFORMAÇÃO: Chunking (Quebra de texto)
    // ------------------------------------------------------------------------
    console.log(`[2/4] Dividindo o texto em chunks...`);

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: Number(chunkSize),
        chunkOverlap: Number(chunkOverlap),
    });

    const chunks = await splitter.splitText(fullText);
    console.log(`Texto dividido com sucesso em ${chunks.length} chunks.`);

    // ------------------------------------------------------------------------
    // 3. TRANSFORMAÇÃO: Geração Local de Embeddings Vetoriais
    // ------------------------------------------------------------------------
    console.log(`[3/4] Carregando modelo Transformer local (Xenova/all-MiniLM-L6-v2) para Ingestão de Embeddings...`);

    // Import ESM Module nativamente no node js ignorando o compilador TS rebaixando para CommonJS
    const xenova = await new Function("return import('@xenova/transformers')")();
    const pipeline = xenova.pipeline;

    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log(`Modelo carregado. Iniciando geração de embeddings (processamento nativo em background)...`);

    const finalDataset = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];

        const output = await extractor(chunkText, { pooling: 'mean', normalize: true });
        const embeddingArray = Array.from(output.data); // array nativo para o JSON

        const documentRecord = {
            text: chunkText,
            metadata: {
                page: 1, 
                source: documentName
            },
            embedding: embeddingArray
        };

        finalDataset.push(documentRecord);

        // Feedback a cada 10 registros
        if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
            console.log(`  Embeddings processados: ${i + 1} / ${chunks.length}`);
        }
    }

    // ------------------------------------------------------------------------
    // 4. PREPARAÇÃO DA CARGA FINAL
    // ------------------------------------------------------------------------
    console.log(`[4/4] Pipeline ETL local concluído.`);
    
    // Log do primeiro objeto da matriz formatada
    const sample = finalDataset[0];
    if (sample) {
        console.log("\n--- EXIBINDO O PRIMEIRO OBJETO GERADO PELO RAG PIPELINE PARA VALIDAÇÃO ---");
        console.log(JSON.stringify({
            text: sample.text.substring(0, 50) + "... (truncado)",
            metadata: sample.metadata,
            embedding: `[Vetor Numérico de ${sample.embedding.length} dimensões]`
        }, null, 2));
    }

    return finalDataset;
}
