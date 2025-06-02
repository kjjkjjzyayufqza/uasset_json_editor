import { useState, useEffect } from "react";
import { Store } from "@tauri-apps/plugin-store";

interface AppState {
  dumpJsonFile: string;
  outputFolder: string;
  gamePakFolder: string;
  modFolder: string;
}

const defaultState: AppState = {
  dumpJsonFile: "",
  outputFolder: "",
  gamePakFolder: "",
  modFolder: "",
};

export const useAppStore = () => {
  const [state, setState] = useState<AppState>(defaultState);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initStore = async () => {
      try {
        const storeInstance = await Store.load("app-settings.json");
        setStore(storeInstance);

        // Load existing state
        const savedState = await storeInstance.get<AppState>("appState");
        if (savedState) {
          setState(savedState);
        }
      } catch (error) {
        console.error("Failed to initialize store:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initStore();
  }, []);

  const updateState = async (newState: Partial<AppState>) => {
    const updatedState = { ...state, ...newState };
    setState(updatedState);

    if (store) {
      try {
        await store.set("appState", updatedState);
        await store.save();
      } catch (error) {
        console.error("Failed to save state:", error);
      }
    }
  };

  const setDumpJsonFile = (file: string) => {
    updateState({ dumpJsonFile: file });
  };

  const setOutputFolder = (folder: string) => {
    updateState({ outputFolder: folder });
  };

  const setGamePakFolder = (folder: string) => {
    updateState({ gamePakFolder: folder });
  };

  const setModFolder = (folder: string) => {
    updateState({ modFolder: folder });
  };

  return {
    state,
    setDumpJsonFile,
    setOutputFolder,
    setGamePakFolder,
    setModFolder,
    isLoading,
  };
}; 