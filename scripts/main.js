var game;

window.onload = function() {
	game = new Phaser.Game(480, 60, Phaser.AUTO, "");
     game.state.add("PlayGame", playGame);
     game.state.start("PlayGame");
}

var playGame = function(game){};
playGame.prototype = {
     preload: function(){
          // the mc is a spritesheet with all animation frames
          game.load.spritesheet("mc", "images/spritesheets/mc.png", 32, 64, 4);
     },
     create: function(){
          // the mc is initally placed like a normal sprite
          this.mc = game.add.sprite(game.width / 2, game.height / 2, "mc");
          // flag to determine if the mc is supposed to move right
          this.mc.goingRight = false;
          // flag to determine if the mc is supposed to move left
          this.mc.goingLeft = false;
          // default idle frame, with the mc facing right
          this.mc.idleFrame = 0;
          // this is how we set an animation, we give it a name and an array with the frames.
          var walkRightAnimation = this.mc.animations.add("walkRight", [0, 1, 2, 3]);
          var walkLeftAnimation = this.mc.animations.add("walkLeft", [0, 1, 2, 3]);
          // these are just listeners for X and Z keys
          this.rightKeyPressed = game.input.keyboard.addKey(Phaser.Keyboard.X);
          this.leftKeyPressed = game.input.keyboard.addKey(Phaser.Keyboard.Z);
          // setting goingRight to true if X is pressed
          this.rightKeyPressed.onDown.add(function(){
               this.mc.goingRight = true;
          }, this);
          // setting goingRight to false if X is released
          this.rightKeyPressed.onUp.add(function(){
               this.mc.goingRight = false;
          }, this);
          // setting goingLeft to true if Y is pressed
          this.leftKeyPressed.onDown.add(function(){
               this.mc.goingLeft = true;
          }, this);
          // setting goingLeft to false if Y is released
          this.leftKeyPressed.onUp.add(function(){
               this.mc.goingLeft = false;
          }, this);
     },
     update: function(){
          // if we are going left and not right (we don't want two keys to be pressed at the same time)
          if(this.mc.goingRight && !this.mc.goingLeft){
               this.mc.animations.play("walkRight", 10, true);
               // idle frame with mc facing right
               this.mc.idleFrame = 0;
          }
          else{
               // if we are going right and not left
               if(!this.mc.goingRight && this.mc.goingLeft){
                    this.mc.animations.play("walkLeft", 10, true);
                    // idle frame with mc facing left
                    this.mc.idleFrame = 4;
               }
               else{
                    // show idle frame
                    this.mc.frame = this.mc.idleFrame;
               }
          }
     }
}
