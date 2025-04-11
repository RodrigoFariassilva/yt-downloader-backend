from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os
from uuid import uuid4
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
CORS(app)

DOWNLOADS_FOLDER = "downloads"
os.makedirs(DOWNLOADS_FOLDER, exist_ok=True)

@app.route("/download", methods=["POST"])
def download():
    data = request.json
    url = data.get("url")
    type_ = data.get("type")

    if not url or type_ not in ["mp3", "mp4"]:
        return jsonify({"error": "Requisição inválida"}), 400

    filename = f"{uuid4()}.{type_}"
    filepath = os.path.join(DOWNLOADS_FOLDER, filename)

    options = {
        "outtmpl": filepath,
        "quiet": True
    }

    if type_ == "mp3":
        options.update({
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
        })
    else:
        options.update({"format": "best"})

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url])
        return jsonify({"downloadUrl": f"https://yt-downloader-api.onrender.com/files/{filename}"})
    except Exception as e:
        print("Erro:", e)
        return jsonify({"error": "Erro ao baixar"}), 500

@app.route("/files/<filename>")
def serve_file(filename):
    return app.send_static_file(f"downloads/{filename}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

