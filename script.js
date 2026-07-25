// ==========================================================================
// TRANSIÇÃO SUAVE ENTRE PÁGINAS
// ==========================================================================
document.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(function () {
        document.body.classList.add('page-loaded');
    });

    document.querySelectorAll('nav a[href$=".html"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            e.preventDefault();
            document.body.classList.remove('page-loaded');
            document.body.classList.add('page-leaving');
            setTimeout(function () {
                window.location.href = href;
            }, 280);
        });
    });
});

// ==========================================================================
// BANCO DE VÍDEOS (guardado no navegador de quem acessa o site)
// ==========================================================================
var VIDEOS_KEY = 'ecoreparo_videos';

function getVideos() {
    try {
        var raw = localStorage.getItem(VIDEOS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (err) {
        return [];
    }
}

function saveVideo(video) {
    var videos = getVideos();
    videos.unshift(video);
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
}

function extractYouTubeId(url) {
    var regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    var match = url.match(regex);
    return match ? match[1] : null;
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================================================
// PÁGINA "ADICIONAR"
// ==========================================================================
var addForm = document.getElementById('add-video-form');
if (addForm) {
    addForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var title = document.getElementById('video-title').value.trim();
        var url = document.getElementById('video-url').value.trim();
        var category = document.getElementById('video-category').value;
        var feedback = document.getElementById('form-feedback');
        var videoId = extractYouTubeId(url);

        if (!title || !videoId) {
            feedback.textContent = 'Verifique o título e cole um link válido do YouTube.';
            feedback.style.color = '#b3543f';
            return;
        }

        saveVideo({
            id: Date.now().toString(),
            title: title,
            url: url,
            videoId: videoId,
            category: category
        });

        feedback.textContent = 'Vídeo adicionado! Levando você até a Pesquisa...';
        feedback.style.color = '#2d5a3f';
        addForm.reset();

        setTimeout(function () {
            document.body.classList.remove('page-loaded');
            document.body.classList.add('page-leaving');
            setTimeout(function () {
                window.location.href = 'pesquisa.html';
            }, 280);
        }, 900);
    });
}

// ==========================================================================
// PÁGINA "PESQUISA"
// ==========================================================================
var videoGrid = document.getElementById('video-grid');
if (videoGrid) {
    var emptyState = document.getElementById('empty-state');
    var searchInput = document.getElementById('search-input');
    var filterTags = document.querySelectorAll('.filter-tag');
    var currentCategory = 'Todos';

    function renderVideos() {
        var videos = getVideos();
        var query = ((searchInput && searchInput.value) || '').toLowerCase().trim();

        var filtered = videos.filter(function (video) {
            var matchesCategory = currentCategory === 'Todos' || video.category === currentCategory;
            var matchesQuery = !query || video.title.toLowerCase().indexOf(query) !== -1;
            return matchesCategory && matchesQuery;
        });

        videoGrid.innerHTML = '';

        if (filtered.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        filtered.forEach(function (video) {
            var safeTitle = escapeHtml(video.title);
            var card = document.createElement('div');
            card.className = 'video-card';
            card.innerHTML =
                '<div class="video-thumb-wrap">' +
                    '<img src="https://img.youtube.com/vi/' + video.videoId + '/hqdefault.jpg" alt="' + safeTitle + '">' +
                    '<div class="video-play-btn">' +
                        '<svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff"><path d="M8 5v14l11-7z"/></svg>' +
                    '</div>' +
                '</div>' +
                '<div class="video-info">' +
                    '<h4>' + safeTitle + '</h4>' +
                    '<span class="result-tag">' + escapeHtml(video.category) + '</span>' +
                '</div>';

            var thumbWrap = card.querySelector('.video-thumb-wrap');
            thumbWrap.addEventListener('click', function () {
                thumbWrap.innerHTML =
                    '<iframe src="https://www.youtube.com/embed/' + video.videoId + '?autoplay=1" ' +
                    'title="' + safeTitle + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
            });

            videoGrid.appendChild(card);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderVideos);
    }

    filterTags.forEach(function (tag) {
        tag.addEventListener('click', function () {
            filterTags.forEach(function (t) { t.classList.remove('active'); });
            tag.classList.add('active');
            currentCategory = tag.getAttribute('data-category');
            renderVideos();
        });
    });

    renderVideos();
}