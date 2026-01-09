import { useEffect, useCallback, useState, useRef } from "react";
import { useBlocker } from "react-router-dom";

export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  // Warn on browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Block navigation with react-router
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  return blocker;
}

export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay: number = 2000
) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "unsaved" | "error">("idle");
  const [lastSavedData, setLastSavedData] = useState<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedData);

  useEffect(() => {
    if (!hasChanges) {
      setSaveStatus(saveStatus === "saved" ? "saved" : "idle");
      return;
    }

    setSaveStatus("unsaved");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await saveFunction(data);
        setLastSavedData(data);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        setSaveStatus("error");
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, hasChanges, saveFunction, delay, saveStatus]);

  const resetSaveStatus = useCallback(() => {
    setLastSavedData(data);
    setSaveStatus("idle");
  }, [data]);

  return { saveStatus, hasChanges, resetSaveStatus };
}
