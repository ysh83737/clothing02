"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, SearchIcon, CheckIcon } from "lucide-react"

export interface SearchableSelectItem {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void

  // items 模式（静态数据，前端过滤）
  items?: SearchableSelectItem[]

  // endpoint 模式（服务端分页加载）
  endpoint?: string
  endpointParams?: Record<string, string>
  pageSize?: number
  itemValue?: (item: any) => string
  itemLabel?: (item: any) => string
  /** 在列表顶部始终显示的选项（如"所有品类"），endpoint 模式下使用 */
  prependItems?: SearchableSelectItem[]

  placeholder?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  emptyText?: string
  disabled?: boolean
  children?: (item: any, isSelected: boolean) => React.ReactNode
}

function SearchableSelect({
  value,
  onValueChange,
  items,
  endpoint,
  endpointParams,
  pageSize = 20,
  itemValue = (item: any) => item.id ?? item.value,
  itemLabel = (item: any) => item.name ?? item.label ?? "",
  prependItems,
  placeholder = "请选择",
  className,
  triggerClassName,
  contentClassName,
  emptyText = "未找到匹配项",
  disabled = false,
  children,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // endpoint 模式状态
  const [loadedItems, setLoadedItems] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [serverLoading, setServerLoading] = useState(false)

  const isEndpointMode = !!endpoint

  // 防抖（只对 endpoint 模式有效）
  useEffect(() => {
    if (!isEndpointMode) return
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300)
    return () => clearTimeout(timer)
  }, [searchText, isEndpointMode])

  // items 模式：前端过滤
  const filteredItems = useMemo(() => {
    if (isEndpointMode) return loadedItems
    if (!items) return []
    if (!searchText) return items
    const q = searchText.toLowerCase()
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [isEndpointMode, items, loadedItems, searchText])

  // endpoint 模式：获取数据
  const fetchPage = useCallback(
    async (page: number, search: string, append: boolean) => {
      if (!endpoint) return
      setServerLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("pageSize", String(pageSize))
        if (search) params.set("search", search)
        if (endpointParams) {
          Object.entries(endpointParams).forEach(([k, v]) => params.set(k, v))
        }
        const res = await fetch(`${endpoint}?${params.toString()}`, {
          cache: "no-cache",
        })
        const json = await res.json()
        if (json.success) {
          const newItems = json.data || []
          const totalPages = json.pagination?.totalPages ?? 1
          setLoadedItems((prev) => (append ? [...prev, ...newItems] : newItems))
          setCurrentPage(page)
          setHasMore(page < totalPages)
        }
      } catch {
        // ignore
      } finally {
        setServerLoading(false)
      }
    },
    [endpoint, pageSize, endpointParams]
  )

  // endpoint 模式：打开时 / 搜索变化时重新加载
  useEffect(() => {
    if (!isEndpointMode || !open) return
    fetchPage(1, debouncedSearch, false)
  }, [isEndpointMode, open, debouncedSearch, fetchPage])

  // endpoint 模式：无限滚动
  useEffect(() => {
    if (!isEndpointMode || !open || !hasMore || serverLoading) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !serverLoading) {
          fetchPage(currentPage + 1, debouncedSearch, true)
        }
      },
      { root: scrollRef.current, rootMargin: "50px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isEndpointMode, open, hasMore, serverLoading, currentPage, debouncedSearch, fetchPage])

  // 选中项查找
  const selectedItem = useMemo(() => {
    if (isEndpointMode) {
      const pre = prependItems?.find((i) => i.value === value)
      if (pre) return pre
      const item = loadedItems.find((i: any) => itemValue(i) === value)
      return item ? { value: itemValue(item), label: itemLabel(item) } : undefined
    }
    return items?.find((item) => item.value === value)
  }, [isEndpointMode, loadedItems, prependItems, items, value, itemValue, itemLabel])

  // 显示列表
  const displayItems = useMemo(() => {
    if (isEndpointMode) {
      return prependItems ? [...prependItems, ...loadedItems] : loadedItems
    }
    return filteredItems
  }, [isEndpointMode, loadedItems, filteredItems, prependItems])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [displayItems.length, searchText])

  useEffect(() => {
    if (open && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    if (!open) {
      setSearchText("")
      setDebouncedSearch("")
      if (isEndpointMode) {
        setLoadedItems([])
        setCurrentPage(1)
        setHasMore(false)
      }
    }
  }, [open, isEndpointMode])

  const handleSelect = useCallback(
    (itemValue: string) => {
      onValueChange(itemValue)
      setOpen(false)
    },
    [onValueChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < displayItems.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : displayItems.length - 1
          )
          break
        case "Enter":
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < displayItems.length) {
            const item = displayItems[highlightedIndex]
            const val = isEndpointMode ? itemValue(item) : item.value
            handleSelect(val)
          }
          break
        case "Escape":
          setOpen(false)
          break
      }
    },
    [displayItems, highlightedIndex, handleSelect, isEndpointMode, itemValue]
  )

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        data-placeholder={!selectedItem ? "" : undefined}
        className={cn(
          "flex w-full cursor-default items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:bg-accent/50 data-placeholder:text-muted-foreground",
          "dark:bg-input/30 dark:hover:bg-input/50",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          className ?? triggerClassName
        )}
      >
        <span className="flex-1 truncate text-left">
          {selectedItem?.label || placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side="bottom"
          sideOffset={4}
          align="center"
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            className={cn(
              "relative isolate z-50 max-h-80 w-(--anchor-width) min-w-48 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
              "duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              contentClassName
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Items list with infinite scroll */}
            <div
              ref={scrollRef}
              className="max-h-60 overflow-y-auto p-1"
              role="listbox"
            >
              {displayItems.length === 0 && !serverLoading ? (
                <div className="px-1.5 py-2 text-sm text-center text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                <>
                  {displayItems.map((item: any, index: number) => {
                    const currentValue = isEndpointMode ? itemValue(item) : item.value
                    const currentLabel = isEndpointMode ? itemLabel(item) : item.label
                    const isSelected = currentValue === value
                    const isHighlighted = index === highlightedIndex
                    return (
                      <div
                        key={currentValue}
                        role="option"
                        aria-selected={isSelected}
                        aria-current={isHighlighted || undefined}
                        onClick={() => handleSelect(currentValue)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={cn(
                          "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-none select-none",
                          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                          isHighlighted && "bg-accent text-accent-foreground"
                        )}
                      >
                        <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
                          {children ? children(item, isSelected) : currentLabel}
                        </span>
                        {isSelected && (
                          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                            <CheckIcon className="size-4" />
                          </span>
                        )}
                      </div>
                    )
                  })}

                  {/* 无限滚动监视线索 */}
                  {isEndpointMode && hasMore && (
                    <div
                      ref={sentinelRef}
                      className="flex items-center justify-center py-2"
                    >
                      {serverLoading ? (
                        <span className="text-xs text-muted-foreground">加载中...</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">加载更多</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { SearchableSelect }
