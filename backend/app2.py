from flask import Flask, request, jsonify
import os
from PIL import Image
import numpy as np
import cv2
import pytesseract
import tempfile
import detection  # Yazdığınız veya sağladığınız kodları buradan import edin
import werkzeug


app = Flask(__name__)

@app.route('/upload-images', methods=['POST'])
def upload_images():
    if 'image_1' not in request.files or 'image_2' not in request.files:
        return jsonify({"error": "Lütfen iki adet görüntü yükleyin."}), 400
    
    # İki dosyayı al ve geçici dosya olarak kaydet
    image_files = [request.files['image_1'], request.files['image_2']]
    image_paths = []
    
    with tempfile.TemporaryDirectory() as temp_dir:
        for i, image_file in enumerate(image_files):
            filename = werkzeug.utils.secure_filename(image_file.filename)
            temp_path = os.path.join(temp_dir, f"image_{i+1}.jpg")
            image_file.save(temp_path)
            image_paths.append(temp_path)
        
        # Görüntüleri işle ve sonuçları döndür
        attendance_image = Image.open(image_paths[0])
        signature_image = Image.open(image_paths[1])
        
        # Attendance analizi
        text = pytesseract.image_to_string(attendance_image)
        absences = detection.extract_attendance(text)
        
        # Signature analizi
        temp_image, all_regions, signatures_dict = script_detection.detect_signatures(np.array(signature_image), absences, (128, 128))
        
        # model operations
        base_model = script_detection.mh.create_snn_model((128, 128, 1))
        model = script_detection.mh.model_building(base_model)
        print("--- MODEL RESULTS ---")

        result = script_detection.main()

        # Görüntü işleme sonuçlarını dosyalara kaydet
        temp_image_path = os.path.join(temp_dir, "detection_result.jpg")
        cv2.imwrite(temp_image_path, temp_image)

        # Sonuçları JSON formatına dönüştür
        response_data = {
            "attendance": absences,
            "number_of_signatures": len(all_regions),
            "detection_result_image": temp_image_path  # İşlenmiş görüntü dosyasının yolu
        }

        # JSON verisini HTTP yanıtında döndür
        return jsonify(response_data), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)
