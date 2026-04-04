import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { 
  EditorState, 
  EditorConfig, 
  EditorAction, 
  Layer, 
  JournalEntry 
} from "./types";
import { INITIAL_CONFIG, DEFAULT_LAYER_TEMPLATE } from "./defaults";
import { getVortexEngine, VortexEngine } from "./wasm-bridge";

const INITIAL_STATE: EditorState = {
  config: INITIAL_CONFIG,
  activeLayerId: "media",
  isPreview: false,
  showFloatingEditor: true,
  journal: [],
  currentTime: 0,
  isPlaying: false,
  duration: 15, // segs por defecto
};

const MAX_JOURNAL_ENTRIES = 50;

function createJournalEntry(actionType: string, payload?: any): JournalEntry {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    action: actionType,
    payload,
  };
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  let newState = state;

  switch (action.type) {
    case "UPDATE_GLOBAL_CONFIG":
      newState = {
        ...state,
        config: { ...state.config, ...action.payload },
      };
      break;

    case "SELECT_LAYER":
      newState = {
        ...state,
        activeLayerId: action.payload,
        showFloatingEditor: action.payload ? true : state.showFloatingEditor,
      };
      break;

    case "ADD_LAYER": {
      const newId = `layer-${Date.now()}`;
      const newLayer: Layer = {
        ...DEFAULT_LAYER_TEMPLATE,
        ...action.payload,
        id: newId,
        name: action.payload?.name || `Capa ${state.config.layers.length + 1}`,
      } as Layer;
      
      newState = {
        ...state,
        config: {
          ...state.config,
          layers: [...state.config.layers, newLayer],
        },
        activeLayerId: newId,
      };
      break;
    }

    case "REMOVE_LAYER": {
      if (state.config.layers.length <= 1) return state;
      const newLayers = state.config.layers.filter(l => l.id !== action.payload);
      const newActiveId = state.activeLayerId === action.payload ? "media" : state.activeLayerId;
      
      newState = {
        ...state,
        config: {
          ...state.config,
          layers: newLayers,
        },
        activeLayerId: newActiveId,
      };
      break;
    }

    case "UPDATE_LAYER":
      newState = {
        ...state,
        config: {
          ...state.config,
          layers: state.config.layers.map(l => 
            l.id === action.payload.id ? { ...l, ...action.payload.updates } : l
          ),
        },
      };
      break;

    case "DUPLICATE_LAYER": {
      const layerToCopy = state.config.layers.find(l => l.id === action.payload);
      if (!layerToCopy) return state;
      
      const newId = `layer-${Date.now()}`;
      const newLayer: Layer = {
        ...layerToCopy,
        id: newId,
        name: `${layerToCopy.name} (Copia)`,
        x: (layerToCopy.x || 0) + 40,
        y: (layerToCopy.y || 0) + 40,
      };
      
      newState = {
        ...state,
        config: {
          ...state.config,
          layers: [...state.config.layers, newLayer],
        },
        activeLayerId: newId,
      };
      break;
    }

    case "TOGGLE_PREVIEW":
      newState = {
        ...state,
        isPreview: action.payload !== undefined ? action.payload : !state.isPreview,
      };
      break;

    case "TOGGLE_FLOATING_EDITOR":
      newState = {
        ...state,
        showFloatingEditor: action.payload !== undefined ? action.payload : !state.showFloatingEditor,
      };
      break;

    case "REORDER_LAYERS":
      newState = {
        ...state,
        config: {
          ...state.config,
          layers: action.payload,
        },
      };
      break;

    case "UNDO":
    case "REDO":
      if (action.payload) {
        newState = {
          ...state,
          config: action.payload as EditorConfig,
        };
      }
      break;

    case "SET_CURRENT_TIME":
      newState = {
        ...state,
        currentTime: action.payload,
      };
      break;
      
    case "TOGGLE_PLAYBACK":
      newState = {
        ...state,
        isPlaying: action.payload !== undefined ? action.payload : !state.isPlaying,
      };
      break;

    case "SET_KEYFRAME": {
        const { layerId, property, time, value, easing } = action.payload;
        newState = {
            ...state,
            config: {
                ...state.config,
                layers: state.config.layers.map(l => {
                    if (l.id !== layerId) return l;
                    const keyframes = { ...(l.keyframes || {}) };
                    const propertyKeyframes = [...(keyframes[property] || [])];
                    
                    // Upsert keyframe
                    const existingIdx = propertyKeyframes.findIndex(kf => Math.abs(kf.time - time) < 0.1);
                    const newKeyframe = { id: `kf-${Date.now()}`, time, value, easing };
                    
                    if (existingIdx >= 0) propertyKeyframes[existingIdx] = newKeyframe;
                    else propertyKeyframes.push(newKeyframe);
                    
                    keyframes[property] = propertyKeyframes;
                    return { ...l, keyframes };
                })
            }
        };
        break;
    }

    case "CLEAR_JOURNAL":
      return { ...state, journal: [] };

    default:
      return state;
  }

  // Journaling Logic
  const payload = "payload" in action ? action.payload : undefined;
  const journalEntry = createJournalEntry(action.type, payload);
  const newJournal = [journalEntry, ...state.journal].slice(0, MAX_JOURNAL_ENTRIES);

  return { ...newState, journal: newJournal };
}

const EditorContext = createContext<{
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  engineReady: boolean;
  engine: VortexEngine | null;
  actions: {
    updateGlobalConfig: (updates: Partial<EditorConfig>) => void;
    selectLayer: (id: string) => void;
    addLayer: (props?: Partial<Layer>) => void;
    removeLayer: (id: string) => void;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    duplicateLayer: (id: string) => void;
    togglePreview: (val?: boolean) => void;
    toggleFloatingEditor: (val?: boolean) => void;
    reorderLayers: (layers: Layer[]) => void;
    undo: () => void;
    redo: () => void;
    setCurrentTime: (time: number) => void;
    setLayerKeyframe: (layerId: string, property: string, value: any, easing?: any) => void;
    togglePlayback: (val?: boolean) => void;
  };
} | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, INITIAL_STATE);
  const engineRef = useRef<VortexEngine | null>(null);
  const [engineReady, setEngineReady] = React.useState(false);
  const isInternalChange = useRef(false);

  // Inicialización del motor
  useEffect(() => {
    getVortexEngine().then(engine => {
      engineRef.current = engine;
      setEngineReady(true);
      // Guardar estado inicial
      engine.pushHistory(JSON.stringify(state.config));
    });
  }, []);

  // Sincronización de historial
  useEffect(() => {
    if (engineRef.current && !isInternalChange.current) {
      engineRef.current.pushHistory(JSON.stringify(state.config));
    }
    isInternalChange.current = false;
  }, [state.config]);

  const actions = {
    updateGlobalConfig: useCallback((payload: Partial<EditorConfig>) => {
      if (engineRef.current) {
        let shouldDispatch = true;
        for (const [key, value] of Object.entries(payload)) {
          if (typeof value === "number") {
            const isSignificant = engineRef.current.debounce_update(key, value, 0.005);
            if (!isSignificant) shouldDispatch = false;
          }
        }
        if (!shouldDispatch) {
          // Filtrado por el motor para el diario, pero despachamos para la UI fluida
        }
      }
      dispatch({ type: "UPDATE_GLOBAL_CONFIG", payload });
    }, []),

    selectLayer: useCallback((payload: string) => dispatch({ type: "SELECT_LAYER", payload }), []),
    addLayer: useCallback((payload?: any) => dispatch({ type: "ADD_LAYER", payload }), []),
    removeLayer: useCallback((payload: string) => dispatch({ type: "REMOVE_LAYER", payload }), []),
    updateLayer: useCallback((id: string, updates: any) => dispatch({ type: "UPDATE_LAYER", payload: { id, updates } }), []),
    duplicateLayer: useCallback((payload: string) => dispatch({ type: "DUPLICATE_LAYER", payload }), []),
    togglePreview: useCallback((payload?: boolean) => dispatch({ type: "TOGGLE_PREVIEW", payload }), []),
    toggleFloatingEditor: useCallback((payload?: boolean) => dispatch({ type: "TOGGLE_FLOATING_EDITOR", payload }), []),
    reorderLayers: useCallback((payload: Layer[]) => dispatch({ type: "REORDER_LAYERS", payload }), []),
    clearJournal: useCallback(() => dispatch({ type: "CLEAR_JOURNAL" }), []),
    
    calculateGamma: useCallback((master: number, channel: number) => {
      // Gamma pre-calculado en JS para control de UI (BCSH simple)
      // El procesamiento pesado de video ocurre en Wasm SIMD
      return master * channel;
    }, []),

    undo: useCallback(() => {
      if (engineRef.current) {
        const str = engineRef.current.undo();
        if (str) {
          try {
            const payload = JSON.parse(str);
            isInternalChange.current = true;
            dispatch({ type: "UNDO", payload });
          } catch(e) { console.error("Undo decode error:", e); }
        }
      }
    }, []),

    redo: useCallback(() => {
      if (engineRef.current) {
        const str = engineRef.current.redo();
        if (str) {
          try {
            const payload = JSON.parse(str);
            isInternalChange.current = true;
            dispatch({ type: "REDO", payload });
          } catch(e) { console.error("Redo decode error:", e); }
        }
      }
    }, []),
    
    setCurrentTime: useCallback((payload: number) => dispatch({ type: "SET_CURRENT_TIME", payload }), []),
    setLayerKeyframe: useCallback((layerId: string, property: string, value: any, easing: any = 'easeInOut') => {
        dispatch({ type: "SET_KEYFRAME", payload: { layerId, property, time: state.currentTime, value, easing } });
    }, [state.currentTime]),
    togglePlayback: useCallback((payload?: boolean) => dispatch({ type: "TOGGLE_PLAYBACK", payload }), []),
  };

  return (
    <EditorContext.Provider value={{ state, dispatch, engineReady, engine: engineRef.current, actions }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
