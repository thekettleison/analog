import json
import os
import re
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["YOUTUBE_API_KEY"]
CHANNEL_HANDLE = "@MyAnalogJournal"

OUTPUT_FILE = "www/videos.json"

# Only include long-form sessions of 25 minutes or more.
MIN_DURATION = 25 * 60


def youtube_get(endpoint, params):
    params["key"] = API_KEY

    response = requests.get(
        f"https://www.googleapis.com/youtube/v3/{endpoint}",
        params=params,
        timeout=30,
    )

    response.raise_for_status()
    return response.json()


def get_uploads_playlist():
    data = youtube_get(
        "channels",
        {
            "part": "contentDetails",
            "forHandle": CHANNEL_HANDLE,
        },
    )

    if not data.get("items"):
        raise RuntimeError(
            f"Could not find YouTube channel {CHANNEL_HANDLE}"
        )

    return (
        data["items"][0]
        ["contentDetails"]
        ["relatedPlaylists"]
        ["uploads"]
    )


def get_all_video_ids(playlist_id):
    video_ids = []
    page_token = None

    while True:
        params = {
            "part": "contentDetails",
            "playlistId": playlist_id,
            "maxResults": 50,
        }

        if page_token:
            params["pageToken"] = page_token

        data = youtube_get("playlistItems", params)

        for item in data.get("items", []):
            video_id = item["contentDetails"].get("videoId")

            if video_id:
                video_ids.append(video_id)

        page_token = data.get("nextPageToken")

        if not page_token:
            break

    return video_ids


def parse_duration(duration):
    """
    Convert an ISO 8601 duration such as PT1H23M45S
    into seconds.
    """
    match = re.fullmatch(
        r"PT"
        r"(?:(\d+)H)?"
        r"(?:(\d+)M)?"
        r"(?:(\d+)S)?",
        duration,
    )

    if not match:
        return 0

    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    return hours * 3600 + minutes * 60 + seconds


def get_longform_videos(video_ids):
    videos = []

    # YouTube allows up to 50 video IDs per request.
    for start in range(0, len(video_ids), 50):
        batch = video_ids[start:start + 50]

        data = youtube_get(
            "videos",
            {
                "part": "snippet,contentDetails",
                "id": ",".join(batch),
            },
        )

        for item in data.get("items", []):
            duration = parse_duration(
                item["contentDetails"]["duration"]
            )

            # Keep only sessions of 25 minutes or longer.
            if duration < MIN_DURATION:
                continue

            videos.append({
                "id": item["id"],
                "title": item["snippet"]["title"],
                "published": item["snippet"]["publishedAt"],
                "duration": duration,
            })

    return videos


def main():
    print("Finding My Analog Journal channel...")

    playlist_id = get_uploads_playlist()

    print(f"Uploads playlist: {playlist_id}")

    print("Getting video list...")

    video_ids = get_all_video_ids(playlist_id)

    print(f"Found {len(video_ids)} uploaded videos.")

    print("Checking durations and filtering to sessions 25+ minutes...")

    videos = get_longform_videos(video_ids)

    print(f"Keeping {len(videos)} long-form videos.")

    videos.sort(
        key=lambda video: video["published"],
        reverse=True,
    )

    output = {
        "channel": CHANNEL_HANDLE,
        "updated": datetime.now(timezone.utc).isoformat(),
        "min_duration": MIN_DURATION,
        "videos": videos,
    }

    os.makedirs(
        os.path.dirname(OUTPUT_FILE),
        exist_ok=True,
    )

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            output,
            f,
            indent=2,
            ensure_ascii=False,
        )

    print(f"Wrote {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
