import cv2
import numpy as np
from tensorflow.keras.models import load_model
from collections import deque

# ==================================================
# LOAD MODEL
# ==================================================
model = load_model("emotion4.h5")

labels = ["Angry", "Happy", "Neutral", "Sad"]

# ==================================================
# FACE DETECTOR
# ==================================================
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# ==================================================
# CAMERA
# ==================================================
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 540)

# ==================================================
# HISTORY FOR STABILITY
# ==================================================
history = {}

# ==================================================
# FRAME DELAY SETTINGS
# Detect only every 15 frames
# ==================================================
frame_count = 0
DETECTION_INTERVAL = 15

# Save last output for display between detections
last_results = {}

# ==================================================
# LOOP
# ==================================================
while True:

    ret, frame = cap.read()

    if not ret:
        continue

    frame = cv2.flip(frame, 1)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    frame_count += 1

    # --------------------------------------------
    # RUN DETECTION ONLY EVERY 15 FRAMES
    # --------------------------------------------
    if frame_count % DETECTION_INTERVAL == 0:

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.15,
            minNeighbors=6,
            minSize=(120,120)
        )

        last_results = {}

        for (x, y, w, h) in faces:

            roi = gray[y:y+h, x:x+w]
            roi = cv2.equalizeHist(roi)

            face48 = cv2.resize(roi, (48,48))
            face48 = face48.astype("float32") / 255.0
            face48 = face48.reshape(1,48,48,1)

            pred = model.predict(face48, verbose=0)[0]

            # -------------------------
            # Heuristics
            # -------------------------
            upper = roi[0:int(h*0.35), :]
            lower = roi[int(h*0.65):h, :]

            upper_mean = np.mean(upper)
            lower_mean = np.mean(lower)

            if lower_mean > 132:
                pred[1] += 0.18

            if upper_mean < 98:
                pred[0] += 0.16

            if lower_mean < 108 and upper_mean > 102:
                pred[3] += 0.16

            if np.argmax(pred) == 2:
                if pred[3] > pred[2] - 0.07:
                    pred[3] += 0.10
                if pred[0] > pred[2] - 0.07:
                    pred[0] += 0.10

            pred = pred / np.sum(pred)

            top2 = pred.argsort()[-2:][::-1]

            i1 = top2[0]
            i2 = top2[1]

            e1 = labels[i1]
            e2 = labels[i2]

            c1 = pred[i1] * 100
            c2 = pred[i2] * 100

            # -------------------------
            # Stable face ID
            # -------------------------
            cx = x + w//2
            cy = y + h//2

            face_id = f"{cx//80}_{cy//80}"

            if face_id not in history:
                history[face_id] = deque(maxlen=6)

            history[face_id].append(i1)

            stable_idx = max(
                set(history[face_id]),
                key=history[face_id].count
            )

            e1 = labels[stable_idx]

            # Mixed logic
            if abs(c1 - c2) < 12 and e2 != e1:
                text = f"{e1}+{e2} {c1:.0f}/{c2:.0f}%"
            else:
                text = f"{e1} {c1:.0f}%"

            # Color
            color = (0,255,0)

            if e1 == "Happy":
                color = (0,255,255)

            elif e1 == "Angry":
                color = (0,0,255)

            elif e1 == "Sad":
                color = (255,0,0)

            # Save last result
            last_results[face_id] = (
                x, y, w, h, text, color
            )

    # --------------------------------------------
    # DRAW LAST RESULTS EVERY FRAME
    # --------------------------------------------
    for face_id in last_results:

        x, y, w, h, text, color = last_results[face_id]

        cv2.rectangle(frame, (x,y), (x+w,y+h), color, 2)

        cv2.putText(
            frame,
            text,
            (x, y-10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.72,
            color,
            2
        )

    cv2.imshow("AI Emotion Detector PRO", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()