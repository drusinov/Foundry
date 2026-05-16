import { NextResponse } from "next/server"

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json()

    const {
      apiKey,
      prompt,
    } = body

    const response =
      await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${apiKey}`,
          },

          body: JSON.stringify({
            model: "gpt-4.1-mini",

            messages: [
              {
                role: "user",

                content: prompt,
              },
            ],

            temperature: 0.7,
          }),
        },
      )

    const data =
      await response.json()

    console.log(
      "OPENAI RESPONSE:",
      JSON.stringify(
        data,
        null,
        2,
      ),
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ??
            "OpenAI request failed",
        },
        {
          status: 500,
        },
      )
    }

    const content =
      data.choices?.[0]
        ?.message?.content

    return NextResponse.json({
      content:
        content ??
        "Empty AI response",
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "AI runtime failure",
      },
      {
        status: 500,
      },
    )
  }
}