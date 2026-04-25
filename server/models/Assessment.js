const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    mood: Number,
    worry: Number,
    irritability: Number,
    sleep: Number,
    social: Number,
    concentration: Number,
    functioning: Number,
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    score: Number,
    riskLevel: String,
    recommendation: String
  },
  { timestamps: true }
);

module.exports = mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);
