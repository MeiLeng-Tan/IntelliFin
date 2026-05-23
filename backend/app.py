import os
from flask import Flask, jsonify

def create_app():
    app = Flask(__name__)

    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            "message": "IntelliFin started"
        }), 200
    
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
