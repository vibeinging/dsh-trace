/** UI preferences belong to this client; collection policy stays in the Host profile. */
export interface TraceNavigationPreferences {
    getSnapshot(): boolean;
    subscribe(listener: () => void): () => void;
    setVisible(visible: boolean): void;
    dispose(): void;
}
export declare function navigationPreferences(): TraceNavigationPreferences;
