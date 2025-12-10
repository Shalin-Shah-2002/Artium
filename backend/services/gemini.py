import json
from typing import Dict, Any, List
from fastapi import HTTPException
import google.generativeai as genai

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
        # Configure Gemini with user's API key
        genai.configure(api_key=api_key)
        # Use the latest Gemini 2.5 Flash model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
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

        
        # Generate content
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
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
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to parse Gemini response as JSON: {str(e)}"
        )
    except Exception as e:
        error_message = str(e)
        
        # Check for specific API errors
        if "API_KEY_INVALID" in error_message or "invalid api key" in error_message.lower():
            raise HTTPException(status_code=401, detail="Invalid Gemini API key.")
        elif "quota" in error_message.lower() or "rate limit" in error_message.lower():
            raise HTTPException(status_code=429, detail="Rate limited by Gemini API.")
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to generate article: {error_message}"
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
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
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
        
        response = model.generate_content(prompt)
        new_content = response.text.strip()
        
        # Return updated section
        return {
            "id": section_id,
            "heading": section.get("heading"),
            "content": new_content,
            "order": section.get("order")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_message = str(e)
        if "API_KEY_INVALID" in error_message or "invalid api key" in error_message.lower():
            raise HTTPException(status_code=401, detail="Invalid Gemini API key.")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to regenerate section: {error_message}")
