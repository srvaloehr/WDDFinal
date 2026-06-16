// Lookup titles for sections logic

import { QUIZ_QUESTIONS, combineAnswers } from "./quiz.js";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  saveLastQuiz,
  getLastQuiz,
  saveDarkMode,
  getDarkMode,
  saveLastGenre,
  getLastGenre,
} from "./storage.js";
import { getMovies, getMovieDetails, getRatings, getSnack } from "./api.js";

//  Grab all the DOM 

var navButtons = document.querySelectorAll(".nav-btn");
var views = document.querySelectorAll(".view");

var playerButtons = document.querySelectorAll(".player-btn");
var quizProgress = document.getElementById("quiz-progress");
var quizCardContainer = document.getElementById("quiz-card-container");
var quizBackBtn = document.getElementById("quiz-back-btn");
var quizNextBtn = document.getElementById("quiz-next-btn");

var resultsLoading = document.getElementById("results-loading");
var movieResults = document.getElementById("movie-results");
var snackResult = document.getElementById("snack-result");
var randomPickBtn = document.getElementById("random-pick-btn");
var lastGenreLabel = document.getElementById("last-genre-label");

var detailsPanel = document.getElementById("details-panel");
var detailsCloseBtn = document.getElementById("details-close-btn");
var detailsTitle = document.getElementById("details-title");
var detailsMeta = document.getElementById("details-meta");
var detailsOverview = document.getElementById("details-overview");
var detailsTagline = document.getElementById("details-tagline");
var detailsExtra = document.getElementById("details-extra");

var watchlistItems = document.getElementById("watchlist-items");
var watchlistEmpty = document.getElementById("watchlist-empty");
var watchlistCount = document.getElementById("watchlist-count");

var darkModeToggle = document.getElementById("dark-mode-toggle");

//  App state 

var currentPlayer = 1;
var currentQuestionIndex = 0;
var player1Answers = {};
var player2Answers = {};
var lastMovies = [];

// --- Light mode toggle: site is dark (AMC theme) 
// Saved preference: "true" means user switched to light mode

if (getDarkMode()) {
  document.body.classList.add("light-mode");
  darkModeToggle.textContent = "🌙 Dark Mode";
}

// Light/dark toggle 
darkModeToggle.addEventListener("click", function () {
  var isLight = document.body.classList.toggle("light-mode");
  saveDarkMode(isLight);
  if (isLight) {
    darkModeToggle.textContent = "🌙 Dark Mode";
  } else {
    darkModeToggle.textContent = "☀️ Light Mode";
  }
});

// Navigation between
for (var i = 0; i < navButtons.length; i++) {
  navButtons[i].addEventListener("click", function () {
    var viewId = this.dataset.view;
    showView(viewId);
    if (viewId === "watchlist-view") {
      renderWatchlist();
    }
  });
}

function showView(viewId) {
  for (var i = 0; i < views.length; i++) {
    if (views[i].id === viewId) {
      views[i].classList.add("active");
      views[i].hidden = false;
    } else {
      views[i].classList.remove("active");
      views[i].hidden = true;
    }
  }

  for (var i = 0; i < navButtons.length; i++) {
    if (navButtons[i].dataset.view === viewId) {
      navButtons[i].classList.add("active");
      navButtons[i].setAttribute("aria-current", "page");
    } else {
      navButtons[i].classList.remove("active");
      navButtons[i].removeAttribute("aria-current");
    }
  }
}

// Player toggle
for (var i = 0; i < playerButtons.length; i++) {
  playerButtons[i].addEventListener("click", function () {
    currentPlayer = Number(this.dataset.player);

    for (var j = 0; j < playerButtons.length; j++) {
      playerButtons[j].classList.remove("active");
    }
    this.classList.add("active");

    currentQuestionIndex = 0;
    renderQuestion("right");
  });
}

//  Quiz rendering 

function renderQuestion(direction) {
  var question = QUIZ_QUESTIONS[currentQuestionIndex];

  quizProgress.textContent =
    "Question " + (currentQuestionIndex + 1) + " of " + QUIZ_QUESTIONS.length;

  var currentAnswers = currentPlayer === 2 ? player2Answers : player1Answers;
  var savedAnswer = currentAnswers[question.id];

  var optionsHtml = "";
  for (var i = 0; i < question.options.length; i++) {
    var option = question.options[i];
    var selectedClass = option.value === savedAnswer ? "selected" : "";
    optionsHtml +=
      '<button type="button" class="quiz-option ' +
      selectedClass +
      '" data-value="' +
      option.value +
      '">' +
      option.label +
      "</button>";
  }

  var slideClass = direction === "left" ? "slide-in-left" : "";

  quizCardContainer.innerHTML =
    '<div class="quiz-card ' +
    slideClass +
    '">' +
    '<h3 class="quiz-question">' +
    question.text +
    "</h3>" +
    '<div class="quiz-options">' +
    optionsHtml +
    "</div>" +
    "</div>";

  // Quiz option
  var optionButtons = quizCardContainer.querySelectorAll(".quiz-option");
  for (var i = 0; i < optionButtons.length; i++) {
    optionButtons[i].addEventListener("click", function () {
      var currentAnswers = currentPlayer === 2 ? player2Answers : player1Answers;
      currentAnswers[question.id] = this.dataset.value;

      for (var j = 0; j < optionButtons.length; j++) {
        optionButtons[j].classList.remove("selected");
      }
      this.classList.add("selected");

      quizNextBtn.disabled = false;
    });
  }

  quizNextBtn.disabled = !savedAnswer;
  quizBackBtn.disabled = currentQuestionIndex === 0;
  quizNextBtn.textContent =
    currentQuestionIndex === QUIZ_QUESTIONS.length - 1 ? "Finish" : "Next";
}

// Quiz Next 
quizNextBtn.addEventListener("click", function () {
  var isLast = currentQuestionIndex === QUIZ_QUESTIONS.length - 1;
  if (isLast) {
    handleQuizFinish();
    return;
  }
  currentQuestionIndex++;
  renderQuestion("right");
});

//  Quiz Back
quizBackBtn.addEventListener("click", function () {
  if (currentQuestionIndex === 0) return;
  currentQuestionIndex--;
  renderQuestion("left");
});

function handleQuizFinish() {
  // If player 1 just finished, switch to player 2
  if (currentPlayer === 1) {
    currentPlayer = 2;
    currentQuestionIndex = 0;

    for (var i = 0; i < playerButtons.length; i++) {
      if (Number(playerButtons[i].dataset.player) === 2) {
        playerButtons[i].classList.add("active");
      } else {
        playerButtons[i].classList.remove("active");
      }
    }

    renderQuestion("right");
    return;
  }

  // Both players done 
  saveLastQuiz(player1Answers, player2Answers);
  showView("results-view");
  loadResults();
}

//  Results 

async function loadResults() {
  resultsLoading.hidden = false;
  movieResults.innerHTML = "";
  snackResult.innerHTML = "";
  snackResult.style.display = "none";

  var settings = combineAnswers(player1Answers, player2Answers);

  // Save the last genre
  saveLastGenre(settings.genre);

  // Show the last genre
  var lastGenre = getLastGenre();
  if (lastGenreLabel && lastGenre) {
    lastGenreLabel.textContent = "Last time you picked: " + lastGenre;
    lastGenreLabel.hidden = false;
  }

  var movies = await getMovies(settings.genre);
  var snack = await getSnack(settings.snack);

  lastMovies = movies;

  resultsLoading.hidden = true;
  snackResult.style.display = "";

  renderMovies(movies);
  renderSnack(snack);
}

function renderMovies(movies) {
  if (movies.length === 0) {
    movieResults.innerHTML =
      '<p class="empty-message">No movies found. Try the quiz again.</p>';
    return;
  }

  var html = "";

  for (var i = 0; i < movies.length; i++) {
    var movie = movies[i];
    var delay = i * 0.15;

    html +=
      '<article class="movie-card fade-in" style="animation-delay:' +
      delay +
      's" data-movie-id="' +
      movie.id +
      '">' +
      '<div class="card-flip-inner">' +

      // Front of the card
      '<div class="card-front">' +
      '<img class="movie-poster" src="' +
      movie.posterUrl +
      '" alt="Poster for ' +
      movie.title +
      '" width="300" height="450" />' +
      "</div>" +

      // Back of the card 
      '<div class="card-back">' +
      '<p class="card-back-overview">' +
      (movie.overview || "No overview available.") +
      "</p>" +
      "</div>" +

      "</div>" +

      '<div class="movie-card-body">' +
      '<h3 class="movie-title">' + movie.title + "</h3>" +
      '<p class="movie-meta">' + movie.year + " &middot; " + movie.originalLanguage.toUpperCase() + "</p>" +
      '<p class="movie-ratings">' +
      '<span class="rating-badge" id="imdb-' + movie.id + '">IMDb: ...</span>' +
      '<span class="rating-badge" id="rt-' + movie.id + '">RT: ...</span>' +
      "</p>" +
      '<div class="movie-card-actions">' +
      '<button type="button" class="btn btn-secondary btn-small watchlist-btn" data-movie-id="' +
      movie.id +
      '">Add to Watchlist</button>' +
      '<button type="button" class="btn btn-primary btn-small details-btn" data-movie-id="' +
      movie.id +
      '">Details</button>' +
      "</div>" +
      "</div>" +
      "</article>";
  }

  movieResults.innerHTML = html;

  // Fetch ratings 
  for (var i = 0; i < movies.length; i++) {
    fillInRatings(movies[i]);
  }

  // Watchlist button
var watchlistButtons = document.querySelectorAll(".watchlist-btn");
  for (var i = 0; i < watchlistButtons.length; i++) {
    watchlistButtons[i].addEventListener("click", function () {
      var clickedId = Number(this.dataset.movieId);
      var clickedMovie = findMovieById(lastMovies, clickedId);
      handleAddToWatchlist(clickedMovie, this);
    });
  }

  var detailsButtons = document.querySelectorAll(".details-btn");
  for (var i = 0; i < detailsButtons.length; i++) {
    detailsButtons[i].addEventListener("click", function () {
      var clickedId = Number(this.dataset.movieId);
      openDetailsPanel(clickedId);
    });
  }
}


// Fills in IMDb 
async function fillInRatings(movie) {
  var ratings = await getRatings(movie.title);

  var imdbBadge = document.getElementById("imdb-" + movie.id);
  var rtBadge = document.getElementById("rt-" + movie.id);

  if (imdbBadge) {
    imdbBadge.textContent = "IMDb: " + ratings.imdbRating;
  }
  if (rtBadge) {
    rtBadge.textContent = "RT: " + ratings.rottenTomatoes;
  }
}

function findMovieById(movies, movieId) {
  for (var i = 0; i < movies.length; i++) {
    if (movies[i].id === movieId) {
      return movies[i];
    }
  }
  return null;
}

function renderSnack(snack) {
  if (!snack) {
    snackResult.innerHTML =
      '<p class="empty-message">No snack suggestion found this time.</p>';
    return;
  }

  snackResult.innerHTML =
    '<img class="snack-image" src="' +
    snack.imageUrl +
    '" alt="' +
    snack.name +
    '" width="200" height="150" />' +
    '<div class="snack-card-body">' +
    '<h4 class="snack-name">' + snack.name + "</h4>" +
    '<p class="snack-description">' + snack.description + "</p>" +
    "</div>";
}

// Pick for us
randomPickBtn.addEventListener("click", function () {
  if (lastMovies.length === 0) return;
console.log("lastMovies:", lastMovies, "card found:", card);
  var randomIndex = Math.floor(Math.random() * lastMovies.length);
  var chosenMovie = lastMovies[randomIndex];
  var card = document.querySelector('[data-movie-id="' + chosenMovie.id + '"]');

  if (card) {
    card.classList.add("pulse");
    card.addEventListener(
      "animationend",
      function () {
        card.classList.remove("pulse");
      },
      { once: true }
    );
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

//  Details 

async function openDetailsPanel(movieId) {
  detailsPanel.hidden = false;
  detailsPanel.classList.add("panel-open");

  detailsTitle.textContent = "Loading...";
  detailsMeta.textContent = "";
  detailsOverview.textContent = "";
  detailsTagline.textContent = "";
  detailsExtra.textContent = "";

  var details = await getMovieDetails(movieId);

  if (!details) {
    detailsTitle.textContent = "Could not load details";
    detailsOverview.textContent =
      "Something went wrong. Please try again.";
    return;
  }

  detailsTitle.textContent = details.title;
  detailsMeta.textContent =
    details.year + " · " + details.runtime + " min · " + details.genres;
  detailsOverview.textContent = details.overview;

  if (details.tagline) {
    detailsTagline.textContent = '"' + details.tagline + '"';
  }

  if (details.status) {
    detailsExtra.textContent = "Status: " + details.status;
  }
}


detailsCloseBtn.addEventListener("click", function () {
  detailsPanel.hidden = true;
  detailsPanel.classList.remove("panel-open");
});

// Close details 
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && !detailsPanel.hidden) {
    detailsPanel.hidden = true;
    detailsPanel.classList.remove("panel-open");
  }
});

// Watchlist 

function handleAddToWatchlist(movie, button) {
  if (!movie) return;

  addToWatchlist({
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    year: movie.year,
    originalLanguage: movie.originalLanguage,
    overview: movie.overview,
  });

  button.textContent = "✓ Saved";
  button.disabled = true;

  // Confirmation animation 
  var card = button.closest(".movie-card");
  if (card) {
    card.classList.add("confirm-save");
    card.addEventListener(
      "animationend",
      function () {
        card.classList.remove("confirm-save");
      },
      { once: true }
    );
  }

  // Update the watchlist 
  updateWatchlistCount();
}

function renderWatchlist() {
  var watchlist = getWatchlist();

  if (watchlist.length === 0) {
    watchlistEmpty.hidden = false;
    watchlistItems.innerHTML = "";
    watchlistCount.textContent = "";
    return;
  }

  watchlistEmpty.hidden = true;
  watchlistCount.textContent = "(" + watchlist.length + ")";

  var html = "";
  for (var i = 0; i < watchlist.length; i++) {
    var movie = watchlist[i];

    html +=
      '<article class="movie-card fade-in" data-movie-id="' +
      movie.id +
      '">' +
      '<img class="movie-poster" src="' +
      movie.posterUrl +
      '" alt="Poster for ' +
      movie.title +
      '" width="300" height="450" />' +
      '<div class="movie-card-body">' +
      '<h3 class="movie-title">' + movie.title + "</h3>" +
      '<p class="movie-meta">' + movie.year + "</p>" +
      '<p class="movie-overview-short">' +
      (movie.overview ? movie.overview.slice(0, 80) + "..." : "") +
      "</p>" +
      '<div class="movie-card-actions">' +
      '<button type="button" class="btn btn-secondary btn-small remove-btn" data-movie-id="' +
      movie.id +
      '">Remove</button>' +
      "</div>" +
      "</div>" +
      "</article>";
  }

  watchlistItems.innerHTML = html;

  //Remove from watchlist
  var removeButtons = document.querySelectorAll(".remove-btn");
  for (var i = 0; i < removeButtons.length; i++) {
    removeButtons[i].addEventListener("click", function () {
      var movieId = Number(this.dataset.movieId);
      removeFromWatchlist(movieId);
      renderWatchlist();
    });
  }
}

function updateWatchlistCount() {
  var watchlist = getWatchlist();
  if (watchlist.length > 0) {
    watchlistCount.textContent = "(" + watchlist.length + ")";
  } else {
    watchlistCount.textContent = "";
  }
}

// --- Load quiz from last 
var savedQuiz = getLastQuiz();
if (savedQuiz) {
  player1Answers = savedQuiz.player1 || {};
  player2Answers = savedQuiz.player2 || {};
}


updateWatchlistCount();
renderQuestion("right");