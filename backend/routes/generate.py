from fastapi import APIRouter, HTTPException
from schemas import GenerateRequest, SectionRegenerateRequest
from services.gemini import generate_article_with_gemini, regenerate_section_with_gemini

router = APIRouter()

@router.post("/generate")
def generate(req: GenerateRequest):
    """
    Generate a new article using Gemini AI.
    
    Body:
        - title: Article title (required)
        - tone: Writing tone (optional)
        - audience: Target audience (optional)
        - topics: List of topics to cover (optional)
        - apiKey: User's Gemini API key (required)
    
    Returns:
        - article: Generated article with title, tags, and sections
    """
    try:
        article = generate_article_with_gemini(
            api_key=req.apiKey,
            title=req.title,
            tone=req.tone,
            audience=req.audience,
            topics=req.topics,
            additional_prompt=req.additionalPrompt,
        )
        return {"article": article}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate article: {str(e)}")

@router.post("/section/regenerate")
def regenerate_section(req: SectionRegenerateRequest):
    """
    Regenerate a specific section of an article.
    
    Body:
        - article: Full article object
        - sectionId: ID of the section to regenerate
        - promptOverrides: Optional overrides for tone, focus, etc.
        - apiKey: User's Gemini API key (required)
    
    Returns:
        - section: Regenerated section
    """
    try:
        section = regenerate_section_with_gemini(
            api_key=req.apiKey,
            article=req.article,
            section_id=req.sectionId,
            prompt_overrides=req.promptOverrides
        )
        return {"section": section}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate section: {str(e)}")
