$(document).ready( function()
{
  var canUseLocalStorage = 'localStorage' in window && window.localStorage !== null;
  var hs1Name, hs2Name, hs3Name, hs4Name, hs5Name, hs1Score, hs2Score, hs3Score, hs4Score, hs5Score;
  var scores = [];
  var scoreArr = [];
  var assetLoader;
  $.ajax(
    {
      type: 'GET',
      url: 'http://localhost:8080/highscores',
      success: function(result){
        scores = result;
        for(var i = 0; i < scores.length; i++)
        {
          scoreArr.push(scores[i]);
        }
        if(scoreArr.length > 0)
        {
          if (canUseLocalStorage)
          {
              scoreArr.sort(function(a, b)
              {
              return parseInt(b.score) - parseInt(a.score);
            });
            setScores();
          }
        }
      }
  });
  function setScores()
  {
    if(scoreArr[0])
    {
      hs1Name = scoreArr[0].name;
      hs1Score = scoreArr[0].score;
      localStorage.setItem('highscore.hs1Name', hs1Name);
      localStorage.setItem('highscore.hs1Score', hs1Score);
    }
    if(scoreArr[1])
    {
      hs2Name = scoreArr[1].name;
      hs2Score = scoreArr[1].score;
      localStorage.setItem('highscore.hs2Name', hs2Name);
      localStorage.setItem('highscore.hs2Score', hs2Score);
    }
    if(scoreArr[2])
    {
      hs3Name = scoreArr[2].name;
      hs3Score = scoreArr[2].score;
      localStorage.setItem('highscore.hs3Name', hs3Name);
      localStorage.setItem('highscore.hs3Score', hs3Score);
    }
    if(scoreArr[3])
    {
      hs4Name = scoreArr[3].name;
      hs4Score = scoreArr[3].score;
      localStorage.setItem('highscore.hs4Name', hs4Name);
      localStorage.setItem('highscore.hs4Score', hs4Score);
    }
    if(scoreArr[4])
    {
      hs5Name = scoreArr[4].name;
      hs5Score = scoreArr[4].score;
      localStorage.setItem('highscore.hs5Name', hs5Name);
      localStorage.setItem('highscore.hs5Score', hs5Score);
    }
  }
  function playSound() {
    assetLoader = (function() {
      this.sounds      = {
        'backGroundSound'            : 'sounds/backgroundMusic.mp3'
      };

      var assetsLoaded = 0;                                // how many assets have been loaded
      var numSounds    = Object.keys(this.sounds).length;  // total number of sound assets
      this.totalAssest = numSounds;                          // total number of assets

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
        sounds: this.sounds,
        totalAssest: this.totalAssest,
        downloadAll: this.downloadAll
      };
    })();

    assetLoader.downloadAll();


    assetLoader.sounds.backGroundSound.currentTime = 0;
    assetLoader.sounds.backGroundSound.loop = true;
    assetLoader.sounds.backGroundSound.play();
  }
  playSound();
 });
