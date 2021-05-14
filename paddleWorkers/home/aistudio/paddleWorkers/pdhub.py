
from flask import request, Flask
import json
import paddlehub as hub
import cv2
import requests
import os


app = Flask(__name__)
ocr = None


@app.route('/imageOcr', methods=['GET'])
def image_ocr():
    path = request.args.get('imagePath')
    print(path)
    file_name = os.path.basename(path)
    file_down = requests.get(path)
    with open('/mnt/'+file_name,'wb') as f:
        f.write(file_down.content)
    ocr_res = ocr.recognize_text(images=[cv2.imread('/mnt/'+file_name)])
    data = ocr_res[0]['data']
    res_data = {}
    text = []
    for item in data:
        text.append(item['text'])
    res_data['msg'] = '请求成功'
    res_data['code'] = 200
    res_data['data'] = text
    os.remove('/mnt/'+file_name)
    return json.dumps(res_data,ensure_ascii=False)



def load_model():
    global ocr
    ocr = hub.Module(name="chinese_ocr_db_crnn_server")


if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=9000)
