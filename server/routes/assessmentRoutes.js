const express = require("express");
const authMiddleware = require("../middleware/auth");
const dataService = require("../data/dataService");
const { calculateAssessment } = require("../utils/scoring");

const router = express.Router();

router.use(authMiddleware);

function isValidScale(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

router.post("/", async (req, res) => {
  try {
    const {
      childId,
      mood,
      worry,
      irritability,
      sleep,
      social,
      concentration,
      functioning,
      notes
    } = req.body;

    const numericFields = {
      mood: Number(mood),
      worry: Number(worry),
      irritability: Number(irritability),
      sleep: Number(sleep),
      social: Number(social),
      concentration: Number(concentration),
      functioning: Number(functioning)
    };

    if (!childId) {
      return res.status(400).json({ message: "Child profile is required." });
    }

    const allValuesValid = Object.values(numericFields).every((value) => isValidScale(value));
    if (!allValuesValid) {
      return res.status(400).json({ message: "Assessment values must be between 1 and 5." });
    }

    const child = await dataService.findChildByIdForUser(childId, req.user._id);
    if (!child) {
      return res.status(404).json({ message: "Child profile not found." });
    }

    const summary = calculateAssessment(numericFields);
    const assessment = await dataService.createAssessment({
      user: req.user._id,
      child: childId,
      date: new Date(),
      ...numericFields,
      notes: notes || "",
      score: summary.score,
      riskLevel: summary.riskLevel,
      recommendation: summary.recommendation
    });

    if (summary.riskLevel === "High") {
      console.log(`[EMAIL ALERT SIMULATION] High-risk result for ${child.name}. Score: ${summary.score}%.`);
    }

    res.status(201).json({
      message: "Assessment saved successfully.",
      assessment,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to save assessment." });
  }
});

router.get("/:childId", async (req, res) => {
  try {
    const child = await dataService.findChildByIdForUser(req.params.childId, req.user._id);
    if (!child) {
      return res.status(404).json({ message: "Child profile not found." });
    }

    const assessments = await dataService.listAssessmentsByChild(req.user._id, req.params.childId);

    res.json({
      child,
      assessments
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch assessment history." });
  }
});

module.exports = router;
