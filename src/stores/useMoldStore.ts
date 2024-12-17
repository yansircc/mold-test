import { create } from "zustand";


interface MoldStore {
  moldDimensions: {
    length: number;
    width: number;
    height: number;
  };
  moldMaterial: string;
  moldWeight: number;
  moldPrice: number;
  edgeMargin: number;
  error: string | null;

  // Actions
  setMoldDimensions: (moldDimensions: { length: number; width: number; height: number }) => void;
  setMoldMaterial: (moldMaterial: string) => void;
  setMoldWeight: (moldWeight: number) => void;
  setMoldPrice: (moldPrice: number) => void;
  setEdgeMargin: (edgeMargin: number) => void;
  setError: (error: string | null) => void;
  resetMold: () => void;
}

export const useMoldStore = create<MoldStore>((set) => ({
  moldDimensions: { length: 0, width: 0, height: 0 },
  moldMaterial: 'NAK80',
  moldWeight: 0,
  moldPrice: 0,
  error: null,
  edgeMargin: 0,


  setEdgeMargin: (edgeMargin: number) => set({ edgeMargin }),
  setMoldDimensions: (moldDimensions: { length: number; width: number; height: number }) => set({ moldDimensions }),
  setMoldMaterial: (moldMaterial: string) => set({ moldMaterial }),
  setMoldWeight: (moldWeight: number) => set({ moldWeight }),
  setMoldPrice: (moldPrice: number) => set({ moldPrice }),
  setError: (error: string | null) => set({ error }),
  resetMold: () => set({ moldMaterial: 'NAK80', moldWeight: 0, moldPrice: 0, error: null }),
}));
