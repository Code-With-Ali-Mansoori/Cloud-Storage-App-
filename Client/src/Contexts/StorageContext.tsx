import { createContext, useContext, useState } from "react";

// Create context
interface StorageData {
  maxStorageLimit: number;
  usedStorageLimit: number;
  availableStorageLimit: number;
}

interface StorageContextValue {
  storageData: StorageData;
  setStorageData: React.Dispatch<React.SetStateAction<StorageData>>;
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined);

// Context Provider
export const StorageProvider = ({ children }: { children: React.ReactNode }) => {
  const [storageData, setStorageData] = useState({
    maxStorageLimit: 0,
    usedStorageLimit: 0,
    availableStorageLimit: 0,
  });

  return (
    <StorageContext.Provider value={{ storageData, setStorageData }}>
      {children}
    </StorageContext.Provider>
  );
};

// Custom hook for easier access
export const useStorage = (): StorageContextValue => {
  const context = useContext(StorageContext);
  if (!context) throw new Error("useStorage must be used within a StorageProvider");
  return context;
};
