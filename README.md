A web player for DJ sessions from @MyAnalogJournal, with randomized selections and a recently played history in local storage.

www/ — the static website published through GitHub Pages.
update_videos.py — fetches the latest qualifying sessions from the YouTube API and writes them to www/videos.json.

GitHub Actions runs the video updater automatically and commits changes to videos.json. GitHub Pages then serves the contents of www/.

Running locally:
Create a Python virtual environment and install the dependencies:

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt


Create a .env file in the repository root containing your YouTube API key:

YOUTUBE_API_KEY=your_api_key_here


The updater reads the key from the YOUTUBE_API_KEY environment variable.

Run the updater with:

python update_videos.py


This updates:

www/videos.json


The .env file and Python virtual environment are intentionally excluded from Git.

GitHub Actions

The automated video updater requires a repository secret named:

YOUTUBE_API_KEY


The API key should be added under:

Repository → Settings → Secrets and variables → Actions

The key is provided to the workflow as an environment variable and is never stored in the repository.

The updater runs automatically on its scheduled interval and can also be triggered manually from the Actions tab.

GitHub Pages

The website is deployed from the www/ directory using the GitHub Pages Actions workflow.

The Pages source should be configured as:

GitHub Actions


No API key is required by the website itself. The browser only receives the static site and the generated videos.json.

Content

The video data is sourced from the YouTube channel configured in update_videos.py.

Only long-form videos meeting the minimum duration configured by MIN_DURATION are included.
