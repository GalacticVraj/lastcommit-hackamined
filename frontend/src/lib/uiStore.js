import { create } from 'zustand';

const useUIStore = create((set) => ({
    aiPanelOpen: false,
    setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
    toggleAiPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
}));

export default useUIStore;
