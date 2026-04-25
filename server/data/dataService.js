const User = require("../models/User");
const Child = require("../models/Child");
const Assessment = require("../models/Assessment");

function plain(document) {
  if (!document) return null;
  return typeof document.toObject === "function" ? document.toObject() : document;
}

async function findUserByEmail(email) {
  return await User.findOne({ email: email.toLowerCase() });
}

async function getUserById(id) {
  return await User.findById(id);
}

async function createUser(data) {
  const user = await User.create(data);
  return plain(user);
}

async function listChildrenByUser(userId) {
  const children = await Child.find({ user: userId }).sort({ createdAt: -1 });
  return children.map((child) => plain(child));
}

async function createChild(data) {
  const child = await Child.create(data);
  return plain(child);
}

async function findChildByIdForUser(childId, userId) {
  const child = await Child.findOne({ _id: childId, user: userId });
  return plain(child);
}

async function createAssessment(data) {
  const assessment = await Assessment.create(data);
  return plain(assessment);
}

async function listAssessmentsByChild(userId, childId) {
  const assessments = await Assessment.find({ user: userId, child: childId }).sort({ date: 1 });
  return assessments.map((assessment) => plain(assessment));
}

module.exports = {
  findUserByEmail,
  getUserById,
  createUser,
  listChildrenByUser,
  createChild,
  findChildByIdForUser,
  createAssessment,
  listAssessmentsByChild
};
