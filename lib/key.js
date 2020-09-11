(function () {
  var Key = {
    debug: false //Enable logging
  };

  //Key Code values
  Key.A = 65;
  Key.B = 66;
  Key.C = 67;
  Key.D = 68;
  Key.E = 69;
  Key.F = 70;
  Key.G = 71;
  Key.H = 72;
  Key.I = 73;
  Key.J = 74;
  Key.K = 75;
  Key.L = 76;
  Key.M = 77;
  Key.N = 78;
  Key.O = 79;
  Key.P = 80;
  Key.Q = 81;
  Key.R = 82;
  Key.S = 83;
  Key.T = 84;
  Key.U = 85;
  Key.V = 86;
  Key.W = 87;
  Key.X = 88;
  Key.Y = 89;
  Key.Z = 90;

  //NUMBERS
  Key.ZERO = 48;
  Key.ONE = 49;
  Key.TWO = 50;
  Key.THREE = 51;
  Key.FOUR = 52;
  Key.FIVE = 53;
  Key.SIX = 54;
  Key.SEVEN = 55;
  Key.EIGHT = 56;
  Key.NINE = 57;

  //NUMPAD
  Key.NUMPAD_0 = 96;
  Key.NUMPAD_1 = 97;
  Key.NUMPAD_2 = 98;
  Key.NUMPAD_3 = 99;
  Key.NUMPAD_4 = 100;
  Key.NUMPAD_5 = 101;
  Key.NUMPAD_6 = 102;
  Key.NUMPAD_7 = 103;
  Key.NUMPAD_8 = 104;
  Key.NUMPAD_9 = 105;
  Key.NUMPAD_MULTIPLY = 106;
  Key.NUMPAD_ADD = 107;
  Key.NUMPAD_ENTER = 108;
  Key.NUMPAD_SUBTRACT = 109;
  Key.NUMPAD_DECIMAL = 110;
  Key.NUMPAD_DIVIDE = 111;

  //FUNCTION KEYS
  Key.F1 = 112;
  Key.F2 = 113;
  Key.F3 = 114;
  Key.F4 = 115;
  Key.F5 = 116;
  Key.F6 = 117;
  Key.F7 = 118;
  Key.F8 = 119;
  Key.F9 = 120;
  Key.F10 = 121;
  Key.F11 = 122;
  Key.F12 = 123;
  Key.F13 = 124;
  Key.F14 = 125;
  Key.F15 = 126;

  //SYMBOLS
  Key.COLON = 186;
  Key.EQUALS = 187;
  Key.UNDERSCORE = 189;
  Key.QUESTION_MARK = 191;
  Key.TILDE = 192;
  Key.OPEN_BRACKET = 219;
  Key.BACKWARD_SLASH = 220;
  Key.CLOSED_BRACKET = 221;
  Key.QUOTES = 222;
  Key.LESS_THAN = 188;
  Key.GREATER_THAN = 190;

  //OTHER KEYS    
  Key.BACKSPACE = 8;
  Key.TAB = 9;
  Key.CLEAR = 12;
  Key.ENTER = 13;
  Key.SHIFT = 16;
  Key.CONTROL = 17;
  Key.ALT = 18;
  Key.CAPS_LOCK = 20;
  Key.ESC = 27;
  Key.SPACEBAR = 32;
  Key.PAGE_UP = 33;
  Key.PAGE_DOWN = 34;
  Key.END = 35;
  Key.HOME = 36;
  Key.LEFT = 37;
  Key.UP = 38;
  Key.RIGHT = 39;
  Key.DOWN = 40;
  Key.INSERT = 45;
  Key.DELETE = 46;
  Key.HELP = 47;
  Key.NUM_LOCK = 144;

  // Utlities for tracking global key presses
  var _pressedKeys = [];
  var _disabled = false;
  var _targetObject;
  var _captureStarted = false;
      
  /**
   * Called when a key is pressed
   */
  var _keyDown = function (e) {
    if (!_disabled) {
      if (Key.debug && !_pressedKeys[e.keyCode]) {
        console.log('Key pressed: ' + e.keyCode);
      }
      _pressedKeys[e.keyCode] = true;
    }
  };

  /**
   * Called when a key is released
   */
  var _keyUp = function (e) {
    if (!_disabled) {
      if (Key.debug && _pressedKeys[e.keyCode]) {
        console.log('Key released: ' + e.keyCode);
      }
      _pressedKeys[e.keyCode] = false;
    }
  };

  /**
   * Forces all keyboard data to false. This is used when the current object listening for key presses loses focus, and prevents keys from getting "stuck".
   */
  var _resetKeys = function (e) {
    //Sets all key states to false
    for (var i in _pressedKeys) {
      if (_pressedKeys.hasOwnProperty(i)) {
        _pressedKeys[i] = false;
      }
    }
    _disabled = true;
    if (Key.debug) {
      console.log('Target lost focus');
    }
  };

  /**
   * Removes the disabled flag so that the object listening for key presses can receive events again once it regains focus
   */
  _restartKeys = function (e) {
    _disabled = false;
    if (Key.debug) {
      console.log('Target received focus');
    }
  }

  /**
   * Starts capturing keyboard inputs from the supplied DOM object that currently has focus. (Defaults to the window if not specified)
   */
  Key.startCapture = function (target) {
    target = target || window;
    if (_captureStarted) {
      Key.endCapture();
    }
    _targetObject = target;
    _targetObject.addEventListener('keydown', _keyDown);
    _targetObject.addEventListener('keyup', _keyUp);
    _targetObject.addEventListener('blur', _resetKeys);
    _targetObject.addEventListener('focus', _restartKeys);
    _captureStarted = true;
    if (Key.debug) {
      console.log('Capture started');
    }
  };
      
  /**
   * Stops capturing keyboard inputs
   */
  Key.endCapture = function () {
    if (_captureStarted) {
      _targetObject.removeEventListener('keydown', _keyDown);
      _targetObject.removeEventListener('keyup', _keyUp);
      _targetObject.removeEventListener('blur',_resetKeys);
      _targetObject.removeEventListener('focus', _restartKeys);
      _targetObject = null;
      _captureStarted = false;
      Key.resetKeys(null);
      if (Key.debug) {
        console.log('Capture ended');
      }
    }
  };

  /**
   * Returns the state of a key given its key code. True when pressed, false otherwise
   */
  Key.isDown = function (keyCode) {
    return (!_disabled && _pressedKeys[keyCode] != undefined && _pressedKeys[keyCode] != null && _pressedKeys[keyCode] == true);
  };

  if (typeof module !== 'undefined') {
    module.exports = Key;
  } else {
    window.KeyJS = Key;
  }
})();
