const express = require("express");
const authMiddleware = require("../middleware/auth");
const dataService = require("../data/dataService");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const children = await dataService.listChildrenByUser(req.user._id);
    res.json({ children });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch child profiles." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, age, gender, school, guardianNotes } = req.body;
    const numericAge = Number(age);

    if (!name || !numericAge || !gender) {
      return res.status(400).json({ message: "Child name, age, and gender are required." });
    }

    const child = await dataService.createChild({
      user: req.user._id,
      name,
      age: numericAge,
      gender,
      school: school || "",
      guardianNotes: guardianNotes || ""
    });

    res.status(201).json({
      message: "Child profile saved successfully.",
      child
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to save child profile." });
  }
});

module.exports = router;
