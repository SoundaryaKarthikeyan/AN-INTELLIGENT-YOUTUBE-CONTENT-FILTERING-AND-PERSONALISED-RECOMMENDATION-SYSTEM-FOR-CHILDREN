from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_config import db
from datetime import datetime
from firebase_admin import firestore

# ✅ STEP 1: Create app FIRST
app = Flask(__name__)
CORS(app)

# =========================
# 🔐 LOGIN
# =========================
@app.route('/parent/login', methods=['POST'])
def parent_login():
    data = request.get_json()
    email = data.get('email')

    parents = db.collection('parents').where('email', '==', email).stream()

    parent_doc = None
    for doc in parents:
        parent_doc = doc
        break

    if not parent_doc:
        return jsonify({"error": "Parent not found"}), 404

    parent_id = parent_doc.id

    children_ref = db.collection('parents') \
        .document(parent_id) \
        .collection('children') \
        .stream()

    children = []
    for child in children_ref:
        d = child.to_dict()
        children.append({
            "id": child.id,
            "name": d.get("name", "Child")
        })

    return jsonify({"children": children})


# =========================
# 📺 TRACK WATCH
# =========================
@app.route('/track/watch', methods=['POST'])
def track_watch():
    data = request.get_json()

    db.collection('watch_history').add({
        "child_id": data.get("child_id"),
        "video_id": data.get("video_id"),
        "title": data.get("title"),
        "duration_watched": data.get("duration_watched"),
        "total_duration": data.get("total_duration"),
        "timestamp": datetime.utcnow().isoformat()
    })

    return jsonify({"status": "saved"})


# =========================
# 📊 WATCH HISTORY
# =========================
@app.route('/parent/watch-history/<child_id>')
def watch_history(child_id):
    try:
        docs = db.collection('watch_history') \
            .where('child_id', '==', child_id) \
            .order_by('timestamp', direction=firestore.Query.DESCENDING) \
            .stream()
        
        result = [{"title": d.get("title"), "duration": d.get("duration_watched"), "time": d.get("timestamp")} for d in docs]
        return jsonify(result)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


# =========================
# 🚀 RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)