const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhODljY2JiMzg1YjdlN2NlZDNjZDg4Zjc2YmJiNTRiNiIsInN1YiI6IjY3NTRlMDNiMDk4MmI0NjI2Nzg5ZjFhYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Fg8XN1vCVEG7HvTYfuzCjxjEJUXUH0mGXPupKX9pRQY'
    }
};

const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = 'a89ccbb385b7e7ced3cd88f76bbb54b6'

async function fetchWithErrorHandling(url) {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}api_key=${API_KEY}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

async function addToFavorites(serieId, serieName) {
    try {
        const response = await fetch('http://localhost:3000/favoritas');
        const favoritas = await response.json();

        if (favoritas.some(fav => fav.id === serieId)) {
            return false;
        }

        const updateResponse = await fetch('http://localhost:3000/favoritas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: serieId,
                nome: serieName
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Erro ao salvar favoritos');
        }

        return true;
    } catch (error) {
        console.error('Erro ao adicionar aos favoritos:', error);
        return false;
    }
}

async function removeFromFavorites(serieId) {
    try {
        const deleteResponse = await fetch(`http://localhost:3000/favoritas/${serieId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!deleteResponse.ok) {
            throw new Error('Erro ao remover dos favoritos');
        }

        return true;
    } catch (error) {
        console.error('Erro ao remover dos favoritos:', error);
        return false;
    }
}

async function carregarDetalhesSerie() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const serieId = urlParams.get('id');

        if (!serieId) {
            throw new Error('ID da série não fornecido');
        }

        const [detalhes, creditos, videos] = await Promise.all([
            fetchWithErrorHandling(`${BASE_URL}/tv/${serieId}?language=pt-BR`),
            fetchWithErrorHandling(`${BASE_URL}/tv/${serieId}/credits?language=pt-BR`),
            fetchWithErrorHandling(`${BASE_URL}/tv/${serieId}/videos?language=pt-BR`)
        ]);

        if (!detalhes) {
            throw new Error('Detalhes da série não encontrados');
        }

        const anoEstreia = detalhes.first_air_date ? `(${detalhes.first_air_date.substring(0, 4)})` : '';
        document.title = `${detalhes.name} ${anoEstreia}`;
        document.getElementById('serie-titulo').textContent = `${detalhes.name} ${anoEstreia}`;

        if (videos && videos.results && videos.results.length > 0) {
            const trailer = videos.results.find(video => video.type === 'Trailer') || videos.results[0];
            if (trailer) {
                document.getElementById('trailer-container').innerHTML = `
                    <iframe src="https://www.youtube.com/embed/${trailer.key}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
            }
        } else {
            const backdropPath = detalhes.backdrop_path || detalhes.poster_path;
            if (backdropPath) {
                document.getElementById('trailer-container').innerHTML = `
                    <div class="serie-backdrop">
                        <img src="${IMG_URL}${backdropPath}" 
                             alt="${detalhes.name}" 
                             class="img-fluid w-100">
                    </div>
                `;
            }
        }

        document.getElementById('serie-overview').textContent = detalhes.overview || 'Descrição não disponível.';
        if (detalhes.vote_average) {
            document.getElementById('serie-nota').textContent = `Nota: ${detalhes.vote_average.toFixed(1)}`;
        }

        if (creditos && creditos.cast && creditos.cast.length > 0) {
            const elencoHTML = creditos.cast.slice(0, 3).map(ator => `
                <div class="col">
                    <div class="card h-100">
                        <img src="${ator.profile_path ? IMG_URL + ator.profile_path : '../assets/img/no-image.jpg'}" 
                             class="card-img-top" 
                             alt="${ator.name}"
                             onerror="this.src='../assets/img/no-image.jpg'">
                        <div class="card-body">
                            <h5 class="card-title">${ator.name}</h5>
                            <p class="card-text">${ator.character}</p>
                        </div>
                    </div>
                </div>
            `).join('');
            document.getElementById('elenco-container').innerHTML = elencoHTML;
        } else {
            document.getElementById('elenco-container').innerHTML = '<p class="text-center">Nenhum dado de elenco disponível.</p>';
        }

        if (detalhes.seasons && detalhes.seasons.length > 0) {
            const temporadasHTML = detalhes.seasons.map(temporada => `
                <div class="col">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${temporada.name}</h5>
                            <p class="card-text">Número de episódios: ${temporada.episode_count}</p>
                        </div>
                    </div>
                </div>
            `).join('');
            document.getElementById('temporadas-container').innerHTML = temporadasHTML;
        } else {
            document.getElementById('temporadas-container').innerHTML = '<p class="text-center">Nenhuma informação sobre temporadas disponível.</p>';
        }

        const btnFavoritar = document.getElementById('btn-favoritar');
        if (btnFavoritar) {
            fetch('http://localhost:3000/favoritas')
                .then(response => response.json())
                .then(favoritas => {
                    const isFavorite = favoritas.some(fav => fav.id === serieId);
                    if (isFavorite) {
                        btnFavoritar.textContent = 'Remover dos Favoritos';
                        btnFavoritar.classList.remove('btn-primary');
                        btnFavoritar.classList.add('btn-danger');
                    }
                });

            btnFavoritar.addEventListener('click', async () => {
                const isFavorite = btnFavoritar.classList.contains('btn-danger');
                let success;
                
                if (isFavorite) {
                    success = await removeFromFavorites(serieId);
                    if (success) {
                        btnFavoritar.textContent = 'Adicionar aos Favoritos';
                        btnFavoritar.classList.remove('btn-danger');
                        btnFavoritar.classList.add('btn-primary');
                    }
                } else {
                    success = await addToFavorites(serieId, detalhes.name);
                    if (success) {
                        btnFavoritar.textContent = 'Remover dos Favoritos';
                        btnFavoritar.classList.remove('btn-primary');
                        btnFavoritar.classList.add('btn-danger');
                    }
                }
                
                if (!success) {
                    btnFavoritar.textContent = 'Erro ao processar';
                    setTimeout(() => {
                        btnFavoritar.textContent = isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
                    }, 2000);
                }
            });
        }

    } catch (error) {
        console.error('Erro ao carregar detalhes da série:', error);
        document.body.innerHTML = `
            <div class="container text-center my-5">
                <h2>Erro ao carregar detalhes da série</h2>
                <p>${error.message}</p>
                <a href="index.html" class="btn btn-primary">Voltar para a página inicial</a>
            </div>
        `;
    }
}

async function loadFavoritedShows() {
    try {
        const container = document.getElementById('trending-shows');
        
        const response = await fetch('http://localhost:3000/favoritas');
        const favoritas = await response.json();

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
                        <div>
                            <a href="detalhes.html?id=${favoritas[index].id}" class="btn btn-primary">Ver Detalhes</a>
                            <button onclick="removerFavorita('${favoritas[index].id}')" class="btn btn-danger">Remover</button>
                        </div>
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

async function removerFavorita(serieId) {
    const success = await removeFromFavorites(serieId);
    if (success) {
        loadFavoritedShows();
    }
}

document.addEventListener('DOMContentLoaded', carregarDetalhesSerie);