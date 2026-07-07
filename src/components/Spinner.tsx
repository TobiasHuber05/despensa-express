export default function Spinner({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      <p className="text-sm text-white/70">{texto}</p>
    </div>
  )
}
