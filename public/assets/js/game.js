document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameBoard = document.getElementById('game-board');
    const startButton = document.getElementById('start-game');
    const resetButton = document.getElementById('reset-game');
    const scoreElement = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    
    // Game state
    let score = 0;
    let timeLeft = 60;
    let timer;
    let flippedCards = [];
    let matchedPairs = 0;
    let isPlaying = false;
    
    // API endpoints for the memory game
    const apiEndpoints = [
        { name: 'GET /users', description: 'List all users' },
        { name: 'POST /users', description: 'Create a new user' },
        { name: 'GET /products', description: 'List all products' },
        { name: 'POST /products', description: 'Create a new product' },
        { name: 'GET /orders', description: 'List all orders' },
        { name: 'POST /orders', description: 'Create a new order' },
        { name: 'GET /auth/login', description: 'User login' },
        { name: 'POST /auth/register', description: 'User registration' }
    ];
    
    // Create pairs by duplicating the endpoints
    function createCardPairs() {
        // Select 8 random endpoints if we have more than 8
        const selectedEndpoints = apiEndpoints.slice(0, 8);
        
        // Create pairs
        let pairs = [];
        selectedEndpoints.forEach(endpoint => {
            // Create two cards for each endpoint
            pairs.push({
                id: `${endpoint.name}-1`,
                name: endpoint.name,
                description: endpoint.description,
                matched: false
            });
            
            pairs.push({
                id: `${endpoint.name}-2`,
                name: endpoint.name,
                description: endpoint.description,
                matched: false
            });
        });
        
        // Shuffle the pairs
        return shuffleArray(pairs);
    }
    
    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // Create the game board
    function createGameBoard() {
        gameBoard.innerHTML = '';
        const cardPairs = createCardPairs();
        
        cardPairs.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card-item');
            cardElement.dataset.id = card.id;
            cardElement.dataset.name = card.name;
            
            const cardFront = document.createElement('div');
            cardFront.classList.add('card-front');
            cardFront.innerHTML = '<i class="fas fa-question"></i>';
            
            const cardBack = document.createElement('div');
            cardBack.classList.add('card-back');
            cardBack.textContent = card.name;
            
            cardElement.appendChild(cardFront);
            cardElement.appendChild(cardBack);
            
            cardElement.addEventListener('click', flipCard);
            
            gameBoard.appendChild(cardElement);
        });
    }
    
    // Flip a card
    function flipCard() {
        if (isPlaying && flippedCards.length < 2 && !this.classList.contains('flipped') && !this.classList.contains('matched')) {
            this.classList.add('flipped');
            flippedCards.push(this);
            
            if (flippedCards.length === 2) {
                checkForMatch();
            }
        }
    }
    
    // Check if the flipped cards match
    function checkForMatch() {
        const card1 = flippedCards[0];
        const card2 = flippedCards[1];
        
        if (card1.dataset.name === card2.dataset.name) {
            // Match found
            card1.classList.add('matched');
            card2.classList.add('matched');
            flippedCards = [];
            score += 10;
            scoreElement.textContent = score;
            matchedPairs++;
            
            // Check if all pairs are matched
            if (matchedPairs === 8) {
                endGame(true);
            }
        } else {
            // No match
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
            }, 1000);
        }
    }
    
    // Start the game
    function startGame() {
        isPlaying = true;
        score = 0;
        timeLeft = 60;
        matchedPairs = 0;
        flippedCards = [];
        
        scoreElement.textContent = score;
        timerElement.textContent = timeLeft;
        
        startButton.disabled = true;
        resetButton.disabled = false;
        
        createGameBoard();
        
        // Start the timer
        timer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                endGame(false);
            }
        }, 1000);
    }
    
    // End the game
    function endGame(isWin) {
        clearInterval(timer);
        isPlaying = false;
        
        if (isWin) {
            alert(`Congratulations! You've matched all pairs with a score of ${score}!`);
        } else {
            alert(`Time's up! Your score is ${score}.`);
        }
        
        startButton.disabled = false;
        resetButton.disabled = true;
    }
    
    // Reset the game
    function resetGame() {
        clearInterval(timer);
        startGame();
    }
    
    // Event listeners
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
});
