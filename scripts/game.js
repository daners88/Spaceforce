(function ($) {
var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');
var spawnPoint= {x:canvas.width/2,y:canvas.height/2 - 19};

//var playerName;
var lastTimeAlienSpawned = 0;
var lastFrameTimeMs = 0;
var timeTotalMs = 0;
var player, cage, background, assetLoader, KEY_CODES, KEY_STATUS;
var bricks = [], aliens = [];
var brickL = 38;
var brickH = 19;
var topSide = 50, bottomSide = 500, rightSide = 845, leftSide = 88, leftLimiter = 110, topLimiter = 65;

var canUseLocalStorage = 'localStorage' in window && window.localStorage !== null;


function rand(low, high) {
  return Math.floor( Math.random() * (high - low + 1) + low );
}

function bound(num, low, high) {
  return Math.max( Math.min(num, high), low);
}

function SpriteSheet(path, frameWidth, frameHeight) {
  this.image = new Image();
  this.frameWidth = frameWidth;
  this.frameHeight = frameHeight;

  var self = this;
  this.image.onload = function() {
    self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
  };

  this.image.src = path;
}

function Animation(spritesheet, frameSpeed, startFrame, endFrame) {

  var animationSequence = [];
  var currentFrame = 0;
  var counter = 0;

  for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
    animationSequence.push(frameNumber);

  this.update = function() {

    if (counter == (frameSpeed - 1))
      currentFrame = (currentFrame + 1) % animationSequence.length;

    counter = (counter + 1) % frameSpeed;
  };

  this.draw = function(x, y) {
    var row = Math.floor(animationSequence[currentFrame] / spritesheet.framesPerRow);
    var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

    context.drawImage(
      spritesheet.image,
      col * spritesheet.frameWidth, row * spritesheet.frameHeight,
      spritesheet.frameWidth, spritesheet.frameHeight,
      x, y,
      spritesheet.frameWidth, spritesheet.frameHeight);
  };
}

function Vector(x, y, dx, dy) {
  this.x = x || 0;
  this.y = y || 0;

  this.dx = dx || 0;
  this.dy = dy || 0;
}

Vector.prototype.advance = function() {

  this.x += this.dx;
  if(this.x > rightSide)
  {

    if(this.type != 'mc')
    {
      this.x = rightSide;
      if(this.clockwise)
      {
        this.dy = this.dx;
        this.dx = 0;
      }
      else
      {
        this.dy = -this.dx;
        this.dx = 0;
      }
    }
    else
    {
      if(!this.isJumping)
      {
        this.x = rightSide;
      }
    }
  }
  else if(this.x < leftSide)
  {

    if(this.type != 'mc')
    {
      this.x = leftSide;
      if(this.clockwise)
      {
        this.dy = -this.dx;
        this.dx = 0;
      }
      else
      {
        this.dy = this.dx;
        this.dx = 0;
      }
    }
    else
    {
      if(!this.isJumping)
      {
        this.x = leftSide;
      }
    }
  }
  this.y += this.dy;
  if(this.y > bottomSide)
  {

    if(this.type != 'mc')
    {
      this.y = bottomSide;
      if(this.clockwise)
      {
        this.dx = -this.dy;
        this.dy = 0;
      }
      else
      {
        this.dx = this.dy;
        this.dy = 0;
      }
    }
    else
    {
      if(!this.isJumping)
      {
        this.y = bottomSide;
      }
    }
  }
  else if(this.y < topSide)
  {

    if(this.type != 'mc')
    {
      this.y = topSide;
      if(this.clockwise)
      {
        this.dx = this.dy;
        this.dy = 0;
      }
      else
      {
        this.dx = -this.dy;
        this.dy = 0;
      }
    }
    else
    {
      if(!this.isJumping)
      {
        this.y = topSide;
      }
    }
  }
  if(this.type == 'mc')
  {
    if(this.x < leftLimiter && (this.onTop || this.onBottom))
    {

      if(!this.isJumping)
      {
        this.x = leftLimiter;
      }
    }
    else if(this.y < topLimiter && (this.onRight || this.onLeft))
    {

      if(!this.isJumping)
      {
        this.y = topLimiter;
      }
    }
    if(this.x > leftSide && this.x < rightSide && this.y > topSide && this.y < bottomSide)
    {
      var topDiff = this.y - topSide, bottomDiff = bottomSide - this.y, rightDiff = rightSide - this.x, leftDiff = this.x - leftSide;
      if(topDiff <= bottomDiff && topDiff <= rightDiff && topDiff <= leftDiff)
      {
        this.y = topSide;
      }
      else if(bottomDiff <= topSide && bottomDiff <= rightDiff && bottomDiff <= leftDiff)
      {
        this.y = bottomSide;
      }
      else if(rightDiff <= leftDiff && rightDiff <= topDiff && rightDiff <= bottomDiff)
      {
        this.x = rightSide;
      }
      else if(leftDiff <= rightDiff && leftDiff <= topDiff && leftDiff <= bottomDiff)
      {
        this.x = leftSide;
      }
    }
  }
};

Vector.prototype.minDist = function(vec) {
  var minDist = Infinity;
  var max     = Math.max( Math.abs(this.dx), Math.abs(this.dy),
                          Math.abs(vec.dx ), Math.abs(vec.dy ) );
  var slice   = 1 / max;

  var x, y, distSquared;

  var vec1 = {}, vec2 = {};
  vec1.x = this.x + this.width/2;
  vec1.y = this.y + this.height/2;
  vec2.x = vec.x + vec.width/2;
  vec2.y = vec.y + vec.height/2;
  for (var percent = 0; percent < 1; percent += slice) {
    x = (vec1.x + this.dx * percent) - (vec2.x + vec.dx * percent);
    y = (vec1.y + this.dy * percent) - (vec2.y + vec.dy * percent);
    distSquared = x * x + y * y;

    minDist = Math.min(minDist, distSquared);
  }

  return Math.sqrt(minDist);
};

function Sprite(x, y, w, h, type) {
  this.x      = x;
  this.y      = y;
  this.width  = w;
  this.height = h;
  this.type   = type;
  Vector.call(this, x, y, 0, 0);

  this.update = function() {
    this.dx = -player.speed;
    this.advance();
  };

  this.draw = function() {
    context.save();
    context.translate(0.5,0.5);
    context.drawImage(assetLoader.imgs[this.type], this.x, this.y, this.width, this.height);
    context.restore();
  };
}
Sprite.prototype = Object.create(Vector.prototype);

function getRandomOppositeDirection(num)
{
  var multiplier = 1;
  if (num > 0)
  {
    multiplier = -1;
  }
  var newNum = rand(1, 2) * multiplier;
  return newNum;
}

function getAlienType() {
  var type;
  switch (rand(0, 2)) {
    case 0:
    type = 'greenAlien';
    break;
    case 1:
      type = 'redAlien';
      break;
    case 2:
      type = 'blueAlien';
      break;
  }

  return type;
}

function updateBricks() {
  for (var i = 0; i < bricks.length; i++) {
    //bricks[i].update();
    bricks[i].draw();
  }
}

function updateAliens() {
  for (var i = 0; i < aliens.length; i++) {
    for(var j = 0; j < bricks.length; j++){
      if(aliens[i].minDist(bricks[j]) <= aliens[i].width - brickH/2)
      {
        if(bricks[j].type == 'lBrickV')
        {
          aliens[i].dy = getRandomOppositeDirection(aliens[i].dy);
          aliens[i].dx = aliens[i].dx > 0 ? aliens[i].dx : -aliens[i].dx;
        }
        else if(bricks[j].type == 'rBrickV')
        {
          aliens[i].dy = getRandomOppositeDirection(aliens[i].dy);
          aliens[i].dx = aliens[i].dx > 0 ? -aliens[i].dx : aliens[i].dx;
        }
        else if(bricks[j].type == 'tBrickH')
        {
          aliens[i].dx = getRandomOppositeDirection(aliens[i].dx);
          aliens[i].dy = aliens[i].dy > 0 ? -aliens[i].dy : aliens[i].dy;
        }
        else if(bricks[j].type == 'bBrickH')
        {
          aliens[i].dx = getRandomOppositeDirection(aliens[i].dx);
          aliens[i].dy = aliens[i].dy > 0 ? aliens[i].dy : -aliens[i].dy;
        }
      }
    }
    aliens[i].update();
    aliens[i].draw();
  }
}

function updatePlayer() {
  player.update();
  player.draw();
}

function spawnSprites() {
  if(bricks.length < 1)
  {
      spawnBrickSprites();
  }
  if(lastFrameTimeMs - lastTimeAlienSpawned >= 3500)
  {
    spawnAlienSprites();
    lastTimeAlienSpawned = lastFrameTimeMs;
  }
}

function spawnBrickSprites() {
  var x = 791;
  var y = 486;
  var by = 106;
  var bx = 810;
  for(var i = 0; i < 18; i++)
  {
    bricks.push(new Sprite(x, y, brickL, brickH, 'tBrickH'));
    bricks.push(new Sprite(bx, by, brickL, brickH, 'bBrickH'));
    x = x - brickL;
    bx = bx - brickL;
  }
  x = 830;
  y = 467;
  bx =147;
  by =448;
  for(var i = 0; i < 10; i++)
  {
    bricks.push(new Sprite(x, y, brickH, brickL, 'rBrickV'));
    bricks.push(new Sprite(bx, by, brickH, brickL, 'lBrickV'));
    y = y - brickL;
    by = by - brickL;
  }
}

function spawnAlienSprites() {
    var type = getAlienType();
    var alien = new makeAlien(type);
    alien.reset();
    aliens.push(alien);
}

function update(elapsedTime){
  updatePlayer();
  updateBricks();
  updateAliens();
  cage.update();
  cage.draw();
}

function gameloop(timestamp) {
  var elapsedTime = timestamp - lastFrameTimeMs
  lastFrameTimeMs = timestamp;
  if (!stop) {
    requestAnimationFrame(gameloop);
    context.clearRect(0, 0, canvas.width, canvas.height);

    background.draw();

    update(elapsedTime);
    spawnSprites();

//    context.fillText('Score: ' + score, canvas.width - 140, 30);

//     if (timer > 5000) {
//       timer = 0;
//
// //spawn aliens at certain times
//     }
//
//     timer++;
  }
}

function mainMenu() {

  $('#progress').hide();
  $('#main').show();
  $('#menu').addClass('main');
//  $('.sound').show();
}

function makeAlien(type) {
  this.width  = 32;
  this.height = 32;
  if(type == 'greenAlien')
  {
      this.sheet  = new SpriteSheet("images/spritesheets/alien1.png", this.width, this.height);
      this.walkAnim  = new Animation(this.sheet, 5, 0, 9);
      assetLoader.sounds.greenSpawn.play();
  }
  else if(type == 'redAlien')
  {
      this.sheet  = new SpriteSheet("images/spritesheets/alien2.png", this.width, this.height);
      this.walkAnim  = new Animation(this.sheet, 5, 0, 4);
      assetLoader.sounds.redSpawn.play();
  }
  else
  {
      this.sheet  = new SpriteSheet("images/spritesheets/alien3.png", this.width, this.height);
      this.walkAnim  = new Animation(this.sheet, 5, 0, 3);
      assetLoader.sounds.blueSpawn.play();
  }

  this.anim = this.walkAnim;
  this.multiplierx = Math.random() > 0.5 ? 1 : -1;
  this.multipliery = Math.random() > 0.5 ? 1 : -1;
  this.dy        = rand(1, 2) * this.multipliery;
  this.dx        = rand(1, 2) * this.multiplierx;
  this.speed      = rand(1, 2);
  this.clockwise = rand(0, 1);

  Vector.call(this, 0, 0, this.dx, this.dy);

  this.update = function() {

    this.advance();

    this.anim.update();
  };

  this.draw = function() {
    this.anim.draw(this.x, this.y);
  };

  this.reset = function() {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
  };
};
makeAlien.prototype = Object.create(Vector.prototype);

function Cage() {
  this.width  = 64;
  this.height = 64;
  this.sheet  = new SpriteSheet("images/spritesheets/cage.png", this.width, this.height);
  this.anim  = new Animation(this.sheet, 5, 0, 3);

  this.dy        = 0;
  this.dx        = 0;

  Vector.call(this, 0, 0, this.dx, this.dy);

  this.update = function() {

    this.advance();

    this.anim.update();
  };

  this.draw = function() {
    this.anim.draw(this.x, this.y);
  };

  this.reset = function() {
    this.x = spawnPoint.x - 15;
    this.y = spawnPoint.y - 15;
  };
};
Cage.prototype = Object.create(Vector.prototype);

function initialize() {
  assetLoader = (function() {
    this.imgs        = {
        "bg"            : "images/background.png",
        "bgss"            : "images/spritesheets/backgroundSprites.png",
        "mcTop"           : "images/spritesheets/mcTside.png",
        "mcTflip"           : "images/spritesheets/mcTflip.png",
        "mcBottom"           : "images/spritesheets/mcBside.png",
        "mcRight"         : "images/spritesheets/mcRSide.png",
        "mcLeft"         : "images/spritesheets/mcLSide.png",
        "greenAlien"      : "images/spritesheets/alien1.png",
        "redAlien"         : "images/spritesheets/alien2.png",
        "blueAlien" : "images/spritesheets/alien3.png",
        'tBrickH'         : 'images/tBrickH.png',
        'bBrickH'         : 'images/bBrickH.png',
        'lBrickV'         : 'images/lBrickV.png',
        'rBrickV'         : 'images/rBrickV.png',
        'cage'          : 'images/spritesheets/cage.png'
      };

    this.sounds      = {
      'backGroundSound'            : 'sounds/backgroundMusic.mp3',
      'jump'          : 'sounds/playerJump.wav',
      'die'      : 'sounds/playerDeath.wav',
      'money'     : 'sounds/money.wav',
      'greenSpawn'        : 'sounds/greenSpawn.wav',
      'redSpawn'        : 'sounds/redSpawn.wav',
      'blueSpawn'        : 'sounds/blueSpawn.wav'
    };

    var assetsLoaded = 0;                                // how many assets have been loaded
    var numImgs      = Object.keys(this.imgs).length;    // total number of image assets
    var numSounds    = Object.keys(this.sounds).length;  // total number of sound assets
    this.totalAssest = numImgs;                          // total number of assets

    function assetLoaded(dic, name) {
      if (this[dic][name].status !== 'loading') {
        return;
      }

      this[dic][name].status = 'loaded';
      assetsLoaded++;

      if (typeof this.progress === 'function') {
        this.progress(assetsLoaded, this.totalAssest);
      }

      if (assetsLoaded === this.totalAssest && typeof this.finished === 'function') {
        this.finished();
      }
    }


    function _checkAudioState(sound) {
      if (this.sounds[sound].status === 'loading' && this.sounds[sound].readyState === 4) {
        assetLoaded.call(this, 'sounds', sound);
      }
    }

    this.downloadAll = function() {
      var _this = this;
      var src;

      for (var img in this.imgs) {
        if (this.imgs.hasOwnProperty(img)) {
          src = this.imgs[img];

          (function(_this, img) {
            _this.imgs[img] = new Image();
            _this.imgs[img].status = 'loading';
            _this.imgs[img].name = img;
            _this.imgs[img].onload = function() { assetLoaded.call(_this, 'imgs', img) };
            _this.imgs[img].src = src;
          })(_this, img);
        }
      }

      for (var sound in this.sounds) {
        if (this.sounds.hasOwnProperty(sound)) {
          src = this.sounds[sound];

          (function(_this, sound) {
            _this.sounds[sound] = new Audio();
            _this.sounds[sound].status = 'loading';
            _this.sounds[sound].name = sound;
            _this.sounds[sound].addEventListener('canplay', function() {
              _checkAudioState.call(_this, sound);
            });
            _this.sounds[sound].src = src;
            _this.sounds[sound].preload = 'auto';
            _this.sounds[sound].load();
          })(_this, sound);
        }
      }
    }

    return {
      imgs: this.imgs,
      sounds: this.sounds,
      totalAssest: this.totalAssest,
      downloadAll: this.downloadAll
    };
  })();

  assetLoader.progress = function(progress, total) {
    // var pBar = document.getElementById('progress-bar');
    // pBar.value = progress / total;
    // document.getElementById('p').innerHTML = Math.round(pBar.value * 100) + "%";
  }

  assetLoader.finished = function() {
    mainMenu();
  }
  assetLoader.downloadAll();

  player = (function(player) {
    player.type = 'mc';
    player.width  = 32;
    player.height = 64;
    player.topSheet  = new SpriteSheet("images/spritesheets/mcTside.png", player.width, player.height);
    player.topFlipSheet = new SpriteSheet("images/spritesheets/mcTflip.png", player.width, player.height);
    player.bottomSheet  = new SpriteSheet("images/spritesheets/mcBside.png", player.width, player.height);
    player.bottomFlipSheet  = new SpriteSheet("images/spritesheets/mcBflip.png", player.width, player.height);
    player.rightSheet = new SpriteSheet("images/spritesheets/mcRside.png", player.height, player.width);
    player.rightFlipSheet = new SpriteSheet("images/spritesheets/mcRflip.png", player.height, player.width);
    player.leftSheet = new SpriteSheet("images/spritesheets/mcLside.png", player.height, player.width);
    player.leftFlipSheet = new SpriteSheet("images/spritesheets/mcLflip.png", player.height, player.width);
    player.lastWalkLeft = true;
    player.onTop = true;
    player.onLeft = false;
    player.onBottom = false;
    player.onRight = false;

    player.gravity   = .25;
    player.dy        = 0;
    player.dx        = 0;
    player.speed      = 3;
    player.jumpDy    = -5;
    player.isFalling = false;
    player.isJumping = false;

    player.topWalkAnim  = new Animation(player.topSheet, 5, 0, 3);
    player.topFlipWalkAnim = new Animation(player.topFlipSheet, 5, 0, 3);
    player.topStandAnim = new Animation(player.topSheet, 1, 0, 0);
    player.topFlipStandAnim = new Animation(player.topFlipSheet, 1, 0, 0);
    player.bottomWalkAnim  = new Animation(player.bottomSheet, 5, 0, 3);
    player.bottomFlipWalkAnim  = new Animation(player.bottomFlipSheet, 5, 0, 3);
    player.bottomStandAnim = new Animation(player.bottomSheet, 1, 0, 0);
    player.bottomFlipStandAnim = new Animation(player.bottomFlipSheet, 1, 0, 0);
    player.rightWalkAnim = new Animation(player.rightSheet, 5, 0, 3);
    player.rightFlipWalkAnim = new Animation(player.rightFlipSheet, 5, 0, 3);
    player.rightStandAnim = new Animation(player.rightSheet, 1, 0, 0);
    player.rightFlipStandAnim = new Animation(player.rightFlipSheet, 1, 0, 0);
    player.leftWalkAnim = new Animation(player.leftSheet, 5, 0, 3);
    player.leftFlipWalkAnim = new Animation(player.leftFlipSheet, 5, 0, 3);
    player.leftStandAnim = new Animation(player.leftSheet, 1, 0, 0);
    player.leftFlipStandAnim = new Animation(player.leftFlipSheet, 1, 0, 0);

    Vector.call(player, 0, 0, player.dx, player.dy);

    player.update = function() {

      if (KEY_STATUS.space && !player.isJumping) {
        player.isJumping = true;
        if(player.onTop)
        {
          player.dy = player.jumpDy;
        }
        else if(player.onLeft)
        {
          player.dx = player.jumpDy;
        }
        else if(player.onBottom)
        {
          player.dy = -player.jumpDy;
        }
        else
        {
          player.dx = -player.jumpDy;
        }

        assetLoader.sounds.jump.play();
      }

      if(KEY_STATUS.esc)
      {
        document.location.href = 'index.html';
      }

      if (KEY_STATUS.right && (player.y <= topLimiter|| player.y >= bottomSide))
      {
        player.onLeft = false;
        player.onRight = false;
        if(player.y <= topLimiter)
        {
          player.onTop = true;
          if(!player.isJumping)
          {
            player.y = topSide;
          }
          player.onBottom = false;
          player.anim      = player.topFlipWalkAnim;
        }
        else {
          player.onTop = false;
          player.onBottom = true;
          player.anim      = player.bottomWalkAnim;
        }
        player.dx = player.speed;
        player.lastWalkLeft = false;
      }
      else if(KEY_STATUS.left && (player.y <= topLimiter|| player.y >= bottomSide))
      {
        player.onLeft = false;
        player.onRight = false;
        if(player.y <= topLimiter)
        {
          player.onTop = true;
          if(!player.isJumping)
          {
            player.y = topSide;
          }
          player.onBottom = false;
          player.anim      = player.topWalkAnim;
        }
        else {
          player.onTop = false;
          player.onBottom = true;
          player.anim      = player.bottomFlipWalkAnim;
        }
        player.dx = -player.speed;
        player.lastWalkLeft = true;
      }
      else if (KEY_STATUS.up && (player.x <= leftLimiter || player.x >= rightSide))
      {
        player.onTop = false;
        player.onBottom = false;
        if(player.x <= leftLimiter)
        {
          player.onLeft = true;
          if(!player.isJumping)
          {
            player.x = leftSide;
          }
          player.onRight = false;
          player.anim      = player.leftFlipWalkAnim;
        }
        else {
          player.onLeft = false;
          player.onRight = true;
          player.anim      = player.rightWalkAnim;
        }
        player.dy = -player.speed;
        player.lastWalkLeft = false;
      }
      else if(KEY_STATUS.down && (player.x <= leftLimiter || player.x >= rightSide))
      {
        player.onTop = false;
        player.onBottom = false;
        if(player.x <= leftLimiter)
        {
          player.onLeft = true;
          if(!player.isJumping)
          {
            player.x = leftSide;
          }
          player.onRight = false;
          player.anim      = player.leftWalkAnim;
        }
        else {
          player.onLeft = false;
          player.onRight = true;
          player.anim      = player.rightFlipWalkAnim;
        }
        player.dy = player.speed;
        player.lastWalkLeft = true;
      }
      else
      {
        if(!player.isJumping)
        {
          player.dx = 0;
          player.dy = 0;
        }
        if(player.lastWalkLeft)
        {
          if(player.onLeft)
          {
            player.anim      = player.leftStandAnim;
          }
          else if(player.onRight)
          {
            player.anim      = player.rightFlipStandAnim;
          }
          else if(player.onTop){
            player.anim      = player.topStandAnim;
          }
          else {
            player.anim      = player.bottomFlipStandAnim;
          }

        }
        else
        {
          if(player.onLeft)
          {
            player.anim      = player.leftFlipStandAnim;
          }
          else if(player.onRight)
          {
            player.anim      = player.rightStandAnim;
          }
          else if(player.onTop){
            player.anim      = player.topFlipStandAnim;
          }
          else{
            player.anim      = player.bottomStandAnim;
          }

        }
      }

      this.advance();

      if (player.isFalling || player.isJumping) {
        if(player.onTop)
        {
          player.dy += player.gravity;
          if(player.y == topSide)
          {
            player.isFalling = false;
            player.isJumping = false;
            player.dy = 0;
          }
        }
        else if(player.onLeft)
        {
          player.dx += player.gravity;
          if(player.x == leftSide)
          {
            player.isFalling = false;
            player.isJumping = false;
            player.dx = 0;
          }
        }
        else if(player.onBottom)
        {
          player.dy -= player.gravity;
          if(player.y == bottomSide)
          {
            player.isFalling = false;
            player.isJumping = false;
            player.dy = 0;
          }
        }
        else
        {
          player.dx -= player.gravity;
          if(player.x == rightSide)
          {
            player.isFalling = false;
            player.isJumping = false;
            player.dx = 0;
          }
        }
      }

      player.anim.update();
    };

    player.draw = function() {
      player.anim.draw(player.x, player.y);
    };

    player.reset = function() {
      player.x = 475;
      player.y = topSide;
    };

    return player;
  })(Object.create(Vector.prototype));

  cage = new Cage();
  cage.reset();

  background = (function() {

    this.draw = function() {
      context.drawImage(assetLoader.imgs.bg, 0, 0, 950, 625);
    };

    return {
      draw: this.draw,
      reset: this.reset
    };
  })();

  var num = {32: 'space',
             39: 'right',
             37: 'left',
             40: 'down',
             38: 'up',
             87: 'up',
             65: 'left',
             83: 'down',
             68: 'right',
             27: 'esc'
};

  KEY_CODES = num;
  KEY_STATUS = {};
  for (var code in KEY_CODES) {
    if (KEY_CODES.hasOwnProperty(code)) {
       KEY_STATUS[KEY_CODES[code]] = false;
    }
  }
  document.onkeydown = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
  };
  document.onkeyup = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
  };

  document.getElementById('game-over').style.display = 'none';
  bricks = [];
  aliens = [];
  player.reset();
  timer = 0;
  stop = false;
  //score = 0;

  context.font = '16px arial, sans-serif';

  //background.reset();

  gameloop();

  assetLoader.sounds.die.pause();
  assetLoader.sounds.backGroundSound.currentTime = 0;
  assetLoader.sounds.backGroundSound.loop = true;
  assetLoader.sounds.backGroundSound.play();
}

function loseLife() {
  stop = true;
  //$('#score').html(score);
  $('#game-over').show();
  assetLoader.sounds.backGroundSound.pause();
  assetLoader.sounds.die.currentTime = 0;
  assetLoader.sounds.die.play();

  var hs5 = localStorage.getItem('highscore.hs5Score');

  // if(hs5 != "undefined" && hs5 != null){
  //   if(score > hs5){
  //     $.ajax({
  //         type: 'POST',
  //         datatype: "json",
  //         data: {
  //           playerName: playerName,
  //           score: score
  //         },
  //         url: 'http://localhost:8080/sethighscores',
  //         success: function(result){
  //           scores = result;
  //         }
  //     });
  //   }
  // }
  // else {
  //   $.ajax({
  //       type: 'POST',
  //       datatype: "json",
  //       data: {
  //         playerName: playerName,
  //         score: score
  //       },
  //       url: 'http://localhost:8080/sethighscores',
  //       success: function(result){
  //         scores = result;
  //       }
  //   });
  // }
}

$('.play').click(function() {
 $('#menu').hide();
  initialize();
});
$('.restart').click(function() {
  $('#game-over').hide();
  initialize();
});

initialize();
})(jQuery);
