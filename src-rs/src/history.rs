//! history.rs - Gestión de la pila de memoria (Undo/Redo) con cursor dinámico.

#[allow(dead_code)]
pub struct HistoryStack {
    /// Pila de snapshots binarios
    pub snapshots: Vec<Vec<u8>>,
    /// Posición actual en la historia (0 = estado más antiguo)
    pub cursor: usize,
}

impl HistoryStack {
    pub fn new(capacity: usize) -> Self {
        Self {
            snapshots: Vec::with_capacity(capacity),
            cursor: 0,
        }
    }

    /// Guarda un nuevo snapshot e invalida la rama futura (redo)
    pub fn push(&mut self, snapshot: Vec<u8>) {
        // Al guardar un cambio nuevo, eliminamos estados futuros de posibles redos pasados
        if self.cursor < self.snapshots.len() {
            self.snapshots.truncate(self.cursor);
        }
        
        if self.snapshots.len() >= 100 {
            self.snapshots.remove(0);
        } else {
            self.cursor += 1;
        }
        
        self.snapshots.push(snapshot);
    }

    /// Recupera el estado anterior
    pub fn undo(&mut self) -> Option<Vec<u8>> {
        if self.cursor > 1 {
            self.cursor -= 1;
            self.snapshots.get(self.cursor - 1).cloned()
        } else {
            None
        }
    }

    /// Recupera el estado futuro
    pub fn redo(&mut self) -> Option<Vec<u8>> {
        if self.cursor < self.snapshots.len() {
            let snapshot = self.snapshots.get(self.cursor).cloned();
            self.cursor += 1;
            snapshot
        } else {
            None
        }
    }
}
