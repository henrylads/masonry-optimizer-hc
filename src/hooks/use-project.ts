import useSWR from 'swr'
import { Project } from '@/types/project-types'
import { Design } from '@/types/design-types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useProject(projectId: string) {
  const { data, error, mutate } = useSWR<{
    project: Project & { designs: Design[] }
  }>(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  )

  return {
    project: data?.project || null,
    designs: data?.project?.designs || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
