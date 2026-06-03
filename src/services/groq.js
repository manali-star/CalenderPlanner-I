const API_KEY =
  import.meta.env
    .VITE_GROQ_API_KEY

const API_URL =
  "https://api.groq.com/openai/v1/chat/completions"

export const generateAIReport =
  async (activityData) => {

    try {

      const prompt = `
Analyze this campus activity data.

Return:
- Executive Summary
- Participation Insight
- Recommendation

Keep response professional and concise.

Data:
${JSON.stringify(activityData)}
`

      const response =
        await fetch(API_URL, {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${API_KEY}`,
          },

          body: JSON.stringify({

            model:
                "llama-3.3-70b-versatile",

            messages: [

              {
                role: "system",

                content:
                  "You are an intelligent campus analytics AI assistant.",
              },

              {
                role: "user",

                content: prompt,
              },
            ],

            temperature: 0.7,
          }),
        })

      const data =
        await response.json()

      console.log(
        "Groq Response:",
        data
      )

      if (data.error) {

  console.error(
    "Groq Error:",
    data.error
  )
}

      return (
        data?.choices?.[0]
          ?.message?.content

        ||

        "AI analysis unavailable."
      )

    } catch (error) {

      console.error(
        "Groq API Error:",
        error
      )

      return (
        "AI service temporarily unavailable."
      )
    }
  }