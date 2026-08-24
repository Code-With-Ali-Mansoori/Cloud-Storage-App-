import { createContext, useContext, useState } from "react";

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: string;
  onConfirm?: (() => void | Promise<void>) | null;
}

interface ModalContextValue {
  modal: ModalState;
  confirmModal: ModalState;
  showModal: (title: string, message: string, type?: string) => void;
  closeModal: () => void;
  showConfirmModal: (title: string, message: string, onConfirm: () => void | Promise<void>, type?: string) => void;
  closeConfirmModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const [confirmModal, setConfirmModal] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "warning",
  });

  const showModal = (title: string, message: string, type: string = "info") =>
    setModal({ isOpen: true, title, message, type });

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    type: string = "warning"
  ) =>
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });

  const closeConfirmModal = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  return (
    <ModalContext.Provider
      value={{
        modal,
        confirmModal,
        showModal,
        closeModal,
        showConfirmModal,
        closeConfirmModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextValue => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within a ModalProvider");
  return context;
};
