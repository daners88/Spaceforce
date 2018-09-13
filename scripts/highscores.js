$(document).ready( function() {
  var canUseLocalStorage = 'localStorage' in window && window.localStorage !== null;
  var hs1Name = localStorage.getItem('highscore.hs1Name');
  var hs2Name = localStorage.getItem('highscore.hs2Name');
  var hs3Name = localStorage.getItem('highscore.hs3Name');
  var hs4Name = localStorage.getItem('highscore.hs4Name');
  var hs5Name = localStorage.getItem('highscore.hs5Name');
  var hs1Score = localStorage.getItem('highscore.hs1Score');
  var hs2Score = localStorage.getItem('highscore.hs2Score');
  var hs3Score = localStorage.getItem('highscore.hs3Score');
  var hs4Score = localStorage.getItem('highscore.hs4Score');
  var hs5Score = localStorage.getItem('highscore.hs5Score');
  document.getElementById("hs1-name").textContent = hs1Name + " - ";
  document.getElementById("hs1-score").textContent = hs1Score;
  document.getElementById("hs2-name").textContent = hs2Name + " - ";
  document.getElementById("hs2-score").textContent = hs2Score;
  document.getElementById("hs3-name").textContent = hs3Name + " - ";
  document.getElementById("hs3-score").textContent = hs3Score;
  document.getElementById("hs4-name").textContent = hs4Name + " - ";
  document.getElementById("hs4-score").textContent = hs4Score;
  document.getElementById("hs5-name").textContent = hs5Name + " - ";
  document.getElementById("hs5-score").textContent = hs5Score;


})
