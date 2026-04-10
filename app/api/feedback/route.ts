import { FeedbackStore } from '../../../src/services/feedback-store';

const feedbackStore = new FeedbackStore({ semantic: 0.25, keyword: 0.25, authority: 0.25, recency: 0.25 });

/**
 * Next.js App Router Handler for collecting user telemetry signals (Dwell/Clicks)
 */
export async function POST(req: Request) {
    try {
        const signal = await req.json();

        if (!signal.query_hash || !signal.signal_type) {
            return new Response(JSON.stringify({ error: 'Missing metric bounds for valid signals' }), { status: 400 });
        }

        feedbackStore.addSignal(signal);

        return new Response(JSON.stringify({ success: true, queue_size: feedbackStore.getSignalsCount() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
