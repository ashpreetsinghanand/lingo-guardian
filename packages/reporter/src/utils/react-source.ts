
export interface SourceLocation {
    fileName: string;
    lineNumber: number;
    componentName?: string;
}

/**
 * Extracts React source location (file path & line number) from a DOM element.
 * It traverses the internal Fiber tree to find code location data injected by Babel/SWC.
 */
export function getReactSource(element: HTMLElement): SourceLocation | null {
    // 1. Find the internal React Fiber property on the DOM node
    const fiberKey = Object.keys(element).find((key) =>
        key.startsWith('__reactFiber$') || // React 17+
        key.startsWith('__reactInternalInstance$') // React <17
    );

    if (!fiberKey) return null;

    // @ts-ignore - Accessing internal property
    let fiber = element[fiberKey];

    // 2. Traverse up the fiber tree to find a node with _debugSource
    while (fiber) {
        // _debugSource contains { fileName, lineNumber }
        // _debugOwner is the parent component
        const source = fiber._debugSource;

        if (source) {
            return {
                fileName: source.fileName,
                lineNumber: source.lineNumber,
                componentName: getComponentName(fiber)
            };
        }

        // Move to parent
        fiber = fiber._debugOwner || fiber.return;
    }

    return null;
}

function getComponentName(fiber: any): string | undefined {
    const type = fiber.type;
    if (typeof type === 'string') return type; // HTML tag
    if (typeof type === 'function') return type.displayName || type.name; // Component class/fn
    return undefined;
}
