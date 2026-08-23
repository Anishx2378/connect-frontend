"use client"

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Search, Plus, Filter, FileIcon, Image as ImageIcon, FileText, Download, MoreVertical, Grid, List as ListIcon } from 'lucide-react'

export default function ProjectFilesPage() {
  const params = useParams()
  const projectKey = params.projectKey as string
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const files = [
    { id: 1, name: 'Brand_Guidelines_2026.pdf', type: 'pdf', size: '4.2 MB', date: 'Oct 24, 2026', uploader: 'Priya Nair' },
    { id: 2, name: 'Hero_Image_V2.png', type: 'image', size: '1.8 MB', date: 'Oct 23, 2026', uploader: 'David Kim' },
    { id: 3, name: 'API_Documentation.docx', type: 'doc', size: '850 KB', date: 'Oct 20, 2026', uploader: 'Sarah Jones' },
    { id: 4, name: 'Meeting_Notes_Kickoff.pdf', type: 'pdf', size: '1.2 MB', date: 'Oct 15, 2026', uploader: 'Priya Nair' },
    { id: 5, name: 'Logo_Assets.zip', type: 'archive', size: '12.5 MB', date: 'Oct 14, 2026', uploader: 'David Kim' },
  ]

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'image': return <ImageIcon size={24} className="text-blue-500" />
      case 'pdf': return <FileText size={24} className="text-red-500" />
      default: return <FileIcon size={24} className="text-muted-foreground" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-8 py-6 border-b border-border/60 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Files</h1>
          <p className="text-sm text-muted-foreground">Project assets and documents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-colors w-64"
            />
          </div>
          <div className="flex items-center p-1 bg-secondary rounded-lg gap-1">
            <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}><Grid size={16} /></button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm' : 'text-muted-foreground'}`}><ListIcon size={16} /></button>
          </div>
          <button className="p-2 border border-border text-secondary-foreground rounded-lg hover:bg-muted transition-colors">
            <Filter size={18} />
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} />
            Upload File
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {files.map(file => (
              <div key={file.id} className="bg-white p-4 rounded-xl shadow-sm border border-border/60 hover:shadow-md transition-all group relative cursor-pointer">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-muted-foreground hover:text-secondary-foreground bg-white rounded-md shadow-sm border border-border">
                    <MoreVertical size={14} />
                  </button>
                </div>
                <div className="h-32 bg-muted rounded-lg border border-slate-100 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  {getFileIcon(file.type)}
                </div>
                <h3 className="text-[14px] font-semibold text-foreground truncate mb-1" title={file.name}>{file.name}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{file.size}</span>
                  <span>{file.date}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-border/60 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted text-xs uppercase font-semibold text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Uploaded By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {files.map(file => (
                  <tr key={file.id} className="hover:bg-muted transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <span className="font-semibold text-foreground">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{file.size}</td>
                    <td className="px-6 py-4 text-secondary-foreground font-medium">{file.uploader}</td>
                    <td className="px-6 py-4 text-muted-foreground">{file.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-muted-foreground hover:text-primary rounded-md">
                          <Download size={16} />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-secondary-foreground rounded-md">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
