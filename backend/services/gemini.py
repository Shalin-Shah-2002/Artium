import json
import os
import requests
from typing import Dict, Any, List
from fastapi import HTTPException
import google.generativeai as genai

def _call_gemini_rest_api(api_key: str, prompt: str, max_tokens: int = 8192) -> str:
    """
    Call Gemini API using REST endpoint directly.
    This bypasses SDK limitations and works better with proxies.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topP": 0.95,
            "topK": 40,
            "maxOutputTokens": max_tokens,
        }
    }
    
    # Get proxy settings from environment if available
    proxies = {}
    if os.environ.get("HTTPS_PROXY"):
        proxies["https"] = os.environ.get("HTTPS_PROXY")
    if os.environ.get("HTTP_PROXY"):
        proxies["http"] = os.environ.get("HTTP_PROXY")
    
    try:
        response = requests.post(
            url, 
            headers=headers, 
            json=payload, 
            proxies=proxies if proxies else None,
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            if "candidates" in result and len(result["candidates"]) > 0:
                content = result["candidates"][0]["content"]["parts"][0]["text"]
                return content
            else:
                raise Exception("No content in Gemini response")
        elif response.status_code == 400:
            error_data = response.json()
            error_msg = error_data.get("error", {}).get("message", "Unknown error")
            if "location" in error_msg.lower() or "region" in error_msg.lower():
                raise HTTPException(
                    status_code=400,
                    detail="Geographic restriction detected. Solutions: 1) Use VPN (connect to US/EU) 2) Set proxy: export HTTPS_PROXY=http://proxy:port 3) Deploy backend in supported region. More info: https://ai.google.dev/gemini-api/docs/available-regions"
                )
            raise HTTPException(status_code=400, detail=error_msg)
        elif response.status_code == 401 or response.status_code == 403:
            raise HTTPException(status_code=401, detail="Invalid Gemini API key")
        elif response.status_code == 429:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        else:
            raise HTTPException(status_code=response.status_code, detail=f"API error: {response.text}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error calling Gemini API: {str(e)}")

def generate_article_with_gemini(
    api_key: str,
    title: str,
    tone: str | None,
    audience: str | None,
    topics: List[str] | None,
    additional_prompt: str | None = None,
) -> Dict[str, Any]:
    """
    Generate a Medium-style article using Google Gemini API.
    
    Args:
        api_key: User's Gemini API key
        title: Article title
        tone: Writing tone (informative, persuasive, casual, professional)
        audience: Target audience description
        topics: List of key topics/points to cover
    
    Returns:
        Dict with structure: { title, tags, sections: [{id, heading, content, order}] }
    """
    if not api_key:
        raise HTTPException(status_code=400, detail="Missing Gemini API key.")
    
    try:
        # Build the prompt
        tone_text = tone or "neutral and informative"
        audience_text = f" for {audience}" if audience else ""
        topics_text = ""
        if topics and len(topics) > 0:
            topics_list = "\n".join([f"- {t}" for t in topics])
            topics_text = f"\n\nKey topics to cover:\n{topics_list}"

        narrative_text = ""
        if additional_prompt:
            narrative_text = (
                "\n\nAdditional narrative guidance from the author (use this to shape the storytelling voice, structure, and details):\n"
                f"{additional_prompt.strip()}\n"
            )

        prompt = f"""You are an expert Medium article writer known for producing long-form, insightful, and well-structured content. Write a complete, polished Medium-style article using the following specifications:

Title: {title}
Tone: {tone_text}
Audience: General readers{audience_text}
{topics_text}
{narrative_text}

Your response MUST be structured strictly as a JSON object in this exact format:
{{
  "title": "Refined, SEO-friendly version of the given title",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "sections": [
    {{"id": "intro", "heading": "Introduction", "content": "Engaging 3-5 paragraphs (200-350 words) introducing the topic with a strong hook, context, and reader motivation.", "order": 1}},
    {{"id": "section-1", "heading": "First Main Point", "content": "3-5 well-developed paragraphs (250-400 words) explaining the first major theme with clear examples and insights.", "order": 2}},
    {{"id": "section-2", "heading": "Second Main Point", "content": "3-5 paragraphs (250-400 words) offering deeper exploration, comparisons, or practical explanations.", "order": 3}},
    {{"id": "section-3", "heading": "Additional Insight", "content": "3-5 paragraphs (250-400 words) adding another analytical dimension, case study, or real-world scenario if relevant.", "order": 4}},
    {{"id": "section-4", "heading": "Fourth Insight", "content": "3-5 paragraphs (250-400 words) extending the article with expert guidance, actionable advice, or advanced concepts.", "order": 5}},
    {{"id": "conclusion", "heading": "Conclusion", "content": "2-4 paragraphs (150-250 words) summarizing the article, reinforcing key lessons, and ending with a compelling takeaway.", "order": 6}}
  ]
}}

Requirements:
- Final article length must be 1,500-2,500+ words.
- Maintain a professional yet conversational Medium writing tone.
- Use short, readable paragraphs.
- Include storytelling, examples, analogies, and practical insights.
- Ensure smooth transitions between sections.
- This article will be copied directly into Medium. Format every section's "content" field using Medium-ready Markdown: keep paragraphs separated by a blank line, use bullet or numbered lists where helpful, highlight important phrases with **bold** or _italic_, and avoid leading/trailing whitespace.
- Ensure each paragraph within "content" ends with two newline characters ("\n\n"). For lists, use Markdown syntax ("- item" or "1. item") with one item per line so Medium renders bullets correctly.
- Do NOT add Markdown heading markers inside the "content" field—the "heading" value will be rendered as the Medium heading for that section.
- Output ONLY valid JSON—no markdown code fences, no explanations, no additional commentary.
"""

        # Use REST API for better proxy/region support
        response_text = _call_gemini_rest_api(api_key, prompt, max_tokens=8192)
        
        # Clean up response if it's wrapped in markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON response
        article_data = json.loads(response_text)
        
        # Validate structure
        if "title" not in article_data or "sections" not in article_data:
            raise ValueError("Invalid response structure from Gemini")
        
        # Ensure tags exist
        if "tags" not in article_data:
            article_data["tags"] = []

        if additional_prompt is not None:
            article_data["additionalPrompt"] = additional_prompt
        else:
            article_data.setdefault("additionalPrompt", None)
        
        return article_data
        
    except HTTPException:
        # Re-raise HTTPExceptions from _call_gemini_rest_api
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to parse Gemini response as JSON: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate article: {str(e)}"
        )


def regenerate_section_with_gemini(
    api_key: str,
    article: Dict[str, Any],
    section_id: str,
    prompt_overrides: Dict[str, Any] | None = None
) -> Dict[str, Any]:
    """
    Regenerate a specific section of an article.
    
    Args:
        api_key: User's Gemini API key
        article: Full article object
        section_id: ID of the section to regenerate
        prompt_overrides: Optional overrides like tone, length, focus
    
    Returns:
        Updated section dict
    """
    if not api_key:
        raise HTTPException(status_code=400, detail="Missing Gemini API key.")
    
    try:
        # Find the section
        section = next((s for s in article.get("sections", []) if s.get("id") == section_id), None)
        if not section:
            raise HTTPException(status_code=404, detail="Section not found.")
        
        # Build context and prompt
        overrides = prompt_overrides or {}
        tone = overrides.get("tone", article.get("tone", "neutral"))
        focus = overrides.get("focus", "")
        
        focus_text = f"\nSpecial focus: {focus}" if focus else ""
        
        prompt = f"""Rewrite this article section with improvements:

Article Title: {article.get('title')}
Section Heading: {section.get('heading')}
Current Content: {section.get('content')}

Tone: {tone}
{focus_text}

Rewrite this section to be more engaging and informative. Return ONLY the new content text, no JSON, no markdown code blocks, just the paragraph text."""
        
        # Use REST API for better proxy/region support
        new_content = _call_gemini_rest_api(api_key, prompt, max_tokens=4096)
        
        # Return updated section
        return {
            "id": section_id,
            "heading": section.get("heading"),
            "content": new_content.strip(),
            "order": section.get("order")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate section: {str(e)}")
