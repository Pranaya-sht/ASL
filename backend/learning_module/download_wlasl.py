import os
import json
import subprocess
import random
import time
import logging

# Configure logging
logging.basicConfig(filename='download_{}.log'.format(int(time.time())), filemode='w', level=logging.DEBUG)
logging.getLogger().addHandler(logging.StreamHandler())

# Set the downloader to yt-dlp
youtube_downloader = "yt-dlp"

def run_yt_dlp(url, output_path):
    """Run yt-dlp with error handling."""
    result = subprocess.run(
        [youtube_downloader, url, "-o", f"{output_path}/%(id)s.%(ext)s"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    if result.returncode != 0:
        logging.error(f"Error downloading {url}:\n{result.stderr}")
        return False
    else:
        logging.info(f"Successfully downloaded {url}")
        return True

def request_video(url, referer=''):
    """Make a request to download video data."""
    import urllib.request
    user_agent = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.7) Gecko/2009021910 Firefox/3.0.7'
    headers = {'User-Agent': user_agent}
    
    if referer:
        headers['Referer'] = referer

    request = urllib.request.Request(url, None, headers)
    logging.info(f'Requesting {url}')
    response = urllib.request.urlopen(request)
    return response.read()

def save_video(data, saveto):
    """Save the video data to a file."""
    with open(saveto, 'wb+') as f:
        f.write(data)

    # To be nice to the server, we pause between downloads
    time.sleep(random.uniform(0.5, 1.5))

def download_aslpro(url, dirname, video_id):
    """Download video from ASLPro."""
    saveto = os.path.join(dirname, f'{video_id}.swf')
    if os.path.exists(saveto):
        logging.info(f'{video_id} exists at {saveto}')
        return
    data = request_video(url, referer='http://www.aslpro.com/cgi-bin/aslpro/aslpro.cgi')
    save_video(data, saveto)

def download_others(url, dirname, video_id):
    """Download video from other sources."""
    saveto = os.path.join(dirname, f'{video_id}.mp4')
    if os.path.exists(saveto):
        logging.info(f'{video_id} exists at {saveto}')
        return
    data = request_video(url)
    save_video(data, saveto)

def select_download_method(url):
    """Select the appropriate download method based on the URL."""
    if 'aslpro' in url:
        return download_aslpro
    elif 'youtube' in url or 'youtu.be' in url:
        return run_yt_dlp
    else:
        return download_others

def download_nonyt_videos(indexfile, saveto='raw_videos'):
    """Download non-YouTube videos."""
    with open(indexfile) as f:
        content = json.load(f)

    if not os.path.exists(saveto):
        os.makedirs(saveto)

    for entry in content:
        gloss = entry['gloss']
        instances = entry['instances']

        for inst in instances:
            video_url = inst['url']
            video_id = inst['video_id']
            logging.info(f'gloss: {gloss}, video: {video_id}')
            download_method = select_download_method(video_url)

            if download_method == run_yt_dlp:
                logging.warning(f'Skipping YouTube video {video_id}')
                continue

            try:
                download_method(video_url, saveto, video_id)
            except Exception as e:
                logging.error(f'Failed to download video {video_id}: {e}')

def check_youtube_dl_version():
    """Check if yt-dlp is installed and get the version."""
    ver = subprocess.run([youtube_downloader, '--version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    assert ver.returncode == 0, f"{youtube_downloader} is not installed or not found in PATH. Please verify your installation."

def download_yt_videos(indexfile, saveto='raw_videos'):
    """Download YouTube videos using yt-dlp."""
    with open(indexfile) as f:
        content = json.load(f)

    if not os.path.exists(saveto):
        os.makedirs(saveto)

    for entry in content:
        gloss = entry['gloss']
        instances = entry['instances']

        for inst in instances:
            video_url = inst['url']
            video_id = inst['video_id']

            if 'youtube' not in video_url and 'youtu.be' not in video_url:
                continue

            download_path = os.path.join(saveto, f'{video_id}.mp4')
            if os.path.exists(download_path):
                logging.info(f'Video {video_id} already downloaded.')
                continue

            if run_yt_dlp(video_url, saveto):
                logging.info(f"Downloaded YouTube video: {video_id}")
            else:
                logging.error(f"Failed to download YouTube video: {video_id}")
            time.sleep(random.uniform(1.0, 1.5))

def main():
    # Download non-YouTube videos first
    logging.info('Start downloading non-youtube videos.')
    download_nonyt_videos('WLASL_v0.3.json')

    # Check if yt-dlp is working
    check_youtube_dl_version()

    # Download YouTube videos
    logging.info('Start downloading youtube videos.')
    download_yt_videos('WLASL_v0.3.json')

if __name__ == "__main__":
    main()
