
import { getReactSource } from './utils/react-source';

export interface ReportConfig {
    /** Enable auto-detection of overflows */
    enable?: boolean;
    /** Highlight color for issues (default: red) */
    highlightColor?: string;
    /** Callback when an issue is detected */
    onIssue?: (issue: DetectedIssue) => void;
}

export interface DetectedIssue {
    target: HTMLElement;
    message: string;
    source?: {
        fileName: string;
        lineNumber: number;
    };
}

/**
 * Main Lingo-Guardian Hook
 * 
 * Usage:
 *   useLingoGuardian({ enable: process.env.NODE_ENV === 'development' });
 */
import { useEffect, useRef } from 'react';

export function useLingoGuardian(config: ReportConfig = {}) {
    const { enable = true } = config;
    const observerRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        if (!enable) return;

        // Detection Logic
        const checkOverflows = () => {
            const allElements = document.querySelectorAll('*');
            allElements.forEach((el) => {
                const element = el as HTMLElement;

                // Skip script/style/hidden
                if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;

                // Core check: ScrollWidth > OffsetWidth
                const isHorizontalOverflow = element.scrollWidth > element.offsetWidth;
                const isVerticalOverflow = element.scrollHeight > element.offsetHeight;

                /* 
                   Filtering False Positives:
                   - Need to check if overflow is HIDDEN (intentionally)
                   - or if it's textual
                */
                const style = window.getComputedStyle(element);
                if (style.overflow === 'hidden' || style.overflow === 'scroll' || style.overflow === 'auto') {
                    // If intentional scroll container, maybe not an error?
                    // But for Lingo-Guardian, we flag "TEXT" breaks.
                    // Simplified: Just check scrollWidth > clientWidth for now
                }

                if (isHorizontalOverflow) {
                    highlightIssue(element, 'Horizontal Overflow');
                }
            });
        };

        // WebSocket connection to Sidecar
        const wsRef = useRef<WebSocket | null>(null);

        useEffect(() => {
            if (!enable) return;

            // Connect to Sidecar
            try {
                wsRef.current = new WebSocket('ws://localhost:8080');
                wsRef.current.onopen = () => {
                    console.log('[Lingo-Guardian] Connected to Sidecar');
                };
                wsRef.current.onerror = () => {
                    // Silently fail if sidecar is not running
                };
            } catch (e) {
                // Ignore connection errors
            }

            return () => {
                wsRef.current?.close();
            };
        }, [enable]);

        // Broadcast to Parent (Dashboard) AND Sidecar
        const broadcastIssue = (type: string, payloadSource: any, text: string) => {
            // 1. Dashboard (iframe)
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'LINGO_OVERFLOW',
                    payload: {
                        type,
                        source: payloadSource
                    }
                }, '*');
            }

            // 2. Sidecar (WebSocket)
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'OVERFLOW_REPORT',
                    data: {
                        type,
                        message: text,
                        source: payloadSource,
                        timestamp: new Date().toISOString()
                    }
                }));
            }
        };

        // UI: Visual Indicator
        const highlightIssue = (el: HTMLElement, type: string) => {
            if (el.dataset.lingoGuardian) return; // Already marked

            // Extract Source
            const source = getReactSource(el);
            const text = el.innerText.substring(0, 50) + (el.innerText.length > 50 ? '...' : '');

            // Apply Red Glow
            el.style.outline = '2px solid red';
            el.style.position = 'relative';
            el.setAttribute('title', `[Lingo-Guardian] ${type} \nSource: ${source?.fileName}:${source?.lineNumber}`);
            el.dataset.lingoGuardian = 'true';

            // Console Log
            if (source) {
                console.warn(
                    `%c[Lingo-Guardian] ${type}`,
                    'font-weight:bold; color:red',
                    el,
                    `vscode://file/${source.fileName}:${source.lineNumber}`
                );
            }

            // Broadcast!
            broadcastIssue(type, source, text);
        };


        // Observer: Detect resizes
        observerRef.current = new ResizeObserver(() => {
            // Debounce/Throttle?
            requestAnimationFrame(checkOverflows);
        });

        observerRef.current.observe(document.body);

        // Initial scan
        setTimeout(checkOverflows, 1000);

        return () => {
            observerRef.current?.disconnect();
        };
    }, [enable]);
}
