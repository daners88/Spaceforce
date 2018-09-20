$("#img1").click(function(){
 var yourImages = ['images/tweets/buildWall_quote.png',
 'images/tweets/goodPeople_quote.png',
 'images/tweets/madCoke_quote.png',
 'images/tweets/niceHumane_quote.png',
 'images/tweets/sad_quote.png',
 'images/tweets/sendMoney_quote.png',
 'images/tweets/spaceForce_quote.png',
 'images/tweets/thinCoke_quote.png'];
 var randomImage = Math.round(Math.random()*yourImages.length);
 $("#img1").attr("src", yourImages[randomImage]);});

 $("#img2").click(function(){
  var yourImages = ['images/tweets/buildWall_quote.png',
  'images/tweets/goodPeople_quote.png',
  'images/tweets/madCoke_quote.png',
  'images/tweets/niceHumane_quote.png',
  'images/tweets/sad_quote.png',
  'images/tweets/sendMoney_quote.png',
  'images/tweets/spaceForce_quote.png',
  'images/tweets/thinCoke_quote.png'];
  var randomImage = Math.round(Math.random()*yourImages.length);
  $("#img2").attr("src", yourImages[randomImage]);});
