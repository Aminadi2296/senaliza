import Link from 'next/link'
import { SignTile } from '@/components/SignTile'

export default function NotFound() {
  return (
    <div className="section empty">
      <SignTile kind="warning" className="sign-mid" />
      <h1>No encontramos esa página</h1>
      <p>Puede que el producto ya no exista o que el enlace esté incompleto.</p>
      <Link href="/catalogo" className="btn btn-primary">
        Ver catálogo
      </Link>
    </div>
  )
}
