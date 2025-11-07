import { useEffect, useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormDataType } from '@/types/form-schema'

interface UseDesignAutosaveProps {
  designId: string | null
  projectId: string
  form: UseFormReturn<FormDataType>
  onSaveStart?: () => void
  onSaveSuccess?: () => void
  onSaveError?: () => void
}

export function useDesignAutosave({
  designId,
  projectId,
  form,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: UseDesignAutosaveProps) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const formValues = form.watch()

  useEffect(() => {
    if (!designId) return

    // Debounce save by 2 seconds
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        onSaveStart?.()
        await fetch(`/api/designs/${designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formParameters: formValues,
          }),
        })
        console.log('Design auto-saved')
        onSaveSuccess?.()
      } catch (error) {
        console.error('Auto-save failed:', error)
        onSaveError?.()
      }
    }, 2000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [designId, formValues, onSaveStart, onSaveSuccess, onSaveError])
}
