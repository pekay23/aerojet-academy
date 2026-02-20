import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  src?: string | null
  firstName?: string
  lastName?: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function UserAvatar({ src, firstName = '', lastName = '', size = 'default', className }: UserAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?'
  const sizes = { sm: 'h-8 w-8 text-xs', default: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }

  return (
    <Avatar className={cn(sizes[size], className)}>
      {src && <AvatarImage src={src} alt={`${firstName} ${lastName}`} />}
      <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
    </Avatar>
  )
}
