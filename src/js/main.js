import axios from 'axios';
import _ from 'lodash';
import 'boxicons';

const baseUrl = 'https://hacker-news.firebaseio.com/v0';

let currentPage = 1;
let loading = false;

async function getLatestNews() {
    const response = await axios.get(`${baseUrl}/newstories.json`);
    const newsIds = response.data.slice((currentPage - 1) * 10, currentPage * 10);
    const newsDetailsPromises = newsIds.map(async (id) => {
        const newsResponse = await axios.get(`${baseUrl}/item/${id}.json`);
        return newsResponse.data;
    });
    const newsDetails = await Promise.all(newsDetailsPromises);
    return newsDetails;
}

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

async function loadMoreNews() {
    if (!loading) {
        loading = true;
        currentPage++;
        const newsDetails = await getLatestNews();
        if (newsDetails.length > 0) {
            const newsItems = renderNewsList(newsDetails);
            const container = document.querySelector('.news');
            newsItems.forEach((newsItem) => {
                container.appendChild(newsItem);
            });
            loading = false;
            createObserver(); // Aggiungi l'Observer per le nuove news caricate
        } else {
            window.removeEventListener('scroll', scrollHandler);
        }
    }
}

function scrollHandler() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight && !loading) {
        loadMoreNews();
    }

    const newsItems = document.querySelectorAll('.news-item');
    newsItems.forEach((newsItem) => {
        if (isElementVisible(newsItem)) {
            newsItem.classList.add('visible');
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

function isElementAboveViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.bottom < 0;
}

function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
}

window.addEventListener('scroll', _.throttle(scrollHandler, 500));

async function init() {
    const newsDetails = await getLatestNews();
    const newsItems = renderNewsList(newsDetails);

    const container = document.querySelector('.news');
    newsItems.forEach((newsItem, index) => {
        if (index < 10) {
            newsItem.classList.add('visible');
        }
        container.appendChild(newsItem);
    });

    createObserver();
}

function createObserver() {
    const newsItems = document.querySelectorAll('.news-item');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const isVisible = isElementVisible(entry.target);
                const isAboveViewport = isElementAboveViewport(entry.target);

                if (isVisible) {
                    entry.target.classList.add('visible');
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

init();

const refBtn = document.getElementById('refBtn');
const topBtn = document.getElementById('topBtn');

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}

topBtn.addEventListener('click', scrollToTop);

function refPage() {
    location.reload();
}

refBtn.addEventListener('click', refPage);

const header = document.querySelector('header');
const scrollOffset = 100; // Offset di scroll dopo il quale l'header si riduce in altezza

window.addEventListener('scroll', () => {
    if (window.scrollY > scrollOffset) {
        header.classList.add('sticky-header', 'small');
    } else {
        header.classList.remove('sticky-header', 'small');
    }
});