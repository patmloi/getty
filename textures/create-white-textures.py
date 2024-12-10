import os
from PIL import Image
import numpy as np

files = [f for f in os.listdir() if f[-4:] == '.png' and '-WHITE' not in f]
for f in files:
    arr = np.array(Image.open(f))
    arr[arr[:,:,-1] > 0, :] = 255;
    modified = Image.fromarray(arr)
    modified.save("white/" + f)