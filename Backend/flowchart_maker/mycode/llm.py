import os
from dotenv import load_dotenv
load_dotenv()
from crewai import LLM
gemini_key=os.getenv("GEMINI_KEY")
gemini_llm = LLM(
    model='gemini/gemini-3.1-flash-lite-preview',
    api_key=gemini_key
)