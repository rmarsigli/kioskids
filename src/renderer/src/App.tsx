import React from 'react'

export default function App(): React.JSX.Element {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">KiosKids</h1>
        <p className="mt-2 text-sm text-gray-400">v{window.api.version}</p>
      </div>
    </div>
  )
}
