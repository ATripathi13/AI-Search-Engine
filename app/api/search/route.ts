import { AnswerEngineOrchestrator } from '../../../src/services/orchestrator';

const orchestrator = new AnswerEngineOrchestrator();

/**
 * Next.js App Router POST handler mapped for /api/search
 * Exposes SSE streams chunking data back explicitly
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { query } = body;

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query parameters strict requirement failed' }), { status: 400 });
        }

        // Establish pure Readable server-sent event sequence logic
        const stream = new ReadableStream({
            async start(controller) {
                const generator = orchestrator.execute(query);
                const encoder = new TextEncoder();

                // Interleaved chunking output using data limits
                for await (const chunk of generator) {
                    controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
                }

                controller.close();
            }
        });

        // Push standard EventStream headers 
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
