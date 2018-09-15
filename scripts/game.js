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
var topSide = 50, bottomSide = 500, rightSide = 842, leftSide = 90, leftLimiter = 110, topLimiter = 65;
var currentLevel = 1;

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

  if(type == 'bBrickH' || type == 'tBrickH' || type == 'lBrickV' || type == 'rBrickV')
  {
    this.visible = false;
    this.layer = 0;
  }

  this.update = function() {
    // this.dx = -player.speed;
    // this.advance();
  };

  this.draw = function() {
    context.save();
    context.translate(0.5,0.5);
    context.drawImage(assetLoader.imgs[this.type], this.x, this.y, this.width, this.height);
    context.restore();
  };
}
Sprite.prototype = Object.create(Vector.prototype);

function getRandomDirection(num)
{
  // 1/8 chance to remain same direction
  var multiplier = rand(1, 8);
  if(num > 0)
  {
    if (multiplier > 1)
    {
      multiplier = -1;
    }
  }
  else
  {
    if (multiplier > 1)
    {
      multiplier = 1;
    }
  }
  var newNum;
  if(currentLevel == 1)
  {
    newNum = 1 * multiplier;
  }
  else
  {
    newNum = rand(1, 2) * multiplier;
  }
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

function buildBricks(){
  var rangeStart, rangeEnd;
  var lowestLayer = 0;
  var bricksInRange = [];
  if(player.onTop || player.onBottom)
  {
    rangeStart = player.x - brickL;
    rangeEnd = player.x + brickL;
    if(player.onTop)
    {
      for(var i = 0; i < bricks.length; i++)
      {
        if(bricks[i].type == 'tBrickH' && bricks[i].x > rangeStart && bricks[i].x < rangeEnd)
        {
          if(bricks[i].visible)
          {
            if(bricks[i].layer > lowestLayer)
            {
              lowestLayer = bricks[i].layer;
            }
          }
          bricksInRange.push(bricks[i]);
        }
      }
      for(var j = 0; j < bricksInRange.length; j++)
      {
        if(bricksInRange[j].layer < lowestLayer + 4)
        {
          bricksInRange[j].visible = true;
        }
      }
    }
    else
    {
      for(var i = 0; i < bricks.length; i++)
      {
        if(bricks[i].type == 'bBrickH' && bricks[i].x > rangeStart && bricks[i].x < rangeEnd)
        {
          if(bricks[i].visible)
          {
            if(bricks[i].layer > lowestLayer)
            {
              lowestLayer = bricks[i].layer;
            }
          }
          bricksInRange.push(bricks[i]);
        }
      }
      for(var j = 0; j < bricksInRange.length; j++)
      {
        if(bricksInRange[j].layer < lowestLayer + 4)
        {
          bricksInRange[j].visible = true;
        }
      }
    }
  }
  else
  {
    rangeStart = player.y - brickL;
    rangeEnd = player.y + brickL;
    if(player.onLeft)
    {
      for(var i = 0; i < bricks.length; i++)
      {
        if(bricks[i].type == 'lBrickV' && bricks[i].y > rangeStart && bricks[i].y < rangeEnd)
        {
          if(bricks[i].visible)
          {
            if(bricks[i].layer > lowestLayer)
            {
              lowestLayer = bricks[i].layer;
            }
          }
          bricksInRange.push(bricks[i]);
        }
      }
      for(var j = 0; j < bricksInRange.length; j++)
      {
        if(bricksInRange[j].layer < lowestLayer + 4)
        {
          bricksInRange[j].visible = true;
        }
      }
    }
    else
    {
      for(var i = 0; i < bricks.length; i++)
      {
        if(bricks[i].type == 'rBrickV' && bricks[i].y > rangeStart && bricks[i].y < rangeEnd)
        {
          if(bricks[i].visible)
          {
            if(bricks[i].layer > lowestLayer)
            {
              lowestLayer = bricks[i].layer;
            }
          }
          bricksInRange.push(bricks[i]);
        }
      }
      for(var j = 0; j < bricksInRange.length; j++)
      {
        if(bricksInRange[j].layer < lowestLayer + 4)
        {
          bricksInRange[j].visible = true;
        }
      }
    }
  }
}

function updateBricks() {
  for (var i = 0; i < bricks.length; i++) {
    bricks[i].update();
    if(bricks[i].visible)
    {
          bricks[i].draw();
    }
  }
  if(!player.isJumping && !player.isStanding)
  {
    buildBricks();
  }
}

function updateAliens() {
  for (var i = 0; i < aliens.length; i++) {
    if(aliens[i].y == topSide || aliens[i].y == bottomSide || aliens[i].x == rightSide || aliens[i].x == leftSide)
    {
      aliens[i].escaped = true;
    }
    else
    {
      for(var j = 0; j < bricks.length; j++){
        if(!aliens[i].escaped && bricks[j].visible && aliens[i].minDist(bricks[j]) <= aliens[i].width - brickH/2)
        {
          bricks[j].visible = false;
          if(bricks[j].type == 'lBrickV')
          {
            aliens[i].dy = getRandomDirection(aliens[i].dy);
            //aliens[i].dx = aliens[i].dx > 0 ? aliens[i].dx : -aliens[i].dx;
            aliens[i].dx = getRandomDirection(aliens[i].dx);
          }
          else if(bricks[j].type == 'rBrickV')
          {
            aliens[i].dy = getRandomDirection(aliens[i].dy);
            //aliens[i].dx = aliens[i].dx > 0 ? -aliens[i].dx : aliens[i].dx;
            aliens[i].dx = getRandomDirection(aliens[i].dx);
          }
          else if(bricks[j].type == 'tBrickH')
          {
            aliens[i].dx = getRandomDirection(aliens[i].dx);
            //aliens[i].dy = aliens[i].dy > 0 ? aliens[i].dy : -aliens[i].dy;
            aliens[i].dy = getRandomDirection(aliens[i].dy);
          }
          else if(bricks[j].type == 'bBrickH')
          {
            aliens[i].dx = getRandomDirection(aliens[i].dx);
            //aliens[i].dy = aliens[i].dy > 0 ? -aliens[i].dy : aliens[i].dy;
            aliens[i].dy = getRandomDirection(aliens[i].dy);
          }
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
  //brick spawn starts for top, bottom, right, left, designated by layer number
  var tX1 = 810, tY1 = 106, bX1 = 791, bY1 = 486, rX1 = 830, rY1 = 467, lX1 = 147, lY1 = 448;
  var tX2 = tX1 - 19, tY2 = tY1 + 19, bX2 = bX1 - 19, bY2 = bY1 - 19, rX2 = rX1 - 19, rY2 = rY1 - 19, lX2 = lX1 + 19, lY2 = lY1 - 19;
  var tX3 = tX2 - 19, tY3 = tY2 + 19, bX3 = bX2 - 19, bY3 = bY2 - 19, rX3 = rX2 - 19, rY3 = rY2 - 19, lX3 = lX2 + 19, lY3 = lY2 - 19;
  var tX4 = tX3 - 19, tY4 = tY3 + 19, bX4 = bX3 - 19, bY4 = bY3 - 19, rX4 = rX3 - 19, rY4 = rY3 - 19, lX4 = lX3 + 19, lY4 = lY3 - 19;
  var tX5 = tX4 - 19, tY5 = tY4 + 19, bX5 = bX4 - 19, bY5 = bY4 - 19, rX5 = rX4 - 19, rY5 = rY4 - 19, lX5 = lX4 + 19, lY5 = lY4 - 19;
  var tX6 = tX5 - 19, tY6 = tY5 + 19, bX6 = bX5 - 19, bY6 = bY5 - 19, rX6 = rX5 - 19, rY6 = rY5 - 19, lX6 = lX5 + 19, lY6 = lY5 - 19;
  var tX7 = tX6 - 19, tY7 = tY6 + 19, bX7 = bX6 - 19, bY7 = bY6 - 19, rX7 = rX6 - 19, rY7 = rY6 - 19, lX7 = lX6 + 19, lY7 = lY6 - 19;
  var tX8 = tX7 - 19, tY8 = tY7 + 19, bX8 = bX7 - 19, bY8 = bY7 - 19, rX8 = rX7 - 19, rY8 = rY7 - 19, lX8 = lX7 + 19, lY8 = lY7 - 19;
  var tX9 = tX8 - 19, tY9 = tY8 + 19, bX9 = bX8 - 19, bY9 = bY8 - 19, rX9 = rX8 - 19, rY9 = rY8 - 19, lX9 = lX8 + 19, lY9 = lY8 - 19;
  //first layer
  for(var i = 0; i < 18; i++)
  {
    bricks.push(new Sprite(tX1, tY1, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 1;
    if(currentLevel < 3)
    {
      bricks[bricks.length - 1].visible = true;
    }
    bricks.push(new Sprite(bX1, bY1, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 1;
    if(currentLevel < 2)
    {
      bricks[bricks.length - 1].visible = true;
    }
    tX1 = tX1 - brickL;
    bX1 = bX1 - brickL;
  }
  for(var i = 0; i < 10; i++)
  {
    bricks.push(new Sprite(rX1, rY1, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 1;
    if(currentLevel < 3)
    {
      bricks[bricks.length - 1].visible = true;
    }
    bricks.push(new Sprite(lX1, lY1, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 1;
    if(currentLevel < 2)
    {
      bricks[bricks.length - 1].visible = true;
    }
    rY1 = rY1 - brickL;
    lY1 = lY1 - brickL;
  }
  //second layer
  for(var i = 0; i < 17; i++)
  {
    bricks.push(new Sprite(tX2, tY2, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 2;
    bricks.push(new Sprite(bX2, bY2, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 2;
    tX2 = tX2 - brickL;
    bX2 = bX2 - brickL;
  }
  for(var i = 0; i < 9; i++)
  {
    bricks.push(new Sprite(rX2, rY2, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 2;
    bricks.push(new Sprite(lX2, lY2, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 2;
    rY2 = rY2 - brickL;
    lY2 = lY2 - brickL;
  }
  //third layer
  for(var i = 0; i < 16; i++)
  {
    bricks.push(new Sprite(tX3, tY3, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 3;
    bricks.push(new Sprite(bX3, bY3, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 3;
    tX3 = tX3 - brickL;
    bX3 = bX3 - brickL;
  }
  for(var i = 0; i < 8; i++)
  {
    bricks.push(new Sprite(rX3, rY3, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 3;
    bricks.push(new Sprite(lX3, lY3, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 3;
    rY3 = rY3 - brickL;
    lY3 = lY3 - brickL;
  }
  //fourth layer
  for(var i = 0; i < 15; i++)
  {
    bricks.push(new Sprite(tX4, tY4, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 4;
    bricks.push(new Sprite(bX4, bY4, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 4;
    tX4 = tX4 - brickL;
    bX4 = bX4 - brickL;
  }
  for(var i = 0; i < 7; i++)
  {
    bricks.push(new Sprite(rX4, rY4, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 4;
    bricks.push(new Sprite(lX4, lY4, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 4;
    rY4 = rY4 - brickL;
    lY4 = lY4 - brickL;
  }
  //fifth layer
  for(var i = 0; i < 14; i++)
  {
    bricks.push(new Sprite(tX5, tY5, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 5;
    bricks.push(new Sprite(bX5, bY5, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 5;
    tX5 = tX5 - brickL;
    bX5 = bX5 - brickL;
  }
  for(var i = 0; i < 6; i++)
  {
    bricks.push(new Sprite(rX5, rY5, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 5;
    bricks.push(new Sprite(lX5, lY5, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 5;
    rY5 = rY5 - brickL;
    lY5 = lY5 - brickL;
  }
  //sixth layer
  for(var i = 0; i < 13; i++)
  {
    bricks.push(new Sprite(tX6, tY6, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 6;
    bricks.push(new Sprite(bX6, bY6, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 6;
    tX6 = tX6 - brickL;
    bX6 = bX6 - brickL;
  }
  for(var i = 0; i < 5; i++)
  {
    bricks.push(new Sprite(rX6, rY6, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 6;
    bricks.push(new Sprite(lX6, lY6, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 6;
    rY6 = rY6 - brickL;
    lY6 = lY6 - brickL;
  }
  //seventh layer
  for(var i = 0; i < 12; i++)
  {
    bricks.push(new Sprite(tX7, tY7, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 7;
    bricks.push(new Sprite(bX7, bY7, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 7;
    tX7 = tX7 - brickL;
    bX7 = bX7 - brickL;
  }
  for(var i = 0; i < 4; i++)
  {
    bricks.push(new Sprite(rX7, rY7, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 7;
    bricks.push(new Sprite(lX7, lY7, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 7;
    rY7 = rY7 - brickL;
    lY7 = lY7 - brickL;
  }
  //eighth layer
  for(var i = 0; i < 11; i++)
  {
    bricks.push(new Sprite(tX8, tY8, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 8;
    bricks.push(new Sprite(bX8, bY8, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 8;
    tX8 = tX8 - brickL;
    bX8 = bX8 - brickL;
  }
  for(var i = 0; i < 3; i++)
  {
    bricks.push(new Sprite(rX8, rY8, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 8;
    bricks.push(new Sprite(lX8, lY8, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 8;
    rY8 = rY8 - brickL;
    lY8 = lY8 - brickL;
  }
  //ninth layer
  for(var i = 0; i < 10; i++)
  {
    bricks.push(new Sprite(tX9, tY9, brickL, brickH, 'tBrickH'));
    bricks[bricks.length - 1].layer = 9;
    bricks.push(new Sprite(bX9, bY9, brickL, brickH, 'bBrickH'));
    bricks[bricks.length - 1].layer = 9;
    tX9 = tX9 - brickL;
    bX9 = bX9 - brickL;
  }
  for(var i = 0; i < 2; i++)
  {
    bricks.push(new Sprite(rX9, rY9, brickH, brickL, 'rBrickV'));
    bricks[bricks.length - 1].layer = 9;
    bricks.push(new Sprite(lX9, lY9, brickH, brickL, 'lBrickV'));
    bricks[bricks.length - 1].layer = 9;
    rY9 = rY9 - brickL;
    lY9 = lY9 - brickL;
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
  if(currentLevel > 1)
  {
    this.dy        = rand(1, 2) * this.multipliery;
    this.dx        = rand(1, 2) * this.multiplierx;
  }
  else
  {
    this.dy        = 1 * this.multipliery;
    this.dx        = 1 * this.multiplierx;
  }
  this.speed      = rand(1, 2);
  this.clockwise = rand(0, 1);
  this.escaped = false;

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
    player.isStanding = false;

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
        player.isStanding = false;
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
        player.isStanding = false;
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
        player.isStanding = false;
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
        player.isStanding = false;
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
        player.isStanding = true;
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
