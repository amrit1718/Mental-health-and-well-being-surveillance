document.addEventListener("DOMContentLoaded", () => {
  const authNotice = document.getElementById("dashboardAuthNotice");
  const childForm = document.getElementById("childForm");
  const childMessage = document.getElementById("childMessage");
  const childrenList = document.getElementById("childrenList");
  const overviewText = document.getElementById("overviewText");
  const childOverview = document.getElementById("childOverview");
  const historyList = document.getElementById("historyList");
  const totalChildrenValue = document.getElementById("totalChildrenValue");
  const assessmentCountValue = document.getElementById("assessmentCountValue");
  const latestScoreValue = document.getElementById("latestScoreValue");
  const latestRiskValue = document.getElementById("latestRiskValue");
  let currentChildId = "";
  let trendChart;
  let riskChart;
  let childrenCache = [];

  if (!App.requireAuth(authNotice, false)) {
    Array.from(childForm.elements).forEach((element) => {
      element.disabled = true;
    });
    return;
  }

  App.showInline(authNotice, "You are logged in. Add child profiles and review assessments below.", "success");

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function destroyCharts() {
    if (trendChart) {
      trendChart.destroy();
    }
    if (riskChart) {
      riskChart.destroy();
    }
  }

  function renderEmptyState() {
    childOverview.querySelector("h3").textContent = "Select a child profile to see details";
    overviewText.textContent = "The dashboard will show profile details, the latest recommendation, and risk trends.";
    historyList.innerHTML = '<p class="muted-text">No assessment history to display yet.</p>';
    assessmentCountValue.textContent = "0";
    latestScoreValue.textContent = "--";
    latestRiskValue.textContent = "--";
    destroyCharts();
  }

  function renderChildren(children) {
    totalChildrenValue.textContent = children.length;
    childrenList.innerHTML = "";

    if (!children.length) {
      childrenList.innerHTML = '<p class="muted-text">No child profiles yet. Add one using the form below.</p>';
      renderEmptyState();
      return;
    }

    children.forEach((child) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `child-item ${child._id === currentChildId ? "active" : ""}`;
      item.innerHTML = `
        <div>
          <strong>${child.name}</strong>
          <small>${child.age} years old</small>
        </div>
        <span class="badge">${child.gender}</span>
      `;
      item.addEventListener("click", () => {
        currentChildId = child._id;
        renderChildren(childrenCache);
        loadAssessments(child._id);
      });
      childrenList.appendChild(item);
    });
  }

  function renderCharts(assessments) {
    destroyCharts();
    const trendContext = document.getElementById("trendChart");
    const riskContext = document.getElementById("riskChart");

    const labels = assessments.map((item) => formatDate(item.date));
    const scores = assessments.map((item) => item.score);
    const riskCounts = {
      Low: 0,
      Moderate: 0,
      High: 0
    };

    assessments.forEach((item) => {
      riskCounts[item.riskLevel] += 1;
    });

    // Default chart font
    Chart.defaults.font.family = "'Nunito', sans-serif";
    Chart.defaults.color = "#5b7484";

    trendChart = new Chart(trendContext, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Well-being Score",
            data: scores,
            borderColor: "#5ea8ff",
            backgroundColor: "rgba(94, 168, 255, 0.12)",
            borderWidth: 3,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#5ea8ff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: "rgba(23, 50, 72, 0.9)",
            padding: 12,
            cornerRadius: 12,
            displayColors: false
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: {
              color: "rgba(76, 118, 150, 0.08)",
              drawBorder: false
            },
            ticks: {
              stepSize: 20
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    riskChart = new Chart(riskContext, {
      type: "doughnut",
      data: {
        labels: ["Low", "Moderate", "High"],
        datasets: [
          {
            data: [riskCounts.Low, riskCounts.Moderate, riskCounts.High],
            backgroundColor: ["#36ad7b", "#f5a53d", "#e65b72"],
            hoverOffset: 12,
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                weight: "bold"
              }
            }
          }
        }
      }
    });
  }

  function renderHistory(assessments) {
    if (!assessments.length) {
      historyList.innerHTML = '<p class="muted-text">No assessments for this child yet. Add one from the assessment page.</p>';
      assessmentCountValue.textContent = "0";
      latestScoreValue.textContent = "--";
      latestRiskValue.textContent = "--";
      destroyCharts();
      return;
    }

    const latest = assessments[assessments.length - 1];
    assessmentCountValue.textContent = assessments.length;
    latestScoreValue.textContent = `${latest.score}%`;
    latestRiskValue.textContent = latest.riskLevel;

    historyList.innerHTML = assessments
      .slice()
      .reverse()
      .map((assessment) => `
        <article class="history-item">
          <div>
            <strong>${formatDate(assessment.date)}</strong>
            <p>${assessment.recommendation}</p>
          </div>
          <div class="history-meta">
            <span class="badge">${assessment.score}%</span>
            <span class="badge ${assessment.riskLevel.toLowerCase()}">${assessment.riskLevel}</span>
          </div>
        </article>
      `)
      .join("");

    renderCharts(assessments);
  }

  async function loadChildren() {
    try {
      const response = await App.apiRequest("/children");
      childrenCache = response.children || [];
      if (!currentChildId && childrenCache[0]) {
        currentChildId = childrenCache[0]._id;
      }

      renderChildren(childrenCache);

      if (currentChildId) {
        await loadAssessments(currentChildId);
      }
    } catch (error) {
      App.showInline(authNotice, error.message, "error");
    }
  }

  async function loadAssessments(childId) {
    try {
      const response = await App.apiRequest(`/assessments/${childId}`);
      const child = response.child;
      const assessments = response.assessments || [];

      childOverview.querySelector("h3").textContent = `${child.name} - Profile Summary`;
      overviewText.textContent = `Age ${child.age}, ${child.gender}. ${child.school ? `School/Class: ${child.school}. ` : ""}${child.guardianNotes || "No guardian notes added yet."}`;
      renderHistory(assessments);
    } catch (error) {
      historyList.innerHTML = `<p class="muted-text">${error.message}</p>`;
    }
  }

  childForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(childForm);
    const payload = {
      name: String(formData.get("name")).trim(),
      age: Number(formData.get("age")),
      gender: String(formData.get("gender")).trim(),
      school: String(formData.get("school")).trim(),
      guardianNotes: String(formData.get("guardianNotes")).trim()
    };

    if (!payload.name || !payload.age || !payload.gender) {
      App.showMessage(childMessage, "Please fill in child name, age, and gender.", "error");
      return;
    }

    try {
      App.showMessage(childMessage, "Saving child profile...");
      const response = await App.apiRequest("/children", {
        method: "POST",
        body: payload
      });
      App.showMessage(childMessage, response.message, "success");
      childForm.reset();
      currentChildId = response.child._id;
      await loadChildren();
    } catch (error) {
      App.showMessage(childMessage, error.message, "error");
    }
  });

  renderEmptyState();
  loadChildren();
});
