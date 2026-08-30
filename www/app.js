let youtubePlayer = null;
let historyRecordedForCurrentVideo = false;

let videos = [];
let currentVideo = null;

const HISTORY_KEY = "analog-recently-played";
const MAX_HISTORY = 8;
const RANDOM_CHOICES = 5;

const player = document.getElementById("player");
const title = document.getElementById("title");
const date = document.getElementById("date");
const status = document.getElementById("status");
const randomButton = document.getElementById("randomButton");
const choicesList = document.getElementById("choicesList");
const recentList = document.getElementById("recentList");
const randomizeChoicesButton =
    document.getElementById("randomizeChoices");


/* --------------------------------
   YouTube player
   -------------------------------- */

function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player("player", {
        events: {
            onStateChange: onPlayerStateChange
        }
    });
}


function onPlayerStateChange(event) {
    if (
        event.data === YT.PlayerState.PLAYING &&
        currentVideo &&
        !historyRecordedForCurrentVideo
    ) {
        historyRecordedForCurrentVideo = true;
        addToHistory(currentVideo);
    }
}


/* --------------------------------
   Load videos
   -------------------------------- */

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

        // Pick something immediately on page load,
        // but don't add it to Recent Listens yet.
        playRandom(false);

        // Populate the five choices.
        renderChoices();

    } catch (error) {
        console.error(error);

        status.textContent =
            "Could not load the video list.";
    }
}


/* --------------------------------
   History
   -------------------------------- */

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

    history = history.filter(
        item => item.id !== video.id
    );

    history.unshift(video);

    history = history.slice(0, MAX_HISTORY);

    saveHistory(history);

    renderHistory();
}


/* --------------------------------
   Formatting
   -------------------------------- */

function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }

    return `${minutes}m`;
}


function thumbnailUrl(video) {
    return `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
}


/* --------------------------------
   Playback
   -------------------------------- */

function playVideo(video, addHistory = false, autoplay = true) {
    currentVideo = video;

    historyRecordedForCurrentVideo = addHistory;

    player.src =
        `https://www.youtube.com/embed/${video.id}` +
        `?enablejsapi=1` +
        `&autoplay=${autoplay ? 1 : 0}` +
        `&rel=0`;

    title.textContent = video.title;

    date.textContent =
        `${formatDate(video.published)} · ${formatDuration(video.duration)}`;

    status.textContent = "";

    if (addHistory) {
        addToHistory(video);
    }
}


function playRandom(addHistory = true) {
    if (!videos.length) {
        return;
    }

    let video;

    do {
        video =
            videos[Math.floor(Math.random() * videos.length)];

    } while (
        videos.length > 1 &&
        video.id === currentVideo?.id
    );

const autoplay = addHistory;

    playVideo(video, addHistory, autoplay);

    // Give us five new choices whenever we randomize.
    renderChoices();
}


/* --------------------------------
   Random choices
   -------------------------------- */

function getRandomChoices() {
    const available = videos.filter(
        video => video.id !== currentVideo?.id
    );

    // Fisher-Yates shuffle.
    const shuffled = [...available];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, RANDOM_CHOICES);
}


/* --------------------------------
   Cards
   -------------------------------- */

function createCard(video, className) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;

    const image = document.createElement("img");

    image.src = thumbnailUrl(video);
    image.alt = "";
    image.loading = "lazy";

    const text = document.createElement("div");
    text.className = "card-text";

    const cardTitle = document.createElement("div");
    cardTitle.className = "card-title";
    cardTitle.textContent = video.title;

    const cardMeta = document.createElement("div");
    cardMeta.className = "card-meta";

    cardMeta.textContent =
        `${formatDate(video.published)} · ${formatDuration(video.duration)}`;

    text.appendChild(cardTitle);
    text.appendChild(cardMeta);

    button.appendChild(image);
    button.appendChild(text);

    button.addEventListener("click", () => {
        playVideo(video, true);
    });

    return button;
}


/* --------------------------------
   Choices
   -------------------------------- */

function renderChoices() {
    if (!choicesList || !videos.length) {
        return;
    }

    choicesList.innerHTML = "";

    const choices = getRandomChoices();

    for (const video of choices) {
        choicesList.appendChild(
            createCard(video, "choice-card")
        );
    }
}


/* --------------------------------
   History display
   -------------------------------- */

function renderHistory() {
    if (!recentList) {
        return;
    }

    const history = getHistory();

    recentList.innerHTML = "";

    if (!history.length) {
        recentList.innerHTML =
            '<p class="empty-history">Nothing played yet.</p>';

        return;
    }

    for (const video of history) {
        recentList.appendChild(
            createCard(video, "recent-card")
        );
    }
}


/* --------------------------------
   Buttons
   -------------------------------- */

randomButton.addEventListener(
    "click",
    playRandom
);


randomizeChoicesButton.addEventListener(
    "click",
    renderChoices
);


/* --------------------------------
   Start
   -------------------------------- */

renderHistory();

loadVideos();
