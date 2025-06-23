import requests;
API_KEY = 'AIzaSyDL_zHJPfFNh-4svhd_olMGyPtbb3OQMdI';
VIDEO_ID = ['4CvemDSU8uQ']

def get_video_status(video_ids):
    url = 'https://www.googleapis.com/youtube/v3/videos'
    params = {
            'part': 'status',
            'id': ','.join(VIDEO_ID),
            'key': API_KEY
    }
    response = requests.get(url,params=params)
    data = response.json()
    print(data);

get_video_status(VIDEO_ID)