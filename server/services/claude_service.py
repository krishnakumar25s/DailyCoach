import os
import json
import logging
from collections import Counter
from typing import List, Dict, Any
from anthropic import Anthropic

logger = logging.getLogger("dailycoach.claude_service")

# Read ANTHROPIC_API_KEY
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
client = None

if anthropic_api_key:
    try:
        client = Anthropic(api_key=anthropic_api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize Anthropic client: {e}. Falling back to mock analyzer.")
else:
    logger.warning("ANTHROPIC_API_KEY not found in environment variables. Falling back to mock analyzer.")

def _generate_mock_feedback(logs: List[Dict[str, Any]]) -> str:
    """Generates a deterministic feedback string based on averages and patterns in the logs."""
    if not logs:
        return (
            "You have no focus logs recorded for the last 7 days. "
            "Start by logging your focus sessions, energy levels, and MITs to unlock customized coaching insights. "
            "Tomorrow, focus on logging at least one deep work session."
        )

    count = len(logs)
    total_focus = sum(log.get("focus_minutes") or 0 for log in logs)
    total_energy = sum(log.get("energy") or 0 for log in logs)
    mit_completed = sum(1 for log in logs if log.get("mit_done"))

    avg_focus = total_focus / count
    avg_energy = total_energy / count
    mit_rate = (mit_completed / count) * 100

    # Extract most common top distraction
    distractions = [log.get("top_distraction") for log in logs if log.get("top_distraction")]
    if distractions:
        most_common_distraction = Counter(distractions).most_common(1)[0][0]
    else:
        most_common_distraction = "unspecified distractions"

    if avg_energy < 3.0:
        # Low energy branch
        return (
            f"Your focus minutes averaged {avg_focus:.1f} per day with a low average energy level of {avg_energy:.1f}/5. "
            f"Your MIT completion rate was {mit_rate:.0f}%, with '{most_common_distraction}' frequently breaking your flow. "
            f"This indicates high fatigue limiting your daily focus capacity. "
            f"Tomorrow, prioritize a 30-minute recovery break after your first 90-minute focus session."
        )
    else:
        # High energy branch
        return (
            f"You maintained a solid energy average of {avg_energy:.1f}/5, logging an average of {avg_focus:.1f} focus minutes daily. "
            f"Your MIT completion rate stands at {mit_rate:.0f}%, showing high productivity when your focus is maintained. "
            f"However, '{most_common_distraction}' remains your primary obstacle. "
            f"Tomorrow, put your phone in another room during your first deep work block to keep distraction at bay."
        )

def get_coach_insights(last_7_days_logs: List[Dict[str, Any]]) -> str:
    """Fetches coaching insights from Claude or falls back to rules-based feedback."""
    if not last_7_days_logs:
        return _generate_mock_feedback([])

    if not client:
        return _generate_mock_feedback(last_7_days_logs)

    try:
        # Prepare log information for model consumption
        cleaned_logs = []
        for log in last_7_days_logs:
            cleaned_logs.append({
                "date": str(log.get("date")),
                "sessions_count": log.get("sessions_count"),
                "focus_minutes": log.get("focus_minutes"),
                "energy": log.get("energy"),
                "mit_done": log.get("mit_done"),
                "top_distraction": log.get("top_distraction"),
                "notes": log.get("notes")
            })

        prompt = f"""You are DailyCoach, a deep-work productivity analyst.

User's last 7 days of focus logs:
{json.dumps(cleaned_logs, indent=2, default=str)}

Respond with:
1. One focus-killing pattern you notice (cite the data).
2. How energy level correlates with focus minutes and MIT completion.
3. The single highest-leverage scheduling change for tomorrow.

Be direct, data-specific, and concrete. Max 4 sentences. No fluff, no preamble."""

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022", # Sonnet model
            max_tokens=280,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        if response.content and response.content[0]:
            return response.content[0].text.strip()
        
        raise ValueError("Empty response text from Anthropic API")

    except Exception as e:
        logger.warning(f"Error calling Anthropic API: {e}. Falling back to mock analyzer.")
        return _generate_mock_feedback(last_7_days_logs)
