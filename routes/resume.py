from flask import Blueprint, request, jsonify
from services.parser_service import process_resume

resume_bp = Blueprint("resume", __name__)

@resume_bp.route("/parse-resume", methods=["POST"])
def parse_resume():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    try:
        result = process_resume(file)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500