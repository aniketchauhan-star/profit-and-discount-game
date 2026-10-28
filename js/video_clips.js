// Made by tools/flow_import.py from the user's Google Flow takes: do not edit by hand.
// Each story screen's film in "assets/video/" (its first frame, the screen's picture: "<screen>.webp"): its length
// in seconds, and when each line said on it starts in it (seconds: its speaker's lips start to move); `sound`: it
// plays with its own sound (the others are muted: the game says the lines). The game plays only the films listed here.
const VIDEO_CLIPS = {
  "home": {"seconds": 12.417, "lines": {"plan": 0.68, "advice": 6.33, "promise": 11.3}},
  "outside": {"seconds": 3.625, "lines": {}},
  "browse": {"seconds": 5.917, "lines": {"browse": 1.56}},
  "ask": {"seconds": 10.667, "lines": {"ask": 0.67, "price": 2.46, "costly": 4.84, "check-price": 7.69}},
  "reveal": {"seconds": 12.375, "lines": {"reveal-1": 0.39, "reveal-2": 6.4, "reveal-3": 10.67}},
  "pay": {"seconds": 6.375, "lines": {"thanks": 5.11}},
  "exit": {"seconds": 2.5, "lines": {}},
  "sneakers": {"seconds": 3.917, "lines": {"sneakers": 0.33}},
  "shoe": {"seconds": 0.667, "lines": {}},
  "confused": {"seconds": 6.333, "lines": {"shoe-price": 0.69}},
  "offmeans": {"seconds": 9.375, "lines": {"off-what": 0.58, "shoe-ask": 3.54}},
  "final": {"seconds": 10.208, "lines": {"final-1": 1.81, "final-2": 4.92}},
  "return": {"seconds": 12.417, "lines": {"home-ask": 0.98, "home-learnt": 2.99}},
  "invite": {"seconds": 9.75, "lines": {"inv-1": 1.16, "inv-2": 5.97}},
  "partymoney": {"seconds": 11.5, "lines": {"money": 0.58, "deal-use": 3.98}},
  "partydeal": {"seconds": 10.667, "lines": {"deal-left": 0.44, "deal-really": 5.03, "deal-offers": 6.23}},
  "fitcheck": {"seconds": 10.0, "lines": {}, "sound": true},
  "dancing": {"seconds": 8.0, "lines": {}, "sound": true},
};
