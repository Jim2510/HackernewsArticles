// Importa le librerie necessarie
import axios from 'axios';
import _ from 'lodash';
import 'boxicons';

// URL di base per l'API di Hacker News
const baseUrl = 'https://hacker-news.firebaseio.com/v0';

// Variabili globali
let currentPage = 1; // Pagina corrente
let loading = false; // Flag per indicare se il caricamento è in corso

// Funzione asincrona per ottenere le ultime notizie
async function getLatestNews() {
    // Ottiene l'elenco degli ID delle ultime notizie
    const response = await axios.get(`${baseUrl}/newstories.json`);
    const newsIds = response.data.slice((currentPage - 1) * 10, currentPage * 10);

    // Ottiene i dettagli delle notizie corrispondenti agli ID
    const newsDetailsPromises = newsIds.map(async (id) => {
        const newsResponse = await axios.get(`${baseUrl}/item/${id}.json`);
        return newsResponse.data;
    });

    const newsDetails = await Promise.all(newsDetailsPromises);
    return newsDetails;
}

// Funzione per rendere la lista di notizie
function renderNewsList(newsDetails) {
    const newsItems = [];

    newsDetails.forEach((news) => {
        const newsItem = document.createElement('div');
        newsItem.classList.add('news-item');

        const title = document.createElement('a');
        title.classList.add('news-title');
        title.href = news.url;
        title.textContent = news.title;

        const date = document.createElement('span');
        date.classList.add('news-date');
        date.textContent = new Date(news.time * 1000).toLocaleString();

        newsItem.appendChild(title);
        newsItem.appendChild(date);

        newsItems.push(newsItem);
    });

    return newsItems;
}

// Funzione asincrona per caricare ulteriori notizie
async function loadMoreNews() {
    // Controlla se il caricamento è già in corso
    if (!loading) {
        loading = true;
        currentPage++;

        // Ottiene i dettagli delle notizie
        const newsDetails = await getLatestNews();

        if (newsDetails.length > 0) {
            // Rende e aggiunge gli elementi delle notizie alla lista
            const newsItems = renderNewsList(newsDetails);
            const container = document.querySelector('.news');
            newsItems.forEach((newsItem) => {
                container.appendChild(newsItem);
            });

            loading = false;
            createObserver(); // Aggiungi l'Observer per le nuove notizie caricate
        } else {
            // Rimuovi l'event listener dello scroll se non ci sono più notizie da caricare
            window.removeEventListener('scroll', scrollHandler);
        }
    }
}

// Gestore dello scroll
function scrollHandler() {
    // Controlla se l'utente ha raggiunto la fine della pagina e non ci sono caricamenti in corso
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight && !loading) {
        loadMoreNews();
    }

    // Controlla la visibilità degli elementi delle notizie
    const newsItems = document.querySelectorAll('.news-item');
    newsItems.forEach((newsItem) => {
        if (isElementVisible(newsItem)) {
            newsItem.classList.add('visible');

            // Controlla se l'elemento è sopra o sotto la viewport
            if (isElementAboveViewport(newsItem)) {
                newsItem.classList.remove('fade-in');
            } else {
                newsItem.classList.add('fade-in');
            }
        } else {
            newsItem.classList.remove('visible', 'fade-in');
        }
    });
}

// Controlla se l'elemento è sopra la viewport
function isElementAboveViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.bottom < 0;
}

// Controlla se l'elemento è visibile nella viewport
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
}

// Aggiunge l'event listener per lo scroll con un throttling
window.addEventListener('scroll', _.throttle(scrollHandler, 500));

// Funzione di inizializzazione
async function init() {
    // Ottiene i dettagli delle ultime notizie
    const newsDetails = await getLatestNews();

    // Rende e aggiunge gli elementi delle notizie alla lista
    const newsItems = renderNewsList(newsDetails);
    const container = document.querySelector('.news');
    newsItems.forEach((newsItem, index) => {
        if (index < 10) {
            newsItem.classList.add('visible');
        }
        container.appendChild(newsItem);
    });

    createObserver(); // Aggiungi l'Observer per le nuove notizie caricate
}

// Crea l'Intersection Observer per la visibilità degli elementi
function createObserver() {
    const newsItems = document.querySelectorAll('.news-item');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const isVisible = isElementVisible(entry.target);
                const isAboveViewport = isElementAboveViewport(entry.target);

                if (isVisible) {
                    entry.target.classList.add('visible');

                    // Controlla se l'elemento è sopra o sotto la viewport
                    if (isAboveViewport) {
                        entry.target.classList.remove('fade-in');
                    } else {
                        entry.target.classList.add('fade-in');
                    }
                } else {
                    entry.target.classList.remove('visible', 'fade-in');
                }
            });
        }, {
            rootMargin: '-50px 0px',
        }
    );

    newsItems.forEach((newsItem) => {
        observer.observe(newsItem);
    });
}

init(); // Inizializza l'applicazione

// Aggiungi un evento di ascolto per il campo di input
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', performSearch);

function performSearch() {
    const searchQuery = searchInput.value.trim().toLowerCase(); // Ottieni il testo di ricerca e convertilo in minuscolo
    const newsItems = document.querySelectorAll('.news-item'); // Ottieni tutti gli elementi delle notizie

    newsItems.forEach((newsItem) => {
        const title = newsItem.querySelector('.news-title'); // Ottieni l'elemento del titolo della notizia
        const newsTitle = title.textContent.toLowerCase(); // Ottieni il testo del titolo e convertilo in minuscolo

        // Controlla se il testo di ricerca corrisponde al titolo della notizia
        if (newsTitle.includes(searchQuery)) {
            newsItem.style.display = 'flex'; // Mostra l'elemento delle notizie se c'è corrispondenza
        } else {
            newsItem.style.display = 'none'; // Nascondi l'elemento delle notizie se non c'è corrispondenza
        }
    });
}

// Gestore del click sul pulsante "Torna all'inizio"
const topBtn = document.getElementById('topBtn');

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}
topBtn.addEventListener('click', scrollToTop);

// Gestore del click sul pulsante "Aggiorna pagina"
const refBtn = document.getElementById('refBtn');

function refPage() {
    location.reload();
}
refBtn.addEventListener('click', refPage);

// Riduci l'altezza dell'header quando si fa lo scroll
const header = document.querySelector('header');
const scrollOffset = 100; // Offset di scroll dopo il quale l'header si riduce in altezza

window.addEventListener('scroll', () => {
    if (window.scrollY > scrollOffset) {
        header.classList.add('sticky-header', 'small');
    } else {
        header.classList.remove('sticky-header', 'small');
    }
});

function filterNews(category) {
    const newsItems = document.querySelectorAll('.news-item');

    newsItems.forEach((newsItem) => {
        if (category === 'all' || newsItem.dataset.category === category) {
            newsItem.style.display = 'block';
        } else {
            newsItem.style.display = 'none';
        }
    });
}