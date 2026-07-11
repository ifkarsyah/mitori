import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export type FilterFieldOption = { value: string; label: string }

export type FilterFieldConfig = {
  key: string
  label: string
  options: FilterFieldOption[]
}

export type FilterBarProps = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  fields: FilterFieldConfig[]
  fieldValues: Record<string, string>
  onFieldChange: (key: string, value: string) => void
  groupByOptions: FilterFieldOption[]
  groupBy: string
  onGroupByChange: (value: string) => void
  onClear: () => void
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  fields,
  fieldValues,
  onFieldChange,
  groupByOptions,
  groupBy,
  onGroupByChange,
  onClear,
}: FilterBarProps) {
  const [inputValue, setInputValue] = useState(search)
  const debouncedInputValue = useDebouncedValue(inputValue, 200)

  useEffect(() => {
    onSearchChange(debouncedInputValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInputValue])

  useEffect(() => {
    setInputValue(search)
  }, [search])

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-search">Search</Label>
        <Input
          id="filter-search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-48"
        />
      </div>

      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <Label>{field.label}</Label>
          <Select
            value={fieldValues[field.key]}
            onValueChange={(value) => onFieldChange(field.key, value as string)}
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {(value: string) =>
                  field.options.find((option) => option.value === value)?.label ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <Label>Group by</Label>
        <Select value={groupBy} onValueChange={(value) => onGroupByChange(value as string)}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {(value: string) =>
                groupByOptions.find((option) => option.value === value)?.label ?? value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {groupByOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  )
}
