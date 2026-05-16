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
          }),
        },
      )

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "OpenAI request failed",
        },
        {
          status: 500,
        },
      )
    }

    const data =
      await response.json()

    return NextResponse.json({
      content:
        data.choices?.[0]
          ?.message?.content ??
        "",
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