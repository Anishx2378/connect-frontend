import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command({ id: item.id, label: item.label })
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-sm flex flex-col w-64 max-h-64 overflow-y-auto">
      {props.items.length ? props.items.map((item: any, index: number) => (
        <button
          className={`flex items-center gap-3 px-3 py-2 text-left w-full hover:bg-slate-50 transition-colors ${
            index === selectedIndex ? 'bg-slate-100' : 'bg-transparent'
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          {item.avatar && (
            <img src={item.avatar} alt={item.label} className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200" />
          )}
          {!item.avatar && item.id !== 'all' && item.id !== 'channel' && (
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] shrink-0 font-medium">
              {item.label.substring(0, 2).toUpperCase()}
            </div>
          )}
          {(item.id === 'all' || item.id === 'channel') && (
            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[12px] shrink-0 font-medium">
              @
            </div>
          )}
          <span className="truncate font-medium text-slate-700">{item.label}</span>
        </button>
      )) : (
        <div className="px-4 py-3 text-slate-500 italic text-center">No team members found</div>
      )}
    </div>
  )
})
MentionList.displayName = 'MentionList'
