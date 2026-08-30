let videos = [];
let currentVideo = null;

const player = document.getElementById("player");
const title = document.getElementById("title");
const date = document.getElementById("date");
const status = document.getElementById("status");
const randomButton = document.getElementById("randomButton");

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

        status.textContent =
            `${videos.length} sessions available`;

    } catch (error) {
        console.error(error);
        status.textContent =
            "Could not load the video list.";
    }
}


function playRandom() {
    if (!videos.length) {
        return;
    }

    let video;

    // Avoid immediately picking the same video again.
    do {
        video = videos[Math.floor(Math.random() * videos.length)];
    } while (
        videos.length > 1 &&
        video.id === currentVideo?.id
    );

    currentVideo = video;

    player.src =
        `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`;

    title.textContent = video.title;

    const published = new Date(video.published);

    date.textContent =
        published.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    status.textContent = "";
}


randomButton.addEventListener("click", playRandom);

loadVideos();
