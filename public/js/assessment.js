document.addEventListener("DOMContentLoaded", () => {
  const authNotice = document.getElementById("assessmentAuthNotice");
  const form = document.getElementById("assessmentForm");
  const childSelect = document.getElementById("childSelect");
  const assessmentMessage = document.getElementById("assessmentMessage");
  const resultScore = document.getElementById("resultScore");
  const resultRisk = document.getElementById("resultRisk");
  const resultRecommendation = document.getElementById("resultRecommendation");
  const resultFactors = document.getElementById("resultFactors");
  const highRiskAlert = document.getElementById("highRiskAlert");
  const requiredFields = ["childSelect", "mood", "worry", "irritability", "sleep", "concentration", "social", "functioning"];

  if (!App.requireAuth(authNotice, false)) {
    Array.from(form.elements).forEach((element) => {
      element.disabled = true;
    });
    return;
  }

  App.showInline(authNotice, "You are logged in. Think about the last 2 weeks and complete the check-in.", "success");

  function setFieldError(element, message) {
    const wrapper = element.closest(".form-group") || element.closest(".question-card");
    const errorField = wrapper ? wrapper.querySelector(".field-error") : null;

    if (wrapper) {
      wrapper.classList.toggle("has-error", Boolean(message));
    }

    if (errorField) {
      errorField.textContent = message;
    }
  }

  function validateField(element) {
    if (!element.value.trim()) {
      setFieldError(element, "This field is required.");
      return false;
    }

    setFieldError(element, "");
    return true;
  }

  requiredFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    field.addEventListener("change", () => validateField(field));
  });

  async function loadChildren() {
    try {
      const response = await App.apiRequest("/children");
      const children = response.children || [];

      childSelect.innerHTML = '<option value="">Choose a child profile</option>';

      children.forEach((child) => {
        const option = document.createElement("option");
        option.value = child._id;
        option.textContent = `${child.name} (${child.age} yrs)`;
        childSelect.appendChild(option);
      });

      if (!children.length) {
        App.showMessage(assessmentMessage, "No child profiles found yet. Please add one from the dashboard first.", "error");
      }
    } catch (error) {
      App.showMessage(assessmentMessage, error.message, "error");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let isValid = true;
    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (!validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      App.showMessage(assessmentMessage, "Please complete all required assessment fields.", "error");
      return;
    }

    const payload = {
      childId: childSelect.value,
      mood: Number(document.getElementById("mood").value),
      worry: Number(document.getElementById("worry").value),
      irritability: Number(document.getElementById("irritability").value),
      sleep: Number(document.getElementById("sleep").value),
      concentration: Number(document.getElementById("concentration").value),
      social: Number(document.getElementById("social").value),
      functioning: Number(document.getElementById("functioning").value),
      notes: document.getElementById("notes").value.trim()
    };

    try {
      App.showMessage(assessmentMessage, "Submitting assessment...");
      const response = await App.apiRequest("/assessments", {
        method: "POST",
        body: payload
      });

      const summary = response.summary;
      resultScore.textContent = `${summary.score}%`;
      resultRisk.textContent = summary.riskLevel;
      resultRecommendation.textContent = summary.recommendation;
      resultFactors.innerHTML = (summary.focusAreas || [])
        .map((factor) => `<span class="pill">${factor}</span>`)
        .join("");

      if (summary.riskLevel === "High") {
        highRiskAlert.classList.remove("hidden");
        highRiskAlert.className = "alert-box error";
        highRiskAlert.textContent = summary.alertMessage;
      } else {
        highRiskAlert.classList.add("hidden");
        highRiskAlert.textContent = "";
      }

      App.showMessage(assessmentMessage, "Assessment submitted successfully.", "success");
      form.reset();
    } catch (error) {
      App.showMessage(assessmentMessage, error.message, "error");
    }
  });

  loadChildren();
});
