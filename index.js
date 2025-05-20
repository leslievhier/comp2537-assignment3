$(document).ready(function() {

  let firstCard = undefined;
  let secondCard = undefined;
  let isProcessing = false;
  let gameStarted = false;
  let timerInterval = null;
  let timeRemaining = 0;
  let clickCount = 0;
  let pairsMatched = 0;
  let totalPairs = 3;
  let pairsLeft = totalPairs;
  let pokemonData = [];
  let consecutiveMatches = 0;
  let powerUpActive = false;
 
  const difficultySettings = {
    easy: { pairs: 3, time: 30, bonusTime: 5 },
    medium: { pairs: 6, time: 60, bonusTime: 10 },
    hard: { pairs: 10, time: 90, bonusTime: 15 }
  };
 
  initializeGame();
 
  async function initializeGame() {
    updateStats();
    $("#game_grid").empty();
    await fetchRandomPokemon(totalPairs);
  }
 
  $("#theme").on("change", function() {
    const theme = $(this).val();
    if (theme === "dark") {
      $("body").addClass("dark-theme");
    } else {
      $("body").removeClass("dark-theme");
    }
  });
 
  $("#start-btn").on("click", startGame);
  $("#reset-btn").on("click", resetGame);
 
  $("#difficulty").on("change", function() {
    const difficulty = $(this).val();
    totalPairs = difficultySettings[difficulty].pairs;
    pairsLeft = totalPairs;
    $("#game_grid").empty();
    fetchRandomPokemon(totalPairs);
    updateStats();
  });
 
  function updateStats() {
    $("#timer").text(`Time: ${timeRemaining}s`);
    $("#clicks").text(`Clicks: ${clickCount}`);
    $("#pairs-tracker").text(`Pairs: ${pairsMatched}/${totalPairs}`);
  }
 
  async function fetchRandomPokemon(count) {
    try {
      $("#game-message").text("Loading Pokemon...").removeClass("hidden success failure").show();
      
      let pokemonSet = new Set();
      pokemonData = [];
      
      while (pokemonSet.size < count) {
        const randomId = Math.floor(Math.random() * 898) + 1;
        
        if (pokemonSet.has(randomId)) continue;
        
        pokemonSet.add(randomId);
        
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();
        
        pokemonData.push({
          id: data.id,
          name: data.name,
          imageUrl: data.sprites.other['official-artwork'].front_default || data.sprites.front_default
        });
      }
      
      $("#game-message").addClass("hidden").hide();
      return pokemonData;
    } catch (error) {
      console.error("Error fetching Pokemon:", error);
      $("#game-message").text("Error loading Pokemon. Please try again.").removeClass("hidden success failure").addClass("failure").show();
      return [];
    }
  }
 
  async function startGame() {
    $("#game-message").addClass("hidden").removeClass("success failure power-up").hide();
    
    resetGameState();
    
    const difficulty = $("#difficulty").val();
    timeRemaining = difficultySettings[difficulty].time;
    
    gameStarted = true;
    consecutiveMatches = 0;
    
    updateStats();
    updateCardGrid();
    
    timerInterval = setInterval(updateTimer, 1000);
    
    $(".card").on("click", handleCardClick);
  }
 
  function activatePowerUp() {
    const difficulty = $("#difficulty").val();
    const bonusTime = difficultySettings[difficulty].bonusTime;
    
    powerUpActive = true;
    
    $("#game-message").text(`POWER-UP ACTIVATED: +${bonusTime} SECONDS!`)
      .removeClass("hidden success failure")
      .addClass("power-up")
      .show();
    
    $("#timer").addClass("power-up-active");
    
    timeRemaining += bonusTime;
    $("#timer").text(`Time: ${timeRemaining}s`);
    
    setTimeout(() => {
      if (!$("#game-message").hasClass("success") || $("#game-message").hasClass("power-up")) {
        $("#game-message").addClass("hidden").removeClass("power-up").hide();
      }
      $("#timer").removeClass("power-up-active");
      powerUpActive = false;
    }, 2000);
  }
 
  function resetGameState() {
    clearInterval(timerInterval);
    
    gameStarted = false;
    firstCard = undefined;
    secondCard = undefined;
    isProcessing = false;
    clickCount = 0;
    pairsMatched = 0;
    
    const difficulty = $("#difficulty").val();
    timeRemaining = difficultySettings[difficulty].time;
    
    pairsLeft = totalPairs;
    consecutiveMatches = 0;
    powerUpActive = false;
    
    updateStats();
    $("#game-message").addClass("hidden").removeClass("success failure power-up").hide();
    $("#timer").removeClass("power-up-active time-low");
    
    if ($("#game_grid .card").length > 0) {
      $(".card").removeClass("flip flipping matched");
      $(".card").off("click");
    }
  }
 
  async function resetGame() {
    resetGameState();
    await fetchRandomPokemon(totalPairs);
    $("#game_grid").empty();
  }
 
  function updateTimer() {
    timeRemaining--;
    $("#timer").text(`Time: ${timeRemaining}s`);
    
    if (timeRemaining <= 10) {
      $("#timer").addClass("time-low");
    } else {
      $("#timer").removeClass("time-low");
    }
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      gameStarted = false;
      $(".card").off("click");
      
      if (pairsMatched < totalPairs) {
        $("#game-message").text("Time's up! Game over!").removeClass("hidden success power-up").addClass("failure").show();
      }
      
      $("#timer").text(`Time: 0s`);
    }
  }

  function updateCardGrid() {
    $("#game_grid").empty();
    
    const totalCards = totalPairs * 2;
    
    const cardPairs = [];
    for (let i = 0; i < totalPairs; i++) {
      if (pokemonData && pokemonData.length >= totalPairs) {
        const pokemon = pokemonData[i];
        cardPairs.push({
          id: `${pokemon.id}-1`,
          imageUrl: pokemon.imageUrl,
          name: pokemon.name
        });
        cardPairs.push({
          id: `${pokemon.id}-2`,
          imageUrl: pokemon.imageUrl,
          name: pokemon.name
        });
      } else {
        const imageNum = ((i % 6) + 1);
        const formattedNum = String(imageNum).padStart(3, '0');
        cardPairs.push({
          id: `${formattedNum}-1`,
          imageUrl: `img/${formattedNum}.png`,
          name: `Pokemon ${formattedNum}`
        });
        cardPairs.push({
          id: `${formattedNum}-2`,
          imageUrl: `img/${formattedNum}.png`,
          name: `Pokemon ${formattedNum}`
        });
      }
    }
    
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }
    
    for (let i = 0; i < cardPairs.length; i++) {
      const card = $('<div class="card"></div>');
      const pokemon = cardPairs[i];
      
      const frontFace = $(`<img class="front_face" src="${pokemon.imageUrl}" alt="${pokemon.name}" data-pokemon-id="${pokemon.id}">`);
      const backFace = $('<img class="back_face" src="img/back.webp" alt="Card Back">');
      
      card.append(frontFace);
      card.append(backFace);
      $("#game_grid").append(card);
    }
    
    if (totalCards <= 8) {
      $("#game_grid").css("grid-template-columns", "repeat(3, 1fr)");
    } else if (totalCards <= 12) {
      $("#game_grid").css("grid-template-columns", "repeat(4, 1fr)");
    } else {
      $("#game_grid").css("grid-template-columns", "repeat(5, 1fr)");
    }
  }
 
  function handleCardClick() {
    if (!gameStarted || isProcessing || $(this).hasClass("flip") || $(this).hasClass("flipping") || $(this).hasClass("matched")) {
      return;
    }
    
    clickCount++;
    $("#clicks").text(`Clicks: ${clickCount}`);
    
    $(this).addClass("flip");
    
    if (!firstCard) {
      firstCard = this;
    } else if (this !== firstCard) {
      secondCard = this;
      isProcessing = true;
      
      const firstCardImg = $(firstCard).find(".front_face").attr("src");
      const secondCardImg = $(secondCard).find(".front_face").attr("src");
      
      setTimeout(() => {
        if (firstCardImg === secondCardImg) {
          handleMatch();
        } else {
          handleMismatch();
        }
      }, 500);
    }
  }
 
  function handleMatch() {
    $(firstCard).addClass("matched");
    $(secondCard).addClass("matched");
    
    $(firstCard).off("click");
    $(secondCard).off("click");
    
    pairsMatched++;
    pairsLeft = totalPairs - pairsMatched;
    
    consecutiveMatches++;
    
    if (consecutiveMatches === 2 && !powerUpActive) {
      activatePowerUp();
    }
    
    updateStats();
    
    if (pairsMatched === totalPairs) {
      clearInterval(timerInterval);
      $("#game-message").text("Congratulations! You matched all pairs!").removeClass("hidden failure power-up").addClass("success").show();
    }
    
    resetSelections();
  }
 
  function handleMismatch() {
    $(firstCard).addClass("flipping");
    $(secondCard).addClass("flipping");
    
    consecutiveMatches = 0;
    updateStats();
    
    setTimeout(() => {
      $(firstCard).removeClass("flip flipping");
      $(secondCard).removeClass("flip flipping");
      resetSelections();
    }, 1000);
  }
 
  function resetSelections() {
    firstCard = undefined;
    secondCard = undefined;
    isProcessing = false;
  }
});
