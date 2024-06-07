from flask import Flask, request, jsonify
from PIL import Image
import io
import model_header as mh
import numpy as np
import cv2
import pytesseract
import detection
import ssl
import os
os.environ['MPLBACKEND'] = 'agg'

ssl._create_default_https_context = ssl._create_unverified_context


app = Flask(__name__)

import os
print("Current Working Directory:", os.getcwd())

@app.route('/upload-images', methods=['POST'])
def upload_images():
    if len(request.files) == 0:
        return jsonify({'error': 'No image files'}), 400

    results = {}

    for idx, image_file_key in enumerate(request.files):
        image_file = request.files[image_file_key]
        image = Image.open(image_file.stream)
        image_np = np.array(image)

        # Call your existing functions here
        students = detection.extract_students(image_np)
        students = detection.detect_signatures(image_np, students)

        # Prepare results
        image_results = {}
        for id, info in students.items():
            base_model = mh.create_snn_model((128, 128, 1))
            model = mh.model_building(base_model)
            info['scores'], groups = detection.comparison_algorithm(info['signatures'], model)
            image_results[id] = {
                'attendance': info['attendance'],
                'scores': info['scores'].tolist(),  # Convert numpy array to list for JSON serialization
                'groups': groups
            }
            
            print("image_Results: ",image_results)
        results[f'image_{idx}'] = image_results

    return jsonify(results), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
