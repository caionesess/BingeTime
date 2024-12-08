document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    loadPopularShows();
    loadRecentShows();
    loadFavoritedShows();
    loadAuthorInfo();
});

async function loadAuthorInfo() {
    try {
        const response = await fetch('../db/db.json');
        const data = await response.json();
        const autor = data.autor;

        const autorContainer = document.getElementById('autor-info');
        
        const autorHTML = `
            <div class="col-md-6">
            <p><strong>Autor:</strong> ${autor.nome}</p>
                <p>${autor.bio}</p>
                <p><strong>Curso:</strong> ${autor.curso}</p>
                <p><strong>Contato:</strong> ${autor.email}</p>
            </div>
            <div class="col-md-6 text-center">
                <h5>Minhas Redes Sociais</h5>
                <div class="social-links">
                    <a href="${autor.link_x}" target="_blank" class="social-icon">
                        <i class="fa-brands fa-x-twitter"></i>
                    </a>
                    <a href="${autor.link_ig}" target="_blank" class="social-icon">
                        <i class="fa-brands fa-instagram"></i>
                    </a>
                    <a href="${autor.link_lk}" target="_blank" class="social-icon">
                        <i class="fa-brands fa-linkedin"></i>
                    </a>
                </div>
            </div>
        `;
        
        autorContainer.innerHTML = autorHTML;
    } catch (error) {
        console.error('Erro ao carregar informações do autor:', error);
    }
}

const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhODljY2JiMzg1YjdlN2NlZDNjZDg4Zjc2YmJiNTRiNiIsIm5iZiI6MTczMzYxNTY3NS42MjMwMDAxLCJzdWIiOiI2NzU0ZTAzYjA5ODJiNDYyNjc4OWYxYWIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Fg8XN1vCVEG7HvTYfuzCjxjEJUXUH0mGXPupKX9pRQY'
    }
  };
  
  fetch('https://api.themoviedb.org/3/search/tv?include_adult=true&language=en-US&page=1', options)
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err));
    
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

async function loadPopularShows() {
    try {
        const response = await fetch(`${BASE_URL}/trending/tv/week?language=pt-BR`, options);
        const data = await response.json();
        const shows = data.results.slice(0, 5);

        const carouselInner = document.getElementById('carousel-popular');
        const indicators = document.getElementById('carousel-indicators');

        carouselInner.innerHTML = '';
        indicators.innerHTML = '';

        shows.forEach((show, index) => {
            const indicator = `
                <button type="button" 
                    data-bs-target="#carouselExampleCaptions" 
                    data-bs-slide-to="${index}" 
                    ${index === 0 ? 'class="active" aria-current="true"' : ''} 
                    aria-label="Slide ${index + 1}">
                </button>
            `;
            indicators.innerHTML += indicator;

            const slide = `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <img src="${IMG_URL}${show.backdrop_path}" class="d-block w-100" alt="${show.name}">
                    <div class="carousel-caption d-none d-md-block">
                        <h5>${show.name}</h5>
                        <p>${show.overview}</p>
                        <a href="detalhes.html?id=${show.id}" class="btn btn-primary">Ver Detalhes</a>
                    </div>
                </div>
            `;
            carouselInner.innerHTML += slide;
        });

        new bootstrap.Carousel(document.querySelector('#carouselExampleCaptions'), {
            interval: 5000,
            wrap: true
        });

    } catch (error) {
        console.error('Erro ao carregar séries populares:', error);
    }
}

async function loadRecentShows() {
    try {
        const response = await fetch(`${BASE_URL}/tv/airing_today?language=pt-BR&page=1`, options);
        const data = await response.json();
        const shows = data.results.slice(0, 3);

        const container = document.getElementById('recent-shows');

        shows.forEach(show => {
            const card = `
                <div class="card">
                    <img src="${IMG_URL}${show.poster_path}" class="card-img-top" alt="${show.name}">
                    <div class="card-body">
                        <h5 class="card-title">${show.name}</h5>
                        <p class="card-text">${show.overview.substring(0, 150)}...</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-primary">Nota: ${show.vote_average.toFixed(1)}</span>
                            <a href="detalhes.html?id=${show.id}" class="btn btn-primary">Ver Detalhes</a>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (error) {
        console.error('Erro ao carregar séries recentes:', error);
    }
}

async function loadFavoritedShows() {
    try {
        const container = document.getElementById('trending-shows');
        
        const response = await fetch('../db/db.json');
        const data = await response.json();
        const favoritas = data.favoritas;

        if (!favoritas || favoritas.length === 0) {
            container.innerHTML = `
                <div class="text-center w-100">
                    <p><strong>Você ainda não tem séries favoritas</strong></p>
                    <p>Que tal explorar algumas séries?</p>
                    <a href="explorar.html" class="btn btn-primary btn-lg">
                        <i class="fa-solid fa-magnifying-glass me-2"></i>
                        Explorar Séries
                    </a>
                </div>
            `;
            return;
        }

        const seriesPromises = favoritas.map(favorita => 
            fetch(`${BASE_URL}/tv/${favorita.id}?language=pt-BR`, options)
                .then(res => res.json())
        );

        const seriesDetalhes = await Promise.all(seriesPromises);

        container.innerHTML = seriesDetalhes.map((serie, index) => `
            <div class="card">
                <img src="${IMG_URL}${serie.poster_path}" 
                     class="card-img-top" 
                     alt="${favoritas[index].nome}"
                     onerror="this.src='../assets/img/no-image.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${favoritas[index].nome}</h5>
                    <p class="card-text">${serie.overview ? serie.overview.substring(0, 150) + '...' : 'Sem descrição disponível.'}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-primary">Nota: ${serie.vote_average ? serie.vote_average.toFixed(1) : 'N/A'}</span>
                        <a href="detalhes.html?id=${favoritas[index].id}" class="btn btn-primary">Ver Detalhes</a>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar séries favoritas:', error);
        const container = document.getElementById('trending-shows');
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Erro ao carregar séries favoritas. Por favor, tente novamente mais tarde.
            </div>
        `;
    }
}

async function searchShows(query) {
    try {
        const response = await fetch(`${BASE_URL}/search/tv?query=${query}&language=pt-BR`, options);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Erro na pesquisa:', error);
        return [];
    }
}

