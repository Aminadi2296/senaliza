'use client'

import { useEffect, useRef } from 'react'

/** Webpay exige enviar el token por POST: este formulario se envía solo al cargar. */
export function AutoPostForm({ action, token }: { action: string; token: string }) {
  const ref = useRef<HTMLFormElement>(null)
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    ref.current?.submit()
  }, [])
  return (
    <form ref={ref} method="post" action={action} className="empty">
      <input type="hidden" name="token_ws" value={token} />
      <p>Te estamos llevando a Webpay para completar el pago…</p>
      <noscript>
        <button type="submit" className="btn btn-primary">
          Ir a pagar con Webpay
        </button>
      </noscript>
    </form>
  )
}
