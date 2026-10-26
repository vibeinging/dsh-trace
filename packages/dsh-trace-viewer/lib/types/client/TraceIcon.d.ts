type IconName = 'waterfall' | 'model' | 'tool' | 'compaction' | 'notice' | 'left' | 'right' | 'down' | 'search' | 'history' | 'loading' | 'error' | 'close' | 'copy' | 'check' | 'branch' | 'focus' | 'database';
/** Small local icons keep the viewer aligned with the host without another UI runtime. */
export declare function TraceIcon({ name }: {
    name: IconName;
}): import("react").JSX.Element;
export {};
