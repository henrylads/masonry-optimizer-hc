import useSWR from 'swr'
import { Project } from '@/types/project-types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useProjects() {
  const { data, error, mutate } = useSWR<{ projects: Project[] }>(
    '/api/projects',
    fetcher
  )

  return {
    projects: data?.projects || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}
