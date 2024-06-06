import cv2
import easyocr
import numpy as np
import model_header as mh
from PIL import Image

def adjust_gamma(image, value=1.5):
    """
    Adjust the gamma correction of the image.
    
    Parameters:
        - image (np.ndarray): Input image.
        - value (float): Gamma correction value.
        
    Returns:
        - np.ndarray: Gamma corrected image.
    """
    normalized_image = image / 255.0
    gamma_corrected = np.power(normalized_image, value)
    gamma_corrected = np.uint8(gamma_corrected * 255)
    return gamma_corrected

def edge_detection(image_edges: np.ndarray, canny_thresh1: int = 100, canny_thresh2: int = 225) -> np.ndarray:
    """
    Performs edge detection on the given image using Canny edge detection.
    
    Parameters:
        - image_edges (np.ndarray): Input image for edge detection.
        - canny_thresh1 (int): Lower threshold for the hysteresis procedure in Canny edge detection.
        - canny_thresh2 (int): Upper threshold for the hysteresis procedure in Canny edge detection.
        
    Returns:
        - np.ndarray: Image with detected edges.
    """
    kernel = np.ones((3, 3), np.uint8)
    image_edges = cv2.Canny(image_edges, canny_thresh1, canny_thresh2, apertureSize=3)
    image_edges = cv2.dilate(image_edges, kernel, iterations=3)
    image_edges = cv2.erode(image_edges, kernel, iterations=1)
    return image_edges

def preprocess_image(image: np.ndarray, block_size: int = 21, constant_subtraction: int = 19) -> tuple:
    """
    Preprocesses the attendance image for further analysis.
    
    Parameters:
        - image (np.ndarray): Input image.
        - block_size (int): Size of the pixel neighborhood used for adaptive thresholding.
        - constant_subtraction (int): Constant subtracted from the mean in adaptive thresholding.
        
    Returns:
        - tuple: A tuple containing the resized original image, thresholded image, and edge-detected image.
    """
    image = np.array(image)
    resized = cv2.resize(image, (1400, 1000))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.medianBlur(gray, 3)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block_size, constant_subtraction)
    thresh_binary = 255 - thresh
    edges = edge_detection(thresh_binary)
    return resized, thresh, edges

def detect_lines(image_edges: np.ndarray, hough_threshold: int = 250, min_line_length: int = 500, max_line_gap: int = 30) -> np.ndarray:
    """
    Applies the Hough Lines Transform to detect lines in the edge-detected image.
    
    Parameters:
        - image_edges (np.ndarray): Edge-detected input image.
        - hough_threshold (int): Threshold for the HoughLinesP function.
        - min_line_length (int): Minimum line length for the HoughLinesP function.
        - max_line_gap (int): Maximum allowed gap between line segments for the HoughLinesP function.
        
    Returns:
        - np.ndarray: Image with detected lines drawn.
    """
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 1))
    detected_lines = cv2.morphologyEx(image_edges, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 50))
    detected_lines += cv2.morphologyEx(image_edges, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
    lines = cv2.HoughLinesP(detected_lines, 1, np.pi / 180, threshold=hough_threshold, minLineLength=min_line_length, maxLineGap=max_line_gap)
    clean_image = np.ones((image_edges.shape[0], image_edges.shape[1]), dtype=np.uint8)
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            cv2.line(clean_image, (x1, y1), (x2, y2), (0, 0, 0), 1)
    return clean_image, lines

def calculate_slope_and_intercept(x1, y1, x2, y2):
    """
    Calculates the slope and intercept of a line given two points.

    Parameters:
        - x1 (int): The x-coordinate of the first point.
        - y1 (int): The y-coordinate of the first point.
        - x2 (int): The x-coordinate of the second point.
        - y2 (int): The y-coordinate of the second point.

    Returns:
        - tuple: A tuple containing the slope and intercept of the line.
            - slope (float): The slope of the line.
            - intercept (float): The y-intercept of the line, or None if the line is vertical.
    """
    if x1 != x2:
        slope = (y2 - y1) / (x2 - x1)
        intercept = y1 - slope * x1
        return slope, intercept
    else:
        return float('inf'), None

def extend_lines(clean_image: np.ndarray, lines: np.ndarray) -> np.ndarray:
    """
    Extends the detected lines in the image and makes adjustments to specific lines.
    
    Parameters:
        - clean_image (np.ndarray): Input image containing initial detected lines.
        - lines (np.ndarray): Array of detected lines.
        
    Returns:
        - np.ndarray: Image with extended and adjusted lines.
    """
    if lines is None:
        return clean_image
    completed_image = clean_image.copy()
    for line in lines:
        x1, y1, x2, y2 = line[0]
        slope, intercept = calculate_slope_and_intercept(x1, y1, x2, y2)
        if slope == float('inf'): # vertical line
            extended_x1, extended_y1 = x1, 10
            extended_x2, extended_y2 = x1, completed_image.shape[0] - 10
        elif slope == 0: # horizontal line
            extended_x1, extended_y1 = 10, y1
            extended_x2, extended_y2 = completed_image.shape[1] - 10, y1
        else: # diagonal line
            extended_x1 = int((0 - intercept) / slope) # y = 0
            extended_x2 = int((completed_image.shape[0] - intercept) / slope) # y = 1000
            extended_y1 = 10
            extended_y2 = completed_image.shape[0] - 10
        cv2.line(completed_image, (extended_x1, extended_y1), (extended_x2, extended_y2), (0, 0, 0), 2)
    return completed_image

def detect_all_boxes(image: np.ndarray, block_size: int = 21, constant_subtraction: int = 19) -> tuple:
    """
    Detects boxes in the template image and creates a clean table template by detecting and drawing only the table lines.
    
    Parameters:
        - image (np.ndarray): Input image.
        
    Returns:
        - tuple: A tuple containing the resized original image, thresholded image, contour areas, bounding boxes, and sorted indices.
    """
    image, thresh, edges = preprocess_image(image, block_size, constant_subtraction)
    clean_image, lines = detect_lines(edges)
    completed_image = extend_lines(clean_image, lines)
    contours = cv2.findContours(completed_image, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)[0]
    areas = [cv2.contourArea(contour) for contour in contours]
    bounding_boxes = [cv2.boundingRect(contour) for contour in contours]
    sorted_indices = sorted(range(len(bounding_boxes)), key=lambda k: (bounding_boxes[k][1], bounding_boxes[k][0]))
    return image, thresh, areas, bounding_boxes, sorted_indices

def check_box(image: np.ndarray, method=0) -> int:
    """
    Checks if a box is marked or not based on its appearance.
    
    Parameters:
        - image (np.ndarray): Image containing the checkbox.
        - method (int): Method to use for checkbox checking.
        
    Returns:
        - int: Status of the box (1 for marked, 0 for empty, -1 for ambiguous).
    """
    image_mean = np.mean(image)
    if method == 0:
        threshold = 247
        if image_mean > 1 and image_mean <= threshold: return 1
        elif image_mean > threshold and image_mean < 254: return 0
        else: return -1
    elif method == 1:
        threshold = 0.97
        if image_mean > 0.01 and image_mean <= threshold: return 1
        elif image_mean > threshold and image_mean < 0.995: return 0
        else: return -1

def extract_students(image: np.ndarray, block_size: int = 25, constant_subtraction: int = 11) -> dict:
    """
    Extracts student IDs information from the given image.
    
    Parameters:
        - image (np.ndarray): Input image containing student IDs.
        
    Returns:
        - dict: Dictionary containing extracted student IDs and their attendance information.
    """
    image, thresh, areas, bounding_boxes, sorted_indices = detect_all_boxes(image, block_size, constant_subtraction)
    detection_image = image.copy()
    students = {}
    padding = 1
    reader = easyocr.Reader(['en'])
    for index in sorted_indices:
        x, y, w, h = bounding_boxes[index]
        if (3000 < areas[index] < 15000) and (145 < w < 200) and (20 < h < 90) and (h / w > 0.2):
            cv2.rectangle(detection_image, (x + padding, y + padding), (x + w - padding, y + h - padding), (0, 0, 255), 1)
            region = thresh[y + padding : y + h - padding, x + padding : x + w - padding]
            if check_box(region) == 1:
                results = reader.readtext(region)
                text = " ".join([res[1] for res in results]).strip()
                text = (text.replace('o', '0')
                            .replace('O', '0')
                            .replace('c', '0')
                            .replace('C', '0')
                            .replace('I', '1')
                            .replace('t', '1')
                            .replace('T', '1')
                            .replace('[', '1')
                            .replace(']', '3')
                            .replace('&', '8'))
                print(text)
                students[text] = {'attendance': [1, 1, 1, 1, 1, 1, 1], 'signatures': [], 'scores': []}  
    return students

def detect_signatures(image: np.ndarray, students: dict) -> dict:
    """
    Detects signatures in an image and updates attendance information.
    
    Parameters:
        - image (np.ndarray): Input image.
        - students (dict): Dictionary containing student IDs and their attendance information.
        
    Returns:
        - dict: Updated dictionary of students with signature detection results.
    """
    image, thresh, areas, bounding_boxes, sorted_indices = detect_all_boxes(image)
    detection_image = image.copy()
    all_regions = []
    x_list = []
    padding = 1
    counter = 0
    person = 0
    key_list = list(students.keys())
    for index in sorted_indices:
        x, y, w, h = bounding_boxes[index]
        if (3000 < areas[index] < 8000) and (95 < w < 140) and (30 < h < 90) and (h / w > 0.225):
            cv2.rectangle(detection_image, (x + padding, y + padding), (x + w - padding, y + h - padding), (0, 0, 255), 1)
            region = thresh[y + padding : y + h - padding, x + padding : x + w - padding]
            region = mh.process_single_image(region, image_size=(128, 128))
            x_list.append(x)
            all_regions.append(region)
            if counter % 7 == 6:
                sorted_indices = sorted(range(len(x_list)), key=lambda k: x_list[k])
                for i, index in enumerate(sorted_indices):
                    if check_box(all_regions[counter-6:counter+1][index], method=1) == 0:
                        students[key_list[person]]['attendance'][i] = 0
                    elif check_box(all_regions[counter-6:counter+1][index], method=1) == 1:
                        students[key_list[person]]['signatures'].append(all_regions[counter-6:counter+1][index])
                person += 1
                x_list.clear()
            counter += 1
        if person > len(key_list):
            break
    del all_regions
    del x_list
    return students

def comparison_algorithm(signatures: list, model: object, threshold: float = 0.75) -> tuple:
    """
    Compares signatures using a similarity model to detect groups of similar signatures.

    Parameters:
        - signatures (list): List containing processed signature images.
        - model (object): Trained model for similarity comparison.
        - threshold (float, optional): Similarity threshold for considering signatures as similar. Defaults to 0.75.

    Returns:
        - tuple: A tuple containing the scores of each signature and the detected groups of similar signatures.
            - scores (np.ndarray): Array containing the scores of each signature.
            - groups (list): List of lists containing indices of signatures grouped together as similar.
    """
    num_signatures = len(signatures)
    scores = np.ones(num_signatures)
    groups = []
    for i in range(num_signatures):
        if scores[i] != 0:
            group_indices = [i]
            for j in range(i + 1, num_signatures):
                if scores[j] != 0:
                    similarity_score = mh.model_prediction_function(model, signatures[i], signatures[j])[1]
                    print(f"- Similarity Score : {similarity_score:.5f}\n")
                    if similarity_score >= threshold:
                        scores[i] += 1
                        scores[j] = 0
                        group_indices.append(j)
            groups.append(group_indices)
    return scores, groups

def main():
    path_1 = 'attendance_sample_4.jpg'
    image_1 = np.array(Image.open(path_1))

    # extract student number information
    students = extract_students(image_1)

    if len(students) != 15:
        print(f"Warning: Expected 15 student IDs, but found {len(students)}. Please try again.")
    else:
        # detect signatures on sample image 1
        students = detect_signatures(image_1, students)

        # display student info
        print("\n--- STUDENT INFO ---\n")
        for id, info in students.items():
            print(f"- Student ID: {id}, Attendance List: {info['attendance']}")

        # model operations
        base_model = mh.create_snn_model((128, 128, 1))
        model = mh.model_building(base_model)
        print("\n--- MODEL RESULTS ---\n")
        for id, info in students.items():
            info['scores'], groups = comparison_algorithm(info['signatures'], model)
            print(f"ID: {id}")
            print(f"Scores: {info['scores']}")
            print(f"Groups: {groups}\n\n")

if __name__ == "__main__":
    main()
