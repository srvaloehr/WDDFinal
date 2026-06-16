// api.js - All third-party API calls
// Uses: TMDB (2 endpoints: discover + movie details), OMDb, TheMealDB

import {
  TMDB_API_KEY,
  TMDB_BASE_URL,
  TMDB_IMAGE_BASE_URL,
  OMDB_API_KEY,
  OMDB_BASE_URL,
  MEALDB_BASE_URL,
} from "./config.js";

// Maps quiz mood answers to TMDB genre IDs
var GENRE_MAP = {
  comedy: 35,
  drama: 18,
  emotional: 10749,
  action: 28,
};

// Maps quiz snack answers to MealDB categories
var SNACK_CATEGORY_MAP = {
  salty: "Side",
  sweet: "Dessert",
  mixed: "Starter",
  any: "Snack",
};

// --- ENDPOINT 1: TMDB /discover/movie ---
// Returns up to 4 movies for a given genre

export async function getMovies(genre) {
  try {
    var genreId = GENRE_MAP[genre];
    if (!genreId) {
      genreId = GENRE_MAP.comedy;
    }

    var url =
      TMDB_BASE_URL +
      "/discover/movie" +
      "?api_key=" + TMDB_API_KEY +
      "&with_genres=" + genreId +
      "&sort_by=popularity.desc" +
      "&language=en-US" +
      "&page=1";

    var response = await fetch(url);

    if (!response.ok) {
      throw new Error("TMDB discover request failed: " + response.status);
    }

    var data = await response.json();

    var movies = [];
    var limit = Math.min(data.results.length, 4);
    for (var i = 0; i < limit; i++) {
      var movie = data.results[i];

      var posterUrl = "https://placehold.co/300x450/2d3748/f0f0f0?text=No+Poster";
      if (movie.poster_path) {
        posterUrl = TMDB_IMAGE_BASE_URL + movie.poster_path;
      }

      var year = "N/A";
      if (movie.release_date) {
        year = movie.release_date.slice(0, 4);
      }

      movies.push({
        id: movie.id,
        title: movie.title,
        year: year,
        posterUrl: posterUrl,
        overview: movie.overview,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        popularity: movie.popularity,
        originalLanguage: movie.original_language,
        genreIds: movie.genre_ids,
        adult: movie.adult,
        backdropPath: movie.backdrop_path,
      });
    }

    return movies;
  } catch (error) {
    console.error("getMovies error:", error);
    return [];
  }
}

// --- ENDPOINT 2: TMDB /movie/{id} ---
// Returns full details for one movie

export async function getMovieDetails(movieId) {
  try {
    var url =
      TMDB_BASE_URL +
      "/movie/" + movieId +
      "?api_key=" + TMDB_API_KEY +
      "&language=en-US";

    var response = await fetch(url);

    if (!response.ok) {
      throw new Error("TMDB details request failed: " + response.status);
    }

    var data = await response.json();

    var genreNames = "";
    for (var i = 0; i < data.genres.length; i++) {
      if (i > 0) {
        genreNames += ", ";
      }
      genreNames += data.genres[i].name;
    }

    var year = "N/A";
    if (data.release_date) {
      year = data.release_date.slice(0, 4);
    }

    return {
      title: data.title,
      year: year,
      runtime: data.runtime,
      genres: genreNames,
      overview: data.overview,
      tagline: data.tagline,
      budget: data.budget,
      revenue: data.revenue,
      status: data.status,
      homepage: data.homepage,
    };
  } catch (error) {
    console.error("getMovieDetails error:", error);
    return null;
  }
}

// --- ENDPOINT 3: OMDb ---
// Returns IMDb and Rotten Tomatoes ratings for a movie title

export async function getRatings(movieTitle) {
  try {
    var url =
      OMDB_BASE_URL +
      "?t=" + encodeURIComponent(movieTitle) +
      "&apikey=" + OMDB_API_KEY;

    var response = await fetch(url);

    if (!response.ok) {
      throw new Error("OMDb request failed: " + response.status);
    }

    var data = await response.json();

    if (data.Response === "False") {
      return { imdbRating: "N/A", rottenTomatoes: "N/A" };
    }

    var rottenTomatoes = "N/A";
    if (data.Ratings) {
      for (var i = 0; i < data.Ratings.length; i++) {
        if (data.Ratings[i].Source === "Rotten Tomatoes") {
          rottenTomatoes = data.Ratings[i].Value;
        }
      }
    }

    var imdbRating = data.imdbRating || "N/A";

    return { imdbRating: imdbRating, rottenTomatoes: rottenTomatoes };
  } catch (error) {
    console.error("getRatings error:", error);
    return { imdbRating: "N/A", rottenTomatoes: "N/A" };
  }
}

// --- ENDPOINT 4: TheMealDB ---
// Returns a random snack suggestion for the given preference

export async function getSnack(snackPreference) {
  try {
    var category = SNACK_CATEGORY_MAP[snackPreference];
    if (!category) {
      category = "Snack";
    }

    var url = MEALDB_BASE_URL + "/filter.php?c=" + category;

    var response = await fetch(url);

    if (!response.ok) {
      throw new Error("TheMealDB request failed: " + response.status);
    }

    var data = await response.json();

    if (!data.meals || data.meals.length === 0) {
      return null;
    }

    // Pick a random meal from the list
    var randomIndex = Math.floor(Math.random() * data.meals.length);
    var meal = data.meals[randomIndex];

    return {
      name: meal.strMeal,
      imageUrl: meal.strMealThumb,
      mealId: meal.idMeal,
      description: "A " + category.toLowerCase() + " option to enjoy during the movie.",
    };
  } catch (error) {
    console.error("getSnack error:", error);
    return null;
  }
}