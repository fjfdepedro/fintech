import { NextResponse } from 'next/server'
import { checkAndUpdateCoinMarketCapData } from '@/lib/services/coinmarketcap-service'

export async function POST() {
  try {
    console.log('Iniciando actualización forzada de datos de mercado...')
    const result = await checkAndUpdateCoinMarketCapData()
    console.log('Resultado de la actualización:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating market metadata:', error)
    return NextResponse.json(
      { error: 'Error al actualizar datos de mercado', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 