import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import cv2
import numpy as np
import tensorflow as tf
from keras.models import Model, Sequential # type: ignore
from keras.layers import Conv2D, Dense, Dropout, Flatten, Input, Lambda, MaxPooling2D # type: ignore
from keras.regularizers import l1_l2 # type: ignore
from keras import backend as K

def process_single_image(image: np.ndarray, image_size: tuple) -> np.ndarray:
    """
    Process a single image for model input.
    
    Parameters:
        - image (np.ndarray): Input image.
        - img_size (tuple): Size to resize the image.
        
    Returns:
        - np.ndarray: Processed image.
    """
    resized_img = cv2.resize(image, image_size)
    processed_img = cv2.normalize(resized_img, None, 0, 1, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    return processed_img

def euclidean_distance(vectors: tuple) -> tf.Tensor:
    """
    Compute the Euclidean distance between two vectors.
    
    Parameters:
        - vectors (tuple): Tuple containing two vectors.
        
    Returns:
        - tf.Tensor: Euclidean distance.
    """
    vector1, vector2 = vectors
    sum_square = tf.reduce_sum(tf.square(vector1 - vector2), axis=1, keepdims=True)
    return tf.sqrt(tf.maximum(sum_square, tf.keras.backend.epsilon()))

def contrastive_loss(label: tf.Tensor, distance: tf.Tensor, margin: float = 1.0, alpha: float = 1.75, beta: float = 1.0) -> tf.Tensor:
    """
    Define the contrastive loss function.
    
    Parameters:
        - label (tf.Tensor): True labels.
        - distance (tf.Tensor): Distance between two vectors.
        - margin (float): Margin value for contrastive loss.
        - alpha (float): Weight for original signatures in loss calculation.
        - beta (float): Weight for different signatures in loss calculation.
        
    Returns:
        - tf.Tensor: Contrastive loss value.
    """
    distance = tf.cast(distance, dtype=tf.float32)
    label = tf.cast(label, dtype=tf.float32)
    loss_same = (1 - label) * K.square(distance)
    loss_diff = label * K.square(K.maximum(margin - distance, 0))
    weighted_loss_same = alpha * loss_same
    weighted_loss_diff = beta * loss_diff
    loss = K.mean(weighted_loss_same + weighted_loss_diff)
    return loss

def custom_accuracy(label: tf.Tensor, distance: tf.Tensor, threshold: float = 0.7) -> tf.Tensor:
    """
    Calculate the custom accuracy metric for the model.
    
    Parameters:
        - label (tf.Tensor): True labels.
        - distance (tf.Tensor): Distance between two vectors.
        - threshold (float): Threshold value for binary classification.
        
    Returns:
        - tf.Tensor: Custom accuracy value.
    """
    distance = tf.cast(distance, dtype=tf.float32)
    distance_binary = tf.cast(distance >= threshold, dtype=tf.float32)
    accuracy = tf.reduce_mean(tf.cast(tf.equal(label, distance_binary), dtype=tf.float32))
    return accuracy

def f1_score(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Calculate the F1 score metric for the model.

    Args:
        - y_true (np.ndarray): True labels.
        - y_pred (np.ndarray): Predicted labels.

    Returns:
        - float: F1 score value.
    """
    true_positives = K.sum(K.round(K.clip(y_true * y_pred, 0, 1)))
    predicted_positives = K.sum(K.round(K.clip(y_pred, 0, 1)))
    possible_positives = K.sum(K.round(K.clip(y_true, 0, 1)))
    
    precision = true_positives / (predicted_positives + K.epsilon())
    recall = true_positives / (possible_positives + K.epsilon())
    
    f1_score = 2 * ((precision * recall) / (precision + recall + K.epsilon()))
    return f1_score

def create_snn_model(input_shape: tuple) -> Model:
    """
    Create a Siamese Neural Network model.
    
    Parameters:
        - input_shape (tuple): Input shape for the model.
        
    Returns:
        - Model: SNN model.
    """
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Conv2D(256, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Flatten(name='flatten'),
        Dense(1024, activation='relu', kernel_regularizer=l1_l2(0.00005)),
        Dropout(0.2),
        Dense(512, activation='relu'),
        Dropout(0.2),
        Dense(256, activation='relu'),
        Dropout(0.2),
        Dense(128, activation='relu')
    ])
    input1 = Input(shape=input_shape)
    input2 = Input(shape=input_shape)
    encoded_input1 = model(input1)
    encoded_input2 = model(input2)
    distance = Lambda(euclidean_distance, output_shape=(1,))([encoded_input1, encoded_input2])
    output = Dense(1, activation='sigmoid')(distance)
    snn_model = Model(inputs=[input1, input2], outputs=output)
    return snn_model

def calculate_similarity_score(distance: np.ndarray) -> float:
    """
    Calculate the similarity score.
    
    Parameters:
        - distance (np.ndarray): Distance between two vectors.
        
    Returns:
        - float: Similarity score.
    """
    number = 0.999 - (distance[0][0] * 0.025)
    sim_score = (1 - distance[0][0]) / 0.5
    sim_score = max(0, min(number, sim_score))
    return sim_score

def model_prediction_function(model: Model, img1: np.ndarray, img2: np.ndarray) -> tuple:
    """
    Predict using the model.
    
    Parameters:
        - model (Model): Trained model.
        - img1 (np.ndarray): First input image.
        - img2 (np.ndarray): Second input image.
        
    Returns:
        - tuple: Distance between images and similarity score.
    """
    tmp_img1 = np.expand_dims(img1, axis=0)
    tmp_img2 = np.expand_dims(img2, axis=0)
    distance = model.predict([tmp_img1, tmp_img2])
    similarity_score = calculate_similarity_score(distance)
    return distance, similarity_score

def model_building(model: Model) -> Model:
    """
    Build and compile the model.
    
    Parameters:
        - model (Model): SNN model.
        
    Returns:
        - Model: Compiled SNN model.
    """
    model.compile(optimizer='adam',
                loss=contrastive_loss,
                metrics=[custom_accuracy, f1_score])
    model.load_weights('model_snn.h5')
    return model
