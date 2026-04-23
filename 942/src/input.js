export const InputManager = {
  keys: {},
  mouse: { left: false, right: false },
  
  init() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.updateKeyDisplay(e.code, true);
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.updateKeyDisplay(e.code, false);
    });
    
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.left = true;
        this.updateMouseDisplay(true);
      }
    });
    
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.left = false;
        this.updateMouseDisplay(false);
      }
    });
  },
  
  isKeyPressed(code) {
    return this.keys[code] === true;
  },
  
  isMouseLeftPressed() {
    return this.mouse.left;
  },
  
  updateKeyDisplay(code, pressed) {
    const keyMap = {
      'KeyW': 'key-w',
      'KeyA': 'key-a',
      'KeyS': 'key-s',
      'KeyD': 'key-d',
      'KeyR': 'key-r',
      'KeyF': 'key-f',
      'Space': 'key-space',
      'ShiftLeft': 'key-shift',
      'ShiftRight': 'key-shift'
    };
    
    const elementId = keyMap[code];
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        if (pressed) {
          element.classList.add('pressed');
        } else {
          element.classList.remove('pressed');
        }
      }
    }
  },
  
  updateMouseDisplay(pressed) {
    const element = document.getElementById('key-mouse');
    if (element) {
      if (pressed) {
        element.classList.add('pressed');
      } else {
        element.classList.remove('pressed');
      }
    }
  },
  
  showKeyDisplay() {
    const keyDisplay = document.getElementById('key-display');
    const actionKeys = document.getElementById('action-keys');
    if (keyDisplay) keyDisplay.classList.remove('hidden');
    if (actionKeys) actionKeys.classList.remove('hidden');
  },
  
  hideKeyDisplay() {
    const keyDisplay = document.getElementById('key-display');
    const actionKeys = document.getElementById('action-keys');
    if (keyDisplay) keyDisplay.classList.add('hidden');
    if (actionKeys) actionKeys.classList.add('hidden');
  }
};
