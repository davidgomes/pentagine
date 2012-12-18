var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var sharedCanvases = {};
context.width = canvas.width;
context.height = canvas.height;
context.globalCompositeOperation = "destination-over";

var currentState = null;

var pauseKey = "p";
var canPauseOrResume = true;
var gamePaused = false;

function init() {
  setInterval(tick, 16.666666666);
}

function tick() {
  if (gamePaused) {
    currentState.draw();

    if (isDown(pauseKey))
      pauseOrResumeGame();

    // TODO Draw Pause/Play huge icon on top
  } else {
    if (isDown(pauseKey))
      pauseOrResumeGame();

    currentState.update();
    currentState.draw();
  }
}

function pauseOrResumeGame() {
  if (canPauseOrResume) {
    gamePaused = !gamePaused;

    setTimeout(function() {
      canPauseOrResume = true;
    }, 1000);

    canPauseOrResume = false;
  }
}

function switchState(newState) {
  newState.setup();
  return currentState = newState;
}

function drawCircle(x, y, radius) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2, false);
  context.stroke();
}

function drawRectangle(x, y, width, height, color) {
  if (color) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
    context.fillStyle = "#FFFFFF";
  } else {
    context.fillRect(x, y, width, height);
  }
}

function clearCanvas() {
  context.clearRect(0, 0, context.width, context.height);
}

/*************************************** SPRITE */
Sprite = (function() {
  function constructor(image, x, y) {
    this.x = x;
    this.y = y;
    this.path = image;
    /* try to retrieve a shared canvas instead of generating a new one */
    console.log(this.path);
    console.log(sharedCanvases);
    console.log(this.path in sharedCanvases);
    if (this.path in sharedCanvases) {
        console.log("loaded cached image");
        this.internal = sharedCanvases[this.path][0];
        this.internalctx = sharedCanvases[this.path][1];
        this.loaded = true;
    } else {
      this.image = new Image();
      this.image.src = image;
      this.image.owner = this;
      this.loaded = false;
      this.pending = [];
      /* cache image modifications to an internal canvas for performance and flexibility */
      this.internal = document.createElement("canvas");
      this.internalctx = this.internal.getContext("2d");
      /* save the canvas to the global shared canvas map */
        sharedCanvases[this.path] = [this.internal, this.internalctx];
      /* asynchronous image loading and caching */
      this.image.onload = function() {
        this.owner.internal.width = this.width.toString();
        this.owner.internal.height = this.height.toString();
        this.owner.internalctx.drawImage(this, 0, 0);
        /* dump image reference, we no longer need it */
        delete this.owner.image;
        this.owner.loaded = true;
        /* dispatch all pending sprite modifications */
        var pending = this.owner.pending;
        for (var i = 0; i < pending.length; i++) {
          console.log("dispatched pending");
          pending[i][0].apply(this.owner, Array.prototype.slice.call(pending[i], 1));
        }
        delete this.owner.pending;
      }
    }
  }

  constructor.prototype = {
    draw: function() {
      context.drawImage(this.internal, this.x, this.y);
    },

    stampRect: function(x, y, width, height, color) {
      if (!this.loaded) {
        this.pending.push([this.stampRect, x, y, width, height, color]);
      }
      this.internalctx.fillStyle = color;
      this.internalctx.fillRect(x, y, width, height);
    }
  }

  return constructor;
})();

SpriteList = (function() {
  function constructor() {
    this.sprites = [];
  }

  constructor.prototype = {
    draw: function() {
      for (var i = 0; i < this.sprites.length; i++) {
        this.sprites[i].draw();
      }
    },

    push: function(newSprite) {
      this.sprites.push(newSprite);
    }
  }

  return constructor;
})();

/*function loadImage(imageName) {
  var image = new Image();
  image.src = imageName;
}*/

/*************************************** INPUT */
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

var keyCodeToString = [];
keyCodeToString[8] = "backspace";
keyCodeToString[9] = "tab";
keyCodeToString[13] = "enter";
keyCodeToString[16] = "shift";
keyCodeToString[17] = "ctrl";
keyCodeToString[18] = "alt";
keyCodeToString[19] = "pause";
keyCodeToString[20] = "capslock";
keyCodeToString[27] = "esc";
keyCodeToString[32] = "space";
keyCodeToString[33] = "pageup";
keyCodeToString[34] = "pagedown";
keyCodeToString[35] = "end";
keyCodeToString[36] = "home";
keyCodeToString[37] = "left";
keyCodeToString[38] = "up";
keyCodeToString[39] = "right";
keyCodeToString[40] = "down";
keyCodeToString[45] = "insert";
keyCodeToString[46] = "delete";

keyCodeToString[91] = "leftwindowkey";
keyCodeToString[92] = "rightwindowkey";
keyCodeToString[93] = "selectkey";
keyCodeToString[106] = "multiply";
keyCodeToString[107] = "add";
keyCodeToString[109] = "subtract";
keyCodeToString[110] = "decimalpoint";
keyCodeToString[111] = "divide";

keyCodeToString[144] = "numlock";
keyCodeToString[145] = "scrollock";
keyCodeToString[186] = "semicolon";
keyCodeToString[187] = "equalsign";
keyCodeToString[188] = "comma";
keyCodeToString[189] = "dash";
keyCodeToString[190] = "period";
keyCodeToString[191] = "forwardslash";
keyCodeToString[192] = "graveaccent";
keyCodeToString[219] = "openbracket";
keyCodeToString[220] = "backslash";
keyCodeToString[221] = "closebracket";
keyCodeToString[222] = "singlequote";

var numpadKeys = ["numpad1", "numpad2", "numpad3", "numpad4", "numpad5",
                  "numpad6", "numpad7", "numpad8", "numpad9"];

var numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
var letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
               "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
               "u", "v", "w", "x", "y", "z"];

for (var i = 0; numbers[i]; i++) { keyCodeToString[48 + i] = numbers[i]; }
for (var i = 0; letters[i]; i++) { keyCodeToString[65 + i] = letters[i]; }
for (var i = 0; numpadKeys[i]; i++) { keyCodeToString[96 + i] = numpadKeys[i]; }

var pressedKeys = [];
var preventedKeys = [];

function preventKeys(keys) {
  preventedKeys = keys;
}

function handleKeyDown(e) {
  var event = (e) ? e : window.event;
  var name = keyCodeToString[event.keyCode];
  pressedKeys[name] = true;

  if (preventedKeys[name])
    e.preventDefault();
}

function handleKeyUp(e) {
  var event = (e) ? e : window.event;
  var name = keyCodeToString[event.keyCode];
  pressedKeys[name] = false;

  if (preventedKeys[name])
    e.preventDefault();
}

function isDown(name) {
  if (pressedKeys[name])
    return true;
}
