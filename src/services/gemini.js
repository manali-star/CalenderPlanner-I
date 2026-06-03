const API_KEY =
  import.meta.env
    .VITE_GEMINI_API_KEY

const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

export const generateAIReport =
  async (activities) => {

    try {
      if (
        !activities ||
        activities.length === 0
        ) {

  return (
    "No activity data available for AI analysis."
  )
}

      const activityData =

        activities.map(
          (activity) => ({

            title:
              activity.title,

            status:
              activity.status,

            audience:
              activity.audience_count,

            category:
              activity.category,

            date:
              activity.date,
          })
        )

const prompt = `

You are CampusFlow AI,
an advanced university
operations intelligence system.

Analyze the provided
campus task and activity data.

Your response must include:

1. Executive Summary
2. Participation Analysis
3. Productivity Insight
4. One Strategic Recommendation

Rules:
- Keep response under 120 words
- Be concise and professional
- Focus on operational insights
- Avoid generic statements
- Mention overdue or low-performance risks if detected

Campus Activity Data:
${JSON.stringify(activityData)}

`

      const controller =
  new AbortController()

const timeoutId =
  setTimeout(() => {

    controller.abort()

  }, 10000)

      const response =
        await fetch(
          API_URL,
          {
            method: "POST",

            signal:
            controller.signal,

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          }
        )

      const data =
        await response.json()
        clearTimeout(timeoutId)
        console.log(
  "Gemini Response:",
  data
)

if (data.error) {

  console.error(
    "Gemini API Error:",
    data.error
  )

  const errorMessage =

    data.error.message || ""

  if (
    errorMessage.includes(
      "quota"
    )
  ) {

    return (
      "AI quota exceeded. Please try again later."
    )
  }

  if (
    errorMessage.includes(
      "API key"
    )
  ) {

    return (
      "Invalid AI configuration detected."
    )
  }

  return (
    "AI servers are currently busy. Please try again shortly."
  )
}

const aiText =

  data?.candidates?.[0]
    ?.content?.parts?.[0]
    ?.text

if (
  !aiText ||
  typeof aiText !== "string"
) {

  return (
    "AI analysis unavailable at the moment."
  )
}

if (
  aiText.trim().length < 10
) {

  return (
    "AI generated an incomplete response."
  )
}

return aiText.trim()

    } catch (error) {

      console.error(
  "Gemini Error:",
  error
)

      return (
        "Failed to generate AI report."
      )
    }
  }