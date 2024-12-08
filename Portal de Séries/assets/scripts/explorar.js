const API_KEY = 'a89ccbb385b7e7ced3cd88f76bbb54b6';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
let currentPage = 1;
let currentGenre = 0;
let isSearching = false;
let searchQuery = '';

async function fetchTMDB(endpoint) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${BASE_URL}${endpoint}${separator}api_key=${API_KEY}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

async function loadGenres() {
    try {
        const data = await fetchTMDB('/genre/tv/list?language=pt-BR');
        const genresList = document.getElementById('genresList');

        data.genres.forEach(genre => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'list-group-item list-group-item-action';
            link.textContent = genre.name;
            link.dataset.genreId = genre.id;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.list-group-item').forEach(item =>
                    item.classList.remove('active'));
                link.classList.add('active');
                currentGenre = genre.id;
                currentPage = 1;
                loadSeries();
            });
            genresList.appendChild(link);
        });
    } catch (error) {
        console.error('Erro ao carregar gêneros:', error);
        document.getElementById('genresList').innerHTML += `
                    <div class="alert alert-danger">
                        Erro ao carregar gêneros
                    </div>`;
    }
}

async function loadSeries() {
    try {
        let endpoint;
        if (isSearching) {
            endpoint = `/search/tv?query=${encodeURIComponent(searchQuery)}&language=pt-BR&page=${currentPage}`;
        } else {
            endpoint = `/discover/tv?language=pt-BR&page=${currentPage}${currentGenre ? `&with_genres=${currentGenre}` : ''}`;
        }

        const data = await fetchTMDB(endpoint);
        const container = document.getElementById('seriesContainer');

        if (currentPage === 1) {
            container.innerHTML = '';
        }

        if (data.results.length === 0) {
            container.innerHTML = '<p class="col-12 text-center">Nenhuma série encontrada.</p>';
            document.getElementById('loadMoreBtn').style.display = 'none';
            return;
        }

        data.results.forEach(serie => {
            const card = `
    <div class="col">
    <div class="card h-100">
        <img src="${serie.poster_path ? IMG_URL + serie.poster_path : '../assets/img/no-image.jpg'}" 
             class="card-img-top" 
             alt="${serie.name}"
             onerror="this.src='../assets/img/no-image.jpg'">
        <div class="card-body">
            <h5 class="card-title">${serie.name}</h5>
            <p class="card-text">${serie.overview ? serie.overview.substring(0, 100) + '...' : 'Sem descrição disponível.'}</p>
            <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-primary">Nota: ${serie.vote_average.toFixed(1)}</span>
                <a href="detalhes.html?id=${serie.id}" class="btn btn-primary">Ver Detalhes</a>
            </div>
        </div>
    </div>
</div>
`;
            container.innerHTML += card;
        });

        document.getElementById('loadMoreBtn').style.display =
            data.page < data.total_pages ? 'block' : 'none';
    } catch (error) {
        console.error('Erro ao carregar séries:', error);
        if (currentPage === 1) {
            document.getElementById('seriesContainer').innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-danger">
                                Erro ao carregar séries. Tente novamente mais tarde.
                            </div>
                        </div>`;
        }
    }
}

document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        searchQuery = e.target.value;
        isSearching = searchQuery.length > 0;
        currentPage = 1;
        loadSeries();
    }
});

document.getElementById('searchButton').addEventListener('click', () => {
    searchQuery = document.getElementById('searchInput').value;
    isSearching = searchQuery.length > 0;
    currentPage = 1;
    loadSeries();
});

document.getElementById('loadMoreBtn').addEventListener('click', () => {
    currentPage++;
    loadSeries();
});

document.addEventListener('DOMContentLoaded', () => {
    loadGenres();
    loadSeries();
});