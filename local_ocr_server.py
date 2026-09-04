import uvicorn
from fastapi import FastAPI, UploadFile, File
import pytesseract
from PIL import Image
import io
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    print(f"Received image: {file.filename}")
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    
    # Run Tesseract with custom model
    # Note: Make sure myformmodel.traineddata is in your Tesseract tessdata folder!
    try:
        data = pytesseract.image_to_data(image, lang='myformmodel', output_type=pytesseract.Output.DICT)
        print("OCR successful!")
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        print("Fallback to English OCR...")
        data = pytesseract.image_to_data(image, lang='eng', output_type=pytesseract.Output.DICT)
    
    boxes = []
    n_boxes = len(data['level'])
    for i in range(n_boxes):
        if int(data['conf'][i]) > 0: # Filter out empty/invalid boxes
            text = data['text'][i].strip()
            if text:
                boxes.append({
                    "text": text,
                    "x": data['left'][i],
                    "y": data['top'][i],
                    "width": data['width'][i],
                    "height": data['height'][i]
                })
    
    return {"boxes": boxes}

if __name__ == "__main__":
    print("========================================")
    print("Starting Desktop OCR Server on port 8000")
    print("Make sure you allow Python through your Windows Firewall if asked!")
    print("========================================")
    uvicorn.run(app, host="0.0.0.0", port=8000)
