import {
  TMDB_API_KEY,
  TMDB_BASE_URL,
  TMDB_IMAGE_BASE_URL,
  OMDB_API_KEY,
  OMDB_BASE_URL,
  MEALDB_BASE_URL,
} from "./config.js";




const GENRE_MAP = {
  comedy: 35,
  drama: 18,
  emotional: 10749, // Romance
  action: 28,
};



const SNACK_CATEGORY_MAP = {
  salty: "Side",
  sweet: "Dessert",
  mixed: "Starter",
  any: "Snack",
};


export async function getMovies(genre) {
  try {
    // Look up the TMDB genre id
    let genreId = GENRE_MAP[genre];
    if (!genreId) {
      genreId = GENRE_MAP.comedy;
    }

    const url =
      `${TMDB_BASE_URL}/discover/movie` +
      `?api_key=${TMDB_API_KEY}` +
      `&with_genres=${genreId}` +
      `&sort_by=popularity.desc` +
      `&language=en-US` +
      `&page=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("TMDB request failed: " + response.status);
    }

    const data = await response.json();

    // Build a simple array
    const movies = [];
    for (let i = 0; i < data.results.length && i < 3; i++) {
      const movie = data.results[i];

      let posterUrl = "https://placehold.co/300x450/2d3748/f0f0f0?text=No+Poster";
      if (movie.poster_path) {
        posterUrl = TMDB_IMAGE_BASE_URL + movie.poster_path;
      }

      let year = "N/A";
      if (movie.release_date) {
        year = movie.release_date.slice(0, 4);
      }

      movies.push({
        id: movie.id,
        title: movie.title,
        year: year,
        posterUrl: posterUrl,
      });
    }

    return movies;
  } catch (error) {
    console.error("getMovies error:", error);
    return [];
  }
}




export async function getMovieDetails(movieId) {}
  try {
    const url =
      `${TMDB_BASE_URL}/movie/${movieId}` +
      `?api_key=${TMDB_API_KEY}` +
      `&language=en-US`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("TMDB details request failed: " + response.status);
    }

    const data = await response.json();

    
    let genreNames = "";
    for (let i = 0; i < data.genres.length; i++) {
      if (i > 0) {
        genreNames += ", ";
      }
      genreNames += data.genres[i].name;
    }

    let year = "N/A";
    if (data.release_date) {
      year = data.release_date.slice(0, 4);
    }

    return {
      title: data.title,
      year: year,
      runtime: data.runtime,
      genres: genreNames,
      overview: data.overview,
    };
  } catch (error) {
    console.error("getMovieDetails error:", error);
    return null;
  }

export async function getRatings(movieTitle) {
  try {
    const url =
      `${OMDB_BASE_URL}?t=${encodeURIComponent(movieTitle)}` +
      `&apikey=${OMDB_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("OMDb request failed: " + response.status);
    }

    const data = await response.json();

    // If OMDb couldn't find the movie,: "False"
    if (data.Response === "False") {
      return { imdbRating: "N/A", rottenTomatoes: "N/A" };
    }

    // OMDb returns ratings as a list
    let rottenTomatoes = "N/A";
    if (data.Ratings) {
      for (let i = 0; i < data.Ratings.length; i++) {
        if (data.Ratings[i].Source === "Rotten Tomatoes") {
          rottenTomatoes = data.Ratings[i].Value;
        }
      }
    }

    let imdbRating = "N/A";
    if (data.imdbRating) {
      imdbRating = data.imdbRating;
    }

    return { imdbRating, rottenTomatoes };
  } catch (error) {
    console.error("getRatings error:", error);
    return { imdbRating: "N/A", rottenTomatoes: "N/A" };
  }
}

export async function getSnack(snackPreference) {
  try {
    let category = SNACK_CATEGORY_MAP[snackPreference];
    if (!category) {
      category = "Snack";
    }

    const url = `${MEALDB_BASE_URL}/filter.php?c=${category}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("TheMealDB request failed: " + response.status);
    }

    const data = await response.json();

    // data.meals can be null if there are no results
    if (!data.meals || data.meals.length === 0) {
      return null;
    }

    // Pick 
    const randomIndex = Math.floor(Math.random() * data.meals.length);
    const meal = data.meals[randomIndex];

    return {
      name: meal.strMeal,
      imageUrl: meal.strMealThumb,
      description: "A " + category.toLowerCase() + " option to go with tonight's movie.",
    };
  } catch (error) {
    console.error("getSnack error:", error);
    return null;
  }
}