// Made by tools/flow_import.py from the user's Google Flow takes: do not edit by hand.
// Each story screen's film in "assets/video/" (its first frame, the screen's picture: "<screen>.webp"): its length
// in seconds, and when each line said on it starts in it (seconds: its speaker's lips start to move); `sound`: it
// plays with its own sound (the others are muted: the game says the lines). The game plays only the films listed here.
const VIDEO_CLIPS = {
  "home": {"seconds": 15.583, "lines": {"plan": 0.54, "advice": 7.11, "promise": 13.12}},
  "outside": {"seconds": 3.625, "lines": {}},
  "browse": {"seconds": 5.5, "lines": {"browse": 1.01}},
  "ask": {"seconds": 15.583, "lines": {"ask": 0.5, "price": 3.78, "costly": 7.5, "check-price": 11.28}},
  "reveal": {"seconds": 16.458, "lines": {"reveal-1": 0.34, "reveal-2": 7.11, "reveal-3": 12.82}},
  "discount": {"seconds": 4.417, "lines": {"disc-2": 0.34}},
  "pay": {"seconds": 7.917, "lines": {"thanks": 4.07}},
  "exit": {"seconds": 2.5, "lines": {}},
  "sneakers": {"seconds": 5.25, "lines": {"sneakers": 0.3}},
  "shoe": {"seconds": 0.625, "lines": {}},
  "confused": {"seconds": 6.583, "lines": {"shoe-price": 0.63}},
  "offmeans": {"seconds": 11.542, "lines": {"off-what": 0.53, "shoe-ask": 4.89}},
  "final": {"seconds": 12.083, "lines": {"final-1": 1.51, "final-2": 6.31}},
  "return": {"seconds": 11.75, "lines": {"home-ask": 0.78, "home-learnt": 4.15}},
  "invite": {"seconds": 10.792, "lines": {"inv-1": 0.86, "inv-2": 6.17}},
  "partymoney": {"seconds": 11.083, "lines": {"money": 0.43, "deal-use": 4.49}},
  "partydeal": {"seconds": 14.333, "lines": {"deal-left": 0.35, "deal-really": 6.57, "deal-offers": 9.11}},
  "fitcheck": {"seconds": 10.0, "lines": {}, "sound": true},
};
