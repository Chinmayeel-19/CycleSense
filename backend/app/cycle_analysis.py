
from datetime import date, timedelta
from statistics import mean, pstdev


def analyze_menstrual_cycle(period_dates):
    """
    Analyze menstrual cycle history and estimate the next period.
    Uses unique period start dates.
    """

    if len(period_dates) < 2:
        return {
            "status": "Insufficient data",
            "message": "At least two period start dates are required."
        }

    # Convert dates and remove duplicate entries
    dates = sorted(
        set(date.fromisoformat(d) for d in period_dates)
    )

    if len(dates) < 2:
        return {
            "status": "Insufficient data",
            "message": "At least two unique period start dates are required."
        }

    # Calculate cycle lengths
    cycle_lengths = [
        (dates[i] - dates[i - 1]).days
        for i in range(1, len(dates))
    ]

    # Identify plausible cycle lengths
    valid_cycles = [
        length for length in cycle_lengths
        if 21 <= length <= 45
    ]

    short_cycles = [
        length for length in cycle_lengths if length < 21
    ]

    long_cycles = [
        length for length in cycle_lengths if length > 45
    ]

    if not valid_cycles:
        return {
            "status": "Insufficient valid data",
            "cycle_lengths": cycle_lengths,
            "message": "No cycle lengths between 21 and 45 days were found."
        }

    # Calculate average cycle length
    average_length = round(mean(valid_cycles))

    # Calculate variation between valid cycles
    variation = round(pstdev(valid_cycles), 2)

    # Basic pattern assessment
    if short_cycles or long_cycles:
        pattern = "Cycles outside the 21–45 day screening range detected"
    elif variation <= 7:
        pattern = "Relatively consistent recorded cycles"
    else:
        pattern = "Variable recorded cycles"

    # Estimate next period
    last_period = dates[-1]
    predicted_date = last_period + timedelta(days=average_length)

    # Estimate date range using observed variation
    date_variation = max(
        2,
        round((max(valid_cycles) - min(valid_cycles)) / 2)
    )

    return {
        "status": "Analysis completed",
        "cycle_lengths": cycle_lengths,
        "valid_cycle_lengths": valid_cycles,
        "average_cycle_length": average_length,
        "cycle_variation_days": variation,
        "pattern_assessment": pattern,
        "short_cycles_detected": short_cycles,
        "long_cycles_detected": long_cycles,
        "predicted_next_period": predicted_date.isoformat(),
        "estimated_date_range": {
            "start": (predicted_date - timedelta(days=date_variation)).isoformat(),
            "end": (predicted_date + timedelta(days=date_variation)).isoformat()
        },
        "explanation": (
            "The assessment is based on recorded period start dates. "
            "It is a screening insight, not a medical diagnosis."
        )
    }
