import type { ReactNode } from 'react'

type IconName = 'waterfall' | 'model' | 'tool' | 'compaction' | 'notice' | 'left' | 'right' | 'down' | 'search' | 'history' | 'loading' | 'error' | 'close' | 'copy' | 'check' | 'branch' | 'focus' | 'database'

/** Small local icons keep the viewer aligned with the host without another UI runtime. */
export function TraceIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" /></>,
    focus: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /></>,
    waterfall: <><path d="M3 5h8M7 10h9M12 15h9M3 3v16" /></>,
    model: <><rect x="6" y="6" width="12" height="12" rx="3" /><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M10 10h4v4h-4z" /></>,
    tool: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m7 9 3 3-3 3m6 0h4" /></>,
    compaction: <><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4" /></>,
    notice: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
    left: <path d="m14 6-6 6 6 6" />,
    right: <path d="m9 6 6 6-6 6" />,
    down: <path d="m6 9 6 6 6-6" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    history: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6m3-3v5l3 2" /></>,
    loading: <><path d="M20 12a8 8 0 1 1-8-8" /><path d="M17 4h3v3" /></>,
    error: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 4h.01" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    branch: <><path d="M6 3v10a4 4 0 0 0 4 4h8m-4-4 4 4-4 4" /></>,
  }
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>
}
