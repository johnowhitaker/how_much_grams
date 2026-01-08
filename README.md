Quick app to capture pics for a silly dataset idea.

Prompt: "I'd like to build a dataset for an AI eval. The way I'd like to gather the data is to run a Flask app on this Mac which we will create in this currently empty directory. It should, when I visit mac.local/whatever
the port is for my phone, I should get a page that asks for camera permission and then it prompts me to take a picture of an object, take a picture of the object on the scale and then take a picture of the scale
reading. So three photos for every object that's going to be in the dataset. These three should all be saved with a consistent ID for that object or that data point followed by _object _scale _scale reading. The
app should be kind of nice to use and give me options for retaking a photo right after I've taken it or moving on to the next photo, canceling an observation at any point. You know just basically a nice simple
data gathering UI so that I can quite rapidly build up a fun little dataset to demonstrate this. Let me know if you have any questions otherwise feel free to start the implementation!"

Model: Codex 5.2 in codex cli, one shot it nicely. 

## Run

- `python3 -m venv .venv`
- `source .venv/bin/activate`
- `pip install -r requirements.txt`
- `python app.py`

## Demo data

I'm uploading 20 examples as data.zip
