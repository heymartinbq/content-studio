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

pub struct SpatialEngine {
    layers: Vec<LayerNode>,
    active_layer: u16,
}

impl SpatialEngine {
    pub fn new() -> Self {
        Self {
            layers: Vec::new(),
            active_layer: 0,
        }
    }

    /// Sincronizar un layer desde JS a Wasm
    pub fn sync_layer(&mut self, id: u16, x: f32, y: f32, width: f32, height: f32, locked: bool, visible: bool) {
        if let Some(layer) = self.layers.iter_mut().find(|l| l.id == id) {
            layer.x = x;
            layer.y = y;
            layer.width = width;
            layer.height = height;
            layer.locked = locked;
            layer.visible = visible;
        } else {
            self.layers.push(LayerNode { id, x, y, width, height, locked, visible });
        }
    }

    /// HIT-TEST en Wasm (Retorna el ID de la capa tocada, o 0 si no toca nada)
    /// Iteración reversa para top-Z-index primero
    pub fn hit_test(&mut self, mouse_x: f32, mouse_y: f32) -> u16 {
        for layer in self.layers.iter().rev() {
            if !layer.visible || layer.locked { continue; }

            let left = layer.x - layer.width / 2.0;
            let right = layer.x + layer.width / 2.0;
            let top = layer.y - layer.height / 2.0;
            let bottom = layer.y + layer.height / 2.0;

            let pad = 30.0; // HitBox padding

            if mouse_x >= left - pad && mouse_x <= right + pad &&
               mouse_y >= top - pad && mouse_y <= bottom + pad {
                self.active_layer = layer.id;
                return layer.id;
            }
        }
        self.active_layer = 0;
        0
    }

    /// DRAG - Mover capa activa
    pub fn drag_update(&mut self, delta_x: f32, delta_y: f32) {
        if self.active_layer == 0 { return; }
        
        if let Some(layer) = self.layers.iter_mut().find(|l| l.id == self.active_layer) {
            layer.x += delta_x;
            layer.y += delta_y;
        }
    }

    /// Recuperar X de una capa
    pub fn get_layer_x(&self, id: u16) -> f32 {
        self.layers.iter().find(|l| l.id == id).map_or(0.0, |l| l.x)
    }

    /// Recuperar Y de una capa
    pub fn get_layer_y(&self, id: u16) -> f32 {
        self.layers.iter().find(|l| l.id == id).map_or(0.0, |l| l.y)
    }
}
