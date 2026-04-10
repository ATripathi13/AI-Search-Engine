import { useState, useCallback } from 'react';

export function useEventStream(url: string) {
    const [status, setStatus] = useState<string>('');
    const [tokens, setTokens] = useState<string>('');
    const [finalAnswer, setFinalAnswer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const submitQuery = useCallback(async (query: string) => {
        setIsLoading(true);
        setStatus('Initializing search connection...');
        setTokens('');
        setFinalAnswer(null);
        setError(null);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            if (!response.body) throw new Error('No body returned from streaming endpoint');

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (!dataStr.trim()) continue;

                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.type === 'status') {
                                setStatus(parsed.data);
                            } else if (parsed.type === 'token') {
                                setTokens(prev => prev + parsed.data);
                            } else if (parsed.type === 'DONE') {
                                setFinalAnswer(parsed.data);
                                setStatus('Complete');
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE payload block', dataStr);
                        }
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Stream connection failed fatally');
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    return { submitQuery, status, tokens, finalAnswer, isLoading, error };
}
