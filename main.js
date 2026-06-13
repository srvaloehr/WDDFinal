

import { QUIZ_QUESTIONS, combineAnswers } from "./quiz.js";
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "./storage.js";
import { getMovies, getMovieDetails, getRatings, getSnack } from "./api.js";



const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

const playerButtons = document.querySelectorAll(".player-btn");
const quizProgress = document.getElementById("quiz-progress");
const quizCardContainer = document.getElementById("quiz-card-container");
const quizBackBtn = document.getElementById("quiz-back-btn");
const quizNextBtn = document.getElementById("quiz-next-btn");

const resultsLoading = document.getElementById("results-loading");
const movieResults = document.getElementById("movie-results");
const snackResult = document.getElementById("snack-result");
const randomPickBtn = document.getElementById("random-pick-btn");

const detailsPanel = document.getElementById("details-panel");
const detailsCloseBtn = document.getElementById("details-close-btn");
const detailsTitle = document.getElementById("details-title");
const detailsMeta = document.getElementById("details-meta");
const detailsOverview = document.getElementById("details-overview");

const watchlistItems = document.getElementById("watchlist-items");
const watchlistEmpty = document.getElementById("watchlist-empty");



let currentPlayer = 1;
let currentQuestionIndex = 0;


let player1Answers = {};
let player2Answers = {};

// Saved so the "Pick for us" button can use the same results
let lastMovies = [];



function showView(viewId) {
  for (let i = 0; i < views.length; i++) {
    if (views[i].id === viewId) {
      views[i].classList.add("active");
      views[i].hidden = false;
    } else {
      views[i].classList.remove("active");
      views[i].hidden = true;
    }
  }

  for (let i = 0; i < navButtons.length; i++) {
    if (navButtons[i].dataset.view === viewId) {
      navButtons[i].classList.add("active");
      navButtons[i].setAttribute("aria-current", "page");
    } else {
      navButtons[i].classList.remove("active");
      navButtons[i].removeAttribute("aria-current");
    }
  }
}

for (let i = 0; i < navButtons.length; i++) {
  navButtons[i].addEventListener("click", () => {
    const viewId = navButtons[i].dataset.view;
    showView(viewId);

    if (viewId === "watchlist-view") {
      renderWatchlist();
    }
  });
}

for (let i = 0; i < playerButtons.length; i++) {
  playerButtons[i].addEventListener("click", () => {
    currentPlayer = Number(playerButtons[i].dataset.player);

    for (let j = 0; j < playerButtons.length; j++) {
      playerButtons[j].classList.remove("active");
    }
    playerButtons[i].classList.add("active");

    renderQuestion();
  });
}

function renderQuestion(direction = "right") {
  const question = QUIZ_QUESTIONS[currentQuestionIndex];

  quizProgress.textContent =
    "Question " + (currentQuestionIndex + 1) + " of " + QUIZ_QUESTIONS.length;

  // Figure out which answers object belongs to the current player
  let currentAnswers = player1Answers;
  if (currentPlayer === 2) {
    currentAnswers = player2Answers;
  }

  const savedAnswer = currentAnswers[question.id];

  // Build the option buttons as an HTML string
  let optionsHtml = "";
  for (let i = 0; i < question.options.length; i++) {
    const option = question.options[i];

    let selectedClass = "";
    if (option.value === savedAnswer) {
      selectedClass = "selected";
    }

    optionsHtml +=
      '<button type="button" class="quiz-option ' +
      selectedClass +
      '" data-value="' +
      option.value +
      '">' +
      option.label +
      "</button>";
  }

  let slideClass = "";
  if (direction === "left") {
    slideClass = "slide-in-left";
  }

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

  
  const optionButtons = quizCardContainer.querySelectorAll(".quiz-option");
  for (let i = 0; i < optionButtons.length; i++) {
    optionButtons[i].addEventListener("click", () => {
      // Save the answer for the current player
      currentAnswers[question.id] = optionButtons[i].dataset.value;

      // Mark this option as selected
      for (let j = 0; j < optionButtons.length; j++) {
        optionButtons[j].classList.remove("selected");
      }
      optionButtons[i].classList.add("selected");

      quizNextBtn.disabled = false;
    });
  }

  // Enable/disable the Next and Back buttons
  quizNextBtn.disabled = !savedAnswer;
  quizBackBtn.disabled = currentQuestionIndex === 0;

  // Change the Next button text on the last question
  if (currentQuestionIndex === QUIZ_QUESTIONS.length - 1) {
    quizNextBtn.textContent = "Finish";
  } else {
    quizNextBtn.textContent = "Next";
  }
}

// "Next" / "Finish" button
quizNextBtn.addEventListener("click", () => {
  const isLastQuestion = currentQuestionIndex === QUIZ_QUESTIONS.length - 1;

  if (isLastQuestion) {
    handleQuizFinish();
    return;
  }

  currentQuestionIndex++;
  renderQuestion("right");
});

// "Back" button
quizBackBtn.addEventListener("click", () => {
  if (currentQuestionIndex === 0) {
    return;
  }

  currentQuestionIndex--;
  renderQuestion("left");
});


function handleQuizFinish() {

  if (currentPlayer === 1) {
    currentPlayer = 2;
    currentQuestionIndex = 0;

    for (let i = 0; i < playerButtons.length; i++) {
      if (Number(playerButtons[i].dataset.player) === 2) {
        playerButtons[i].classList.add("active");
      } else {
        playerButtons[i].classList.remove("active");
      }
    }

    renderQuestion("right");
    return;
  }

  // Both players are done - show the results page
  showView("results-view");
  loadResults();
}


// RESULTS

async function loadResults() {
  resultsLoading.hidden = false;
  movieResults.innerHTML = "";
  snackResult.innerHTML = "";

  // Combine both players' answers into one settings object
  const settings = combineAnswers(player1Answers, player2Answers);

  // Get movies and a snack
  const movies = await getMovies(settings.genre);
  const snack = await getSnack(settings.snack);

  lastMovies = movies;

  resultsLoading.hidden = true;

  renderMovies(movies);
  renderSnack(snack);
}

// Builds and shows the movie result cards
function renderMovies(movies) {
  if (movies.length === 0) {
    movieResults.innerHTML =
      '<p class="empty-message">No movies found. Please try the quiz again.</p>';
    return;
  }

  let html = "";

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];

    // Each card gets a slightly longer delay so they appear 
   
    const delay = i * 0.15;

    html +=
      '<article class="movie-card" style="animation-delay: ' +
      delay +
      's" data-movie-id="' +
      movie.id +
      '">' +
      '<img class="movie-poster" src="' +
      movie.posterUrl +
      '" alt="Poster for ' +
      movie.title +
      '" width="300" height="450" />' +
      '<div class="movie-card-body">' +
      '<h3 class="movie-title">' +
      movie.title +
      "</h3>" +
      '<p class="movie-meta">' +
      movie.year +
      "</p>" +
      '<p class="movie-ratings">' +
      '<span class="rating-badge" data-rating-imdb>IMDb: ...</span>' +
      '<span class="rating-badge" data-rating-rt>RT: ...</span>' +
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
  for (let i = 0; i < movies.length; i++) {
    fillInRatings(movies[i]);
  }

  // Hook up "Add to Watchlist" buttons
  const watchlistButtons = document.querySelectorAll(".watchlist-btn");
  for (let i = 0; i < watchlistButtons.length; i++) {
    watchlistButtons[i].addEventListener("click", () => {
      const movieId = Number(watchlistButtons[i].dataset.movieId);
      const movie = findMovieById(movies, movieId);
      handleAddToWatchlist(movie, watchlistButtons[i]);
    });
  }

  // Hook up "Details" buttons
  const detailsButtons = document.querySelectorAll(".details-btn");
  for (let i = 0; i < detailsButtons.length; i++) {
    detailsButtons[i].addEventListener("click", () => {
      const movieId = Number(detailsButtons[i].dataset.movieId);
      openDetailsPanel(movieId);
    });
  }
}


function findMovieById(movies, movieId) {
  for (let i = 0; i < movies.length; i++) {
    if (movies[i].id === movieId) {
      return movies[i];
    }
  }
  return null;
}

// Fetches ratings 
  const ratings = await getRatings(movie.title);

  const card = document.querySelector('[data-movie-id="' + movie.id + '"]');
  if (!card) {
    return;
  }

  const imdbBadge = card.querySelector("[data-rating-imdb]");
  const rtBadge = card.querySelector("[data-rating-rt]");

  if (imdbBadge) {
    imdbBadge.textContent = "IMDb: " + ratings.imdbRating;
  }
  if (rtBadge) {
    rtBadge.textContent = "RT: " + ratings.rottenTomatoes;
  }
}

// Builds and shows the snack suggestion card
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
    '<h4 class="snack-name">' +
    snack.name +
    "</h4>" +
    '<p class="snack-description">' +
    snack.description +
    "</p>" +
    "</div>";
}

// "Too picky? Pick for us" button
randomPickBtn.addEventListener("click", () => {
  if (lastMovies.length === 0) {
    return;
  }

  const randomIndex = Math.floor(Math.random() * lastMovies.length);
  const chosenMovie = lastMovies[randomIndex];

  const card = document.querySelector('[data-movie-id="' + chosenMovie.id + '"]');

  if (card) {
    card.classList.add("spinning");
    card.addEventListener(
      "animationend",
      () => card.classList.remove("spinning"),
      { once: true }
    );
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});



// DETAILS PANEL

async function openDetailsPanel(movieId) {
  detailsPanel.hidden = false;

  detailsTitle.textContent = "Loading...";
  detailsMeta.textContent = "";
  detailsOverview.textContent = "";

  const details = await getMovieDetails(movieId);

  if (!details) {
    detailsTitle.textContent = "Could not load details";
    detailsOverview.textContent =
      "Something went wrong fetching this movie's details. Please try again.";
    return;
  }

  detailsTitle.textContent = details.title;
  detailsMeta.textContent =
    details.year + " \u00B7 " + details.runtime + " min \u00B7 " + details.genres;
  detailsOverview.textContent = details.overview;
}

detailsCloseBtn.addEventListener("click", () => {
  detailsPanel.hidden = true;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !detailsPanel.hidden) {
    detailsPanel.hidden = true;
  }
});

// WATCHLIST
function handleAddToWatchlist(movie, button) {
  if (!movie) {
    return;
  }

  addToWatchlist({
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    year: movie.year,
  });

  button.textContent = "Added!";
  button.disabled = true;

  const card = button.closest(".movie-card");
  if (card) {
    card.classList.add("confirm-action");
    card.addEventListener(
      "animationend",
      () => card.classList.remove("confirm-action"),
      { once: true }
    );
  }
}

function renderWatchlist() {
  const watchlist = getWatchlist();

  if (watchlist.length === 0) {
    watchlistEmpty.hidden = false;
    watchlistItems.innerHTML = "";
    return;
  }

  watchlistEmpty.hidden = true;

  let html = "";
  for (let i = 0; i < watchlist.length; i++) {
    const movie = watchlist[i];

    html +=
      '<article class="movie-card" data-movie-id="' +
      movie.id +
      '">' +
      '<img class="movie-poster" src="' +
      movie.posterUrl +
      '" alt="Poster for ' +
      movie.title +
      '" width="300" height="450" />' +
      '<div class="movie-card-body">' +
      '<h3 class="movie-title">' +
      movie.title +
      "</h3>" +
      '<p class="movie-meta">' +
      movie.year +
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

  const removeButtons = document.querySelectorAll(".remove-btn");
  for (let i = 0; i < removeButtons.length; i++) {
    removeButtons[i].addEventListener("click", () => {
      const movieId = Number(removeButtons[i].dataset.movieId);
      removeFromWatchlist(movieId);
      renderWatchlist();
    });
  }
}




renderQuestion();