from flask import Flask
from routes.resume import resume_bp

app = Flask(__name__)
app.register_blueprint(resume_bp, url_prefix="/api/v1")

if __name__ == "__main__":
    app.run(debug=True)