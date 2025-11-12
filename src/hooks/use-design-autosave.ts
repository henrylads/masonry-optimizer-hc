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

    timeoutRef.current = setTimeout(() => {
      try {
        onSaveStart?.()
        // Import storage functions
        const { designStorage } = require('@/lib/storage')

        // Update design in localStorage
        designStorage.update(designId, {
          formParameters: formValues,
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
