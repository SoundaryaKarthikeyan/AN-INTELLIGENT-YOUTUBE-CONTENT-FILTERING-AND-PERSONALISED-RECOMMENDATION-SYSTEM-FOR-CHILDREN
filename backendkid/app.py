from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_config import db
from datetime import datetime
import datetime as dt # Added for proper timestamp handling
from firebase_admin import firestore

app = Flask(__name__)
# 1. Broaden CORS for development (Ensures mobile devices can connect)
CORS(app, resources={r"/*": {"origins": "*"}})

# Simple health check to see if server is reachable from phone browser
@app.route('/')
def health():
    return jsonify({"status": "Backend is online!"}), 200

# =========================
# 🔐 LOGIN
# =========================
@app.route('/parent/login', methods=['POST'])
def parent_login():
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({"error": "Missing email"}), 400
            
        email = data.get('email').lower().strip() # Cleanup email

        # Query parents collection
        parents = db.collection('parents').where('email', '==', email).stream()

        parent_doc = None
        for doc in parents:
            parent_doc = doc
            break

        if not parent_doc:
            return jsonify({"error": "Parent not found"}), 404

        # Fetch children from sub-collection
        children_ref = db.collection('parents').document(parent_doc.id).collection('children').stream()

        children = []
        for child in children_ref:
            d = child.to_dict()
            children.append({
                "id": child.id,
                "name": d.get("name", "Child")
            })

        return jsonify({"children": children}), 200
    except Exception as e:
        print(f"❌ LOGIN ERROR: {e}")
        return jsonify({"error": str(e)}), 500

# =========================
# 📺 TRACK WATCH (KIDS APP)
# =========================
@app.route('/track/watch', methods=['POST'])
def track_watch():
    try:
        data = request.get_json()
        print("🔥 TRACK HIT:", data)

        db.collection('watch_history').add({
            "child_id": data.get("child_id"),
            "video_id": data.get("video_id"),
            "title": data.get("title"),
            "duration_watched": data.get("duration_watched"),
            "total_duration": data.get("total_duration"),
            "timestamp": firestore.SERVER_TIMESTAMP # Better for ordering
        })

        return jsonify({"status": "saved"}), 201
    except Exception as e:
        print(f"❌ TRACK ERROR: {e}")
        return jsonify({"error": str(e)}), 500

# =========================
# 📊 WATCH HISTORY (PARENT APP)
# =========================
@app.route('/parent/watch-history/<child_id>')
def watch_history(child_id):
    try:
        # Note: This query REQUIRES a composite index in Firestore
        docs = db.collection('watch_history') \
            .where('child_id', '==', child_id) \
            .order_by('timestamp', direction=firestore.Query.DESCENDING) \
            .stream()

        result = []
        for d in docs:
            data = d.to_dict()
            # Convert Firestore timestamp to string for JSON safety
            ts = data.get("timestamp")
            time_str = ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)
            
            result.append({
                "title": data.get("title"),
                "thumbnail": data.get("thumbnail"),
                "duration": data.get("duration_watched"),
                "time": time_str
            })

        return jsonify(result), 200
    except Exception as e:
        print(f"❌ HISTORY ERROR: {e}")
        # If this prints "FailedPrecondition", you need to click the link in terminal to create an index
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Ensure port 5000 is open. On Mac, use 5001 if 5000 is busy.
    app.run(host="0.0.0.0", port=5000, debug=True)