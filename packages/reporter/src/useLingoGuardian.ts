
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

        // Broadcast to Parent (Dashboard)
        const broadcastIssue = (type: string, payloadSource: any) => {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'LINGO_OVERFLOW',
                    payload: {
                        type,
                        source: payloadSource
                    }
                }, '*');
            }
        };

        // UI: Visual Indicator
        const highlightIssue = (el: HTMLElement, type: string) => {
            if (el.dataset.lingoGuardian) return; // Already marked

            // Extract Source
            const source = getReactSource(el);

            // Apply Red Glow
            el.style.outline = '2px solid red';
            el.style.position = 'relative'; // Risk of breaking layout, better to use overlay?
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
            broadcastIssue(type, source);
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
