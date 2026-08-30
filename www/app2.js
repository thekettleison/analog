let videos = [];
let currentVideo = null;

const HISTORY_KEY = "analog-recently-played";
const MAX_HISTORY = 8;

const player = document.getElementById("player");
const title = document.getElementById("title");
const date = document.getElementById("date");
const status = document.getElementById("status");
const randomButton = document.getElementById("randomButton");
const recentList = document.getElementById("recentList");


async function loadVideos() {
    try {
        const response = await fetch("videos.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Could not load video list.");
        }

        const data = await response.json();
        videos = data.videos;

        playRandom();

    } catch (error) {
        console.error(error);

        status.textContent =
            "Could not load the video list.";
    }
}


function getHistory() {
    try {
        return JSON.parse(
            localStorage.getItem(HISTORY_KEY)
        ) || [];
    } catch {
        return [];
    }
}


function saveHistory(history) {
    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );
}


function addToHistory(video) {
    let history = getHistory();

    // Remove this video if it was already in history.
    history = history.filter(
        item => item.id !== video.id
    );

    // Put newest at the beginning.
    history.unshift(video);

    // Keep only the most recent few.
    history = history.slice(0, MAX_HISTORY);

    saveHistory(history);

    renderHistory();
}


function renderHistory() {
    const history = getHistory();

    recentList.innerHTML = "";

    if (!history.length) {
        recentList.innerHTML =
            '<p class="empty-history">Nothing played yet.</p>';

        return;
    }

    for (const video of history) {
        const button = document.createElement("button");

        button.className = "recent-item";
        button.type = "button";

        button.innerHTML = `
            <span class="recent-title"></span>
            <span class="recent-date"></span>
        `;

        button.querySelector(".recent-title")
            .textContent = video.title;

        button.querySelector(".recent-date")
            .textContent = formatDate(video.published);

        button.addEventListener("click", () => {
            playVideo(video);
        });

        recentList.appendChild(button);
    }
}


function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


function playVideo(video) {
    currentVideo = video;

    player.src =
        `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`;

    title.textContent = video.title;

    date.textContent =
        formatDate(video.published);

    status.textContent = "";

    addToHistory(video);
}


function playRandom() {
    if (!videos.length) {
        return;
    }

    let video;

    // Don't immediately pick the currently playing video.
    do {
        video =
            videos[Math.floor(Math.random() * videos.length)];

    } while (
        videos.length > 1 &&
        video.id === currentVideo?.id
    );

    playVideo(video);
}


randomButton.addEventListener(
    "click",
    playRandom
);


// Render saved history immediately.
renderHistory();


// Load the video catalog and automatically
// start a random session.
loadVideos();
