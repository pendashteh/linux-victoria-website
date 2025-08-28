// createJiraIssue.js
// Written by SA; updated to include Support Areas (multi-checkbox) -> Jira

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
  }

  try {
    // ---- Parse body (supports x-www-form-urlencoded and JSON) ----
    const contentType = (event.headers["content-type"] || event.headers["Content-Type"] || "").toLowerCase();
    let formData = {};

    if (contentType.includes("application/json")) {
      formData = JSON.parse(event.body || "{}");
    } else {
      const params = new URLSearchParams(event.body || "");
      // Collect possibly repeated keys (e.g., checkboxes named "supportAreas")
      for (const [key, value] of params.entries()) {
        if (key === "supportAreas") {
          if (!Array.isArray(formData.supportAreas)) formData.supportAreas = [];
          formData.supportAreas.push(value);
        } else if (key in formData) {
          // If any other field repeats, coerce to array
          formData[key] = Array.isArray(formData[key]) ? [...formData[key], value] : [formData[key], value];
        } else {
          formData[key] = value;
        }
      }
    }

    const { name, email, skills } = formData;
    const supportAreas = Array.isArray(formData.supportAreas) ? formData.supportAreas : [];

    // ---- Env vars ----
    const jiraUrl = process.env.JIRA_URL;                // e.g. https://your-domain.atlassian.net/rest/api/3/issue
    const jiraAuth = process.env.JIRA_AUTH;              // e.g. "Basic <base64 email:api_token>"
    const projectKey = process.env.JIRA_PROJECT_KEY;     // e.g. "VOL"
    const issueType = process.env.JIRA_ISSUE_TYPE;       // e.g. "Task" or "Volunteer"
    // NEW: ID of your Jira “Support Area” custom field (e.g., "customfield_12345")
    const supportAreasFieldId = process.env.JIRA_SUPPORT_AREAS_FIELD_ID;

    // ---- Build Jira description (keeps things readable for humans) ----
    const areasText = supportAreas.length ? supportAreas.join(", ") : "—";
    const description = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Skills/Interests" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: `${skills || ""}` }]
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Support Areas" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: areasText }]
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Contact Email" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: `${email || ""}` }]
        }
      ]
    };

    // ---- Build payload ----
    const fields = {
      project: { key: projectKey },
      summary: `${name || "New Volunteer"}`,
      description,
      customfield_10053: email, // your existing "email" custom field
      issuetype: { name: issueType }
    };

    // Put Support Areas into the Jira custom field if configured.
    // Jira (Cloud) expects multi-checkbox/multi-select values as an array of { value: "..." }.
    if (supportAreasFieldId && supportAreas.length) {
      fields[supportAreasFieldId] = supportAreas.map(v => ({ value: v }));
    }

    const payload = { fields };

    const response = await fetch(jiraUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": jiraAuth
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errorMessages ? data.errorMessages.join(", ") : "Jira issue creation failed");
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Thank you! Your submission has been receved!", jiraKey: data.key })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error creating Jira issue", error: error.message })
    };
  }
};
