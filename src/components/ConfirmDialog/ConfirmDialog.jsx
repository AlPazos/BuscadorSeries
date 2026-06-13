import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js'
import './ConfirmDialog.css'

// Diálogo de confirmación genérico (sí/no), al estilo neón del resto de modales.
// Presentacional: avisa con onConfirm / onCancel; quien lo usa decide qué hacer.
function ConfirmDialog({
  titulo,
  mensaje,
  confirmarLabel = 'Confirmar',
  cancelarLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  // mientras esté abierto, el fondo no debe hacer scroll
  useBodyScrollLock()

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        {titulo && <h2 className="confirm-titulo">{titulo}</h2>}
        <p className="confirm-mensaje">{mensaje}</p>

        <div className="confirm-acciones">
          <button type="button" className="confirm-cancelar" onClick={onCancel}>
            {cancelarLabel}
          </button>
          <button
            type="button"
            className="confirm-confirmar"
            onClick={onConfirm}
            autoFocus
          >
            {confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
