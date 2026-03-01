import React from 'react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function CheckInPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Check-in</h1>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Nova Sessão</CardTitle>
        </CardHeader>
        <p className="text-sm text-surface-700">
          Preencha os dados para iniciar o atendimento.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost">Cancelar</Button>
          <Button>Iniciar Sessão</Button>
        </div>
      </Card>
    </div>
  )
}
