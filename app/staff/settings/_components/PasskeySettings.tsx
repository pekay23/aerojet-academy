'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { startRegistration } from '@simplewebauthn/browser'
import { Fingerprint, KeyRound, Laptop, Loader2, Plus, Smartphone, Trash2, Edit2, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface Passkey {
  id: string
  name: string | null
  deviceType: string
  backedUp: boolean
  createdAt: string
  lastUsedAt: string | null
}

export function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const confirmDialog = useConfirmDialog()

  const fetchPasskeys = async () => {
    try {
      const res = await fetch('/api/staff/settings/passkeys')
      if (res.ok) {
        const data = await res.json()
        setPasskeys(data.passkeys)
      }
    } catch (error) {
      console.error('Failed to fetch passkeys', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPasskeys()
  }, [])

  const handleAddPasskey = async () => {
    try {
      setIsRegistering(true)
      
      // 1. Get registration options from server
      const optionsRes = await fetch('/api/auth/passkey/register-options', { method: 'POST' })
      if (!optionsRes.ok) {
        const errData = await optionsRes.json().catch(() => null)
        throw new Error(errData?.detail || errData?.error || 'Failed to get registration options')
      }
      
      const { options } = await optionsRes.json()

      // 2. Prompt browser to create passkey
      let credential
      try {
        credential = await startRegistration({ optionsJSON: options })
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          toast.error('Passkey creation cancelled or blocked by browser')
          return
        }
        throw err
      }

      // 3. Send credential back to server to verify and store
      const verifyRes = await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => null)
        throw new Error(errData?.detail || errData?.error || 'Failed to verify passkey')
      }

      toast.success('Passkey added successfully')
      fetchPasskeys()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'An error occurred while adding the passkey')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleDelete = (id: string, name: string) => {
    confirmDialog.confirm({
      title: 'Delete Passkey',
      description: `Are you sure you want to delete the passkey "${name}"? You will no longer be able to use it to sign in.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/auth/passkey/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error(await res.text() || 'Failed to delete passkey')
          
          toast.success('Passkey deleted')
          setPasskeys((prev) => prev.filter((p) => p.id !== id))
        } catch (error: any) {
          toast.error(error.message)
        } finally {
          confirmDialog.close()
        }
      }
    })
  }

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null)
      return
    }

    try {
      const res = await fetch(`/api/auth/passkey/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      })
      
      if (!res.ok) throw new Error(await res.text() || 'Failed to rename passkey')
      
      toast.success('Passkey renamed')
      setPasskeys(passkeys.map(p => p.id === id ? { ...p, name: editName } : p))
      setEditingId(null)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getDeviceIcon = (deviceType: string, backedUp: boolean) => {
    if (backedUp) return <Smartphone className="h-5 w-5 text-muted-foreground" />
    if (deviceType === 'singleDevice') return <Laptop className="h-5 w-5 text-muted-foreground" />
    return <KeyRound className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <>
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
      <Card>
        <CardHeader>
        <div className="flex items-center gap-2">
          <Fingerprint className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Sign in securely without a password using your device's biometrics or a security key.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">You haven't set up any passkeys yet.</p>
            <Button onClick={handleAddPasskey} disabled={isRegistering}>
              {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add a Passkey
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border divide-y">
              {passkeys.map((passkey) => (
                <div key={passkey.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      {getDeviceIcon(passkey.deviceType, passkey.backedUp)}
                    </div>
                    <div>
                      {editingId === passkey.id ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 w-48"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(passkey.id)}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSaveEdit(passkey.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{passkey.name || 'Unnamed Passkey'}</p>
                          {passkey.backedUp && <Badge variant="secondary" className="text-xs">Synced</Badge>}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(passkey.createdAt).toLocaleDateString()}
                        {passkey.lastUsedAt && ` • Last used ${new Date(passkey.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {editingId !== passkey.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditName(passkey.name || '')
                          setEditingId(passkey.id)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(passkey.id, passkey.name || 'this passkey')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button onClick={handleAddPasskey} disabled={isRegistering} variant="outline" className="w-full">
              {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Another Passkey
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  )
}
