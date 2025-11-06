# # ai_services.py

import json
import librosa
from django.conf import settings
from groq import Groq

client = Groq(api_key=settings.GROQ_AI_API_KEY)

def analyze_track_with_ai(audio_file_path, title, artist_name):
    """
    Use AI + Groq to generate metadata for uploaded tracks.
    """
    try:
        # 1. Extract audio features
        y, sr = librosa.load(audio_file_path, duration=30)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = int(tempo)

        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key = int(chroma.mean(axis=1).argmax())

        # 2. AI metadata classification
        prompt = f"""
        Analyze this African music track:
        Title: {title}
        Artist: {artist_name}
        BPM: {bpm}

        Provide:
        1. Genre
        2. Sub-genre
        3. Mood
        4. Short description (2 sentences)
        5. 5 keywords (tags)

        Format result as JSON.
        """

        response = client.chat.completions.create(
                model="openai/gpt-oss-120b",  
                messages=[
                {
                    "role": "system",
                    "content": "You are an African music metadata analyst."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        ai_metadata = response.choices[0].message.content

        return {
            "bpm": bpm,
            "key": key,
            "ai_analysis": ai_metadata
        }

    except Exception as e:
        print(f"[AI Analysis] Failed: {e}")
        return None

# from django.conf import settings
# from mutagen import File as MutagenFile
# import librosa  # For audio analysis
# import json


# from groq import Groq

# client = Groq(api_key=settings.GROQ_AI_API_KEY)


# response = client.chat.completions.create(
#     model="openai/gpt-oss-120b",
#     messages=[{"role": "user", "content": "Analyze this song"}]
# )



# # client = genai.Client()

# # response = client.models.generate_content(
# #     model="gemini-2.5-flash",
# #     contents="How does AI work?"
# # )
# # print(response.text)



# # claudeai.api_key = settings.CLAUDE_AI_API_KEY
# # client = Anthropic(api_key=settings.CLAUDE_AI_API_KEY)


# def analyze_track_with_ai(audio_file_path, title, artist_name):
#     """
#     Use AI to generate metadata for uploaded tracks.
#     """
#     try:
#         # 1. Extract audio features
#         y, sr = librosa.load(audio_file_path, duration=30)  # First 30 seconds
        
#         # Get BPM
#         tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
#         bpm = int(tempo)
        
#         # Get key
#         chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
#         key = chroma.mean(axis=1).argmax()
        
#         # 2. Use AI for genre/mood classification
#         prompt = f"""
#         Analyze this African music track:
#         Title: {title}
#         Artist: {artist_name}
#         BPM: {bpm}
        
#         Provide:
#         1. Genre (Afrobeats, Amapiano, Highlife, Afro-fusion, etc.)
#         2. Sub-genre
#         3. Mood (Happy, Sad, Energetic, Chill, Party, etc.)
#         4. Short description (2 sentences)
#         5. Tags (5 keywords)
        
#         Format as JSON.
#         """
        
#         response = client.chat.completions.create(
#             model="openai/gpt-oss-120b",
#             max_tokens=500,
#             messages=[
#                 {"role": "system", "content": "You are a music metadata expert specializing in African music."},
#                 {"role": "user", "content": prompt}
#             ],
#             response_format={"type": "json_object"}
#         )
        
#         ai_metadata = response.choices[0].message.content
        
#         return {
#             'bpm': bpm,
#             'key': key,
#             'ai_analysis': ai_metadata
#         }
        
#     except Exception as e:
#         print(f"AI analysis error: {e}")
#         return None


# def smart_search_tracks(query):
#     """
#     AI-powered natural language search.
#     """
#     prompt = f"""
#     User search query: "{query}"
    
#     Extract:
#     1. Genre preference
#     2. Mood preference
#     3. Artist name (if mentioned)
#     4. Language preference
#     5. Any specific requirements
    
#     Return as JSON with keys: genre, mood, artist, language, keywords
#     """
    
#     response = client.chat.completions.create(
#             model="llama3-8b-8192",
#             max_tokens=500,
#         messages=[
#             {"role": "system", "content": "You are a music search assistant."},
#             {"role": "user", "content": prompt}
#         ],
#         response_format={"type": "json_object"}
#     )
    
#     search_params = response.choices[0].message.content
#     return search_params