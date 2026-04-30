const fs = require('fs');

const orig = fs.readFileSync('app/instructor/schedule/_components/CalendarGrid.tsx', 'utf-8');

let lines = orig.split('\n');

const returnIdx = lines.findIndex(l => l.trim() === 'return (');
let beforeReturn = lines.slice(0, returnIdx).join('\n');

// Ensure Filter, Plus are imported
if (!beforeReturn.includes('Filter')) {
    beforeReturn = beforeReturn.replace("from 'lucide-react'", ", Filter, Plus } from 'lucide-react'");
}
if (!beforeReturn.includes('BookOpen')) {
    beforeReturn = beforeReturn.replace("from 'lucide-react'", ", BookOpen, GraduationCap, CalendarDays } from 'lucide-react'");
}

// Add getHours, getMinutes
if (!beforeReturn.includes('getHours')) {
    beforeReturn = beforeReturn.replace("from 'date-fns'", ", getHours, getMinutes } from 'date-fns'");
}


const newReturn = `
  const hourHeight = 96 // px per hour

  const getEventPosition = (startDate: string | Date, endDate: string | Date) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startHour = start.getHours() + start.getMinutes() / 60
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return { top: startHour * hourHeight, height: Math.max(durationHours * hourHeight, 24) }
  }

  const getEventStyles = (category: string | null) => {
    if (category === 'CORE') return 'bg-[#EBF1FF] text-[#4A72E8] border-l-4 border-[#4A72E8]'
    if (category === 'SPECIALIST') return 'bg-[#F3E8FF] text-[#9333EA] border-l-4 border-[#9333EA]'
    if (category === 'AVIONICS') return 'bg-[#FFF0E6] text-[#E0662A] border-l-4 border-[#E0662A]'
    return 'bg-[#F8FAFC] text-[#475569] border-l-4 border-[#94A3B8]'
  }

  const getEventIcon = (category: string | null) => {
    return <BookOpen className="h-4 w-4" />
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 pb-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-black text-xl text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl" onClick={() => setCurrentDate(new Date())}>
            {headerLabel}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{schedule.length} Sessions</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          
          <div className="flex items-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
             {(['Day', 'Week', 'Month'] as ViewMode[]).map((view, i) => (
               <button 
                 key={view} 
                 onClick={() => setViewMode(view)} 
                 className={cn(
                   "px-5 py-2.5 text-sm font-bold transition-colors", 
                   i === 0 && "rounded-l-full",
                   i === 2 && "rounded-r-full border-l border-slate-200 dark:border-slate-700",
                   i === 1 && "border-l border-slate-200 dark:border-slate-700",
                   viewMode === view ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                 )}>
                 {view}
               </button>
             ))}
          </div>

          <button className="flex items-center gap-2 rounded-full bg-[#FF4F33] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#E6462D] transition-colors shadow-md shadow-[#FF4F33]/20">
            New Session <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === 'Week' && (
        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800 min-h-0 shrink-0">
           {/* Week Header */}
           <div className="grid grid-cols-[80px_1fr] border-b border-slate-100 dark:border-slate-800 shrink-0">
             <div className="flex items-center justify-center gap-2 p-2 border-r border-slate-100 dark:border-slate-800">
                <button onClick={navigatePrev} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4 text-slate-400"/></button>
                <button onClick={navigateNext} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4 text-slate-400"/></button>
             </div>
             <div className="grid grid-cols-7">
               {weekDays.map(day => {
                  const isToday = isSameDay(day, new Date())
                  return (
                    <div key={day.toISOString()} className={cn("p-4 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0", isToday && "bg-[#F8FBFF] dark:bg-blue-900/10 relative")}>
                      {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#4A72E8]"></div>}
                      <span className={cn("text-sm font-bold", isToday ? "text-[#4A72E8]" : "text-slate-900 dark:text-white")}>{format(day, 'EEE, dd')}</span>
                    </div>
                  )
               })}
             </div>
           </div>
           
           {/* Week Grid */}
           <div className="flex h-[600px] overflow-y-auto">
              <div className="grid grid-cols-[80px_1fr] w-full relative">
                 {/* Times */}
                 <div className="border-r border-slate-100 dark:border-slate-800">
                    {timeSlots.map(hour => (
                      <div key={hour} className="h-[96px] relative">
                         <span className="absolute -top-3 left-0 w-full text-center text-xs font-medium text-slate-400">
                           {hour === 0 ? '12 am' : hour < 12 ? \`\${hour} am\` : hour === 12 ? '12 pm' : \`\${hour-12} pm\`}
                         </span>
                      </div>
                    ))}
                 </div>
                 
                 {/* Grid Lines & Events */}
                 <div className="grid grid-cols-7 relative">
                    {/* Horizontal Lines */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col">
                      {timeSlots.map(hour => (
                        <div key={hour} className="h-[96px] border-b border-slate-100 dark:border-slate-800"></div>
                      ))}
                    </div>
                    {/* Vertical Lines */}
                    {weekDays.map((day, i) => (
                      <div key={i} className="border-r border-slate-100 dark:border-slate-800 last:border-r-0 h-[2400px]"></div>
                    ))}
                    
                    {/* Events */}
                    {schedule.map(cls => {
                       const dayIndex = weekDays.findIndex((d) => isSameDay(d, new Date(cls.startDate)))
                       if (dayIndex === -1) return null
                       const { top, height } = getEventPosition(cls.startDate, cls.endDate)
                       return (
                         <div
                           key={cls.id}
                           onClick={() => setSelectedSession(cls)}
                           className="absolute left-1 right-1 cursor-pointer transition-transform hover:scale-[1.01] hover:z-10"
                           style={{
                             top: \`\${top}px\`,
                             height: \`\${height - 4}px\`,
                             gridColumnStart: dayIndex + 1,
                             gridColumnEnd: dayIndex + 2
                           }}
                         >
                            <div className={cn("w-full h-full rounded-xl p-3 flex flex-col overflow-hidden shadow-sm relative", getEventStyles(cls.course.category))}>
                               <div className="mb-1 bg-white/30 w-fit p-1.5 rounded-lg text-current backdrop-blur-sm">
                                 {getEventIcon(cls.course.category)}
                               </div>
                               <span className="font-bold text-xs truncate leading-tight mt-1">{cls.course.name}</span>
                               <span className="text-[10px] font-medium opacity-80 truncate">
                                 {format(new Date(cls.startDate), 'hh:mm a')} - {format(new Date(cls.endDate), 'hh:mm a')}
                               </span>
                            </div>
                         </div>
                       )
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'Day' && (
        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800 min-h-0 shrink-0">
           {/* Day Header */}
           <div className="grid grid-cols-[80px_1fr] border-b border-slate-100 dark:border-slate-800 shrink-0">
             <div className="flex items-center justify-center gap-2 p-2 border-r border-slate-100 dark:border-slate-800">
                <button onClick={navigatePrev} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800"><ChevronLeft className="h-4 w-4 text-slate-400"/></button>
                <button onClick={navigateNext} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800"><ChevronRight className="h-4 w-4 text-slate-400"/></button>
             </div>
             <div className={cn("p-4 text-center relative", isSameDay(currentDate, new Date()) && "bg-[#F8FBFF] dark:bg-blue-900/10")}>
                {isSameDay(currentDate, new Date()) && <div className="absolute top-0 left-0 w-full h-1 bg-[#4A72E8]"></div>}
                <span className={cn("text-sm font-bold", isSameDay(currentDate, new Date()) ? "text-[#4A72E8]" : "text-slate-900 dark:text-white")}>{format(currentDate, 'EEEE, dd MMMM')}</span>
             </div>
           </div>
           
           {/* Day Grid */}
           <div className="flex h-[600px] overflow-y-auto">
              <div className="grid grid-cols-[80px_1fr] w-full relative">
                 {/* Times */}
                 <div className="border-r border-slate-100 dark:border-slate-800">
                    {timeSlots.map(hour => (
                      <div key={hour} className="h-[96px] relative">
                         <span className="absolute -top-3 left-0 w-full text-center text-xs font-medium text-slate-400">
                           {hour === 0 ? '12 am' : hour < 12 ? \`\${hour} am\` : hour === 12 ? '12 pm' : \`\${hour-12} pm\`}
                         </span>
                      </div>
                    ))}
                 </div>
                 
                 {/* Grid Lines & Events */}
                 <div className="relative">
                    <div className="absolute inset-0 pointer-events-none flex flex-col">
                      {timeSlots.map(hour => (
                        <div key={hour} className="h-[96px] border-b border-slate-100 dark:border-slate-800"></div>
                      ))}
                    </div>
                    
                    {daySessions.map(cls => {
                       const { top, height } = getEventPosition(cls.startDate, cls.endDate)
                       return (
                         <div
                           key={cls.id}
                           onClick={() => setSelectedSession(cls)}
                           className="absolute left-4 right-4 cursor-pointer transition-transform hover:scale-[1.01] hover:z-10"
                           style={{
                             top: \`\${top}px\`,
                             height: \`\${height - 4}px\`
                           }}
                         >
                            <div className={cn("w-full h-full rounded-xl p-4 flex flex-col overflow-hidden shadow-sm relative", getEventStyles(cls.course.category))}>
                               <div className="mb-2 bg-white/30 w-fit p-2 rounded-lg text-current backdrop-blur-sm">
                                 {getEventIcon(cls.course.category)}
                               </div>
                               <span className="font-bold text-sm truncate leading-tight mt-1">{cls.course.name}</span>
                               <span className="text-xs font-medium opacity-80 truncate">
                                 {format(new Date(cls.startDate), 'hh:mm a')} - {format(new Date(cls.endDate), 'hh:mm a')}
                               </span>
                            </div>
                         </div>
                       )
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {viewMode === 'Month' && (
        <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800 shrink-0">
           <div className="grid grid-cols-7 border-b border-slate-100 bg-[#F8FBFF] dark:bg-blue-900/10 dark:border-slate-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                 <div key={d} className="p-4 text-center text-sm font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-r-0">{d}</div>
              ))}
           </div>
           <div className="grid grid-cols-7">
              {monthDays.map((day, idx) => {
                 const isCurrentMonth = isSameMonth(day, currentDate)
                 const isToday = isSameDay(day, new Date())
                 const dayEvents = schedule.filter((cls) => isSameDay(new Date(cls.startDate), day))
                 
                 return (
                    <div key={idx} onClick={() => { setCurrentDate(day); setViewMode('Day') }} className={cn("min-h-[120px] p-2 border-r border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative", !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/50", isToday && "bg-[#F8FBFF] dark:bg-blue-900/10")}>
                      {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-[#4A72E8]"></div>}
                      <span className={cn("inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-bold mb-2", isToday ? "bg-[#4A72E8] text-white" : !isCurrentMonth ? "text-slate-400" : "text-slate-900 dark:text-white")}>
                         {format(day, 'd')}
                      </span>
                      <div className="space-y-1.5">
                         {dayEvents.slice(0, 3).map(cls => (
                            <div key={cls.id} onClick={(e) => { e.stopPropagation(); setSelectedSession(cls) }} className={cn("px-2 py-1 rounded-md text-xs font-bold truncate", getEventStyles(cls.course.category))}>
                               {cls.course.code}
                            </div>
                         ))}
                         {dayEvents.length > 3 && (
                            <div className="text-xs font-bold text-slate-400 pl-1">+{dayEvents.length - 3} more</div>
                         )}
                      </div>
                    </div>
                 )
              })}
           </div>
        </div>
      )}

      <SessionDetails
        session={selectedSession}
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  )
}
`

fs.writeFileSync('app/instructor/schedule/_components/CalendarGrid.tsx', beforeReturn + '\n' + newReturn);
