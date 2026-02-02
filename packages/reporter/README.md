# @lingo-guardian/reporter

The **Developer Experience (DX)** hook for Lingo-Guardian.
Instantly visualizes i18n layout issues in your browser as you develop.

## Features

- **Real-Time Detection**: Uses `ResizeObserver` to detect overflows instantly.
- **Red Glow**: Automatically outlines overflowing elements in red.
- **Source Linking**: Logs a `vscode://` link to the exact component file and line number.
- **Dashboard Integration**: Broadcasts alerts to the `lingo-guardian dashboard`.

## Installation

```bash
npm install @lingo-guardian/reporter
# or
yarn add @lingo-guardian/reporter
```

## Usage

In your **Next.js** or **React** app, import and use the hook in a top-level component (like `layout.tsx` or `App.tsx`).

### Next.js (Client Component Wrapper)

Since `layout.tsx` is often a Server Component, create a wrapper:

```tsx
// components/LingoWrapper.tsx
'use client';

import { useLingoGuardian } from '@lingo-guardian/reporter';

export function LingoWrapper({ children }: { children: React.ReactNode }) {
  // Enable only in development
  useLingoGuardian({ enable: process.env.NODE_ENV === 'development' });
  
  return <>{children}</>;
}
```

Then use it in `app/layout.tsx`:

```tsx
import { LingoWrapper } from './components/LingoWrapper';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LingoWrapper>
          {children}
        </LingoWrapper>
      </body>
    </html>
  );
}
```

## Configuration

```typescript
useLingoGuardian({
  enable?: boolean;     // Default: true. Set to false in production.
  highlightColor?: string; // Default: 'red'.
  onIssue?: (issue) => void; // Custom callback.
})
```

## Dashboard Support

To use the 4-pane dashboard:
1.  Run your app: `npm run dev`
2.  Run the dashboard: `npx lingo-guardian dashboard http://localhost:3000`

The reporter hook will automatically send signals to the dashboard when overflows occur.
