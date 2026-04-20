import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Test: Todos</h1>
      {todos && todos.length > 0 ? (
        <ul className="list-disc pl-5">
          {todos.map((todo: any) => (
            <li key={todo.id} className="mb-2">
              <span className="font-medium">{todo.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">No todos found in the 'todos' table.</p>
      )}
    </div>
  )
}
