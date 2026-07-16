/* ==================================================
   NORAH Studio
   Lyrics Editor History Manager
================================================== */

window.LyricsEditorHistory = (() => {
  const DEFAULT_HISTORY_LIMIT = 100;


  function cloneState(state) {
    if (state == null) {
      return state;
    }

    return JSON.parse(
      JSON.stringify(state)
    );
  }


  function create(options = {}) {
    const captureState =
      options.captureState;

    const restoreState =
      options.restoreState;

    const historyLimit =
      Math.max(
        1,
        Number(
          options.historyLimit
        ) ||
        DEFAULT_HISTORY_LIMIT
      );


    if (
      typeof captureState !==
      'function'
    ) {
      throw new Error(
        'LyricsEditorHistory: captureState is required.'
      );
    }


    if (
      typeof restoreState !==
      'function'
    ) {
      throw new Error(
        'LyricsEditorHistory: restoreState is required.'
      );
    }


    const undoStack = [];
    const redoStack = [];

    let restoring = false;


    function statesEqual(
      stateA,
      stateB
    ) {
      if (
        stateA == null ||
        stateB == null
      ) {
        return false;
      }

      return (
        JSON.stringify(stateA) ===
        JSON.stringify(stateB)
      );
    }


    function capture() {
      return cloneState(
        captureState()
      );
    }


    function commit(beforeState) {
      if (
        restoring ||
        !beforeState
      ) {
        return false;
      }

      const afterState =
        capture();

      if (
        statesEqual(
          beforeState,
          afterState
        )
      ) {
        return false;
      }

      undoStack.push(
        cloneState(beforeState)
      );

      if (
        undoStack.length >
        historyLimit
      ) {
        undoStack.shift();
      }

      redoStack.length = 0;

      return true;
    }


    function undo() {
      const previousState =
        undoStack.pop();

      if (!previousState) {
        return false;
      }

      const currentState =
        capture();

      redoStack.push(
        currentState
      );

      restoring = true;

      try {
        restoreState(
          cloneState(
            previousState
          )
        );
      } finally {
        restoring = false;
      }

      return true;
    }


    function redo() {
      const nextState =
        redoStack.pop();

      if (!nextState) {
        return false;
      }

      const currentState =
        capture();

      undoStack.push(
        currentState
      );

      restoring = true;

      try {
        restoreState(
          cloneState(
            nextState
          )
        );
      } finally {
        restoring = false;
      }

      return true;
    }


    function reset() {
      undoStack.length = 0;
      redoStack.length = 0;
    }


    function canUndo() {
      return undoStack.length > 0;
    }


    function canRedo() {
      return redoStack.length > 0;
    }


    function isRestoring() {
      return restoring;
    }


    function getStatus() {
      return {
        undoCount:
          undoStack.length,

        redoCount:
          redoStack.length,

        restoring
      };
    }


    return {
      capture,
      commit,
      undo,
      redo,
      reset,
      canUndo,
      canRedo,
      isRestoring,
      getStatus
    };
  }


  return {
    create
  };
})();