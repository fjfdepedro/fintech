export async function revalidatePath(path: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        path
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to revalidate path: ${path}`)
    }

    return response.json()
  } catch (error) {
    console.error('Error revalidating path:', error)
    throw error
  }
} 