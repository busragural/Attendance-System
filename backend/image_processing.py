from flask import Flask, request

app = Flask(__name__)

@app.route('/upload-images', methods=['POST'])
def upload_images():
    print("Received request")

    # Gelen resimleri al
    images = []
    index = 1

    # Dosyaları 'image_1', 'image_2', ... şeklinde al
    while f'image_{index}' in request.files:
        image = request.files[f'image_{index}']
        images.append(image)
        index += 1

    # Resimleri yazdır
    for index, image in enumerate(images):
        print(f"Name: {image.filename}")
        print(f"URI: {image.stream.name}")  # Use .stream.name to get the file path
        print(f"Type: {image.content_type}")
        print("\n")

    return 'Images received successfully'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
