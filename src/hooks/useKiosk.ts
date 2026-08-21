import { useContext } from "react";
import { KioskContext } from "../state/KioskContext";

export function useKiosk() {
  const ctx = useContext(KioskContext);
  if (!ctx) {
    throw new Error("useKiosk must be used inside a <KioskProvider>");
  }
  return ctx;
}
