import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, loadAppState, saveAppState, mergeServerWorkspace, DEFAULT_APP_STATE } from "../lib/appState";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";

const APP_STATE_EVENT = "app_state_update";

// Reusable debounce utility
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttled server save — at most once every 10 seconds
function throttle<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    if (remaining <= 0) {
      lastCall = now;
      func(...args);
    } else {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, remaining);
    }
  };
}

export function useAppState() {
  const { user, token } = useAuth();
  const userId = user?.id || "guest";
  const isAuthenticated = !!user && !!token;

  // Initialize from localStorage immediately (fast, synchronous)
  const [state, setState] = useState<AppState>(() => loadAppState(userId));
  const [serverSyncDone, setServerSyncDone] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // SERVER SYNC: On login / userId change → fetch workspace from server
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setServerSyncDone(false);

    if (!isAuthenticated || userId === "guest") {
      // Reload from localStorage for guest or on logout
      setState(loadAppState(userId));
      setServerSyncDone(true);
      return;
    }

    const fetchWorkspace = async () => {
      try {
        console.log(`[WORKSPACE] Fetching server workspace for user ${userId}...`);
        const res = await API.get("/workspace");

        if (res.data.found && res.data.workspace) {
          // Server has data — merge and use it as source of truth
          const serverState = mergeServerWorkspace(res.data.workspace);
          console.log("[WORKSPACE] Restored from server ✅");
          
          const latestMatchRestore = serverState.analyses?.latestAnalysis?.match;
          console.log({
              stage: "8. AppState Restore",
              matchedSkills: latestMatchRestore?.matchedSkills?.length,
              missingSkills: latestMatchRestore?.missingSkills?.length,
              strengths: latestMatchRestore?.strengths?.length,
              weaknesses: latestMatchRestore?.weaknesses?.length,
              atsScore: latestMatchRestore?.matchScore,
              keys: latestMatchRestore ? Object.keys(latestMatchRestore) : []
          });

          setState(serverState);
          saveAppState(serverState, userId); // also update localStorage cache
        } else {
          // New user — check if localStorage has existing data (e.g., from before server sync was added)
          const localState = loadAppState(userId);
          const hasLocalData =
            localState.resume.uploaded ||
            localState.analyses.history.length > 0 ||
            localState.applications.length > 0 ||
            Object.keys(localState.gapCloser.roadmaps).length > 0;

          if (hasLocalData) {
            // Push local data up to server so it's persisted going forward
            console.log("[WORKSPACE] No server data found — pushing existing localStorage workspace to server.");
            setState(localState);
            await API.put("/workspace", localState);
          } else {
            // Truly new user
            console.log("[WORKSPACE] New user — starting with empty workspace.");
            setState({ ...DEFAULT_APP_STATE });
          }
        }
      } catch (err: any) {
        console.warn("[WORKSPACE] Server fetch failed, using localStorage fallback:", err?.message);
        setState(loadAppState(userId));
      } finally {
        setServerSyncDone(true);
      }
    };

    fetchWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isAuthenticated]);

  // Maintain a ref of the state to avoid dependency loop in debounced save
  const stateRef = useRef<AppState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ─────────────────────────────────────────────────────────────────────────
  // LOCAL SAVE — debounced 300ms
  // ─────────────────────────────────────────────────────────────────────────
  const debouncedLocalSave = useRef(
    debounce((currentState: AppState, currentUserId: string) => {
      saveAppState(currentState, currentUserId);
      window.dispatchEvent(new CustomEvent(APP_STATE_EVENT, {
        detail: { state: currentState, userId: currentUserId }
      }));
    }, 300)
  ).current;

  // ─────────────────────────────────────────────────────────────────────────
  // SERVER SAVE — throttled to at most once per 10 seconds
  // ─────────────────────────────────────────────────────────────────────────
  const throttledServerSave = useRef(
    throttle(async (currentState: AppState) => {
      if (!isAuthenticated) return;
      try {
        console.log({
            stage: "PRE-SAVE TO SERVER",
            exists: !!currentState.analyses?.latestAnalysis?.ai?.suggestions,
            length: currentState.analyses?.latestAnalysis?.ai?.suggestions?.length
        });
        await API.put("/workspace", currentState);
      } catch (err: any) {
        console.warn("[WORKSPACE] Server save failed (will retry on next change):", err?.message);
      }
    }, 10000)
  ).current;

  // Normal immediate save
  const saveStateImmediate = useCallback((currentState: AppState, currentUserId: string) => {
    saveAppState(currentState, currentUserId);
    window.dispatchEvent(new CustomEvent(APP_STATE_EVENT, {
      detail: { state: currentState, userId: currentUserId }
    }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE FUNCTION — supports partial updates
  // ─────────────────────────────────────────────────────────────────────────
  const updateAppState = useCallback((
    updater: Partial<AppState> | ((prev: AppState) => AppState),
    immediate: boolean = false
  ) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };

      // Defer side effects
      setTimeout(() => {
        if (immediate) {
          saveStateImmediate(next, userId);
        } else {
          debouncedLocalSave(next, userId);
        }
        // Always try to sync important changes to server
        if (isAuthenticated && userId !== "guest" && serverSyncDone) {
          throttledServerSave(next);
        }
      }, 0);

      return next;
    });
  }, [debouncedLocalSave, saveStateImmediate, throttledServerSave, userId, isAuthenticated, serverSyncDone]);

  // ─────────────────────────────────────────────────────────────────────────
  // CROSS-TAB SYNC — listen to custom events from other hook instances
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.userId === userId && JSON.stringify(detail.state) !== JSON.stringify(stateRef.current)) {
        setState(detail.state);
      }
    };

    window.addEventListener(APP_STATE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(APP_STATE_EVENT, handleUpdate);
    };
  }, [userId]);

  return {
    appState: state,
    updateAppState,
    serverSyncDone,
  };
}
