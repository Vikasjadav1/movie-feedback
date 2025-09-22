const apiKey = "e439110e"; // Your OMDB API Key
const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const modal = document.getElementById('movie-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close');
const toggleThemeBtn = document.getElementById('toggle-theme');

// NEW: Toggle Dark/Light Mode with Class
toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
});

// NEW: Fade-in animation on scroll using IntersectionObserver
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            entry.target.style.setProperty('--delay', `${index * 0.1}s`);
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2
});

// Fetch movies from OMDB
async function fetchMovies(query) {
    const res = await fetch(`https://www.omdbapi.com/?s=${query}&apikey=${apiKey}`);
    const data = await res.json();
    return data.Search || [];
}

// Fetch movie details
async function fetchMovieDetails(id) {
    const res = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${apiKey}`);
    const data = await res.json();
    return data;
}

// Display movies with optional average rating
async function displayMovies(query = "Avengers") {
    moviesGrid.innerHTML = "Loading...";
    const movies = await fetchMovies(query);
    moviesGrid.innerHTML = "";
    if (movies.length === 0) {
        moviesGrid.innerHTML = "<p style='grid-column:1/-1;text-align:center;color:#aaa;'>No movies found.</p>";
        return;
    }

    movies.forEach(movie => {
        const savedReviews = JSON.parse(localStorage.getItem(movie.imdbID)) || [];
        const averageRating = savedReviews.length ? (savedReviews.reduce((a, b) => a + parseInt(b.rating), 0) / savedReviews.length).toFixed(1) : 0;

        const card = document.createElement('div');
        card.classList.add('movie-card');
        card.innerHTML = `
            <img src="${movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/400x600?text=No+Image'}" alt="${movie.Title}">
            <div class="info">
                <h3>${movie.Title}</h3>
                <p>${movie.Year}</p>
                <p>⭐ ${averageRating}</p>
            </div>
        `;
        card.addEventListener('click', () => openModal(movie.imdbID));
        moviesGrid.appendChild(card);
        observer.observe(card); // Attach observer to the new card
    });
}

// Open Movie Modal
async function openModal(id) {
    const movie = await fetchMovieDetails(id);
    let savedReviews = JSON.parse(localStorage.getItem(id)) || [];

    modalBody.innerHTML = `
        <h2>${movie.Title} (${movie.Year})</h2>
        <p><strong>Genre:</strong> ${movie.Genre}</p>
        <p><strong>Plot:</strong> ${movie.Plot}</p>
        <p><strong>Cast:</strong> ${movie.Actors}</p>
        <h3>Rate & Review:</h3>
        <div class="stars" id="rating-stars">
            ${[1, 2, 3, 4, 5].map(i => `<span data-star="${i}">&#9733;</span>`).join('')}
        </div>
        <textarea id="review-text" placeholder="Write a comment..."></textarea>
        <button id="submit-review">Submit</button>
        <h3>Reviews:</h3>
        <div id="reviews-list">
            ${savedReviews.map(r => `<p>⭐ ${r.rating} - ${r.comment}</p>`).join('')}
        </div>
    `;

    // Rating stars interaction
    const stars = document.querySelectorAll('#rating-stars span');
    let selectedRating = 0;
    stars.forEach(star => {
        star.addEventListener('mouseover', () => fillStars(star.dataset.star));
        star.addEventListener('mouseout', () => fillStars(selectedRating));
        star.addEventListener('click', () => selectedRating = star.dataset.star);
    });

    function fillStars(rating) {
        stars.forEach(star => {
            star.classList.toggle('star-filled', star.dataset.star <= rating);
        });
    }

    // Submit review
    document.getElementById('submit-review').addEventListener('click', () => {
        const comment = document.getElementById('review-text').value.trim();
        if (selectedRating && comment) {
            savedReviews.push({ rating: selectedRating, comment });
            localStorage.setItem(id, JSON.stringify(savedReviews));

            const reviewsList = document.getElementById('reviews-list');
            const newReview = document.createElement('p');
            newReview.innerHTML = `⭐ ${selectedRating} - ${comment}`;
            reviewsList.appendChild(newReview);

            selectedRating = 0;
            fillStars(0);
            document.getElementById('review-text').value = '';

            displayMovies(searchInput.value || "Avengers");
        } else {
            alert("Please select a rating and write a comment.");
        }
    });

    modal.style.display = 'flex';
}

// Close modal
closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

// Search functionality
searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') displayMovies(searchInput.value);
});

// Initial display
displayMovies();