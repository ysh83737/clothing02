"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UsePaginatedFetchOptions {
  defaultPageSize?: number
  debounceMs?: number
  extraParams?: Record<string, string>
}

interface UsePaginatedFetchResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  search: string
  setSearch: (search: string) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  filters: Record<string, string>
  setFilters: (filters: Record<string, string>) => void
  refresh: () => void
}

export function usePaginatedFetch<T>(
  url: string,
  options: UsePaginatedFetchOptions = {}
): UsePaginatedFetchResult<T> {
  const { defaultPageSize = 20, debounceMs = 300, extraParams = {} } = options

  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})
  const refreshRef = useRef(0)

  // 用 ref 固定 extraParams，防止每次渲染新对象导致无限请求
  const extraParamsRef = useRef(extraParams)
  if (JSON.stringify(extraParams) !== JSON.stringify(extraParamsRef.current)) {
    extraParamsRef.current = extraParams
  }

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [search, debounceMs])

  // 搜索或筛选变化时重置到第 1 页
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters])

  const paramsRef = useRef({ url, page, pageSize, debouncedSearch, filters, extraParams: extraParamsRef.current })
  useEffect(() => {
    paramsRef.current = { url, page, pageSize, debouncedSearch, filters, extraParams: extraParamsRef.current }
  })

  // 用 cacheKey 做深比较，避免对象引用变化触发无限请求
  const [cacheKey, setCacheKey] = useState(0)
  const lastKeyRef = useRef("")

  useEffect(() => {
    const key = JSON.stringify({ url, page, pageSize, debouncedSearch, filters, extraParams: extraParamsRef.current })
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key
      setCacheKey((k) => k + 1)
    }
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const marker = ++refreshRef.current
    try {
      const p = paramsRef.current
      const params = new URLSearchParams()
      params.set("page", String(p.page))
      params.set("pageSize", String(p.pageSize))
      if (p.debouncedSearch) params.set("search", p.debouncedSearch)
      for (const [key, value] of Object.entries(p.filters)) {
        if (value) params.set(key, value)
      }
      for (const [key, value] of Object.entries(p.extraParams)) {
        if (value) params.set(key, value)
      }

      const res = await fetch(`${p.url}?${params.toString()}`)
      if (marker !== refreshRef.current) return
      const json = await res.json()
      if (!json.success) {
        console.error("API error:", json.error)
        setData([])
        setTotal(0)
        setTotalPages(0)
        return
      }
      setData(json.data ?? [])
      if (json.pagination) {
        setTotal(json.pagination.total)
        setTotalPages(json.pagination.totalPages)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      if (marker === refreshRef.current) {
        setData([])
        setTotal(0)
        setTotalPages(0)
      }
    } finally {
      if (marker === refreshRef.current) {
        setLoading(false)
      }
    }
    // 只依赖 cacheKey，通过外部深比较驱动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    search,
    setSearch,
    filters,
    setFilters,
    setPage,
    setPageSize,
    refresh: fetchData,
  }
}
