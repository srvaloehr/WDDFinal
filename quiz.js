export var QUIZ_QUESTIONS = [
  {
    id: "energy",
    text: "How much energy do you have tonight?",
    options: [
      { label: "Wiped out", value: "low" },
      { label: "Somewhere in the middle", value: "medium" },
      { label: "Ready to go", value: "high" },
    ],
  },
  {
    id: "mood",
    text: "What kind of movie do you want?",
    options: [
      { label: "Something to laugh at", value: "comedy" },
      { label: "Something to think about", value: "drama" },
      { label: "Something to feel", value: "emotional" },
      { label: "Just turn my brain off", value: "action" },
    ],
  },
  {
    id: "length",
    text: "How long is reasonable tonight?",
    options: [
      { label: "Under 90 minutes", value: "short" },
      { label: "90 to 120 minutes", value: "medium" },
      { label: "Doesn't matter", value: "any" },
    ],
  },
  {
    id: "subtitles",
    text: "Are you okay with subtitles?",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
    ],
  },
  {
    id: "snack",
    text: "What sounds good to eat?",
    options: [
      { label: "Something salty", value: "salty" },
      { label: "Something sweet", value: "sweet" },
      { label: "A mix of both", value: "mixed" },
      { label: "Whatever", value: "any" },
    ],
  },
];

//combines answer
export function combineAnswers(player1Answers, player2Answers) {
  var settings = {};

  // Genre
  if (player1Answers.mood === player2Answers.mood) {
    settings.genre = player1Answers.mood;
  } else {
    settings.genre = player1Answers.mood;
  }

  // Energy
  if (player1Answers.energy === player2Answers.energy) {
    settings.energy = player1Answers.energy;
  } else {
    settings.energy = "medium";
  }

  // Length
  var lengthOrder = { short: 1, medium: 2, any: 3 };
  var p1Length = player1Answers.length || "any";
  var p2Length = player2Answers.length || "any";
  if (lengthOrder[p1Length] <= lengthOrder[p2Length]) {
    settings.length = p1Length;
  } else {
    settings.length = p2Length;
  }

  // Subtitles
  settings.subtitlesOk =
    player1Answers.subtitles === "yes" && player2Answers.subtitles === "yes";

  // Snack
  if (player1Answers.snack === player2Answers.snack) {
    settings.snack = player1Answers.snack;
  } else {
    settings.snack = "mixed";
  }

  return settings;
}