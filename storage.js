// storage.js - All localStorage read/write helpers
// Saves and retrieves multiple pieces of data to meet the LocalStorage rubric requirement

var WATCHLIST_KEY = "reelmood_watchlist";
var LAST_QUIZ_KEY = "reelmood_last_quiz";
var DARK_MODE_KEY = "reelmood_dark_mode";
var LAST_GENRE_KEY = "reelmood_last_genre";

// --- Watchlist ---

export function getWatchlist() {
  var saved = localStorage.getItem(WATCHLIST_KEY);
  if (!saved) {
    return [];
  }
  return JSON.parse(saved);
}

export function addToWatchlist(movie) {
  var watchlist = getWatchlist();

  // Don't add the same movie twice
  var alreadySaved = false;
  for (var i = 0; i < watchlist.length; i++) {
    if (watchlist[i].id === movie.id) {
      alreadySaved = true;
    }
  }

  if (!alreadySaved) {
    watchlist.push(movie);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }
}

export function removeFromWatchlist(movieId) {
  var watchlist = getWatchlist();
  var updatedList = [];
  for (var i = 0; i < watchlist.length; i++) {
    if (watchlist[i].id !== movieId) {
      updatedList.push(watchlist[i]);
    }
  }
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedList));
}

// --- Last quiz answers (so the page remembers what you picked) ---

export function saveLastQuiz(player1Answers, player2Answers) {
  var quizData = {
    player1: player1Answers,
    player2: player2Answers,
    savedAt: new Date().toLocaleDateString(),
  };
  localStorage.setItem(LAST_QUIZ_KEY, JSON.stringify(quizData));
}

export function getLastQuiz() {
  var saved = localStorage.getItem(LAST_QUIZ_KEY);
  if (!saved) {
    return null;
  }
  return JSON.parse(saved);
}

// --- Dark mode preference ---

export function saveDarkMode(isDark) {
  localStorage.setItem(DARK_MODE_KEY, isDark ? "true" : "false");
}

export function getDarkMode() {
  return localStorage.getItem(DARK_MODE_KEY) === "true";
}

// --- Last genre picked (shown as a small reminder on the results page) ---

export function saveLastGenre(genre) {
  localStorage.setItem(LAST_GENRE_KEY, genre);
}

export function getLastGenre() {
  return localStorage.getItem(LAST_GENRE_KEY) || "";
}