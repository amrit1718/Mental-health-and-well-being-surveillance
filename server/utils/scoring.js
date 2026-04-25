const domainLabels = {
  mood: "Persistent sadness or loss of interest",
  worry: "Worry, fear, or clinginess",
  irritability: "Irritability or outbursts",
  sleep: "Sleep or energy concerns",
  concentration: "Focus and learning difficulty",
  social: "Social withdrawal",
  functioning: "Daily functioning impact"
};

const weights = {
  mood: 1.25,
  worry: 1.15,
  irritability: 1.05,
  sleep: 0.95,
  concentration: 1.05,
  social: 1,
  functioning: 1.55
};

function calculateAssessment(data) {
  const entries = Object.entries(weights);
  const weightedTotal = entries.reduce((sum, [key, weight]) => sum + data[key] * weight, 0);
  const minScore = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const maxScore = entries.reduce((sum, [, weight]) => sum + (5 * weight), 0);
  const burdenRatio = (weightedTotal - minScore) / (maxScore - minScore);
  const score = Math.round((1 - burdenRatio) * 100);
  const severeCount = Object.keys(weights).filter((key) => data[key] >= 4).length;
  const focusAreas = getFocusAreas(data);

  let riskLevel = "Low";
  if (
    score < 40 ||
    data.functioning === 5 ||
    (data.mood >= 4 && data.social >= 4 && data.functioning >= 4) ||
    severeCount >= 4
  ) {
    riskLevel = "High";
  } else if (score < 68 || severeCount >= 2 || data.functioning >= 4) {
    riskLevel = "Moderate";
  }

  return {
    score,
    riskLevel,
    recommendation: buildRecommendation(riskLevel, focusAreas),
    alertMessage:
      riskLevel === "High"
        ? "High-concern pattern detected. Please review the child promptly, consider a school counselor or licensed mental health professional, and seek urgent help immediately if the child may be unsafe."
        : "No urgent alert at this time.",
    focusAreas
  };
}

function getFocusAreas(data) {
  return Object.keys(weights)
    .map((key) => ({
      label: domainLabels[key],
      value: data[key]
    }))
    .filter((item) => item.value >= 3)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item) => item.label);
}

function buildRecommendation(riskLevel, focusAreas) {
  if (riskLevel === "High") {
    return "The pattern suggests significant concern, especially in the areas most affecting daily life. Increase observation frequency, speak with the child in a calm supportive way, involve school support staff, and arrange a professional assessment soon.";
  }

  if (focusAreas.includes(domainLabels.functioning)) {
    return "Daily functioning is starting to slip. Coordinate with caregivers or teachers, reduce avoidable pressure, and watch whether routines, participation, or relationships keep getting harder.";
  }

  if (focusAreas.includes(domainLabels.worry)) {
    return "Worry and fear seem more noticeable. Offer predictable routines, gentle reassurance, and note whether certain places, transitions, or separations trigger distress.";
  }

  if (focusAreas.includes(domainLabels.sleep)) {
    return "Sleep or energy concerns stand out. Track bedtime habits, screen time, nighttime waking, and next-day tiredness over the coming week.";
  }

  if (focusAreas.includes(domainLabels.concentration)) {
    return "Attention and learning appear affected. Break tasks into smaller steps, reduce distractions, and compare focus across schoolwork, play, and home routines.";
  }

  if (focusAreas.includes(domainLabels.social)) {
    return "Social withdrawal is worth monitoring. Notice whether the child is pulling away from peers, play, or family connection more than usual.";
  }

  return "Current observations suggest a lower level of concern. Continue regular weekly check-ins and watch for changes in mood, worry, sleep, school functioning, and social engagement.";
}

module.exports = {
  calculateAssessment
};
