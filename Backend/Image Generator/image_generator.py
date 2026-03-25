
from bytez import Bytez
import os
from dotenv import load_dotenv
load_dotenv()
key = os.getenv("BYTEZ_API_KEY")
sdk = Bytez(key)

# choose stable-diffusion-xl-base-1.0
model = sdk.model("stabilityai/stable-diffusion-xl-base-1.0")

output= model.run("a rafale fighter jet launching a bramhos ")

print(output)