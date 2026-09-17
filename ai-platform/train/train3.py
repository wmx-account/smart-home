# import cv2
# video = cv2.VideoCapture("./datasets/BVN.mp4")
# num = 0
# step = 30
# while True:
#     ret, frame = video.read()
#     if not ret:
#         break
#     num += 1
#     if num % step == 0 :
#         cv2.imwrite("./datasets/images/train/" + str(num) + ".jpg", frame)


from ultralytics import YOLO

model = YOLO("yolo11n.pt")

result = model.train(
    data = "bvn.yaml",
    epochs = 50,
    workers = 0
)