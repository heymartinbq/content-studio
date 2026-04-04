#[derive(Debug, Clone)]
pub struct LayerNode {
    pub id: u16,        // Correspondencia numérica del ID de capa del config
    pub x: f32,
    pub y: f32,
    pub width: f32,     // Calculado estáticamente (hitbox ancho)
    pub height: f32,    // Calculado estáticamente (hitbox alto)
    pub locked: bool,
    pub visible: bool,
}

/// Motor Espacial Sovereign (Vortex-Spatial)
/// Gestión de colisiones y transformaciones de bajo nivel con latencia 0.
pub struct SpatialEngine {
    layers: Vec<LayerNode>,
    active_layer: u16,
    last_mouse_x: f32,
    last_mouse_y: f32,
}

impl Default for SpatialEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl SpatialEngine {
    pub fn new() -> Self {
        Self {
            layers: Vec::new(),
            active_layer: 0,
            last_mouse_x: 0.0,
            last_mouse_y: 0.0,
        }
    }

    /// Sincronizar un layer desde el frontend a la memoria Wasm
    #[allow(clippy::too_many_arguments)]
    pub fn sync_layer(&mut self, id: u16, x: f32, y: f32, width: f32, height: f32, locked: bool, visible: bool) {
        if id == 0 { return; }
        if let Some(layer) = self.layers.iter_mut().find(|l| l.id == id) {
            // Durante un Drag activo, ignoramos los updates de X/Y externos para evitar Jitter (React Lag)
            if self.active_layer != id {
                layer.x = x;
                layer.y = y;
            }
            layer.width = width;
            layer.height = height;
            layer.locked = locked;
            layer.visible = visible;
        } else {
            self.layers.push(LayerNode { id, x, y, width, height, locked, visible });
        }
    }

    /// HIT-TEST en Wasm (Retorna el ID de la capa tocada)
    pub fn hit_test(&mut self, mouse_x: f32, mouse_y: f32) -> u16 {
        self.last_mouse_x = mouse_x;
        self.last_mouse_y = mouse_y;
        
        for layer in self.layers.iter().rev() {
            if !layer.visible || layer.locked { continue; }

            let left = layer.x - layer.width / 2.0;
            let right = layer.x + layer.width / 2.0;
            let top = layer.y - layer.height / 2.0;
            let bottom = layer.y + layer.height / 2.0;

            let pad = 40.0; // HitBox padding generoso para UX táctil

            if mouse_x >= left - pad && mouse_x <= right + pad &&
               mouse_y >= top - pad && mouse_y <= bottom + pad {
                self.active_layer = layer.id;
                return layer.id;
            }
        }
        self.active_layer = 0;
        0
    }

    /// DRAG - Actualización de posición basada en DELTAS relativos
    /// Esto garantiza 0ms de latencia ya que no depende del loop de React.
    pub fn drag_update(&mut self, mouse_x: f32, mouse_y: f32) {
        if self.active_layer == 0 { return; }
        
        let dx = mouse_x - self.last_mouse_x;
        let dy = mouse_y - self.last_mouse_y;
        
        if let Some(layer) = self.layers.iter_mut().find(|l| l.id == self.active_layer) {
            layer.x += dx;
            layer.y += dy;
        }
        
        self.last_mouse_x = mouse_x;
        self.last_mouse_y = mouse_y;
    }

    /// Finalizar interacción
    pub fn release(&mut self) -> u16 {
        let released_id = self.active_layer;
        self.active_layer = 0;
        released_id
    }

    pub fn get_layer_x(&self, id: u16) -> f32 {
        self.layers.iter().find(|l| l.id == id).map_or(0.0, |l| l.x)
    }

    pub fn get_layer_y(&self, id: u16) -> f32 {
        self.layers.iter().find(|l| l.id == id).map_or(0.0, |l| l.y)
    }

    pub fn get_active_layer_id(&self) -> u16 {
        self.active_layer
    }
}
