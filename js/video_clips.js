// Made by tools/flow_import.py from the user's Google Flow takes: do not edit by hand.
// Each story screen's film in "assets/video/" (its first frame, the screen's picture: "<screen>.webp"): its length
// in seconds, and when each line said on it starts in it (seconds: its speaker's lips start to move); `sound`: it
// plays with its own sound (the others are muted: the game says the lines). The game plays only the films listed here.
const VIDEO_CLIPS = {
  "home": {"seconds": 15.333, "lines": {"plan": 0.54, "advice": 6.94, "promise": 12.71}},
  "outside": {"seconds": 3.625, "lines": {}},
  "browse": {"seconds": 5.0, "lines": {"browse": 1.01}},
  "ask": {"seconds": 14.583, "lines": {"ask": 0.5, "price": 3.49, "costly": 6.96, "check-price": 10.53}},
  "reveal": {"seconds": 14.25, "lines": {"reveal-1": 0.34, "reveal-2": 5.78, "reveal-3": 11.15}},
  "discount": {"seconds": 4.417, "lines": {"disc-2": 0.34}},
  "pay": {"seconds": 7.5, "lines": {"thanks": 4.07}},
  "exit": {"seconds": 2.5, "lines": {}},
  "sneakers": {"seconds": 4.792, "lines": {"sneakers": 0.3}},
  "shoe": {"seconds": 0.625, "lines": {}},
  "confused": {"seconds": 6.583, "lines": {"shoe-price": 0.63}},
  "offmeans": {"seconds": 10.25, "lines": {"off-what": 0.53, "shoe-ask": 4.89}},
  "final": {"seconds": 11.125, "lines": {"final-1": 1.51, "final-2": 5.56}},
  "return": {"seconds": 11.667, "lines": {"home-ask": 0.78, "home-learnt": 4.06}},
  "invite": {"seconds": 10.208, "lines": {"inv-1": 0.86, "inv-2": 6.17}},
  "partymoney": {"seconds": 10.167, "lines": {"money": 0.43, "deal-use": 4.33}},
  "partydeal": {"seconds": 13.292, "lines": {"deal-left": 0.35, "deal-really": 5.9, "deal-offers": 8.4}},
  "fitcheck": {"seconds": 10.0, "lines": {}, "sound": true},
};
