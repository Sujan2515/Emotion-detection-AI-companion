import base64
import sys
from pathlib import Path

# Ensure backend imports resolve when run from repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from services import emotion_service


def main():
    img_path = Path(__file__).resolve().parents[1] / "AI_companion_final" / "fer-2013" / "test" / "happy" / "PrivateTest_10077120.jpg"
    print("Image:", img_path)
    b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
    data_url = "data:image/jpeg;base64," + b64

    print("Model path:", emotion_service._resolve_model_path())

    face48, stats = emotion_service._preprocess_for_model(data_url)
    print("preprocess type:", type(face48), "stats:", stats)
    if face48 is not None:
        try:
            import numpy as np

            print("preprocess shape:", face48.shape, "dtype:", face48.dtype, "min/max:", float(np.min(face48)), float(np.max(face48)))
        except Exception as e:
            print("numpy inspect failed:", repr(e))

    try:
        res = emotion_service._predict_emotion_ml(data_url)
        print("_predict_emotion_ml:", res)
    except Exception as e:
        print("_predict_emotion_ml raised:", repr(e))

    print("predict_emotion:", emotion_service.predict_emotion(data_url))


if __name__ == "__main__":
    main()
