const WATCHLIST_KEY = "reelmood_watchlist";

// Returns the saved watchlist
export function getWatchlist() {
  const saved = localStorage.getItem(WATCHLIST_KEY);

  if (!saved) {
    return [];
  }

  return JSON.parse(saved);
}

// Adds a movie to the watchlist if it isn't already saved.
export function addToWatchlist(movie) {
  const watchlist = getWatchlist();

  // Check if this movie is already saved
  let alreadySaved = false;
  for (let i = 0; i < watchlist.length; i++) {
    if (watchlist[i].id === movie.id) {
      alreadySaved = true;
    }
  }

  if (!alreadySaved) {
    watchlist.push(movie);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }
}

// Removes a movie from the watchlist by its id
export function removeFromWatchlist(movieId) {
  const watchlist = getWatchlist();

  const updatedList = [];
  for (let i = 0; i < watchlist.length; i++) {
    if (watchlist[i].id !== movieId) {
      updatedList.push(watchlist[i]);
    }
  }

  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedList));
}