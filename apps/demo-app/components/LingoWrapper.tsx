'use client';

import { useLingoGuardian } from 'lingo-guardian-reporter';
import React from 'react';

export function LingoWrapper({ children }: { children: React.ReactNode }) {
    useLingoGuardian({ enable: true });
    return <>{children}</>;
}
