
import { getReactSource } from './utils/react-source';

export interface ReportConfig {
    /** Enable auto-detection of overflows */
    enable?: boolean;
    /** Show red glow on overflow elements (default: true) */
    showGlow?: boolean;
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
 *   useLingoGuardian({ enable: true, showGlow: true });
 *   
 * Options:
 *   - enable: Enable/disable the hook (default: true)
 *   - showGlow: Show red glow on overflow elements (default: true)
 *   - highlightColor: Custom highlight color (default: 'red')
 */
import { useEffect, useRef, useCallback } from 'react';

export function useLingoGuardian(config: ReportConfig = {}) {
    const {
        enable = true,
        showGlow = true,
        highlightColor = 'red'
    } = config;

    const observerRef = useRef<ResizeObserver | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const checkedElementsRef = useRef<Set<HTMLElement>>(new Set());

    // WebSocket connection to Sidecar
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
    const broadcastIssue = useCallback((type: string, payloadSource: any, text: string) => {
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
    }, []);

    // UI: Visual Indicator
    const highlightIssue = useCallback((el: HTMLElement, type: string) => {
        // Check if already processed to avoid duplicates
        if (checkedElementsRef.current.has(el)) return;
        checkedElementsRef.current.add(el);

        // Extract Source
        const source = getReactSource(el);
        const text = el.innerText?.substring(0, 50) + (el.innerText?.length > 50 ? '...' : '');

        // Apply Red Glow (only if showGlow is enabled)
        if (showGlow) {
            // Strong, visible red glow effect
            el.style.outline = `3px solid ${highlightColor}`;
            el.style.outlineOffset = '2px';
            el.style.boxShadow = `0 0 10px 3px ${highlightColor}, inset 0 0 5px rgba(255,0,0,0.2)`;
            el.style.position = 'relative';
            el.setAttribute('title', `[Lingo-Guardian] ${type}\nSource: ${source?.fileName}:${source?.lineNumber}`);
        }

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
    }, [showGlow, highlightColor, broadcastIssue]);

    // Main overflow detection
    useEffect(() => {
        if (!enable) return;

        // Clear previous checked elements on re-run
        checkedElementsRef.current.clear();

        // Detection Logic - more robust
        const checkOverflows = () => {
            const allElements = document.querySelectorAll('*');
            allElements.forEach((el) => {
                const element = el as HTMLElement;

                // Skip script/style/meta elements
                if (['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'HTML'].includes(element.tagName)) return;

                // Skip if no visible content
                if (!element.offsetWidth || !element.offsetHeight) return;

                // Get computed styles
                const style = window.getComputedStyle(element);

                // Skip elements with overflow: visible (they're meant to overflow)
                if (style.overflow === 'visible' && style.overflowX === 'visible') return;

                // Core check: ScrollWidth > ClientWidth (more accurate than offsetWidth)
                const isHorizontalOverflow = element.scrollWidth > element.clientWidth + 1; // +1 for rounding tolerance

                // Check for text-overflow: ellipsis which indicates intentional truncation
                if (style.textOverflow === 'ellipsis' && style.overflow === 'hidden') return;

                if (isHorizontalOverflow) {
                    highlightIssue(element, 'Horizontal Overflow');
                }
            });
        };

        // Observer: Detect resizes and DOM changes
        observerRef.current = new ResizeObserver(() => {
            requestAnimationFrame(checkOverflows);
        });

        observerRef.current.observe(document.body);

        // Multiple scans to catch late-loading content
        const scanIntervals = [500, 1000, 2000, 3000];
        const timeouts = scanIntervals.map(delay =>
            setTimeout(checkOverflows, delay)
        );

        return () => {
            observerRef.current?.disconnect();
            timeouts.forEach(clearTimeout);
            checkedElementsRef.current.clear();
        };
    }, [enable, highlightIssue]);
}
