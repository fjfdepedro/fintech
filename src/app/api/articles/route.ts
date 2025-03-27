import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import axios from 'axios'

const OPENROUTER_API_KEY = process.env.QWEN_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

async function getLatestCryptoData() {
  const cryptoData = await prisma.marketData.findMany({
    where: {
      type: 'CRYPTO'
    },
    orderBy: {
      timestamp: 'desc'
    },
    distinct: ['symbol']
  })
  return cryptoData
}

async function generateArticle(cryptoData: any[]) {
  const prompt = `Write a professional financial analysis article about the following cryptocurrencies. For each cryptocurrency, include its current price, 24h change, and market trends. Use professional financial language and focus on market analysis. Here's the data:

${cryptoData.map(crypto => `
${crypto.name} (${crypto.symbol}):
- Current Price: $${crypto.price}
- 24h Change: ${crypto.change}%
- Volume: ${crypto.volume}
- Last Updated: ${new Date(crypto.timestamp).toLocaleString()}
`).join('\n')}

Please write a paragraph for each cryptocurrency, analyzing its performance and market position.`

  const response = await axios.post(OPENROUTER_URL, {
    model: "qwen/qwq-32b:free",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`
    }
  })

  return response.data.choices[0].message.content
}

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if we already have an article for today
    const existingArticle = await prisma.article.findFirst({
      where: {
        date: {
          gte: today
        }
      }
    })

    if (existingArticle) {
      return NextResponse.json(existingArticle)
    }

    // Get latest crypto data
    const cryptoData = await getLatestCryptoData()

    // Generate new article
    const content = await generateArticle(cryptoData)

    // Save the article
    const article = await prisma.article.create({
      data: {
        content,
        date: today
      }
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error generating article:', error)
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    )
  }
} 