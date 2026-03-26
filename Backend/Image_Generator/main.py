import base64
import os
from typing import Any

from bytez import Bytez
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

load_dotenv()
key = os.getenv("BYTEZ_API_KEY")
sdk = Bytez(key)
DEFAULT_MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0"

app = FastAPI(title="Image_Generator Backend")


class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Prompt used to generate the image")
    model_id: str = Field(DEFAULT_MODEL_ID, description="Bytez model ID")


class GenerateImageResponse(BaseModel):
    model_id: str
    result: Any


def _serialize_result(result: Any) -> Any:
    if isinstance(result, (bytes, bytearray)):
        return {"base64": base64.b64encode(result).decode("utf-8")}
    return result


def _run_generation(prompt: str, model_id: str) -> Any:
    api_key = os.getenv("BYTEZ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="BYTEZ_API_KEY is not set")

    try:
        sdk = Bytez(api_key)
        model = sdk.model(model_id)
        output = model.run(prompt)
        return _serialize_result(output)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {exc}") from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate", response_model=GenerateImageResponse)
def generate_image(payload: GenerateImageRequest) -> GenerateImageResponse:
    result = _run_generation(payload.prompt, payload.model_id)
    return GenerateImageResponse(model_id=payload.model_id, result=result)

