"use client";

import React, {
  cloneElement,
  createContext,
  Dispatch,
  ReactElement,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import useCloseModal from "../_hooks/useOutsideClick";
import { Icon } from "@iconify/react/dist/iconify.js";

type ModalContextTypes = {
  openName: string;
  close: () => void;
  open: Dispatch<SetStateAction<string>>;
};

const ModalContext = createContext<null | ModalContextTypes>(null);

function Modal({ children }: { children: React.ReactNode }) {
  const [openName, setOpenName] = useState<string>("");

  const close = () => setOpenName("");
  const open = setOpenName;

  return (
    <ModalContext.Provider value={{ openName, close, open }}>
      {children}
    </ModalContext.Provider>
  );
} // some state in parent component and then child components to how to change these states

function useModalContext() {
  const context = useContext(ModalContext);

  if (!context) throw new Error("ModalContext was used outside of Modal");

  return context;
}

type OpenProps = {
  opens: string;
  children: ReactElement;
};

function Open({ children, opens: opensWindowName }: OpenProps) {
  const { open } = useModalContext();

  return cloneElement(children as ReactElement<{ onClick: () => void }>, {
    onClick: () => open(opensWindowName),
  });
}

type WindowProps = {
  children: ReactElement;
  name: string;
};

function Window({ children, name }: WindowProps) {
  const { openName, close } = useModalContext();

  const { ref } = useCloseModal(close);

  useEffect(() => {
    const headerMenu = document.querySelector(".headerMenu");

    if (!headerMenu) return;

    if (name === openName) {
      document.body.style.paddingRight = "12px";
      document.body.style.overflow = "hidden";
      headerMenu.classList.add("paddingRight");
    }

    return () => {
      document.body.style.overflow = "visible";
      document.body.style.paddingRight = "0";
      headerMenu.classList.remove("paddingRight");
    };
  }, [openName, name]);

  if (name !== openName) return null;

  return createPortal(
    // used to avoid parent css overflow:hidden
    <div className="fixed top-0 left-0 z-[1000] h-[100vh] w-full backdrop-blur-xs transition-all duration-500">
      <div
        className="dark:bg-gray-0 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform overflow-y-auto rounded-lg bg-white py-[3.2rem] shadow-[0_2.4rem_3.2rem_rgba(0,0,0,0.12)] transition-all duration-500 dark:shadow-[0_2.4rem_3.2rem_rgba(0,0,0,0.4)]"
        ref={ref as React.RefObject<HTMLDivElement>}
      >
        <button
          className="absolute top-[1.2rem] right-[1.9rem] translate-x-[0.8rem] transform rounded-md border-none bg-none p-[0.4rem] text-[2.4rem] text-gray-500 transition-all duration-200 hover:bg-gray-100 dark:text-gray-400 hover:dark:bg-gray-800"
          onClick={close}
          aria-label="Icon"
        >
          <Icon icon="gg:close" />
        </button>

        <div className="xs:px-[2rem] flex items-center justify-center overflow-hidden px-[1rem]">
          {cloneElement(children)}
        </div>
      </div>
    </div>,
    document.body,
  );
}

Modal.Open = Open;
Modal.Window = Window;

export default Modal;
